"use server";

import jsPDF from "jspdf";
import { getAdminFirestore, getAdminStorage } from "@/lib/firebaseAdmin";

// ═══════════════════════════════════════════════════════════════
//
// This action fetches an order from Firestore, generates a PDF
// receipt using jsPDF (same layout as client-side receiptGenerator),
// uploads it to Firebase Storage via Admin SDK, and writes the
// receiptUrl back to the order document.
//
// Called from: handleStatusUpdate() when status === "confirmed"
// ═══════════════════════════════════════════════════════════════

// ── Helpers ────────────────────────────────────────────────────

const safe = (v: unknown): string => {
  if (v === null || v === undefined || v === "") return "N/A";
  const s = String(v).trim();
  return s || "N/A";
};

const money = (n: number): string => `$${n.toFixed(2)}`;

// ── Draw Receipt ─────────────

function drawReceipt(doc: jsPDF, order: any): number {
  const items = order.items || [];
  const W = 58;
  const M = 3;
  let y = 4;

  const bold = () => doc.setFont("courier", "bold");
  const normal = () => doc.setFont("courier", "normal");
  const lineSpacing = (size: number) => size * 0.42;

  const center = (text: string, size: number, isBold = false) => {
    doc.setFontSize(size);
    isBold ? bold() : normal();
    doc.text(text, W / 2, y, { align: "center" });
    y += lineSpacing(size);
  };

  const left = (text: string, size: number) => {
    doc.setFontSize(size);
    normal();
    doc.text(text, M, y);
    y += lineSpacing(size);
  };

  const row = (l: string, r: string, size: number) => {
    doc.setFontSize(size);
    normal();
    doc.text(l, M, y);
    doc.text(r, W - M, y, { align: "right" });
    y += lineSpacing(size);
  };

  const sep = () => {
    y -= 1.0;
    doc.setLineWidth(0.1);
    doc.line(M, y, W - M, y);
    y += 2.3;
  };

  const dash = () => {
    y -= 0.8;
    doc.setLineDashPattern([0.5, 0.5], 0);
    doc.line(M, y, W - M, y);
    doc.setLineDashPattern([], 0);
    y += 2.0;
  };

  // ── Header ──
  center("SULTAN PALACE HOTEL", 7, true);
  center("Dongwe, East Coast, Zanzibar", 4.5);
  center("+255 684 888 111 | +255 777 085 630", 4.5);

  sep();

  let typeStr = "WALK IN";
  const type = order.orderType;
  if (type === "takeaway") typeStr = "TAKEAWAY";
  else if (type === "room_service") typeStr = "ROOM SERVICE";
  else if (type === "delivery") typeStr = "DELIVERY";

  center(typeStr, 7, true);
  y -= 1;
  sep();

  const dt =
    order.createdAt instanceof Date
      ? order.createdAt
      : order.createdAt?.toDate?.()
        ? order.createdAt.toDate()
        : new Date();

  const dateStr = dt.toLocaleDateString("en-GB").replace(/\//g, "-");
  const timeStr = dt.toLocaleTimeString("en-US", {
    hour: "2-digit",
    minute: "2-digit",
    hour12: true,
  });

  doc.setFontSize(5.5);
  normal();
  doc.text(`Receipt No.: ${safe(order.receiptNo)}`, M, y);
  doc.text(`Date: ${dateStr}`, 35, y);
  y += lineSpacing(5.5);
  doc.text(`Order No.: ${safe(order.orderNumber)}`, M, y);
  doc.text(`Time: ${timeStr}`, 35, y);
  y += lineSpacing(5.5);

  const isRoomService =
    order.orderType === "room_service" || order.deliveryLocation === "in_room";

  if (isRoomService) left(`Room: ${safe(order.roomName)}`, 5.5);
  else left(`Table: ${safe(order.tableNumber)}`, 5.5);

  sep();

  const waiter = order.waiterName || "N/A";
  row(`Guest: ${safe(order.guestName)}`, `Waiter: ${safe(waiter)}`, 5.5);

  sep();

  // ── Items Header ──
  doc.setFontSize(5.5);
  bold();
  doc.text("Item", M, y);
  doc.text("Sku", M + 21, y);
  doc.text("Qty", M + 36, y);
  doc.text("Amount", W - M, y, { align: "right" });
  y += lineSpacing(5.5);
  dash();

  // ── Items ──
  const toTitleCase = (str: string): string =>
    str
      .toLowerCase()
      .split(" ")
      .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
      .join(" ");

  const wrapText = (
    text: string,
    maxWidth: number,
    fontSize: number,
  ): string[] => {
    doc.setFontSize(fontSize);
    const words = text.split(" ");
    const lines: string[] = [];
    let currentLine = "";

    for (const word of words) {
      const testLine = currentLine ? `${currentLine} ${word}` : word;
      const width = doc.getTextWidth(testLine);
      if (width > maxWidth && currentLine) {
        lines.push(currentLine);
        currentLine = word;
      } else currentLine = testLine;
    }

    if (currentLine) lines.push(currentLine);
    return lines;
  };

  normal();

  items.forEach((item: any, index: number) => {
    const variant = item.variant;
    let rawName = item.name || "Item";

    if (variant?.name) {
      const regex = new RegExp(`\\s*-\\s*${variant.name}$`, "i");
      rawName = rawName.replace(regex, "");
    }

    const name = toTitleCase(rawName);
    const qty = item.quantity || 1;
    const price = item.price || 0;
    const amt = money(price * qty);

    let sku = item.sku || "";
    if (sku === "N/A") sku = "";
    if (sku.length > 10) sku = sku.substring(0, 10);

    const nameLines = wrapText(name, 18, 5.5);

    doc.text(nameLines[0], M, y);
    doc.text(sku, M + 21, y);
    doc.text(String(qty), M + 37, y);
    doc.text(amt, W - M, y, { align: "right" });
    y += 2.5;

    for (let i = 1; i < nameLines.length; i++) {
      doc.text(nameLines[i], M, y);
      y += 2.5;
    }

    if (variant?.name) {
      doc.setFontSize(4.5);
      wrapText(`  ( ${variant.name} )`, 16, 4.5).forEach((l) => {
        doc.text(l, M, y);
        y += 2.2;
      });
    }

    const notes = item.specialInstructions || item.notes;
    if (notes?.trim()) {
      doc.setFontSize(4.5);
      wrapText(`  [${notes}]`, 16, 4.5).forEach((l) => {
        doc.text(l, M, y);
        y += 2.2;
      });
    }

    if (index < items.length - 1) y += 1.2;
  });

  sep();

  // ── Totals ──
  const subtotal =
    order.subtotal ??
    items.reduce(
      (s: number, i: any) => s + (i.price || 0) * (i.quantity || 1),
      0,
    );

  const tax = order.tax ?? 0;
  const discount = order.discount ?? 0;
  const total = order.totalAmount ?? subtotal + tax - discount;

  row("Subtotal:", money(subtotal), 5.5);
  row("Tax:", money(tax), 5.5);

  if (discount > 0) row("Discount:", `-${money(discount)}`, 5.5);

  sep();

  doc.setFontSize(6.5);
  bold();
  doc.text("TOTAL:", M, y);
  doc.text(money(total), W - M, y, { align: "right" });
  y += lineSpacing(6.5);

  sep();

  // ── Payment ──
  normal();
  const paymentMethod = safe(order.paymentMethod);
  left(`Payment: ${paymentMethod}`, 5.5);
  const orderPaid = order.paidAmount;
  const orderDue = order.dueAmount;
  const isDueStatus =
    order.paymentStatus === "due" ||
    order.paymentStatus === "unpaid" ||
    order.paymentStatus === "partial";

  let paid = orderPaid;
  let due = orderDue;

  if (paid === undefined || paid === null) {
    paid = isDueStatus ? 0 : total;
  }

  if (due === undefined || due === null) {
    due = total - paid;
  }

  if (due < 0) due = 0;

  row("Paid:", money(paid), 5.5);
  row("Due:", money(due), 5.5);

  sep();

  // ── Footer ──
  center("Thank you for your order!", 5.5);
  y += 1.5;
  row(
    `Prepared By : ${safe(order.preparedBy)}`,
    `Printed By  : ${safe(order.printedBy)}`,
    5,
  );

  return y;
}

// ── Two-Pass PDF Generation ───────────────────────────────────

function generateReceiptBuffer(order: any): Buffer {
  const BOTTOM_PADDING = 4;

  // Pass 1: measure content height
  const measureDoc = new jsPDF({
    orientation: "portrait",
    unit: "mm",
    format: [58, 1000],
  });
  const actualHeight = drawReceipt(measureDoc, order);

  // Pass 2: render at exact height
  const finalDoc = new jsPDF({
    orientation: "portrait",
    unit: "mm",
    format: [58, actualHeight + BOTTOM_PADDING],
  });
  drawReceipt(finalDoc, order);

  // Get ArrayBuffer and convert to Node.js Buffer
  const arrayBuffer = finalDoc.output("arraybuffer");
  return Buffer.from(arrayBuffer);
}

// ═══════════════════════════════════════════════════════════════
//  Main Export: generateAndStoreReceipt(orderId)
// ═══════════════════════════════════════════════════════════════

export async function generateAndStoreReceipt(
  orderId: string,
  menuType: "food" | "bar" = "food",
): Promise<string | null> {
  const collection = menuType === "bar" ? "barOrders" : "foodOrders";
  try {
    // 1. Fetch order from Firestore
    const db = getAdminFirestore();
    const orderDoc = await db.collection(collection).doc(orderId).get();

    if (!orderDoc.exists) {
      console.error(`[Receipt] Order ${orderId} not found`);
      return null;
    }

    const order = { id: orderDoc.id, ...orderDoc.data() };

    // 2. Generate PDF
    const pdfBuffer = generateReceiptBuffer(order);

    // 3. Upload to Firebase Storage via Admin SDK
    const bucket = getAdminStorage();
    const filePath = `receipts/${orderId}/receipt-${Date.now()}.pdf`;
    const file = bucket.file(filePath);

    await file.save(pdfBuffer, {
      metadata: {
        contentType: "application/pdf",
        metadata: {
          orderId,
          generatedAt: new Date().toISOString(),
          generatedBy: "server",
        },
      },
    });

    // Make the file publicly readable and get the download URL
    await file.makePublic();
    const receiptUrl = `https://storage.googleapis.com/${bucket.name}/${filePath}`;

    // 4. Write receiptUrl back to order document (use correct collection)
    await db.collection(collection).doc(orderId).update({
      receiptUrl,
      receiptGeneratedAt: new Date(),
    });

    console.log(`[Receipt] Generated for order ${orderId}: ${receiptUrl}`);
    return receiptUrl;
  } catch (error) {
    console.error("[Receipt] Server-side generation failed:", error);
    return null;
  }
}
