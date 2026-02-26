import nodemailer from "nodemailer";
import { Booking } from "./firestoreService";
import * as dns from "dns";
import { promisify } from "util";

const dnsLookup = promisify(dns.lookup);

// Email configuration interface
interface EmailConfig {
  host: string;
  port: number;
  secure: boolean;
  auth: {
    user: string;
    pass: string;
  };
  from: string; // Sender email address
  fromName: string; // Sender name
}

// Get email configuration from environment variables
const getEmailConfig = (): EmailConfig => {
  const host = process.env.SMTP_HOST || "smtppro.zoho.com";
  const port = parseInt(process.env.SMTP_PORT || "465", 10);
  const secure = process.env.SMTP_SECURE === "true" || port === 465;
  const user = (process.env.SMTP_USER || "").trim();

  const rawPassword = process.env.SMTP_PASSWORD || "";
  const pass = rawPassword.replace(/\s+/g, "").trim();

  const from = (process.env.SMTP_FROM_EMAIL || user).trim();
  const fromName = (process.env.SMTP_FROM_NAME || "Sultan Palace Hotel").trim();

  if (!user || !pass) {
    throw new Error(
      "SMTP credentials are not configured. Please set SMTP_USER and SMTP_PASSWORD environment variables.",
    );
  }

  console.log("[SMTP] Config loaded:", {
    host,
    port,
    secure,
    user: user.substring(0, 3) + "***",
    from,
  });

  return {
    host,
    port,
    secure,
    auth: { user, pass },
    from,
    fromName,
  };
};

// ═══════════════════════════════════════════════════════════════════════════════
// SINGLETON POOLED TRANSPORT
// Reuses TCP connections — up to 5 concurrent, 100 messages per connection.
// ═══════════════════════════════════════════════════════════════════════════════
let _transporter: nodemailer.Transporter | null = null;

const getTransporter = (): nodemailer.Transporter => {
  if (_transporter) return _transporter;

  const config = getEmailConfig();

  _transporter = nodemailer.createTransport({
    pool: true,
    maxConnections: 5,
    maxMessages: 100,
    host: config.host,
    port: config.port,
    secure: config.secure,
    auth: config.auth,
    tls: {
      rejectUnauthorized: false,
      minVersion: "TLSv1.2",
    },
    connectionTimeout: 20000,
    socketTimeout: 20000,
    greetingTimeout: 10000,
  } as nodemailer.TransportOptions);

  console.log(
    "[SMTP] Pooled transporter created →",
    config.host + ":" + config.port,
  );
  return _transporter;
};

export const verifySMTPConnection = async (
  retries: number = 3,
): Promise<{ success: boolean; error?: string }> => {
  let lastError: string | null = null;
  const errors: string[] = [];

  for (let attempt = 1; attempt <= retries + 1; attempt++) {
    try {
      console.log(
        `[SMTP] Verifying connection (Attempt ${attempt}/${retries + 1})...`,
      );

      const transport = getTransporter();

      const verifyPromise = transport.verify();
      const timeoutPromise = new Promise((_, reject) =>
        setTimeout(
          () => reject(new Error("Connection timeout after 20 seconds")),
          20000,
        ),
      );

      await Promise.race([verifyPromise, timeoutPromise]);

      console.log("[SMTP] Connection verified successfully");
      return { success: true };
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : "Unknown error";
      errors.push(errorMessage);
      lastError = errorMessage;

      console.error(
        ` SMTP verification failed (Attempt ${attempt}/${retries + 1}):`,
        errorMessage,
      );

      if (attempt === retries + 1) {
        break;
      }

      const waitTime = Math.min(500 * Math.pow(2, attempt - 1), 3000);
      await new Promise((resolve) => setTimeout(resolve, waitTime));
    }
  }

  return {
    success: false,
    error: `SMTP connection failed. Last error: ${lastError}`,
  };
};

interface SendEmailOptions {
  to: string | string[];
  subject: string;
  html: string;
  text?: string;
  cc?: string | string[];
  bcc?: string | string[];
  attachments?: Array<{
    filename: string;
    content?: string | Buffer;
    path?: string;
    contentType?: string;
  }>;
}

export const sendEmail = async (
  options: SendEmailOptions,
  retries: number = 3,
): Promise<{ success: boolean; messageId?: string; error?: string }> => {
  const config = getEmailConfig();
  let lastError: string | null = null;
  const errors: string[] = [];

  const mailOptions = {
    from: `"${config.fromName}" <${config.from}>`,
    to: Array.isArray(options.to) ? options.to.join(", ") : options.to,
    subject: options.subject,
    html: options.html,
    text: options.text || options.html.replace(/<[^>]*>/g, ""),
    cc: options.cc
      ? Array.isArray(options.cc)
        ? options.cc.join(", ")
        : options.cc
      : undefined,
    bcc: options.bcc
      ? Array.isArray(options.bcc)
        ? options.bcc.join(", ")
        : options.bcc
      : undefined,
    attachments: options.attachments,
  };

  for (let attempt = 1; attempt <= retries + 1; attempt++) {
    try {
      console.log(
        `[SMTP] Sending email to ${options.to} (Attempt ${attempt}/${retries + 1})...`,
      );

      const transport = getTransporter();

      const sendPromise = transport.sendMail(mailOptions);
      const timeoutPromise = new Promise((_, reject) =>
        setTimeout(
          () => reject(new Error("Email send timeout after 20 seconds")),
          20000,
        ),
      );

      const info = (await Promise.race([
        sendPromise,
        timeoutPromise,
      ])) as nodemailer.SentMessageInfo;

      console.log(`[EMAIL_SENT]`, {
        to: options.to,
        subject: options.subject,
        messageId: info.messageId,
      });
      return {
        success: true,
        messageId: info.messageId,
      };
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : "Unknown error occurred";
      errors.push(errorMessage);
      lastError = errorMessage;

      console.error(
        ` Error sending email (Attempt ${attempt}/${retries + 1}):`,
        errorMessage,
      );

      if (attempt === retries + 1) {
        break;
      }

      const waitTime = Math.min(500 * Math.pow(2, attempt - 1), 3000);
      await new Promise((resolve) => setTimeout(resolve, waitTime));
    }
  }

  return {
    success: false,
    error: `Email sending failed. Last error: ${lastError}`,
  };
};

const formatCurrency = (amount: number, currency: string = "USD"): string => {
  const safeAmount = typeof amount === "number" && !isNaN(amount) ? amount : 0;
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: currency,
  }).format(safeAmount);
};

const formatDate = (dateString: string): string => {
  const date = new Date(dateString);
  return date.toLocaleDateString("en-US", {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
  });
};

const calculateNights = (checkIn: string, checkOut: string): number => {
  const checkInDate = new Date(checkIn);
  const checkOutDate = new Date(checkOut);
  const diffTime = Math.abs(checkOutDate.getTime() - checkInDate.getTime());
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  return diffDays;
};

// Email Templates

const BASE_URL = "https://www.sultanpalacehotelznz.com"; // Always use production domain for emails

// Social Links & Assets
const SOCIAL_LINKS = {
  facebook: "https://www.facebook.com/sultanpalace.znz",
  instagram: "https://www.instagram.com/sultanpalace.zanzibar",
  whatsapp: "https://wa.me/255777085630",
  website: BASE_URL,
  email: "reservations@sultanpalacehotelznz.com",
  phone: "+255 684 888 111",
};

const BRAND_COLORS = {
  primary: "#0a1a2b", // Dark Blue
  accent: "#BE8C53", // Gold
  background: "#f4f4f4",
  text: "#333333",
  lightText: "#666666",
  white: "#ffffff",
  success: "#28a745",
  warning: "#ffc107",
  danger: "#dc3545",
};

/**
 * Generates the master layout for all emails.
 */
const generateEmailLayout = (title: string, content: string): string => {
  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${title}</title>
  <!--[if mso]>
  <noscript>
    <xml>
      <o:OfficeDocumentSettings>
        <o:PixelsPerInch>96</o:PixelsPerInch>
      </o:OfficeDocumentSettings>
    </xml>
  </noscript>
  <![endif]-->
  <style>
    body { margin: 0; padding: 0; font-family: 'Open Sans', 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; background-color: ${BRAND_COLORS.background}; color: ${BRAND_COLORS.text}; }
    table { border-collapse: collapse; width: 100%; }
    .container { max-width: 600px; margin: 0 auto; background-color: ${BRAND_COLORS.white}; overflow: hidden; box-shadow: 0 4px 6px rgba(0,0,0,0.1); }
    .header { background-color: ${BRAND_COLORS.primary}; padding: 30px 20px; text-align: center; }
    .header h1 { color: ${BRAND_COLORS.white}; margin: 0; font-size: 24px; font-weight: 600; letter-spacing: 1px; text-transform: uppercase; }
    .content { padding: 40px 30px; }
    .footer { background-color: ${BRAND_COLORS.primary}; padding: 30px 20px; text-align: center; color: ${BRAND_COLORS.white}; }
    .footer a { color: ${BRAND_COLORS.white}; text-decoration: none; margin: 0 10px; }
    .footer p { margin: 10px 0; font-size: 13px; color: rgba(255,255,255,0.7); }
    .button { display: inline-block; padding: 12px 24px; background-color: ${BRAND_COLORS.accent}; color: ${BRAND_COLORS.primary}; text-decoration: none; font-weight: bold; border-radius: 4px; margin-top: 20px; }
    @media only screen and (max-width: 600px) {
      .content { padding: 20px; }
      .container { width: 100% !important; }
    }
  </style>
</head>
<body>
  <div class="container">
    <!-- Header -->
    <div class="header">
      <!-- Use text for now if image is not guaranteed to load, or use alt text effectively -->
      <h1>Sultan Palace</h1>
      <p style="color: ${BRAND_COLORS.accent}; margin: 5px 0 0; font-size: 14px; letter-spacing: 2px;">ZANZIBAR</p>
    </div>

    <!-- Main Content -->
    <div class="content">
      ${content}
    </div>

    <!-- Footer -->
    <div class="footer">
      <div style="margin-bottom: 20px;">
        <a href="${SOCIAL_LINKS.facebook}" target="_blank">Facebook</a> •
        <a href="${SOCIAL_LINKS.instagram}" target="_blank">Instagram</a> •
        <a href="${SOCIAL_LINKS.whatsapp}" target="_blank">WhatsApp</a>
      </div>
      <p>Dongwe, East Coast, Zanzibar</p>
      <p>
        <a href="tel:${SOCIAL_LINKS.phone.replace(/\s/g, "")}">${SOCIAL_LINKS.phone}</a> | 
        <a href="mailto:${SOCIAL_LINKS.email}">${SOCIAL_LINKS.email}</a>
      </p>
      <p style="margin-top: 20px; border-top: 1px solid rgba(255,255,255,0.1); padding-top: 10px;">
        © ${new Date().getFullYear()} Sultan Palace Hotel. All rights reserved.
      </p>
    </div>
  </div>
</body>
</html>
  `.trim();
};

// Booking Confirmation Email Template
export const generateBookingConfirmationEmail = (booking: Booking): string => {
  const nights = calculateNights(booking.checkIn, booking.checkOut);
  const guestName = `${booking.guestDetails.firstName} ${booking.guestDetails.lastName}`;

  const content = `
    <h2 style="color: ${BRAND_COLORS.primary}; margin-top: 0; font-size: 24px; text-align: center;">Booking Confirmed!</h2>
    <p style="text-align: center; color: ${BRAND_COLORS.lightText}; font-size: 16px; margin-bottom: 30px;">
      Dear ${guestName}, thank you for choosing Sultan Palace. We are delighted to confirm your stay with us.
    </p>

    <!-- Key Info Card -->
    <div style="background-color: #FAFAFA; border: 1px solid #EEEEEE; border-radius: 8px; padding: 20px; margin-bottom: 30px;">
      <table style="width: 100%;">
        <tr>
          <td style="padding-bottom: 10px; width: 50%;">
            <span style="font-size: 12px; color: ${BRAND_COLORS.lightText}; text-transform: uppercase;">Check-in</span><br>
            <strong style="color: ${BRAND_COLORS.primary}; font-size: 16px;">${formatDate(booking.checkIn)}</strong>
          </td>
          <td style="padding-bottom: 10px; width: 50%;">
            <span style="font-size: 12px; color: ${BRAND_COLORS.lightText}; text-transform: uppercase;">Check-out</span><br>
            <strong style="color: ${BRAND_COLORS.primary}; font-size: 16px;">${formatDate(booking.checkOut)}</strong>
          </td>
        </tr>
        <tr>
          <td style="padding-top: 10px;">
            <span style="font-size: 12px; color: ${BRAND_COLORS.lightText}; text-transform: uppercase;">Booking ID</span><br>
            <strong style="color: ${BRAND_COLORS.primary};">${booking.bookingId}</strong>
          </td>
          <td style="padding-top: 10px;">
             <span style="font-size: 12px; color: ${BRAND_COLORS.lightText}; text-transform: uppercase;">Guests</span><br>
             <strong style="color: ${BRAND_COLORS.primary};">${booking.guests.adults} Adults${booking.guests.children > 0 ? `, ${booking.guests.children} Children` : ""}</strong>
          </td>
        </tr>
      </table>
    </div>

    <!-- Room Details -->
    <h3 style="color: ${BRAND_COLORS.primary}; font-size: 18px; border-bottom: 2px solid ${BRAND_COLORS.accent}; padding-bottom: 10px; margin-bottom: 15px;">Reservation Details</h3>
    <table style="width: 100%; margin-bottom: 20px;">
      ${booking.rooms
        .map(
          (room) => `
        <tr>
          <td style="padding: 10px 0; border-bottom: 1px solid #eee;">
            <strong style="color: ${BRAND_COLORS.text}; display: block;">${room.type}</strong>
            ${room.allocatedRoomType ? `<span style="font-size: 13px; color: ${BRAND_COLORS.lightText};">Assigned: ${room.allocatedRoomType}</span>` : ""}
          </td>
          <td style="padding: 10px 0; border-bottom: 1px solid #eee; text-align: right; vertical-align: top;">
            ${formatCurrency(room.price)}
          </td>
        </tr>
      `,
        )
        .join("")}
    </table>

    ${
      booking.addOns.length > 0
        ? `
    <!-- Add-ons -->
    <h3 style="color: ${BRAND_COLORS.primary}; font-size: 18px; border-bottom: 2px solid ${BRAND_COLORS.accent}; padding-bottom: 10px; margin-bottom: 15px;">Enhancements</h3>
    <table style="width: 100%; margin-bottom: 20px;">
      ${booking.addOns
        .map(
          (addon) => `
        <tr>
          <td style="padding: 8px 0; color: ${BRAND_COLORS.lightText};">
            ${addon.name} <span style="font-size: 12px; color: #999;">(x${addon.quantity})</span>
          </td>
          <td style="padding: 8px 0; text-align: right; color: ${BRAND_COLORS.text};">
            ${formatCurrency(addon.price * addon.quantity)}
          </td>
        </tr>
      `,
        )
        .join("")}
    </table>
    `
        : ""
    }

    <!-- Total Amount -->
    <div style="background-color: ${BRAND_COLORS.primary}; color: ${BRAND_COLORS.white}; padding: 20px; border-radius: 8px; text-align: center; margin-top: 30px;">
      <span style="display: block; font-size: 14px; opacity: 0.8; margin-bottom: 5px;">Total Amount</span>
      <strong style="font-size: 28px;">${formatCurrency(booking.totalAmount)}</strong>
      <div style="margin-top: 5px; font-size: 12px; background: rgba(255,255,255,0.1); display: inline-block; padding: 4px 10px; border-radius: 10px;">
        Status: <span style="text-transform: uppercase;">${booking.status}</span>
      </div>
    </div>

    <div style="text-align: center; margin-top: 30px;">
      <p style="color: ${BRAND_COLORS.lightText}; font-size: 14px;">Need to make changes? <a href="mailto:${SOCIAL_LINKS.email}" style="color: ${BRAND_COLORS.primary}; font-weight: bold;">Contact Us</a></p>
    </div>
  `;

  return generateEmailLayout("Booking Confirmation", content);
};

// Booking Cancellation Email Template
export const generateBookingCancellationEmail = (
  booking: Booking,
  cancellationReason?: string,
): string => {
  const guestName = `${booking.guestDetails.firstName} ${booking.guestDetails.lastName}`;

  const content = `
    <h2 style="color: ${BRAND_COLORS.danger}; margin-top: 0; font-size: 24px; text-align: center;">Booking Cancelled</h2>
    <p style="text-align: center; color: ${BRAND_COLORS.lightText}; font-size: 16px; margin-bottom: 30px;">
      Dear ${guestName}, per your request, we have cancelled your reservation.
    </p>

    <div style="background-color: #FFF5F5; border: 1px solid ${BRAND_COLORS.danger}; border-radius: 8px; padding: 20px; margin-bottom: 30px;">
      <table style="width: 100%;">
        <tr>
           <td style="padding: 5px 0;"><strong style="color: ${BRAND_COLORS.text};">Booking ID:</strong> <span style="color: ${BRAND_COLORS.lightText};">${booking.bookingId}</span></td>
        </tr>
        <tr>
           <td style="padding: 5px 0;"><strong style="color: ${BRAND_COLORS.text};">Dates:</strong> <span style="color: ${BRAND_COLORS.lightText};">${formatDate(booking.checkIn)} - ${formatDate(booking.checkOut)}</span></td>
        </tr>
         ${
           cancellationReason
             ? `
        <tr>
           <td style="padding: 15px 0 5px; border-top: 1px dashed ${BRAND_COLORS.danger}30; margin-top: 10px;">
             <strong style="color: ${BRAND_COLORS.danger};">Cancellation Reason:</strong><br>
             <span style="color: ${BRAND_COLORS.text}; font-style: italic;">"${cancellationReason}"</span>
           </td>
        </tr>
        `
             : ""
         }
      </table>
    </div>

    <div style="text-align: center;">
      <p style="color: ${BRAND_COLORS.lightText}; margin-bottom: 20px;">We hope to welcome you another time.</p>
      <a href="${BASE_URL}" class="button">Visit Our Website</a>
    </div>
  `;

  return generateEmailLayout("Booking Cancellation", content);
};

// General Reply Email Template
export const generateGeneralReplyEmail = (
  message: string,
  recipientName: string = "Guest",
): string => {
  const formattedMessage = message.replace(/\n/g, "<br>");

  const content = `
    <h2 style="color: ${BRAND_COLORS.primary}; margin-top: 0; font-size: 24px;">Response from Sultan Palace</h2>
    <p style="color: ${BRAND_COLORS.lightText}; font-size: 16px; margin-bottom: 20px;">
      Dear ${recipientName},
    </p>
    
    <div style="color: ${BRAND_COLORS.text}; font-size: 16px; line-height: 1.8; border-left: 3px solid ${BRAND_COLORS.accent}; padding-left: 20px; margin: 20px 0;">
      ${formattedMessage}
    </div>
    
    <p style="color: ${BRAND_COLORS.lightText}; font-size: 15px; margin-top: 30px;">
      If you have further questions, please simply reply to this email.
    </p>
  `;

  return generateEmailLayout("Response from Sultan Palace", content);
};

export const generateBookingEnquiryEmail = (enquiryDetails: any): string => {
  // Placeholder for future implementation if needed, though typically admin receives this
  // This often needs to be sent TO THE ADMIN about a new enquiry
  const content = `
    <h2 style="color: ${BRAND_COLORS.primary};">New Booking Enquiry</h2>
    <div style="background: #f9f9f9; padding: 15px; border-radius: 8px;">
      <p><strong>Name:</strong> ${enquiryDetails.name}</p>
      <p><strong>Email:</strong> ${enquiryDetails.email}</p>
      <p><strong>Details:</strong><br>${JSON.stringify(enquiryDetails, null, 2)}</p>
    </div>
   `;
  return generateEmailLayout("New Booking Enquiry", content);
};

export const generatePasswordChangedEmail = (email: string): string => {
  const content = `
    <h2 style="color: ${BRAND_COLORS.primary}; margin-top: 0; font-size: 24px; text-align: center;">Security Alert: Password Changed</h2>
    <p style="text-align: center; color: ${BRAND_COLORS.lightText}; font-size: 16px; margin-bottom: 30px;">
      The password for your account associated with <strong>${email}</strong> has been changed by an administrator.
    </p>

    <div style="background-color: #FFF5F5; border: 1px solid ${BRAND_COLORS.danger}; border-radius: 8px; padding: 20px; margin-bottom: 30px;">
       <p style="color: ${BRAND_COLORS.text}; margin: 0; text-align: center;">
         If you did not authorize this change, please contact the hotel administration immediately.
       </p>
    </div>

    <div style="text-align: center;">
      <p style="color: ${BRAND_COLORS.lightText}; margin-bottom: 20px;">
        If you are unable to access your account, please reach out to support.
      </p>
      <a href="mailto:${SOCIAL_LINKS.email}" class="button" style="background-color: ${BRAND_COLORS.primary}; color: white;">Contact Support</a>
    </div>
  `;

  return generateEmailLayout("Password Changed Notification", content);
};

export const generateAdminWelcomeEmail = (email: string): string => {
  const content = `
    <h2 style="color: ${BRAND_COLORS.primary}; margin-top: 0; font-size: 24px; text-align: center;">Welcome to Admin Console</h2>
    <p style="text-align: center; color: ${BRAND_COLORS.lightText}; font-size: 16px; margin-bottom: 30px;">
      Hello <strong>${email}</strong>,
    </p>
    <p style="text-align: center; color: ${BRAND_COLORS.text}; font-size: 16px; margin-bottom: 30px;">
      Welcome to the Sultan Palace Hotel Administration Team. Your admin account has been successfully created.
    </p>

    <div style="background-color: #FAFAFA; border: 1px solid #EEEEEE; border-radius: 8px; padding: 20px; margin-bottom: 30px;">
       <p style="color: ${BRAND_COLORS.text}; margin: 0; text-align: center;">
         You now have access to the dashboard to manage bookings, guests, and hotel operations.
       </p>
    </div>

    <div style="text-align: center;">
      <a href="${BASE_URL}/admin/login" class="button" style="background-color: ${BRAND_COLORS.accent}; color: ${BRAND_COLORS.primary};">Login to Dashboard</a>
    </div>
  `;

  return generateEmailLayout("Welcome to Sultan Palace Admin", content);
};

export const sendNightAuditReport = async (
  pdfBuffer: Buffer,
  recipientEmail: string,
  date: Date,
): Promise<boolean> => {
  const dateStr = date.toLocaleDateString("en-US", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });
  const content = `
        <h2 style="color: ${BRAND_COLORS.primary};">Night Audit Report</h2>
        <p style="color: ${BRAND_COLORS.text};">
            Please find attached the Night Audit Report for <strong>${dateStr}</strong>.
        </p>
        <p style="color: ${BRAND_COLORS.lightText}; font-size: 14px;">
            This report was automatically generated.
        </p>
    `;

  const html = generateEmailLayout(`Night Audit Report - ${dateStr}`, content);

  const result = await sendEmail({
    to: recipientEmail,
    subject: `Night Audit Report - ${dateStr}`,
    html,
    attachments: [
      {
        filename: `Night_Audit_Report_${date.toISOString().split("T")[0]}.pdf`,
        content: pdfBuffer,
        contentType: "application/pdf",
      },
    ],
  });

  return result.success;
};

export const sendInvoiceEmail = async (
  bill: Booking | any, // Using any for CheckoutBill to avoid circular dependency if possible, or Import it.
  pdfBuffer: Buffer,
): Promise<boolean> => {
  const guestEmail = bill.guestEmail || bill.guestDetails?.email;
  const guestName =
    bill.guestName ||
    (bill.guestDetails
      ? `${bill.guestDetails.firstName} ${bill.guestDetails.lastName}`
      : "Guest");
  const billId = bill.id || bill.bookingId; // CheckoutBill has id, Booking has bookingId

  if (!guestEmail) {
    console.warn("[Email] No guest email found for invoice:", billId);
    return false;
  }

  const content = `
    <h2 style="color: ${BRAND_COLORS.primary}; margin-top: 0; font-size: 24px;">Your Stay Invoice</h2>
    <p style="color: ${BRAND_COLORS.text}; font-size: 16px;">
      Dear ${guestName},
    </p>
    <p style="color: ${BRAND_COLORS.text}; margin-bottom: 20px;">
      Thank you for staying at Sultan Palace Hotel. Please find attached your invoice for your recent stay.
    </p>
    <p style="color: ${BRAND_COLORS.lightText}; font-size: 14px;">
      We hope to welcome you back soon!
    </p>
  `;

  const html = generateEmailLayout(`Invoice - ${billId}`, content);

  const result = await sendEmail({
    to: guestEmail,
    subject: `Invoice - ${billId} - Sultan Palace Hotel`,
    html,
    attachments: [
      {
        filename: `Invoice_${billId}.pdf`,
        content: pdfBuffer,
        contentType: "application/pdf",
      },
    ],
  });

  if (result.success) {
    console.log(`[Email] Invoice sent to ${guestEmail}`);
  } else {
    console.error(
      `[Email] Failed to send invoice to ${guestEmail}: ${result.error}`,
    );
  }

  return result.success;
};

export const generateNewOrderAdminEmail = (order: any): string => {
  const itemsList = order.items
    .map(
      (item: any) => `
    <tr>
      <td style="padding: 8px 0; border-bottom: 1px solid #eee;">
        ${item.quantity}x ${item.name}
        ${item.variant ? `<br><small>${item.variant.name}</small>` : ""}
        ${
          item.selectedModifiers && item.selectedModifiers.length > 0
            ? `<br><small>${item.selectedModifiers.map((m: any) => m.name).join(", ")}</small>`
            : ""
        }
      </td>
      <td style="padding: 8px 0; border-bottom: 1px solid #eee; text-align: right;">
        ${formatCurrency(item.price * item.quantity)}
      </td>
    </tr>
  `,
    )
    .join("");

  const content = `
    <h2 style="color: ${BRAND_COLORS.primary}; margin-top: 0; text-align: center;">New Order Received</h2>
    
    <div style="background-color: #f8f9fa; padding: 15px; border-radius: 8px; margin-bottom: 20px;">
      <table style="width: 100%;">
        <tr>
          <td style="padding: 5px 0;"><strong>Order:</strong> #${order.orderNumber}</td>
          <td style="padding: 5px 0; text-align: right;"><strong>Type:</strong> ${order.orderType.replace("_", " ").toUpperCase()}</td>
        </tr>
        <tr>
          <td style="padding: 5px 0;"><strong>Guest:</strong> ${order.guestName}</td>
          <td style="padding: 5px 0; text-align: right;"><strong>Location:</strong> ${order.roomName || order.tableNumber || "N/A"}</td>
        </tr>
      </table>
    </div>

    <h3 style="color: ${BRAND_COLORS.primary}; font-size: 16px; border-bottom: 2px solid ${BRAND_COLORS.accent}; padding-bottom: 5px;">Order Details</h3>
    <table style="width: 100%; margin-bottom: 20px;">
      ${itemsList}
      <tr>
        <td style="padding: 10px 0; font-weight: bold;">Total Due</td>
        <td style="padding: 10px 0; text-align: right; font-weight: bold; font-size: 18px;">${formatCurrency(order.totalAmount)}</td>
      </tr>
    </table>

    <div style="background-color: #e9ecef; padding: 10px; border-radius: 5px; margin-bottom: 20px;">
      <p style="margin: 0;"><strong>Payment:</strong> <span style="text-transform: capitalize;">${order.paymentMethod || "Pending"}</span> (${order.paymentStatus})</p>
    </div>

    <div style="text-align: center; margin-top: 30px;">
      <a href="${BASE_URL}/admin/orders" class="button">View in Admin Panel</a>
    </div>
  `;

  return generateEmailLayout(`New Order #${order.orderNumber}`, content);
};

export const generateOrderAcknowledgmentEmail = (order: any): string => {
  const itemsList = order.items
    .map(
      (item: any) => `
    <tr>
      <td style="padding: 8px 0; border-bottom: 1px solid #eee;">
        ${item.quantity}x ${item.name}
      </td>
      <td style="padding: 8px 0; border-bottom: 1px solid #eee; text-align: right;">
        ${formatCurrency(item.price * item.quantity)}
      </td>
    </tr>
  `,
    )
    .join("");

  const content = `
    <h2 style="color: ${BRAND_COLORS.primary}; margin-top: 0; text-align: center;">Order Received</h2>
    <p style="text-align: center; color: ${BRAND_COLORS.lightText}; margin-bottom: 30px;">
      Thank you <strong>${order.guestName}</strong>, we have received your order!
    </p>
    
    <div style="text-align: center; margin-bottom: 30px;">
      <span style="background-color: ${BRAND_COLORS.accent}; color: ${BRAND_COLORS.primary}; padding: 5px 15px; border-radius: 20px; font-weight: bold;">
        Order #${order.orderNumber}
      </span>
    </div>

    <table style="width: 100%; margin-bottom: 20px;">
      ${itemsList}
      <tr>
        <td style="padding: 8px 0; border-top: 1px solid #eee; color: ${BRAND_COLORS.lightText};">Subtotal</td>
        <td style="padding: 8px 0; border-top: 1px solid #eee; text-align: right; color: ${BRAND_COLORS.lightText};">${formatCurrency(order.subtotal ?? order.totalAmount)}</td>
      </tr>
      ${
        order.discount && order.discount > 0
          ? `
      <tr>
        <td style="padding: 5px 0; color: ${BRAND_COLORS.lightText};">Discount</td>
        <td style="padding: 5px 0; text-align: right; color: ${BRAND_COLORS.lightText};">-${formatCurrency(order.discount)}</td>
      </tr>`
          : ""
      }
      ${
        order.tax && order.tax > 0
          ? `
      <tr>
        <td style="padding: 5px 0; color: ${BRAND_COLORS.lightText};">Tax</td>
        <td style="padding: 5px 0; text-align: right; color: ${BRAND_COLORS.lightText};">${formatCurrency(order.tax)}</td>
      </tr>`
          : ""
      }
      <tr>
        <td style="padding: 10px 0; font-weight: bold; border-top: 2px solid #eee;">Grand Total</td>
        <td style="padding: 10px 0; text-align: right; font-weight: bold; font-size: 18px; border-top: 2px solid #eee;">${formatCurrency(order.totalAmount)}</td>
      </tr>
    </table>

    <div style="background-color: ${BRAND_COLORS.background}; padding: 15px; border-radius: 8px; text-align: center; margin-top: 20px;">
      <p style="margin: 0; font-style: italic; color: ${BRAND_COLORS.lightText};">
        Our team is reviewing your order. You will receive your official receipt once the order is confirmed.
      </p>
    </div>

    <div style="text-align: center; margin-top: 30px; border-top: 1px solid #eee; padding-top: 20px;">
      <p style="margin-bottom: 5px; font-weight: bold;">Need assistance?</p>
      <p style="margin: 0;">Call us at <a href="tel:${SOCIAL_LINKS.phone.replace(/\s/g, "")}" style="color: ${BRAND_COLORS.primary}; text-decoration: none;">${SOCIAL_LINKS.phone}</a></p>
    </div>
  `;

  return generateEmailLayout(`Order Received - #${order.orderNumber}`, content);
};

export const generateOrderUpdatedEmail = (order: any): string => {
  const itemsList = order.items
    .map(
      (item: any) => `
    <tr>
      <td style="padding: 8px 0; border-bottom: 1px solid #eee;">
        ${item.quantity}x ${item.name}
        ${item.variant ? `<br><small style="color: #888;">${item.variant.name}</small>` : ""}
      </td>
      <td style="padding: 8px 0; border-bottom: 1px solid #eee; text-align: right;">
        ${formatCurrency(item.price * item.quantity)}
      </td>
    </tr>
  `,
    )
    .join("");

  const content = `
    <h2 style="color: ${BRAND_COLORS.primary}; margin-top: 0; text-align: center;">Order Updated</h2>
    <p style="text-align: center; color: ${BRAND_COLORS.lightText}; margin-bottom: 30px;">
      Hi <strong>${order.guestName}</strong>, your order has been updated by our team. Here are the revised details:
    </p>

    <div style="text-align: center; margin-bottom: 30px;">
      <span style="background-color: ${BRAND_COLORS.warning}; color: #333; padding: 5px 15px; border-radius: 20px; font-weight: bold;">
        Order #${order.orderNumber} — Updated
      </span>
    </div>

    <table style="width: 100%; margin-bottom: 20px;">
      ${itemsList}
      <tr>
        <td style="padding: 8px 0; border-top: 1px solid #eee; color: ${BRAND_COLORS.lightText};">Subtotal</td>
        <td style="padding: 8px 0; border-top: 1px solid #eee; text-align: right; color: ${BRAND_COLORS.lightText};">${formatCurrency(order.subtotal ?? order.totalAmount)}</td>
      </tr>
      ${
        order.discount && order.discount > 0
          ? `
      <tr>
        <td style="padding: 5px 0; color: ${BRAND_COLORS.lightText};">Discount</td>
        <td style="padding: 5px 0; text-align: right; color: ${BRAND_COLORS.lightText};">-${formatCurrency(order.discount)}</td>
      </tr>`
          : ""
      }
      ${
        order.tax && order.tax > 0
          ? `
      <tr>
        <td style="padding: 5px 0; color: ${BRAND_COLORS.lightText};">Tax</td>
        <td style="padding: 5px 0; text-align: right; color: ${BRAND_COLORS.lightText};">${formatCurrency(order.tax)}</td>
      </tr>`
          : ""
      }
      <tr>
        <td style="padding: 10px 0; font-weight: bold; border-top: 2px solid #eee;">New Total</td>
        <td style="padding: 10px 0; text-align: right; font-weight: bold; font-size: 18px; border-top: 2px solid #eee;">${formatCurrency(order.totalAmount)}</td>
      </tr>
    </table>

    <div style="background-color: ${BRAND_COLORS.background}; padding: 15px; border-radius: 8px; text-align: center; margin-top: 20px;">
      <p style="margin: 0; font-style: italic; color: ${BRAND_COLORS.lightText};">
        If you have any questions about these changes, please don't hesitate to contact us.
      </p>
    </div>

    <div style="text-align: center; margin-top: 30px; border-top: 1px solid #eee; padding-top: 20px;">
      <p style="margin-bottom: 5px; font-weight: bold;">Need assistance?</p>
      <p style="margin: 0;">Call us at <a href="tel:${SOCIAL_LINKS.phone.replace(/\s/g, "")}" style="color: ${BRAND_COLORS.primary}; text-decoration: none;">${SOCIAL_LINKS.phone}</a></p>
    </div>
  `;

  return generateEmailLayout(`Order Updated — #${order.orderNumber}`, content);
};

export const generateOrderReceiptEmail = (
  order: any,
  receiptUrl: string,
): string => {
  const itemsList = order.items
    .map(
      (item: any) => `
    <tr>
      <td style="padding: 8px 0; border-bottom: 1px solid #eee;">
        ${item.quantity}x ${item.name}
      </td>
      <td style="padding: 8px 0; border-bottom: 1px solid #eee; text-align: right;">
        ${formatCurrency(item.price * item.quantity)}
      </td>
    </tr>
  `,
    )
    .join("");

  const content = `
    <h2 style="color: ${BRAND_COLORS.success}; margin-top: 0; text-align: center;">Order Confirmed!</h2>
    <p style="text-align: center; color: ${BRAND_COLORS.lightText}; margin-bottom: 30px;">
      Your order <strong>#${order.orderNumber}</strong> has been confirmed and processed.
    </p>

    <div style="background-color: #f8f9fa; padding: 15px; border-radius: 8px; margin-bottom: 20px;">
      <table style="width: 100%;">
        <tr>
          <td style="padding: 5px 0;"><strong>Date:</strong> ${formatDate(
            order.createdAt?.toDate
              ? order.createdAt.toDate().toISOString()
              : order.createdAt,
          )}</td>
          <td style="padding: 5px 0; text-align: right;"><strong>Payment:</strong> <span style="text-transform: capitalize;">${order.paymentMethod || "Pending"}</span></td>
        </tr>
      </table>
    </div>

    <h3 style="color: ${BRAND_COLORS.primary}; font-size: 16px; border-bottom: 2px solid ${BRAND_COLORS.accent}; padding-bottom: 5px;">Receipt Details</h3>
    <table style="width: 100%; margin-bottom: 20px;">
      ${itemsList}
      <tr>
        <td style="padding: 10px 0; font-weight: bold; border-top: 1px solid #eee;">Subtotal</td>
        <td style="padding: 10px 0; text-align: right; border-top: 1px solid #eee;">${formatCurrency(order.subtotal || 0)}</td>
      </tr>
      ${
        order.discount && order.discount > 0
          ? `
      <tr>
        <td style="padding: 5px 0; color: ${BRAND_COLORS.lightText};">Discount</td>
        <td style="padding: 5px 0; text-align: right; color: ${BRAND_COLORS.lightText};">-${formatCurrency(order.discount)}</td>
      </tr>`
          : ""
      }
      <tr>
        <td style="padding: 5px 0; color: ${BRAND_COLORS.lightText};">Tax</td>
        <td style="padding: 5px 0; text-align: right; color: ${BRAND_COLORS.lightText};">${formatCurrency(order.tax || 0)}</td>
      </tr>
      <tr>
        <td style="padding: 10px 0; font-weight: bold; font-size: 18px; border-top: 2px solid #000;">Total</td>
        <td style="padding: 10px 0; text-align: right; font-weight: bold; font-size: 18px; border-top: 2px solid #000;">${formatCurrency(order.totalAmount)}</td>
      </tr>
    </table>

    <div style="text-align: center; margin-top: 30px;">
      <a href="${receiptUrl}" class="button" target="_blank" style="background-color: ${BRAND_COLORS.primary}; color: ${BRAND_COLORS.white};">View / Download Receipt</a>
    </div>

    <div style="text-align: center; margin-top: 30px; border-top: 1px solid #eee; padding-top: 20px;">
      <p style="margin-bottom: 5px;"><strong>Sultan Palace Hotel</strong></p>
      <p style="margin: 0; font-size: 12px; color: ${BRAND_COLORS.lightText};">Dongwe, East Coast, Zanzibar</p>
      <p style="margin-top: 5px;"><a href="tel:${SOCIAL_LINKS.phone.replace(/\s/g, "")}" style="color: ${BRAND_COLORS.primary}; text-decoration: none;">${SOCIAL_LINKS.phone}</a></p>
    </div>
  `;

  return generateEmailLayout(
    `Your Receipt — Order #${order.orderNumber}`,
    content,
  );
};
