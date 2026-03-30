#!/usr/bin/env node

/**
 * BOT Printer Listener — Entry Point
 *
 * Connects to Firestore and starts real-time listeners for bar orders:
 *  1. New orders (barPrinted == false) → print
 *  2. Reprint requests (reprintRequested == true) → print
 *  3. Manual bar print requests (barPrintRequested == true) → print
 *
 * Usage:
 *   1. Copy .env.example → .env and fill in values
 *   2. Place serviceAccountKey.json in this directory
 *   3. npm install
 *   4. npm start
 */

const chalk = require("chalk");
const config = require("./config");
const { isPrinterReady, PRINTER_CONFIGS } = require("./printer");
const {
  listenForNewBarOrders,
  listenForBarReprintRequests,
  listenForBarPrintRequests,
} = require("./listener");

async function main() {
  console.log("");
  console.log(
    chalk.bold.hex("#9333EA")("╔══════════════════════════════════════╗"),
  );
  console.log(
    chalk.bold.hex("#9333EA")("║   BOT PRINTER LISTENER          ║"),
  );
  console.log(
    chalk.bold.hex("#9333EA")("║   Sultan Palace Hotel           ║"),
  );
  console.log(
    chalk.bold.hex("#9333EA")("║   All Bar Locations             ║"),
  );
  console.log(
    chalk.bold.hex("#9333EA")("╚══════════════════════════════════════╝"),
  );
  console.log("");

  // Show config — Bar Printer
  console.log(chalk.bold.cyan("  📠 Bar Printer (BOT):"));
  console.log(chalk.dim("     Type:"), config.barPrinter.type);
  console.log(chalk.dim("     Interface:"), config.barPrinter.interface);
  console.log(chalk.dim("     Width:"), config.barPrinter.width, "chars");

  const barReady = await isPrinterReady("bar");
  if (barReady) {
    console.log(chalk.green("     ✓ Connected and ready"));
  } else {
    console.log(chalk.yellow("     ⚠ Not detected — will retry when printing"));
  }
  console.log("");

  // Environment
  console.log(chalk.dim("  Environment:"), config.env);
  if (!config.isProduction) {
    console.log(
      chalk.yellow(
        "  ⚠ DEV MODE — printing disabled. Set NODE_ENV=production to enable.",
      ),
    );
  }
  console.log("");

  // Start listeners (all bar orders)
  listenForNewBarOrders();
  listenForBarReprintRequests();
  listenForBarPrintRequests();

  console.log("");
  console.log(
    chalk.green.bold("  ● System is live — waiting for bar orders..."),
  );
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
