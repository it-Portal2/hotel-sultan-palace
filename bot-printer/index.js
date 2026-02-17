#!/usr/bin/env node

/**
 * BOT Printer Listener — Entry Point
 *
 * Connects to Firestore and starts real-time listeners for:
 *  1. Beach bar orders (barPrinted == false, barLocation == beach_bar) → print
 *  2. Beach bar reprints (reprintRequested == true, barLocation == beach_bar) → print
 *
 * Main Bar printing is handled by KOT service (Phase 9E — shares Ramson printer).
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
    chalk.bold.hex("#9333EA")("║   BOT PRINTER LISTENER — v2.0.0     ║"),
  );
  console.log(
    chalk.bold.hex("#9333EA")("║   Sultan Palace Hotel               ║"),
  );
  console.log(
    chalk.bold.hex("#9333EA")("║   Beach Bar Only (Phase 9F)         ║"),
  );
  console.log(
    chalk.bold.hex("#9333EA")("╚══════════════════════════════════════╝"),
  );
  console.log("");

  // Show config — Beach Bar Printer (only printer in this service now)
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

  console.log(
    chalk.dim("  ℹ Main Bar printing moved to KOT service (Ramson printer)"),
  );
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

  // Start listeners (beach bar only)
  listenForNewBarOrders();
  listenForBarReprintRequests();

  console.log("");
  console.log(
    chalk.green.bold("  ● System is live — waiting for beach bar orders..."),
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
