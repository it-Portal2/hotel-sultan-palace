/**
 * listener.js
 * Production-grade Firestore real-time listeners for BOT (Bar Order Ticket) printing.
 *
 * THREE LISTENERS (ALL BAR LOCATIONS):
 * ─────────────────
 * 1. NEW BAR ORDERS      → barPrinted == false → print
 * 2. BAR REPRINTS        → reprintRequested == true → print
 * 3. MANUAL BAR PRINTS   → barPrintRequested == true → print
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

// ═══════════════════════════════════════════════════════════════
//  LISTENER 1: NEW BEACH BAR ORDERS
//  Collection: barOrders
//  Query: barPrinted == false AND barLocation == "beach_bar"
//  Trigger: added event only
//  Action: print to beach_bar printer → set barPrinted: true
// ═══════════════════════════════════════════════════════════════
function listenForNewBarOrders() {
  const ref = db
    .collection("barOrders")
    .where("barPrinted", "==", false);

  ref.onSnapshot(
    async (snapshot) => {
      for (const change of snapshot.docChanges()) {
        if (change.type !== "added") continue;

        const docId = change.doc.id;
        const order = { id: docId, ...change.doc.data() };

        const lockKey = `new-${docId}`;
        if (!acquireLock(lockKey)) continue;

        const printerName = "bar";
        logOrder("BAR ORDER", "green", order, printerName);

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
    "Watching for bar orders (barPrinted == false) → Bar Printer",
  );
}

// ═══════════════════════════════════════════════════════════════
//  LISTENER 2: BEACH BAR REPRINT REQUESTS
//  Collection: barOrders
//  Query: reprintRequested == true AND barLocation == "beach_bar"
//  Trigger: added + modified
//  Action: print with REPRINT label to beach_bar printer → reset flag
// ═══════════════════════════════════════════════════════════════
function listenForBarReprintRequests() {
  const ref = db
    .collection("barOrders")
    .where("reprintRequested", "==", true);

  ref.onSnapshot(
    async (snapshot) => {
      for (const change of snapshot.docChanges()) {
        if (change.type !== "added" && change.type !== "modified") continue;

        const docId = change.doc.id;
        const order = { id: docId, ...change.doc.data() };

        const lockKey = `reprint-${docId}`;
        if (!acquireLock(lockKey)) continue;

        const printerName = "bar";
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
    "Watching for bar reprints (reprintRequested == true) → Bar Printer",
  );
}

// ═══════════════════════════════════════════════════════════════
//  LISTENER 3: MANUAL BAR PRINT REQUESTS
//  Collection: barOrders
//  Query: barPrintRequested == true
//  Trigger: added + modified
//  Action: print with BOT label to bar printer → reset flag
// ═══════════════════════════════════════════════════════════════
function listenForBarPrintRequests() {
  const ref = db
    .collection("barOrders")
    .where("barPrintRequested", "==", true);

  ref.onSnapshot(
    async (snapshot) => {
      for (const change of snapshot.docChanges()) {
        if (change.type !== "added" && change.type !== "modified") continue;

        const docId = change.doc.id;
        const order = { id: docId, ...change.doc.data() };

        const lockKey = `manual-${docId}`;
        if (!acquireLock(lockKey)) continue;

        const printerName = "bar";
        logOrder("BAR PRINT", "magenta", order, printerName);

        try {
          let printed = true;
          if (config.isProduction) {
            printed = await printReceipt(order, "BOT", printerName);
          } else {
            console.log(
              chalk.dim(`  ⏭ Skipping manual print (NODE_ENV=${config.env})`),
            );
          }

          if (!printed) {
            console.error(
              chalk.red(`  ✗ Manual print failed`),
              chalk.dim("— will retry on next snapshot"),
            );
            continue;
          }

          const docRef = db.collection("barOrders").doc(docId);
          await db.runTransaction(async (tx) => {
            const freshDoc = await tx.get(docRef);
            if (!freshDoc.exists) return;

            const data = freshDoc.data();
            if (data.barPrintRequested !== true) {
              console.log(
                chalk.yellow(`  ⚠ Already handled by another instance`),
              );
              return;
            }

            tx.update(docRef, {
              barPrintRequested: false,
              barPrinted: true,
              barPrintedAt: admin.firestore.FieldValue.serverTimestamp(),
            });
          });

          console.log(
            chalk.green(`  ✓ Manual print marked`),
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
      console.error(chalk.red("[Listener] Manual print error:"), err.message);
    },
  );

  console.log(
    chalk.cyan("[Listener]"),
    "Watching for manual bar prints (barPrintRequested == true) → Bar Printer",
  );
}

module.exports = {
  listenForNewBarOrders,
  listenForBarReprintRequests,
  listenForBarPrintRequests,
};
