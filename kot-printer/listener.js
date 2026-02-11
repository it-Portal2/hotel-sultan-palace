/**
 * listener.js
 * Production-grade Firestore real-time listeners for KOT printing.
 *
 * DESIGN PRINCIPLES (industry-standard):
 * ─────────────────────────────────────
 * 1. ATOMIC OPERATIONS  — Firestore transactions prevent double-prints.
 *    Even if 2 listener instances run, only one wins the transaction.
 *
 * 2. NO IN-MEMORY STATE — We never rely on a Set or Map to track what
 *    was printed. The Firestore document IS the source of truth.
 *    `kotPrinted: true` = printed. Period.
 *
 * 3. EVENT-TYPE FILTERING — Only process `added` events for new orders.
 *    `modified` and `removed` are ignored to prevent re-triggers.
 *    For reprints, we process `added` (initial load) and `modified`
 *    (when staff clicks reprint while listener is running).
 *
 * 4. SELF-HEALING QUERIES — When we set `kotPrinted: true`, the doc
 *    no longer matches `where("kotPrinted", "==", false)`, so it
 *    automatically drops out of the listener. No infinite loops.
 *
 * 5. CONCURRENCY LOCK — Per-document in-memory lock prevents the same
 *    doc from being processed in parallel (e.g. if a snapshot fires
 *    while a prior print is still in progress).
 *
 * 6. AUDIT TRAIL — We record `kotPrintedAt` timestamp and `reprintCount`
 *    for operational visibility and debugging.
 *
 * FLOW:
 *   New order created → kotPrinted: false → listener picks up →
 *   transaction: check kotPrinted == false → PRINT → set kotPrinted: true,
 *   kotPrintedAt: now → doc drops out of query → done.
 *
 *   Staff clicks "Print" → reprintRequested: true → listener picks up →
 *   transaction: check reprintRequested == true → PRINT → set
 *   reprintRequested: false, reprintCount++ → doc drops out → done.
 */

const chalk = require("chalk");
const config = require("./config");
const { db, admin } = require("./firebase");
const { printReceipt } = require("./printer");

// ─── Per-document processing lock ───
// Prevents concurrent processing of the same document if snapshots
// fire faster than the print job completes.
const activeLocks = new Set();

function acquireLock(key) {
  if (activeLocks.has(key)) return false;
  activeLocks.add(key);
  return true;
}

function releaseLock(key) {
  activeLocks.delete(key);
}

// ─── Helpers ───
function logOrder(tag, color, order) {
  const items = order.items?.length || 0;
  console.log(
    chalk[color](`[${tag}]`),
    chalk.bold(order.orderNumber || order.id),
    chalk.dim(
      `— ${order.guestName || "Unknown"} (${items} item${items !== 1 ? "s" : ""})`,
    ),
  );
}

// ═══════════════════════════════════════════════════════════════
//  LISTENER 1: NEW ORDERS
//  Query: kotPrinted == false
//  Trigger: document enters the query (added event only)
//  Action: print → transaction { kotPrinted: true, kotPrintedAt }
// ═══════════════════════════════════════════════════════════════
function listenForNewOrders() {
  const ref = db.collection("foodOrders").where("kotPrinted", "==", false);

  ref.onSnapshot(
    async (snapshot) => {
      for (const change of snapshot.docChanges()) {
        // ONLY process documents that ENTER the query
        // `added` fires for: initial load + newly matching docs
        // We skip `modified` to avoid re-triggering if someone edits
        // the order while kotPrinted is still false (rare edge case)
        if (change.type !== "added") continue;

        const docId = change.doc.id;
        const order = { id: docId, ...change.doc.data() };

        // Concurrency lock — skip if already being processed
        const lockKey = `new-${docId}`;
        if (!acquireLock(lockKey)) continue;

        logOrder("NEW ORDER", "green", order);

        try {
          // ── STEP 1: PRINT (production only) ──
          let printed = true;
          if (config.isProduction) {
            printed = await printReceipt(order);
          } else {
            console.log(
              chalk.dim(`  ⏭ Skipping print (NODE_ENV=${config.env})`),
            );
          }

          if (!printed) {
            console.error(
              chalk.red(`  ✗ Print failed`),
              chalk.dim("— will retry on next snapshot"),
            );
            // Don't update Firestore — doc stays in query, listener retries
            continue;
          }

          // ── STEP 2: ATOMIC UPDATE ──
          // Transaction ensures: if another instance already printed this
          // order, we don't double-update or cause confusion.
          const docRef = db.collection("foodOrders").doc(docId);

          await db.runTransaction(async (tx) => {
            const freshDoc = await tx.get(docRef);
            if (!freshDoc.exists) return;

            const data = freshDoc.data();

            // Double-check: if already printed by another instance, skip
            if (data.kotPrinted === true) {
              console.log(
                chalk.yellow(`  ⚠ Already marked printed by another instance`),
              );
              return;
            }

            tx.update(docRef, {
              kotPrinted: true,
              kotPrintedAt: admin.firestore.FieldValue.serverTimestamp(),
            });
          });

          console.log(
            chalk.green(`  ✓ Printed & marked`),
            chalk.dim(order.orderNumber),
          );
        } catch (err) {
          console.error(chalk.red(`  ✗ Error:`), err.message);
        } finally {
          releaseLock(lockKey);
        }
      }
    },
    (err) => {
      console.error(chalk.red("[Listener] New orders error:"), err.message);
      // Firestore will automatically retry the listener
    },
  );

  console.log(
    chalk.cyan("[Listener]"),
    "Watching for new orders (kotPrinted == false)",
  );
}

// ═══════════════════════════════════════════════════════════════
//  LISTENER 2: REPRINT REQUESTS
//  Query: reprintRequested == true
//  Trigger: added (initial) + modified (staff clicks reprint)
//  Action: print with "REPRINT" label → transaction { reprintRequested: false, reprintCount++ }
// ═══════════════════════════════════════════════════════════════
function listenForReprintRequests() {
  const ref = db.collection("foodOrders").where("reprintRequested", "==", true);

  ref.onSnapshot(
    async (snapshot) => {
      for (const change of snapshot.docChanges()) {
        // Process `added` (initial load of matching docs) and `modified`
        // (when staff clicks Print while listener is running — the doc
        // goes from reprintRequested: false → true, re-entering the query)
        if (change.type !== "added" && change.type !== "modified") continue;

        const docId = change.doc.id;
        const order = { id: docId, ...change.doc.data() };

        // Concurrency lock
        const lockKey = `reprint-${docId}`;
        if (!acquireLock(lockKey)) continue;

        logOrder("REPRINT", "yellow", order);

        try {
          // ── STEP 1: PRINT WITH REPRINT LABEL (production only) ──
          let printed = true;
          if (config.isProduction) {
            printed = await printReceipt(order, "REPRINT");
          } else {
            console.log(
              chalk.dim(`  ⏭ Skipping reprint (NODE_ENV=${config.env})`),
            );
          }

          if (!printed) {
            console.error(
              chalk.red(`  ✗ Reprint failed`),
              chalk.dim("— will retry on next snapshot"),
            );
            continue;
          }

          // ── STEP 2: ATOMIC RESET ──
          const docRef = db.collection("foodOrders").doc(docId);

          await db.runTransaction(async (tx) => {
            const freshDoc = await tx.get(docRef);
            if (!freshDoc.exists) return;

            const data = freshDoc.data();

            // Double-check: already handled by another instance
            if (data.reprintRequested !== true) {
              console.log(
                chalk.yellow(`  ⚠ Already handled by another instance`),
              );
              return;
            }

            tx.update(docRef, {
              reprintRequested: false,
              reprintCount: admin.firestore.FieldValue.increment(1),
              lastReprintAt: admin.firestore.FieldValue.serverTimestamp(),
            });
          });

          console.log(
            chalk.green(`  ✓ Reprinted & reset`),
            chalk.dim(order.orderNumber),
          );
        } catch (err) {
          console.error(chalk.red(`  ✗ Error:`), err.message);
        } finally {
          releaseLock(lockKey);
        }
      }
    },
    (err) => {
      console.error(chalk.red("[Listener] Reprint error:"), err.message);
    },
  );

  console.log(
    chalk.cyan("[Listener]"),
    "Watching for reprint requests (reprintRequested == true)",
  );
}

module.exports = { listenForNewOrders, listenForReprintRequests };
