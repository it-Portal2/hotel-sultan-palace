/**
 * listener.js
 * Production-grade Firestore real-time listeners for BOT (Bar Order Ticket) printing.
 *
 * TWO LISTENERS:
 * ─────────────────
 * 1. NEW BAR ORDERS     → barPrinted == false → route by barLocation → print
 * 2. REPRINT REQUESTS   → reprintRequested == true → route by barLocation → print
 *
 * ROUTING:
 *   order.barLocation === "main_bar"  → Main Bar Printer
 *   order.barLocation === "beach_bar" → Beach Bar Printer
 *
 * Same design principles as KOT listener (atomic ops, no in-memory state,
 * self-healing queries, concurrency locks, audit trail).
 */

const chalk = require("chalk");
const config = require("./config");
const { db, admin } = require("./firebase");
const { printReceipt } = require("./printer");

// ─── Per-document processing lock ───
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
function logOrder(tag, color, order, printerName) {
  const items = order.items?.length || 0;
  console.log(
    chalk[color](`[${tag}]`),
    chalk.bold(order.orderNumber || order.id),
    chalk.dim(
      `— ${order.guestName || "Unknown"} (${items} item${items !== 1 ? "s" : ""}) → ${printerName}`,
    ),
  );
}

/**
 * Resolve which printer to use based on barLocation.
 * Defaults to "main_bar" if barLocation is missing or unknown.
 */
function resolvePrinter(order) {
  const loc = order.barLocation;
  if (loc === "beach_bar") return "beach_bar";
  return "main_bar"; // default
}

// ═══════════════════════════════════════════════════════════════
//  LISTENER 1: NEW BAR ORDERS
//  Collection: barOrders
//  Query: barPrinted == false
//  Trigger: added event only
//  Action: route by barLocation → print → set barPrinted: true
// ═══════════════════════════════════════════════════════════════
function listenForNewBarOrders() {
  const ref = db.collection("barOrders").where("barPrinted", "==", false);

  ref.onSnapshot(
    async (snapshot) => {
      for (const change of snapshot.docChanges()) {
        if (change.type !== "added") continue;

        const docId = change.doc.id;
        const order = { id: docId, ...change.doc.data() };

        const lockKey = `new-${docId}`;
        if (!acquireLock(lockKey)) continue;

        const printerName = resolvePrinter(order);
        logOrder("NEW BAR ORDER", "green", order, printerName);

        try {
          let printed = true;
          if (config.isProduction) {
            printed = await printReceipt(order, null, printerName);
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
            continue;
          }

          const docRef = db.collection("barOrders").doc(docId);
          await db.runTransaction(async (tx) => {
            const freshDoc = await tx.get(docRef);
            if (!freshDoc.exists) return;

            const data = freshDoc.data();
            if (data.barPrinted === true) {
              console.log(
                chalk.yellow(`  ⚠ Already marked printed by another instance`),
              );
              return;
            }

            tx.update(docRef, {
              barPrinted: true,
              barPrintedAt: admin.firestore.FieldValue.serverTimestamp(),
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
      console.error(chalk.red("[Listener] New bar orders error:"), err.message);
    },
  );

  console.log(
    chalk.cyan("[Listener]"),
    "Watching for new bar orders (barPrinted == false)",
  );
}

// ═══════════════════════════════════════════════════════════════
//  LISTENER 2: BAR REPRINT REQUESTS
//  Collection: barOrders
//  Query: reprintRequested == true
//  Trigger: added + modified
//  Action: route by barLocation → print with REPRINT label → reset
// ═══════════════════════════════════════════════════════════════
function listenForBarReprintRequests() {
  const ref = db.collection("barOrders").where("reprintRequested", "==", true);

  ref.onSnapshot(
    async (snapshot) => {
      for (const change of snapshot.docChanges()) {
        if (change.type !== "added" && change.type !== "modified") continue;

        const docId = change.doc.id;
        const order = { id: docId, ...change.doc.data() };

        const lockKey = `reprint-${docId}`;
        if (!acquireLock(lockKey)) continue;

        const printerName = resolvePrinter(order);
        logOrder("BAR REPRINT", "yellow", order, printerName);

        try {
          let printed = true;
          if (config.isProduction) {
            printed = await printReceipt(order, "REPRINT", printerName);
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

          const docRef = db.collection("barOrders").doc(docId);
          await db.runTransaction(async (tx) => {
            const freshDoc = await tx.get(docRef);
            if (!freshDoc.exists) return;

            const data = freshDoc.data();
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
      console.error(chalk.red("[Listener] Bar reprint error:"), err.message);
    },
  );

  console.log(
    chalk.cyan("[Listener]"),
    "Watching for bar reprint requests (reprintRequested == true)",
  );
}

module.exports = { listenForNewBarOrders, listenForBarReprintRequests };
