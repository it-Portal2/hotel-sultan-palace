/**
 * printer.js
 * Printer module for BOT (Bar Order Ticket) printing.
 *
 * Printers:
 *   "beach_bar" → Beach Bar Printer (config.beachBarPrinter)
 *
 * (Main Bar printing moved to KOT service — Phase 9E)
 */

const {
  printer: ThermalPrinter,
  types: PrinterTypes,
} = require("node-thermal-printer");
const config = require("./config");
const { buildReceipt } = require("./receiptBuilder");

// Map config type string to PrinterTypes enum
const printerTypeMap = {
  epson: PrinterTypes.EPSON,
  star: PrinterTypes.STAR,
};

// ─── Named printer instances ───
const printerInstances = {};

// Printer configs — beach_bar only (main_bar moved to KOT service)
const PRINTER_CONFIGS = {
  beach_bar: config.beachBarPrinter,
};

/**
 * Get or create a printer instance by name.
 * @param {"beach_bar"} name
 */
function getPrinter(name) {
  const cfg = PRINTER_CONFIGS[name];
  if (!cfg) throw new Error(`Unknown printer: "${name}"`);

  if (!printerInstances[name]) {
    printerInstances[name] = new ThermalPrinter({
      type: printerTypeMap[cfg.type] || PrinterTypes.EPSON,
      interface: cfg.interface,
      characterSet: "PC437_USA",
      removeSpecialCharacters: false,
      lineCharacter: "-",
      width: cfg.width,
      options: {
        timeout: 5000,
      },
    });
  }
  return printerInstances[name];
}

/**
 * Check if a named printer is connected and ready.
 * @param {"beach_bar"} name
 */
async function isPrinterReady(name) {
  try {
    const p = getPrinter(name);
    return await p.isPrinterConnected();
  } catch (err) {
    return false;
  }
}

/**
 * Print a receipt for the given order on the specified printer.
 * @param {object} order - Firestore order document data
 * @param {string} [label] - Optional label (e.g. "REPRINT")
 * @param {"beach_bar"} [printerName="beach_bar"] - Target printer
 * @returns {Promise<boolean>} - true if printed successfully
 */
async function printReceipt(order, label, printerName = "beach_bar") {
  const p = getPrinter(printerName);

  try {
    // Check connection
    const connected = await p.isPrinterConnected();
    if (!connected) {
      const cfg = PRINTER_CONFIGS[printerName];
      console.error(
        `[Printer:${printerName}] Not connected. Check interface:`,
        cfg.interface,
      );
      return false;
    }

    // Clear any previous buffer
    p.clear();

    // If reprint, add a header label
    if (label) {
      p.alignCenter();
      p.bold(true);
      p.setTextSize(1, 1);
      p.println(`*** ${label} ***`);
      p.bold(false);
      p.setTextNormal();
      p.newLine();
    }

    // Build the receipt content (same layout as KOT)
    const cfg = PRINTER_CONFIGS[printerName];
    buildReceipt(p, order, cfg.width);

    // Execute print
    await p.execute();

    return true;
  } catch (err) {
    console.error(`[Printer:${printerName}] Print failed:`, err.message);

    // Reset instance on error so next attempt creates fresh connection
    printerInstances[printerName] = null;

    return false;
  }
}

module.exports = { printReceipt, isPrinterReady, PRINTER_CONFIGS };
