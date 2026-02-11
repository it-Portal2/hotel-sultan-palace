#!/usr/bin/env node

/**
 * KOT Printer Listener — Entry Point
 *
 * Connects to Firestore and starts real-time listeners for:
 *  1. New orders (kotPrinted == false) → print & mark
 *  2. Reprint requests (reprintRequested == true) → print & reset
 *
 * Usage:
 *   1. Copy .env.example → .env and fill in values
 *   2. Place serviceAccountKey.json in this directory
 *   3. npm install
 *   4. npm start
 */

const chalk = require("chalk");
const config = require("./config");
const { isPrinterReady } = require("./printer");
const { listenForNewOrders, listenForReprintRequests } = require("./listener");

async function main() {
  console.log("");
  console.log(
    chalk.bold.hex("#FF6A00")("╔══════════════════════════════════════╗"),
  );
  console.log(
    chalk.bold.hex("#FF6A00")("║   KOT PRINTER LISTENER — v1.0.0     ║"),
  );
  console.log(
    chalk.bold.hex("#FF6A00")("║   Sultan Palace Hotel               ║"),
  );
  console.log(
    chalk.bold.hex("#FF6A00")("╚══════════════════════════════════════╝"),
  );
  console.log("");

  // Show config
  console.log(chalk.dim("  Printer Type:"), config.printer.type);
  console.log(chalk.dim("  Printer Interface:"), config.printer.interface);
  console.log(chalk.dim("  Paper Width:"), config.printer.width, "chars");
  console.log(chalk.dim("  Environment:"), config.env);
  if (!config.isProduction) {
    console.log(
      chalk.yellow(
        "  ⚠ DEV MODE — printing disabled. Set NODE_ENV=production to enable.",
      ),
    );
  }
  console.log("");

  // Check printer
  const ready = await isPrinterReady();
  if (ready) {
    console.log(chalk.green("  ✓ Printer connected and ready"));
  } else {
    console.log(
      chalk.yellow("  ⚠ Printer not detected — will retry when printing"),
    );
    console.log(
      chalk.dim(
        "    Check that the printer is powered on and the interface is correct",
      ),
    );
  }
  console.log("");

  // Start listeners
  listenForNewOrders();
  listenForReprintRequests();

  console.log("");
  console.log(chalk.green.bold("  ● System is live — waiting for orders..."));
  console.log(chalk.dim("  Press Ctrl+C to stop"));
  console.log("");
}

// Handle graceful shutdown
process.on("SIGINT", () => {
  console.log("");
  console.log(chalk.yellow("[System] Shutting down..."));
  process.exit(0);
});

process.on("unhandledRejection", (reason) => {
  console.error(chalk.red("[System] Unhandled rejection:"), reason);
});

main().catch((err) => {
  console.error(chalk.red("[System] Fatal error:"), err);
  process.exit(1);
});
