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

  // ─── Printer ───
  printer: {
    type: process.env.PRINTER_TYPE || "epson",
    interface: process.env.PRINTER_INTERFACE || "tcp://192.168.1.100:9100",
    width: parseInt(process.env.PRINTER_WIDTH || "32", 10),
  },

  // ─── Hotel Info (must match jsPDF receipt) ───
  hotel: {
    name: "SULTAN PALACE HOTEL",
    address: "Dongwe, East Coast, Zanzibar",
    phones: "+255 684 888 111 | +255 777 085 630",
  },
};
