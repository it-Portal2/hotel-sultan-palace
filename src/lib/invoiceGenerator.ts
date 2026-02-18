import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import { CheckoutBill } from "./firestoreService";

// Helper to format currency
const formatCurrency = (amount: number, currency: string = "USD"): string => {
    return new Intl.NumberFormat("en-US", {
        style: "currency",
        currency: currency,
    }).format(amount);
};

// Helper to format date
const formatDate = (date: Date | string): string => {
    if (!date) return "-";
    const d = new Date(date);
    return d.toLocaleDateString("en-GB", {
        day: "2-digit",
        month: "short",
        year: "numeric",
    });
};

export const generateInvoicePDF = (bill: CheckoutBill): Buffer => {
    const doc = new jsPDF();
    const pageWidth = doc.internal.pageSize.width;

    // Hotel Details
    const hotelName = "Sultan Palace Hotel";
    const hotelAddress = "Dongwe, East Coast, Zanzibar";
    const hotelPhone = "+255 684 888 111";
    const hotelEmail = "reservations@sultanpalacehotelznz.com";
    const hotelWeb = "www.sultanpalacehotelznz.com";

    let y = 20;

    // --- HEADER ---
    doc.setFontSize(20);
    doc.setFont("helvetica", "bold");
    doc.text(hotelName.toUpperCase(), 14, y);

    // Invoice Label (Right aligned)
    doc.setFontSize(24);
    doc.setFont("helvetica", "light");
    doc.setTextColor(50, 50, 50);
    doc.text("INVOICE", pageWidth - 14, y, { align: "right" });

    y += 8;

    // Hotel Contact Info
    doc.setFontSize(9);
    doc.setFont("helvetica", "normal");
    doc.setTextColor(80, 80, 80);
    doc.text(hotelAddress, 14, y); y += 5;
    doc.text(`Tel: ${hotelPhone}`, 14, y); y += 5;
    doc.text(`Email: ${hotelEmail}`, 14, y); y += 5;
    doc.text(hotelWeb, 14, y);

    // Invoice Details (Right aligned)
    y -= 15; // Move back up to align with hotel info
    doc.setFontSize(10);

    const invoiceNum = bill.id.slice(-8).toUpperCase();
    const dateStr = formatDate(new Date());

    doc.setFont("helvetica", "bold");
    doc.text("Invoice #", pageWidth - 50, y);
    doc.setFont("courier", "bold");
    doc.text(invoiceNum, pageWidth - 14, y, { align: "right" });
    y += 6;

    doc.setFont("helvetica", "bold");
    doc.text("Date", pageWidth - 50, y);
    doc.setFont("helvetica", "normal");
    doc.text(dateStr, pageWidth - 14, y, { align: "right" });

    y += 20;

    // Draw Line
    doc.setLineWidth(0.5);
    doc.setDrawColor(0, 0, 0);
    doc.line(14, y, pageWidth - 14, y);
    y += 10;

    // --- GUEST & BOOKING INFO ---
    const leftX = 14;
    const rightX = pageWidth / 2 + 10;

    // Left Column: Bill To
    doc.setFontSize(10);
    doc.setFont("helvetica", "bold");
    doc.setTextColor(100, 100, 100);
    doc.text("BILL TO (GUEST)", leftX, y);
    y += 6;

    doc.setFontSize(12);
    doc.setFont("helvetica", "bold");
    doc.setTextColor(0, 0, 0);
    doc.text(bill.guestName, leftX, y);
    y += 6;

    doc.setFontSize(10);
    doc.setFont("helvetica", "normal");
    if (bill.roomNumber) {
        doc.text(`Room: ${bill.roomNumber}`, leftX, y);
        y += 5;
    }
    doc.text(bill.guestEmail || "N/A", leftX, y);

    // Right Column: Stay Info
    let stayY = y - 17; // Align with top of 'BILL TO' section roughly

    doc.setFontSize(10);
    doc.setFont("helvetica", "bold");
    doc.setTextColor(100, 100, 100);
    doc.text("STAY INFORMATION", rightX, stayY);
    stayY += 6;

    doc.setFontSize(10);
    doc.setFont("helvetica", "normal");
    doc.setTextColor(0, 0, 0);

    const stayInfo = [
        { label: "Check-In:", value: formatDate(bill.checkInDate) },
        { label: "Check-Out:", value: formatDate(bill.checkOutDate) },
        { label: "Booking ID:", value: bill.id },
    ];

    stayInfo.forEach(item => {
        doc.text(item.label, rightX, stayY);
        doc.text(item.value, rightX + 30, stayY);
        stayY += 5;
    });

    y = Math.max(y, stayY) + 10;

    // --- CHARGES TABLE ---

    // Prepare Table Data
    const tableBody: any[] = [];

    // 1. Room Charges
    if (bill.roomDetails) {
        bill.roomDetails.forEach((room, i) => {
            tableBody.push([
                i + 1,
                `Room Charge - ${room.roomType}\nAccomodation Charges`,
                `${room.nights} Night(s) @ ${formatCurrency(room.rate)}`,
                formatCurrency(room.total)
            ]);
        });
    }

    // 2. Food Orders
    bill.foodOrders.forEach(food => {
        tableBody.push([
            '',
            `Restaurant / Bar\nOrder #${(food.orderNumber || "").replace(/^#/, "")}`,
            formatDate(food.date),
            formatCurrency(food.amount)
        ]);
    });

    // 3. Services
    bill.services.forEach(svc => {
        tableBody.push([
            '',
            `${svc.serviceType.replace(/_/g, " ").toUpperCase()}\n${svc.description}`,
            formatDate(svc.date),
            formatCurrency(svc.amount)
        ]);
    });

    // 4. Add-ons
    bill.addOns.forEach(add => {
        tableBody.push([
            '',
            `${add.name}\nAdd-On Item`,
            `Qty: ${add.quantity}`,
            formatCurrency(add.total)
        ]);
    });

    // 5. Facilities
    bill.facilities.forEach(fac => {
        tableBody.push([
            '',
            `${fac.name}\nFacility Usage`,
            formatDate(fac.date),
            formatCurrency(fac.amount)
        ]);
    });

    // 6. POS Invoices
    if (bill.posInvoices) {
        bill.posInvoices.forEach(inv => {
            let desc = `POS Invoice - ${inv.voucherNo}\n${inv.items && inv.items.length > 0 ? inv.items.join(", ") : "Incidental Charges"}`;
            if (inv.totalPaid > 0) desc += `\n(Paid: ${formatCurrency(inv.totalPaid)})`;

            tableBody.push([
                '',
                desc,
                formatDate(inv.date),
                formatCurrency(inv.totalAmount)
            ]);
        });
    }

    // 7. Transactions (Charges)
    if (bill.transactions) {
        bill.transactions
            .filter(t => t.type === "charge")
            .forEach(txn => {
                tableBody.push([
                    '',
                    `${(txn.category || "Other")} Charge\n${txn.description}`,
                    formatDate(txn.date),
                    formatCurrency(txn.amount)
                ]);
            });
    }

    // Generate Table
    autoTable(doc, {
        startY: y,
        head: [["#", "DESCRIPTION", "DATE / DETAILS", "AMOUNT"]],
        body: tableBody,
        theme: "plain",
        styles: {
            fontSize: 9,
            cellPadding: 3,
        },
        headStyles: {
            fillColor: [255, 255, 255],
            textColor: [0, 0, 0],
            fontStyle: 'bold',
            lineWidth: { bottom: 0.5 },
            lineColor: [0, 0, 0]
        },
        columnStyles: {
            0: { cellWidth: 10, textColor: [100, 100, 100] },
            1: { cellWidth: 'auto' }, // Description
            2: { cellWidth: 40, halign: 'center', textColor: [80, 80, 80] },
            3: { cellWidth: 30, halign: 'right', fontStyle: 'bold' }
        },
        didDrawCell: (data) => {
            // Add border bottom to rows
            if (data.section === 'body' && data.column.index === 3) {
                // Optional: draw line under each row? No, maybe just rely on spacing.
            }
        }
    });

    // @ts-ignore
    let finalY = doc.lastAutoTable.finalY + 10;

    // --- TOTALS SECTION ---
    const totalsX = pageWidth - 80;
    const valX = pageWidth - 14;

    const drawTotalLine = (label: string, value: string, isBold: boolean = false, isLarge: boolean = false) => {
        doc.setFontSize(isLarge ? 12 : 10);
        doc.setFont("helvetica", isBold ? "bold" : "normal");
        doc.setTextColor(isBold ? 0 : 80);

        doc.text(label, totalsX, finalY);
        doc.text(value, valX, finalY, { align: 'right' });
        finalY += (isLarge ? 8 : 6);
    };

    // Subtotal
    drawTotalLine("Subtotal", formatCurrency(bill.totalAmount));

    // Taxes
    drawTotalLine("Taxes & Fees (Inc)", formatCurrency(bill.taxes));

    // Divider
    doc.setLineWidth(0.5);
    doc.line(totalsX, finalY - 2, pageWidth - 14, finalY - 2);
    finalY += 2;

    // Total Amount
    drawTotalLine("Total Amount", formatCurrency(bill.totalAmount), true, true);

    // Paid
    drawTotalLine("Amount Paid", formatCurrency(bill.paidAmount));

    // Payment Method
    drawTotalLine("Payment Method", (bill.paymentMethod || "N/A").toUpperCase());

    // Balance Due (Boxed or Highlighted)
    finalY += 2;
    doc.setDrawColor(0, 0, 0);
    doc.setLineWidth(0.5);
    doc.line(totalsX, finalY, pageWidth - 14, finalY);
    finalY += 8;

    doc.setFontSize(12);
    doc.setFont("helvetica", "bold");
    doc.setTextColor(0, 0, 0);
    doc.text("BALANCE DUE", totalsX, finalY);
    doc.text(formatCurrency(bill.balance), valX, finalY, { align: 'right' });

    // --- FOOTER ---
    const pageHeight = doc.internal.pageSize.height;
    let footerY = pageHeight - 30;

    doc.setFontSize(9);
    doc.setFont("helvetica", "normal");
    doc.setTextColor(100, 100, 100);

    doc.line(14, footerY, pageWidth - 14, footerY); // Top Border
    footerY += 5;

    doc.text("Thank you for staying with us!", pageWidth / 2, footerY, { align: 'center' });
    footerY += 5;
    doc.text("Please make all cheques payable to Sultan Palace Hotel.", pageWidth / 2, footerY, { align: 'center' });
    footerY += 5;
    doc.text(`For inquiries, contact us at ${hotelPhone} or ${hotelEmail}`, pageWidth / 2, footerY, { align: 'center' });

    return Buffer.from(doc.output("arraybuffer"));
};
