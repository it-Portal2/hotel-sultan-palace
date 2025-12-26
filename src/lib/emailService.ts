import nodemailer from 'nodemailer';
import { Booking } from './firestoreService';
import * as dns from 'dns';
import { promisify } from 'util';

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
  const host = process.env.SMTP_HOST || 'smtp.gmail.com';
  const port = parseInt(process.env.SMTP_PORT || '587', 10);
  const secure = process.env.SMTP_SECURE === 'true' || port === 465;
  const user = (process.env.SMTP_USER || '').trim();

  const rawPassword = process.env.SMTP_PASSWORD || '';
  const pass = rawPassword.replace(/\s+/g, '').trim();

  const from = (process.env.SMTP_FROM_EMAIL || user).trim();
  const fromName = (process.env.SMTP_FROM_NAME || 'Hotel Sultan Palace').trim();

  if (!user || !pass) {
    throw new Error('SMTP credentials are not configured. Please set SMTP_USER and SMTP_PASSWORD environment variables.');
  }

  console.log('SMTP Config:', {
    host,
    port,
    secure,
    user: user.substring(0, 3) + '***',
    passwordLength: pass.length,
    from,
    fromName,
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

// Note: getTransporter function removed - using createSMTPTransport instead for better connection handling

const createSMTPTransport = (host: string, port: number, secure: boolean, auth: { user: string; pass: string }): nodemailer.Transporter => {
  return nodemailer.createTransport({
    host: host,
    port: port,
    secure: secure,
    auth: auth,
    tls: {
      rejectUnauthorized: false,
      minVersion: 'TLSv1.2',
      maxVersion: 'TLSv1.3',
    },
    connectionTimeout: 20000,
    socketTimeout: 20000,
    greetingTimeout: 10000,
    pool: false,
    debug: false,
    logger: false,
  } as nodemailer.TransportOptions);
};

export const verifySMTPConnection = async (retries: number = 3): Promise<{ success: boolean; error?: string }> => {
  const config = getEmailConfig();
  let lastError: string | null = null;
  const errors: string[] = [];

  for (let attempt = 1; attempt <= retries + 1; attempt++) {
    try {
      console.log(`Attempting SMTP connection to ${config.host}:${config.port} (Attempt ${attempt}/${retries + 1})...`);

      const transport = createSMTPTransport(
        config.host,
        config.port,
        config.secure,
        config.auth
      );

      const verifyPromise = transport.verify();
      const timeoutPromise = new Promise((_, reject) =>
        setTimeout(() => reject(new Error('Connection timeout after 20 seconds')), 20000)
      );

      await Promise.race([verifyPromise, timeoutPromise]);

      try {
        transport.close();
      } catch {
        // Ignore transport close errors
      }

      console.log(`✅ SMTP connection verified successfully to ${config.host}!`);
      return { success: true };

    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      errors.push(errorMessage);
      lastError = errorMessage;

      console.error(`❌ SMTP verification failed (Attempt ${attempt}/${retries + 1}):`, errorMessage);

      if (attempt === retries + 1) {
        break;
      }

      const waitTime = Math.min(500 * Math.pow(2, attempt - 1), 3000);
      await new Promise(resolve => setTimeout(resolve, waitTime));
    }
  }

  return {
    success: false,
    error: `SMTP connection failed. Last error: ${lastError}`
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

export const sendEmail = async (options: SendEmailOptions, retries: number = 3): Promise<{ success: boolean; messageId?: string; error?: string }> => {
  const config = getEmailConfig();
  let lastError: string | null = null;
  const errors: string[] = [];

  const mailOptions = {
    from: `"${config.fromName}" <${config.from}>`,
    to: Array.isArray(options.to) ? options.to.join(', ') : options.to,
    subject: options.subject,
    html: options.html,
    text: options.text || options.html.replace(/<[^>]*>/g, ''),
    cc: options.cc ? (Array.isArray(options.cc) ? options.cc.join(', ') : options.cc) : undefined,
    bcc: options.bcc ? (Array.isArray(options.bcc) ? options.bcc.join(', ') : options.bcc) : undefined,
    attachments: options.attachments,
  };

  for (let attempt = 1; attempt <= retries + 1; attempt++) {
    try {
      console.log(`Sending email to ${options.to} (Attempt ${attempt}/${retries + 1})...`);

      const transport = createSMTPTransport(
        config.host,
        config.port,
        config.secure,
        config.auth
      );

      const sendPromise = transport.sendMail(mailOptions);
      const timeoutPromise = new Promise((_, reject) =>
        setTimeout(() => reject(new Error('Email send timeout after 20 seconds')), 20000)
      );

      const info = await Promise.race([sendPromise, timeoutPromise]) as nodemailer.SentMessageInfo;

      try {
        transport.close();
      } catch {
        // Ignore transport close errors
      }

      console.log(`✅ Email sent successfully:`, info.messageId);
      return {
        success: true,
        messageId: info.messageId,
      };

    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
      errors.push(errorMessage);
      lastError = errorMessage;

      console.error(`❌ Error sending email (Attempt ${attempt}/${retries + 1}):`, errorMessage);

      if (attempt === retries + 1) {
        break;
      }

      const waitTime = Math.min(500 * Math.pow(2, attempt - 1), 3000);
      await new Promise(resolve => setTimeout(resolve, waitTime));
    }
  }

  return {
    success: false,
    error: `Email sending failed. Last error: ${lastError}`
  };
};

const formatCurrency = (amount: number, currency: string = 'USD'): string => {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: currency,
  }).format(amount);
};

const formatDate = (dateString: string): string => {
  const date = new Date(dateString);
  return date.toLocaleDateString('en-US', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
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

const BASE_URL = process.env.NEXT_PUBLIC_APP_URL || 'https://www.sultanpalacehotelznz.com'; // Fallback to assumed production domain or localhost

// Social Links & Assets
const SOCIAL_LINKS = {
  facebook: 'https://www.facebook.com/sultanpalace.znz',
  instagram: 'https://www.instagram.com/sultanpalace.zanzibar',
  whatsapp: 'https://wa.me/255777085630',
  website: BASE_URL,
  email: 'reservations@sultanpalacehotelznz.com',
  phone: '+255 684 888 111'
};

const BRAND_COLORS = {
  primary: '#0a1a2b', // Dark Blue
  accent: '#BE8C53',  // Gold
  background: '#f4f4f4',
  text: '#333333',
  lightText: '#666666',
  white: '#ffffff',
  success: '#28a745',
  warning: '#ffc107',
  danger: '#dc3545'
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
        <a href="tel:${SOCIAL_LINKS.phone.replace(/\s/g, '')}">${SOCIAL_LINKS.phone}</a> | 
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
             <strong style="color: ${BRAND_COLORS.primary};">${booking.guests.adults} Adults${booking.guests.children > 0 ? `, ${booking.guests.children} Children` : ''}</strong>
          </td>
        </tr>
      </table>
    </div>

    <!-- Room Details -->
    <h3 style="color: ${BRAND_COLORS.primary}; font-size: 18px; border-bottom: 2px solid ${BRAND_COLORS.accent}; padding-bottom: 10px; margin-bottom: 15px;">Reservation Details</h3>
    <table style="width: 100%; margin-bottom: 20px;">
      ${booking.rooms.map(room => `
        <tr>
          <td style="padding: 10px 0; border-bottom: 1px solid #eee;">
            <strong style="color: ${BRAND_COLORS.text}; display: block;">${room.type}</strong>
            ${room.allocatedRoomType ? `<span style="font-size: 13px; color: ${BRAND_COLORS.lightText};">Assigned: ${room.allocatedRoomType}</span>` : ''}
          </td>
          <td style="padding: 10px 0; border-bottom: 1px solid #eee; text-align: right; vertical-align: top;">
            ${formatCurrency(room.price)}
          </td>
        </tr>
      `).join('')}
    </table>

    ${booking.addOns.length > 0 ? `
    <!-- Add-ons -->
    <h3 style="color: ${BRAND_COLORS.primary}; font-size: 18px; border-bottom: 2px solid ${BRAND_COLORS.accent}; padding-bottom: 10px; margin-bottom: 15px;">Enhancements</h3>
    <table style="width: 100%; margin-bottom: 20px;">
      ${booking.addOns.map(addon => `
        <tr>
          <td style="padding: 8px 0; color: ${BRAND_COLORS.lightText};">
            ${addon.name} <span style="font-size: 12px; color: #999;">(x${addon.quantity})</span>
          </td>
          <td style="padding: 8px 0; text-align: right; color: ${BRAND_COLORS.text};">
            ${formatCurrency(addon.price * addon.quantity)}
          </td>
        </tr>
      `).join('')}
    </table>
    ` : ''}

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

  return generateEmailLayout('Booking Confirmation', content);
};

// Booking Cancellation Email Template
export const generateBookingCancellationEmail = (booking: Booking, cancellationReason?: string): string => {
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
         ${cancellationReason ? `
        <tr>
           <td style="padding: 15px 0 5px; border-top: 1px dashed ${BRAND_COLORS.danger}30; margin-top: 10px;">
             <strong style="color: ${BRAND_COLORS.danger};">Cancellation Reason:</strong><br>
             <span style="color: ${BRAND_COLORS.text}; font-style: italic;">"${cancellationReason}"</span>
           </td>
        </tr>
        ` : ''}
      </table>
    </div>

    <div style="text-align: center;">
      <p style="color: ${BRAND_COLORS.lightText}; margin-bottom: 20px;">We hope to welcome you another time.</p>
      <a href="${BASE_URL}" class="button">Visit Our Website</a>
    </div>
  `;

  return generateEmailLayout('Booking Cancellation', content);
};

// General Reply Email Template
export const generateGeneralReplyEmail = (message: string, recipientName: string = 'Guest'): string => {
  const formattedMessage = message.replace(/\n/g, '<br>');

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

  return generateEmailLayout('Response from Sultan Palace', content);
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
  return generateEmailLayout('New Booking Enquiry', content);
}
