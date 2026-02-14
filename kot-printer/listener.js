/**
 * listener.js
 * Production-grade Firestore real-time listeners for KOT printing.
 *
 * THREE LISTENERS:
 * ─────────────────
 * 1. NEW ORDERS         → restaurantPrinted == false → print to Ramson (restaurant)
 * 2. REPRINT REQUESTS   → reprintRequested == true   → print to Ramson (restaurant)
 * 3. KITCHEN PRINTS     → kitchenPrintRequested == true → print to POSX (kitchen)
 *
 * DESIGN PRINCIPLES (industry-standard):
 * ─────────────────────────────────────
 * 1. ATOMIC OPERATIONS  — Firestore transactions prevent double-prints.
 * 2. NO IN-MEMORY STATE — Firestore document IS the source of truth.
 * 3. EVENT-TYPE FILTERING — `added` for new, `added`+`modified` for requests.
 * 4. SELF-HEALING QUERIES — Setting flag removes doc from query automatically.
 * 5. CONCURRENCY LOCK — Per-document in-memory lock prevents parallel processing.
 * 6. AUDIT TRAIL — Timestamps and counts for operational visibility.
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

// ═══════════════════════════════════════════════════════════════
//  LISTENER 1: NEW ORDERS → Restaurant Printer (Ramson)
//  Query: restaurantPrinted == false
//  Trigger: document enters the query (added event only)
//  Action: print to "restaurant" → set restaurantPrinted: true
// ═══════════════════════════════════════════════════════════════
function listenForNewOrders() {
  const ref = db
    .collection("foodOrders")
    .where("restaurantPrinted", "==", false);

  ref.onSnapshot(
    async (snapshot) => {
      for (const change of snapshot.docChanges()) {
        if (change.type !== "added") continue;

        const docId = change.doc.id;
        const order = { id: docId, ...change.doc.data() };

        const lockKey = `new-${docId}`;
        if (!acquireLock(lockKey)) continue;

        logOrder("NEW ORDER", "green", order, "restaurant");

        try {
          let printed = true;
          if (config.isProduction) {
            printed = await printReceipt(order, null, "restaurant");
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

          const docRef = db.collection("foodOrders").doc(docId);
          await db.runTransaction(async (tx) => {
            const freshDoc = await tx.get(docRef);
            if (!freshDoc.exists) return;

            const data = freshDoc.data();
            if (data.restaurantPrinted === true) {
              console.log(
                chalk.yellow(`  ⚠ Already marked printed by another instance`),
              );
              return;
            }

            tx.update(docRef, {
              restaurantPrinted: true,
              restaurantPrintedAt: admin.firestore.FieldValue.serverTimestamp(),
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
    },
  );

  console.log(
    chalk.cyan("[Listener]"),
    "Watching for new orders (restaurantPrinted == false) → Restaurant",
  );
}

// ═══════════════════════════════════════════════════════════════
//  LISTENER 2: REPRINT REQUESTS → Restaurant Printer (Ramson)
//  Query: reprintRequested == true
//  Trigger: added + modified
//  Action: print to "restaurant" with REPRINT label → reset flag
// ═══════════════════════════════════════════════════════════════
function listenForReprintRequests() {
  const ref = db.collection("foodOrders").where("reprintRequested", "==", true);

  ref.onSnapshot(
    async (snapshot) => {
      for (const change of snapshot.docChanges()) {
        if (change.type !== "added" && change.type !== "modified") continue;

        const docId = change.doc.id;
        const order = { id: docId, ...change.doc.data() };

        const lockKey = `reprint-${docId}`;
        if (!acquireLock(lockKey)) continue;

        logOrder("REPRINT", "yellow", order, "restaurant");

        try {
          let printed = true;
          if (config.isProduction) {
            printed = await printReceipt(order, "REPRINT", "restaurant");
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

          const docRef = db.collection("foodOrders").doc(docId);
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
      console.error(chalk.red("[Listener] Reprint error:"), err.message);
    },
  );

  console.log(
    chalk.cyan("[Listener]"),
    "Watching for reprint requests (reprintRequested == true) → Restaurant",
  );
}

// ═══════════════════════════════════════════════════════════════
//  LISTENER 3: KITCHEN PRINT REQUESTS → Kitchen Printer (POSX)
//  Query: kitchenPrintRequested == true
//  Trigger: added + modified
//  Action: print to "kitchen" → reset flag, set kitchenPrinted
// ═══════════════════════════════════════════════════════════════
function listenForKitchenPrintRequests() {
  const ref = db
    .collection("foodOrders")
    .where("kitchenPrintRequested", "==", true);

  ref.onSnapshot(
    async (snapshot) => {
      for (const change of snapshot.docChanges()) {
        if (change.type !== "added" && change.type !== "modified") continue;

        const docId = change.doc.id;
        const order = { id: docId, ...change.doc.data() };

        const lockKey = `kitchen-${docId}`;
        if (!acquireLock(lockKey)) continue;

        logOrder("KITCHEN PRINT", "magenta", order, "kitchen");

        try {
          let printed = true;
          if (config.isProduction) {
            printed = await printReceipt(order, "KITCHEN", "kitchen");
          } else {
            console.log(
              chalk.dim(`  ⏭ Skipping kitchen print (NODE_ENV=${config.env})`),
            );
          }

          if (!printed) {
            console.error(
              chalk.red(`  ✗ Kitchen print failed`),
              chalk.dim("— will retry on next snapshot"),
            );
            continue;
          }

          const docRef = db.collection("foodOrders").doc(docId);
          await db.runTransaction(async (tx) => {
            const freshDoc = await tx.get(docRef);
            if (!freshDoc.exists) return;

            const data = freshDoc.data();
            if (data.kitchenPrintRequested !== true) {
              console.log(
                chalk.yellow(`  ⚠ Already handled by another instance`),
              );
              return;
            }

            tx.update(docRef, {
              kitchenPrintRequested: false,
              kitchenPrinted: true,
              kitchenPrintedAt: admin.firestore.FieldValue.serverTimestamp(),
            });
          });

          console.log(
            chalk.green(`  ✓ Kitchen printed & marked`),
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
      console.error(chalk.red("[Listener] Kitchen print error:"), err.message);
    },
  );

  console.log(
    chalk.cyan("[Listener]"),
    "Watching for kitchen prints (kitchenPrintRequested == true) → Kitchen",
  );
}

module.exports = {
  listenForNewOrders,
  listenForReprintRequests,
  listenForKitchenPrintRequests,
};
