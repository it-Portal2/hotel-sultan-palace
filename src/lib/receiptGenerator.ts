"use client";

import jsPDF from "jspdf";
import { FoodOrder } from "./firestoreService";
import { storage } from "./firebase";
import { ref, uploadBytes, getDownloadURL } from "firebase/storage";

interface ReceiptData {
  order: FoodOrder;
}

const safe = (v: unknown): string => {
  if (v === null || v === undefined || v === "") return "N/A";
  const s = String(v).trim();
  return s || "N/A";
};

const money = (n: number): string => `$${n.toFixed(2)}`;

// ================= DRAW ALL RECEIPT CONTENT =================

function drawReceipt(doc: jsPDF, order: FoodOrder): number {
  const items = order.items || [];
  const W = 58;
  const M = 3;
  let y = 4; // top margin

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

  // ================= SEPARATOR =================
  const sep = () => {
    y -= 1.0;
    doc.setLineWidth(0.1);
    doc.line(M, y, W - M, y);
    y += 2.3;
  };

  // ================= DASH =================
  const dash = () => {
    y -= 0.8;
    doc.setLineDashPattern([0.5, 0.5], 0);
    doc.line(M, y, W - M, y);
    doc.setLineDashPattern([], 0);
    y += 2.0;
  };

  // ================= HEADER =================
  center("SULTAN PALACE HOTEL", 7, true);
  center("Dongwe, East Coast, Zanzibar", 4.5);
  center("+255 684 888 111 | +255 777 085 630", 4.5);

  sep();

  let typeStr = "WALK IN";
  const type = (order as any).orderType;
  if (type === "takeaway") typeStr = "TAKEAWAY";
  else if (type === "room_service") typeStr = "ROOM SERVICE";
  else if (type === "delivery") typeStr = "DELIVERY";

  center(typeStr, 7, true);
  y -= 1;
  sep();

  const dt = order.createdAt instanceof Date ? order.createdAt : new Date();

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
    (order as any).orderType === "room_service" ||
    (order as any).deliveryLocation === "in_room";

  if (isRoomService) left(`Room: ${safe(order.roomName)}`, 5.5);
  else left(`Table: ${safe((order as any).tableNumber)}`, 5.5);

  sep();

  const waiter = order.waiterName || "N/A";
  row(`Guest: ${safe(order.guestName)}`, `Waiter: ${safe(waiter)}`, 5.5);

  sep();

  // ================= ITEMS HEADER =================
  doc.setFontSize(5.5);
  bold();
  doc.text("Item", M, y);
  doc.text("Sku", M + 21, y);
  doc.text("Qty", M + 36, y);
  doc.text("Amount", W - M, y, { align: "right" });
  y += lineSpacing(5.5);
  dash();

  // ================= ITEMS =================
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

  items.forEach((item, index) => {
    const variant = (item as any).variant;
    let rawName = item.name || "Item";

    if (variant?.name) {
      const regex = new RegExp(`\\s*-\\s*${variant.name}$`, "i");
      rawName = rawName.replace(regex, "");
    }

    const name = toTitleCase(rawName);
    const qty = item.quantity || 1;
    const price = item.price || 0;
    const amt = money(price * qty);

    let sku = (item as any).sku || "";
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

    const notes = item.specialInstructions || (item as any).notes;
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

  // ================= TOTALS =================
  const subtotal =
    order.subtotal ??
    items.reduce((s, i) => s + (i.price || 0) * (i.quantity || 1), 0);

  const tax = order.tax ?? 0;
  const discount = (order as any).discount ?? 0;
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

  // ================= PAYMENT =================
  normal();
  const paymentMethod = safe(order.paymentMethod);
  left(`Payment: ${paymentMethod}`, 5.5);
  const orderPaid = (order as any).paidAmount;
  const orderDue = (order as any).dueAmount;
  const isDueStatus =
    order.paymentStatus === "due" ||
    order.paymentStatus === "unpaid" ||
    order.paymentStatus === "partial";

  let paid = orderPaid;
  let due = orderDue;

  // Default logic if missing
  if (paid === undefined || paid === null) {
    if (isDueStatus) {
      paid = 0;
    } else {
      paid = total; // Assume fully paid if status is not due/unpaid
    }
  }

  if (due === undefined || due === null) {
    due = total - paid;
  }

  // Ensure non-negative due
  if (due < 0) due = 0;

  row("Paid:", money(paid), 5.5);
  row("Due:", money(due), 5.5);

  sep();

  // ================= FOOTER =================
  center("Thank you for your order!", 5.5);

  y += 1.5;

  row(
    `Prepared By : ${safe(order.preparedBy)}`,
    `Printed By  : ${safe(order.printedBy)}`,
    5,
  );

  return y; // return final y position = actual content height
}

// ================= TWO-PASS RENDERING =================
// Pass 1: Draw on a tall canvas to measure actual content height.
// Pass 2: Create final PDF at the exact measured height + bottom padding.
export function generateReceiptPDF(data: ReceiptData): Blob {
  const { order } = data;
  const BOTTOM_PADDING = 4; // mm

  // Pass 1: measure
  const measureDoc = new jsPDF({
    orientation: "portrait",
    unit: "mm",
    format: [58, 1000], // very tall — content will never overflow
  });
  const actualHeight = drawReceipt(measureDoc, order);

  // Pass 2: render at exact height
  const finalDoc = new jsPDF({
    orientation: "portrait",
    unit: "mm",
    format: [58, actualHeight + BOTTOM_PADDING],
  });
  drawReceipt(finalDoc, order);

  return finalDoc.output("blob");
}

/* ===== Upload + Download functions ===== */

export async function uploadReceiptToStorage(
  data: ReceiptData,
): Promise<string | null> {
  if (!storage) return null;
  try {
    const blob = generateReceiptPDF(data);
    const id = data.order.id || data.order.orderNumber || String(Date.now());
    const path = `receipts/${id}/receipt-${Date.now()}.pdf`;
    const sRef = ref(storage, path);
    await uploadBytes(sRef, blob, { contentType: "application/pdf" });
    return await getDownloadURL(sRef);
  } catch (e) {
    console.error("[Receipt] Upload error:", e);
    return null;
  }
}

export function downloadReceiptPDF(data: ReceiptData, filename?: string): void {
  const blob = generateReceiptPDF(data);
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename || `receipt-${data.order.orderNumber || "order"}.pdf`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

export async function processReceipt(
  data: ReceiptData,
): Promise<string | null> {
  downloadReceiptPDF(data);
  return uploadReceiptToStorage(data);
}

import {
  getNextOrderNumber,
  getNextReceiptNumber,
} from "./services/fbOrderService";

export async function generateReceiptNumber(): Promise<string> {
  return await getNextReceiptNumber();
}

export async function generateOrderNumber(): Promise<string> {
  return await getNextOrderNumber();
}
