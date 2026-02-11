/**
 * printer.js
 * Manages thermal printer connection and print jobs.
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

let printerInstance = null;

/**
 * Get or create the printer instance.
 */
function getPrinter() {
  if (!printerInstance) {
    printerInstance = new ThermalPrinter({
      type: printerTypeMap[config.printer.type] || PrinterTypes.EPSON,
      interface: config.printer.interface,
      characterSet: "PC437_USA",
      removeSpecialCharacters: false,
      lineCharacter: "-",
      width: config.printer.width,
      options: {
        timeout: 5000,
      },
    });
  }
  return printerInstance;
}

/**
 * Check if the printer is connected and ready.
 */
async function isPrinterReady() {
  try {
    const p = getPrinter();
    const connected = await p.isPrinterConnected();
    return connected;
  } catch (err) {
    return false;
  }
}

/**
 * Print a receipt for the given order.
 * @param {object} order - Firestore order document data
 * @param {string} [label] - Optional label (e.g. "REPRINT")
 * @returns {Promise<boolean>} - true if printed successfully
 */
async function printReceipt(order, label) {
  const p = getPrinter();

  try {
    // Check connection
    const connected = await p.isPrinterConnected();
    if (!connected) {
      console.error(
        "[Printer] Not connected. Check interface:",
        config.printer.interface,
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
      p.setTextNormalSize();
      p.newLine();
    }

    // Build the receipt content
    buildReceipt(p, order);

    // Execute print
    await p.execute();

    return true;
  } catch (err) {
    console.error("[Printer] Print failed:", err.message);

    // Reset instance on error so next attempt creates fresh connection
    printerInstance = null;

    return false;
  }
}

module.exports = { printReceipt, isPrinterReady };
