"use server";

import {
  sendEmail,
  generateBookingConfirmationEmail,
  generateBookingEnquiryEmail,
  generateBookingCancellationEmail,
  sendInvoiceEmail,
  generateAdminWelcomeEmail,
  generatePasswordChangedEmail,
  generateNewOrderAdminEmail,
  generateOrderAcknowledgmentEmail,
  generateOrderReceiptEmail,
  generateOrderUpdatedEmail,
} from "@/lib/emailService";
import { Booking, CheckoutBill } from "@/lib/firestoreService";
import { generateInvoicePDF } from "@/lib/invoiceGenerator";

export async function sendBookingConfirmationEmailAction(
  booking: Booking,
): Promise<{ success: boolean; error?: string }> {
  try {
    const guestEmail = booking.guestDetails?.email;

    if (!guestEmail) {
      console.warn("No guest email provided for booking confirmation.");
      return { success: false, error: "No guest email provided." };
    }

    const htmlContent = generateBookingConfirmationEmail(booking);

    const result = await sendEmail({
      to: guestEmail,
      subject: `Booking Confirmation - ${booking.bookingId}`,
      html: htmlContent,
    });

    if (result.success) {
      return { success: true };
    } else {
      console.error("Failed to send booking confirmation email:", result.error);
      return { success: false, error: result.error };
    }
  } catch (error: any) {
    console.error(
      "Unexpected error in sendBookingConfirmationEmailAction:",
      error,
    );
    return { success: false, error: error.message };
  }
}

export async function sendContactEmailAction(contactData: {
  name: string;
  email: string;
  phone: string;
  message: string;
  subject: string;
}): Promise<{ success: boolean; error?: string }> {
  try {
    // Send notification to ADMIN (or Hotel Reservations)
    const adminEmail = "portalholdingsznz@gmail.com";
    const htmlContent = generateBookingEnquiryEmail(contactData);

    const result = await sendEmail({
      to: adminEmail,
      subject: `New Contact Inquiry: ${contactData.subject} - ${contactData.name}`,
      html: htmlContent,
      text: `Name: ${contactData.name}\nEmail: ${contactData.email}\nPhone: ${contactData.phone}\nMessage: ${contactData.message}`,
    });

    if (result.success) {
      return { success: true };
    } else {
      console.error("Failed to send contact email:", result.error);
      return { success: false, error: result.error };
    }
  } catch (error: any) {
    console.error("Unexpected error in sendContactEmailAction:", error);
    return { success: false, error: error.message };
  }
}

export async function sendBookingCancellationEmailAction(
  booking: Booking,
  reason?: string,
): Promise<{ success: boolean; error?: string }> {
  try {
    const guestEmail = booking.guestDetails?.email;

    if (!guestEmail) {
      console.warn("No guest email provided for booking cancellation.");
      return { success: false, error: "No guest email provided." };
    }

    const htmlContent = generateBookingCancellationEmail(booking, reason);

    const result = await sendEmail({
      to: guestEmail,
      subject: `Booking Cancelled - ${booking.bookingId}`,
      html: htmlContent,
    });

    if (result.success) {
      return { success: true };
    } else {
      console.error("Failed to send booking cancellation email:", result.error);
      return { success: false, error: result.error };
    }
  } catch (error: any) {
    console.error(
      "Unexpected error in sendBookingCancellationEmailAction:",
      error,
    );
    return { success: false, error: error.message };
  }
}

export async function sendInvoiceEmailAction(
  bill: CheckoutBill,
): Promise<{ success: boolean; error?: string }> {
  console.log(
    `[ACTION] sendInvoiceEmailAction triggered for bill: ${bill?.id}, guest: ${bill?.guestEmail}`,
  );
  try {
    if (!bill || !bill.id) {
      return { success: false, error: "Invalid bill data" };
    }

    console.log(`[Action] Generating PDF for bill ${bill.id}...`);
    // Generate PDF
    const pdfBuffer = generateInvoicePDF(bill);

    console.log(`[Action] Sending email to ${bill.guestEmail}...`);
    // Send Email
    const success = await sendInvoiceEmail(bill, pdfBuffer);

    if (success) {
      return { success: true };
    } else {
      return { success: false, error: "Failed to send email" };
    }
  } catch (error: any) {
    console.error("Error in sendInvoiceEmailAction:", error);
    return { success: false, error: error.message || "Server error" };
  }
}

export async function sendAdminWelcomeEmailAction(
  email: string,
): Promise<{ success: boolean; error?: string }> {
  console.log(
    `[ACTION] sendAdminWelcomeEmailAction logic triggered for: ${email}`,
  );
  try {
    const htmlContent = generateAdminWelcomeEmail(email);
    const result = await sendEmail({
      to: email,
      subject: "Welcome to Sultan Palace Admin Team",
      html: htmlContent,
    });

    if (result.success) {
      console.log(`[Admin] Welcome email sent to ${email}`);
      return { success: true };
    } else {
      console.error(
        `[Admin] Failed to send welcome email to ${email}: ${result.error}`,
      );
      return { success: false, error: result.error };
    }
  } catch (error: any) {
    console.error("Unexpected error in sendAdminWelcomeEmailAction:", error);
    return { success: false, error: error.message };
  }
}

export async function sendPasswordChangedEmailAction(
  email: string,
): Promise<{ success: boolean; error?: string }> {
  console.log(
    `[ACTION] sendPasswordChangedEmailAction triggered for: ${email}`,
  );
  try {
    const htmlContent = generatePasswordChangedEmail(email);
    const result = await sendEmail({
      to: email,
      subject: "Security Alert: Your Password Has Been Changed",
      html: htmlContent,
    });

    if (result.success) {
      console.log(`[Email] Password changed notification sent to ${email}`);
      return { success: true };
    } else {
      console.error(
        `[Email] Failed to send password changed notification to ${email}: ${result.error}`,
      );
      return { success: false, error: "Failed to send password changed email" };
    }
  } catch (error: any) {
    console.error("Unexpected error in sendPasswordChangedEmailAction:", error);
    return { success: false, error: error.message };
  }
}

export async function sendOrderPlacedEmailAction(
  order: any,
): Promise<{ success: boolean; error?: string }> {
  console.log(
    `[ACTION] sendOrderPlacedEmailAction triggered for order: ${order.orderNumber}`,
  );

  try {
    // 1. Admin Notification
    const adminEmail =
      process.env.SMTP_FROM_EMAIL || "portalholdingsznz@gmail.com";
    await sendEmail({
      to: adminEmail,
      subject: `New Order #${order.orderNumber} — ${order.orderType}`,
      html: generateNewOrderAdminEmail(order),
    });
    console.log(`[Email] Admin notification sent to ${adminEmail}`);

    // 2. Guest Acknowledgment
    if (order.guestEmail && order.guestEmail !== "N/A") {
      await sendEmail({
        to: order.guestEmail,
        subject: `Order Received — #${order.orderNumber} | Sultan Palace Hotel`,
        html: generateOrderAcknowledgmentEmail(order),
      });
      console.log(`[Email] Guest acknowledgment sent to ${order.guestEmail}`);
    }

    return { success: true };
  } catch (error: any) {
    console.error("Error in sendOrderPlacedEmailAction:", error);
    return { success: false, error: error.message || "Server error" };
  }
}

export async function sendOrderReceiptEmailAction(
  order: any,
  receiptUrl: string,
): Promise<{ success: boolean; error?: string }> {
  console.log(
    `[ACTION] sendOrderReceiptEmailAction triggered for order: ${order.orderNumber}`,
  );

  if (!order.guestEmail || order.guestEmail === "N/A") {
    console.log(
      `[Email] No guest email to send receipt to for order ${order.orderNumber}`,
    );
    return { success: false, error: "No guest email" };
  }

  try {
    await sendEmail({
      to: order.guestEmail,
      subject: `Your Receipt — Order #${order.orderNumber} | Sultan Palace Hotel`,
      html: generateOrderReceiptEmail(order, receiptUrl),
    });
    console.log(`[Email] Receipt email sent to ${order.guestEmail}`);
    return { success: true };
  } catch (error: any) {
    console.error("Error in sendOrderReceiptEmailAction:", error);
    return { success: false, error: error.message || "Server error" };
  }
}

export async function sendOrderUpdatedEmailAction(
  order: any,
): Promise<{ success: boolean; error?: string }> {
  if (!order.guestEmail || order.guestEmail === "N/A") {
    return { success: false, error: "No guest email" };
  }

  try {
    await sendEmail({
      to: order.guestEmail,
      subject: `Your Order Has Been Updated — #${order.orderNumber} | Sultan Palace Hotel`,
      html: generateOrderUpdatedEmail(order),
    });
    return { success: true };
  } catch (error: any) {
    console.error("Error in sendOrderUpdatedEmailAction:", error);
    return { success: false, error: error.message || "Server error" };
  }
}
