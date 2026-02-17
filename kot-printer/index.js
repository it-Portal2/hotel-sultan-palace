#!/usr/bin/env node

/**
 * KOT Printer Listener — Entry Point
 *
 * Connects to Firestore and starts real-time listeners for:
 *  1. New orders (restaurantPrinted == false) → print to Restaurant (Ramson)
 *  2. Reprint requests (reprintRequested == true) → print to Restaurant (Ramson)
 *  3. Kitchen print requests (kitchenPrintRequested == true) → print to Kitchen (POSX)
 *  4. Main bar orders (barPrinted == false, barLocation == main_bar) → Ramson (Phase 9E)
 *  5. Main bar reprints (reprintRequested == true, barLocation == main_bar) → Ramson (Phase 9E)
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
  listenForNewOrders,
  listenForReprintRequests,
  listenForKitchenPrintRequests,
  listenForMainBarOrders,
  listenForMainBarReprints,
} = require("./listener");

async function main() {
  console.log("");
  console.log(
    chalk.bold.hex("#FF6A00")("╔══════════════════════════════════════╗"),
  );
  console.log(
    chalk.bold.hex("#FF6A00")("║   KOT PRINTER LISTENER — v3.0.0     ║"),
  );
  console.log(
    chalk.bold.hex("#FF6A00")("║   Sultan Palace Hotel               ║"),
  );
  console.log(
    chalk.bold.hex("#FF6A00")("╚══════════════════════════════════════╝"),
  );
  console.log("");

  // Show config — Restaurant Printer
  console.log(chalk.bold.cyan("  📠 Restaurant Printer (Ramson):"));
  console.log(chalk.dim("     Type:"), config.printer.type);
  console.log(chalk.dim("     Interface:"), config.printer.interface);
  console.log(chalk.dim("     Width:"), config.printer.width, "chars");

  const restaurantReady = await isPrinterReady("restaurant");
  if (restaurantReady) {
    console.log(chalk.green("     ✓ Connected and ready"));
  } else {
    console.log(chalk.yellow("     ⚠ Not detected — will retry when printing"));
  }
  console.log("");

  // Show config — Kitchen Printer
  console.log(chalk.bold.magenta("  🍳 Kitchen Printer (POSX):"));
  console.log(chalk.dim("     Type:"), config.kitchenPrinter.type);
  console.log(chalk.dim("     Interface:"), config.kitchenPrinter.interface);
  console.log(chalk.dim("     Width:"), config.kitchenPrinter.width, "chars");

  const kitchenReady = await isPrinterReady("kitchen");
  if (kitchenReady) {
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

  // Start all five listeners
  listenForNewOrders();
  listenForReprintRequests();
  listenForKitchenPrintRequests();
  listenForMainBarOrders();
  listenForMainBarReprints();

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
