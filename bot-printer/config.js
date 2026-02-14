require("dotenv").config();
const path = require("path");

module.exports = {
  // ─── Environment ───
  env: process.env.NODE_ENV || "development",
  isProduction: (process.env.NODE_ENV || "development") === "production",

  // ─── Firebase ───
  firebase: {
    serviceAccountPath: path.resolve(
      process.env.FIREBASE_SERVICE_ACCOUNT_PATH || "./serviceAccountKey.json",
    ),
  },

  // ─── Main Bar Printer ───
  // For: bar orders where barLocation === "main_bar"
  mainBarPrinter: {
    type: process.env.MAIN_BAR_PRINTER_TYPE || "epson",
    interface:
      process.env.MAIN_BAR_PRINTER_INTERFACE || "tcp://192.168.1.102:9100",
    width: parseInt(process.env.MAIN_BAR_PRINTER_WIDTH || "48", 10),
  },

  // ─── Beach Bar Printer ───
  // For: bar orders where barLocation === "beach_bar"
  beachBarPrinter: {
    type: process.env.BEACH_BAR_PRINTER_TYPE || "epson",
    interface:
      process.env.BEACH_BAR_PRINTER_INTERFACE || "tcp://192.168.1.103:9100",
    width: parseInt(process.env.BEACH_BAR_PRINTER_WIDTH || "48", 10),
  },

  // ─── Hotel Info (must match jsPDF receipt) ───
  hotel: {
    name: "SULTAN PALACE HOTEL",
    address: "Dongwe, East Coast, Zanzibar",
    phones: "+255 684 888 111 | +255 777 085 630",
  },
};
