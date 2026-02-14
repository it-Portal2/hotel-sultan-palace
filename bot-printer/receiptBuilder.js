/**
 * receiptBuilder.js
 *
 * Builds an ESC/POS receipt that EXACTLY matches the jsPDF receipt layout
 * from receiptGenerator.ts.
 *
 * ESC/POS printers handle line spacing natively — each println() advances
 * one line automatically. The jsPDF spacing bugs (manual Y-coordinate math)
 * CANNOT happen here because we don't do manual positioning.
 *
 * 58mm thermal = 32 chars wide (vs jsPDF 58mm with proportional fonts)
 *
 * Matching sections (in order):
 * ┌─────────────────────────────────────────┐
 * │ 1. Hotel Header (name, address, phones) │
 * │ 2. Order Type (WALK IN / TAKEAWAY / …)  │
 * │ 3. Receipt & Order IDs + Date & Time    │
 * │ 4. Room or Table number                 │
 * │ 5. Guest & Waiter names                 │
 * │ 6. Items table (name, sku, qty, amount) │
 * │    └── variant, modifiers, notes        │
 * │ 7. Subtotal, Tax, Discount              │
 * │ 8. TOTAL (bold, double-size)            │
 * │ 9. Payment (method, paid, due)          │
 * │ 10. Footer (thank you, prepared/printed)│
 * │ 11. Auto-cut                            │
 * └─────────────────────────────────────────┘
 */

const config = require("./config");

// ─── Helpers ───

const safe = (v) => {
  if (v === null || v === undefined || v === "") return "N/A";
  const s = String(v).trim();
  return s || "N/A";
};

const money = (n) => `$${Number(n || 0).toFixed(2)}`;

const toTitleCase = (str) =>
  str
    .toLowerCase()
    .split(" ")
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
    .join(" ");

/**
 * Wrap text to fit within maxWidth characters.
 * Returns an array of lines, splitting on word boundaries.
 */
function wrapText(text, maxWidth) {
  if (text.length <= maxWidth) return [text];

  const words = text.split(" ");
  const lines = [];
  let current = "";

  for (const word of words) {
    const test = current ? `${current} ${word}` : word;
    if (test.length > maxWidth && current) {
      lines.push(current);
      current = word;
    } else {
      current = test;
    }
  }
  if (current) lines.push(current);

  // Fallback: if a single word is longer than maxWidth, hard-split it
  const result = [];
  for (const line of lines) {
    if (line.length <= maxWidth) {
      result.push(line);
    } else {
      for (let i = 0; i < line.length; i += maxWidth) {
        result.push(line.substring(i, i + maxWidth));
      }
    }
  }
  return result;
}

/**
 * Build a receipt onto the given printer instance.
 * @param {import('node-thermal-printer').printer} p — thermal printer
 * @param {object} order — Firestore order document data
 */
function buildReceipt(p, order) {
  const items = order.items || [];
  const W = config.printer.width; // 32 for 58mm, 42 for 80mm

  // ─── Left-right row (like jsPDF's row()) ───
  const row = (left, right) => {
    const maxLeft = W - right.length - 1;
    const l = left.length > maxLeft ? left.substring(0, maxLeft) : left;
    const padding = W - l.length - right.length;
    p.println(l + (padding > 0 ? " ".repeat(padding) : " ") + right);
  };

  // ─── Fixed-column row (right column starts at fixed position) ───
  // Ensures labels like "Date:" and "Time:" always start at the same column.
  const SPLIT_COL = 18; // right column starts here
  const rowAligned = (left, right) => {
    const l =
      left.length > SPLIT_COL
        ? left.substring(0, SPLIT_COL)
        : left.padEnd(SPLIT_COL);
    const r = right.substring(0, W - SPLIT_COL);
    p.println(l + r);
  };

  // Column widths for items table
  // Exact proportional match to jsPDF positions:
  //   Item @ M(3), Sku @ M+21(24), Qty @ M+36(39), Amount @ W-M(55)
  //   Gaps = 21mm : 15mm : 16mm over 52mm usable → scaled to 32 chars
  const COL_NAME = 13;
  const COL_SKU = 9;
  const COL_QTY = 3;
  const COL_AMT = W - COL_NAME - COL_SKU - COL_QTY; // 7

  // ═══════════════════════════════════════════
  //  SECTION 1: HOTEL HEADER
  //  Matches jsPDF: center("SULTAN PALACE HOTEL", 7, true)
  //                 center("Dongwe, East Coast, Zanzibar", 4.5)
  //                 center("+255 684 888 111 | +255 777 085 630", 4.5)
  //  Only the hotel name — NO "Prepared By:" prefix.
  //  Phone numbers on a SINGLE line with "|" separator.
  // ═══════════════════════════════════════════
  p.alignCenter();
  p.bold(true);
  p.setTextDoubleHeight();
  p.println(config.hotel.name);
  p.bold(false);
  p.setTextNormal();
  p.println(config.hotel.address);
  // Phone numbers on ONE line (matches jsPDF single-line format)
  p.println(config.hotel.phones);

  p.drawLine();

  // ═══════════════════════════════════════════
  //  SECTION 2: ORDER TYPE
  //  Matches jsPDF: center(typeStr, 7, true)
  //  Use bold normal size (not double-height) for a compact look.
  // ═══════════════════════════════════════════
  let typeStr = "WALK IN";
  const type = order.orderType;
  if (type === "takeaway") typeStr = "TAKEAWAY";
  else if (type === "room_service") typeStr = "ROOM SERVICE";
  else if (type === "delivery") typeStr = "DELIVERY";

  p.bold(true);
  p.println(typeStr);
  p.bold(false);

  p.drawLine();

  // ═══════════════════════════════════════════
  //  SECTION 3: RECEIPT/ORDER IDS + DATE/TIME
  //  Matches jsPDF:
  //    doc.text(`Receipt No.: ${...}`, M, y);
  //    doc.text(`Date: ${dateStr}`,    35, y);
  //    doc.text(`Order No.: ${...}`,   M, y);
  //    doc.text(`Time: ${timeStr}`,    35, y);
  // ═══════════════════════════════════════════
  p.alignLeft();

  const dt =
    order.createdAt && typeof order.createdAt.toDate === "function"
      ? order.createdAt.toDate()
      : order.createdAt instanceof Date
        ? order.createdAt
        : new Date();

  const dateStr = dt.toLocaleDateString("en-GB").replace(/\//g, "-");
  const timeStr = dt.toLocaleTimeString("en-US", {
    hour: "2-digit",
    minute: "2-digit",
    hour12: true,
  });

  rowAligned(`Rcpt: ${safe(order.receiptNo)}`, `Date: ${dateStr}`);
  rowAligned(`Ord:  ${safe(order.orderNumber)}`, `Time: ${timeStr}`);

  // ═══════════════════════════════════════════
  //  SECTION 4: ROOM OR TABLE
  //  Matches jsPDF: left(`Room: ${...}`, 5.5) or left(`Table: ${...}`, 5.5)
  // ═══════════════════════════════════════════
  const isRoomService =
    order.orderType === "room_service" || order.deliveryLocation === "in_room";

  if (isRoomService) {
    p.println(`Room: ${safe(order.roomName)}`);
  } else {
    p.println(`Table: ${safe(order.tableNumber)}`);
  }

  p.drawLine();

  // ═══════════════════════════════════════════
  //  SECTION 5: GUEST & WAITER
  //  Matches jsPDF: row(`Guest: ${...}`, `Waiter: ${...}`, 5.5)
  // ═══════════════════════════════════════════
  row(`Guest: ${safe(order.guestName)}`, `Waiter: ${safe(order.waiterName)}`);

  p.drawLine();

  // ═══════════════════════════════════════════
  //  SECTION 6: ITEMS TABLE
  //  Matches jsPDF column positions:
  //    "Item" @ M, "Sku" @ M+21, "Qty" @ M+36, "Amount" @ W-M (right)
  //  For thermal: Item gets the widest column.
  // ═══════════════════════════════════════════

  // Table header
  p.bold(true);
  p.println(
    "Item".padEnd(COL_NAME) +
      "Sku".padEnd(COL_SKU) +
      "Qty".padEnd(COL_QTY) +
      "Amount".padStart(COL_AMT),
  );
  p.bold(false);
  p.println("-".repeat(W));

  // Items
  items.forEach((item) => {
    const variant = item.variant;
    let rawName = item.name || "Item";

    // Strip variant suffix from name (matches jsPDF lines 161-164)
    if (variant && variant.name) {
      const regex = new RegExp(`\\s*-\\s*${variant.name}$`, "i");
      rawName = rawName.replace(regex, "");
    }

    const name = toTitleCase(rawName);
    const qty = item.quantity || 1;
    const price = item.price || 0;
    const amt = money(price * qty);

    let sku = item.sku || "";
    if (sku === "N/A") sku = "";
    if (sku.length > COL_SKU - 1) sku = sku.substring(0, COL_SKU - 1);

    // First line: name + sku + qty + amount
    const displayName =
      name.length > COL_NAME - 1 ? name.substring(0, COL_NAME - 1) : name;

    p.println(
      displayName.padEnd(COL_NAME) +
        sku.padEnd(COL_SKU) +
        String(qty).padEnd(COL_QTY) +
        amt.padStart(COL_AMT),
    );

    // Continuation lines for long names
    if (name.length > COL_NAME - 1) {
      const remaining = name.substring(COL_NAME - 1);
      wrapText(remaining, W - 2).forEach((line) => {
        p.println("  " + line);
      });
    }

    // Variant (matches jsPDF lines 188-194)
    if (variant && variant.name) {
      let variantText = `  ( ${variant.name} )`;
      if (variant.price > 0) variantText += ` +${money(variant.price)}`;
      wrapText(variantText, W).forEach((line) => p.println(line));
    }

    // Modifiers (matches jsPDF — selectedModifiers array)
    if (item.selectedModifiers && item.selectedModifiers.length > 0) {
      item.selectedModifiers.forEach((mod) => {
        let modText = `  + ${mod.name}`;
        if (mod.price > 0) modText += ` +${money(mod.price)}`;
        wrapText(modText, W).forEach((line) => p.println(line));
      });
    }

    // Special instructions (matches jsPDF lines 196-203)
    const notes = item.specialInstructions || item.notes;
    if (notes && notes.trim()) {
      wrapText(`  [${notes.trim()}]`, W).forEach((line) => p.println(line));
    }
  });

  p.drawLine();

  // ═══════════════════════════════════════════
  //  SECTION 7: SUBTOTAL / TAX / DISCOUNT
  //  Matches jsPDF: row("Subtotal:", money(...), 5.5) etc.
  // ═══════════════════════════════════════════
  const subtotal =
    order.subtotal ??
    items.reduce((s, i) => s + (i.price || 0) * (i.quantity || 1), 0);
  const tax = order.tax ?? 0;
  const discount = order.discount ?? 0;
  const total = order.totalAmount ?? subtotal + tax - discount;

  row("Subtotal:", money(subtotal));
  row("Tax:", money(tax));
  if (discount > 0) {
    row("Discount:", `-${money(discount)}`);
  }

  p.drawLine();

  // ═══════════════════════════════════════════
  //  SECTION 8: TOTAL (bold, double-height)
  //  Matches jsPDF: size 6.5 bold
  //  Double-height makes TOTAL visually prominent on thermal
  // ═══════════════════════════════════════════
  p.bold(true);
  p.setTextDoubleHeight();
  row("TOTAL:", money(total));
  p.bold(false);
  p.setTextNormal();

  p.drawLine();

  // ═══════════════════════════════════════════
  //  SECTION 9: PAYMENT INFO
  //  Matches jsPDF: left(`Payment: ${...}`, 5.5), row("Paid:", ...), row("Due:", ...)
  // ═══════════════════════════════════════════
  p.println(`Payment: ${safe(order.paymentMethod)}`);
  row("Paid:", money(order.paidAmount ?? total));
  row("Due:", money(order.dueAmount ?? 0));

  p.drawLine();

  // ═══════════════════════════════════════════
  //  SECTION 10: FOOTER
  //  Matches jsPDF: center("Thank you for your order!", 5.5)
  //                 row("Prepared By : ...", "Printed By  : ...", 5)
  // ═══════════════════════════════════════════
  p.alignCenter();
  p.println("Thank you for your order!");
  p.alignLeft();
  p.println(`Prepared By: ${safe(order.preparedBy)}`);
  p.println(`Printed By:  ${safe(order.printedBy)}`);
  // ═══════════════════════════════════════════
  //  SECTION 11: FEED + AUTO-CUT
  //  1 empty line of feed before cut prevents text from being
  //  cut off on the leading edge of the cutter
  // ═══════════════════════════════════════════
  p.cut();
}

module.exports = { buildReceipt };
