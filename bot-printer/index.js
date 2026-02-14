#!/usr/bin/env node

/**
 * BOT Printer Listener — Entry Point
 *
 * Connects to Firestore and starts real-time listeners for:
 *  1. New bar orders (barPrinted == false) → route by barLocation → print
 *  2. Reprint requests (reprintRequested == true) → route by barLocation → print
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
} = require("./listener");

async function main() {
  console.log("");
  console.log(
    chalk.bold.hex("#9333EA")("╔══════════════════════════════════════╗"),
  );
  console.log(
    chalk.bold.hex("#9333EA")("║   BOT PRINTER LISTENER — v1.0.0     ║"),
  );
  console.log(
    chalk.bold.hex("#9333EA")("║   Sultan Palace Hotel               ║"),
  );
  console.log(
    chalk.bold.hex("#9333EA")("╚══════════════════════════════════════╝"),
  );
  console.log("");

  // Show config — Main Bar Printer
  console.log(chalk.bold.cyan("  🍸 Main Bar Printer:"));
  console.log(chalk.dim("     Type:"), config.mainBarPrinter.type);
  console.log(chalk.dim("     Interface:"), config.mainBarPrinter.interface);
  console.log(chalk.dim("     Width:"), config.mainBarPrinter.width, "chars");

  const mainBarReady = await isPrinterReady("main_bar");
  if (mainBarReady) {
    console.log(chalk.green("     ✓ Connected and ready"));
  } else {
    console.log(chalk.yellow("     ⚠ Not detected — will retry when printing"));
  }
  console.log("");

  // Show config — Beach Bar Printer
  console.log(chalk.bold.cyan("  🏖️  Beach Bar Printer:"));
  console.log(chalk.dim("     Type:"), config.beachBarPrinter.type);
  console.log(chalk.dim("     Interface:"), config.beachBarPrinter.interface);
  console.log(chalk.dim("     Width:"), config.beachBarPrinter.width, "chars");

  const beachBarReady = await isPrinterReady("beach_bar");
  if (beachBarReady) {
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

  // Start listeners
  listenForNewBarOrders();
  listenForBarReprintRequests();

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
