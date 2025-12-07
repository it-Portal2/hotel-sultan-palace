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
    requireTLS: port === 587,
    ignoreTLS: false,
    logger: false,
    debug: false,
  } as nodemailer.TransportOptions); 
};

export const verifySMTPConnection = async (retries: number = 3): Promise<{ success: boolean; error?: string }> => {
  const config = getEmailConfig();
  
  const connectionStrategies: Array<{ host: string; name: string }> = [];
  
  try {
    if (config.host === 'smtp.gmail.com') {
      const ipv6 = await dnsLookup(config.host, { family: 6 });
      connectionStrategies.push({ host: ipv6.address, name: 'IPv6' });
      console.log(`Resolved ${config.host} to IPv6: ${ipv6.address}`);
    }
  } catch {
    console.warn(`IPv6 resolution failed for ${config.host}`);
  }
  
  try {
    if (config.host === 'smtp.gmail.com') {
      const ipv4 = await dnsLookup(config.host, { family: 4 });
      connectionStrategies.push({ host: ipv4.address, name: 'IPv4' });
      console.log(`Resolved ${config.host} to IPv4: ${ipv4.address}`);
    }
  } catch {
    console.warn(`IPv4 resolution failed for ${config.host}`);
  }
  
  connectionStrategies.push({ host: config.host, name: 'hostname' });
  
  const gmailPorts = config.host === 'smtp.gmail.com' 
    ? [
        { port: 587, secure: false }, 
        { port: 465, secure: true }
      ]
    : [{ port: config.port, secure: config.secure }];
  
  let lastError: string | null = null;
  const errors: string[] = [];
  
  for (const strategy of connectionStrategies) {
    for (const portConfig of gmailPorts) {
      for (let attempt = 1; attempt <= retries + 1; attempt++) {
        try {
          console.log(`Attempting SMTP connection (${strategy.name}, Port ${portConfig.port}, Attempt ${attempt}/${retries + 1})...`);
          
          const transport = createSMTPTransport(
            strategy.host,
            portConfig.port,
            portConfig.secure,
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
          
          console.log(`✅ SMTP connection verified successfully (${strategy.name}, Port ${portConfig.port})!`);
          return { success: true };
          
        } catch (error) {
          const errorMessage = error instanceof Error ? error.message : 'Unknown error';
          const fullError = `${strategy.name}:${portConfig.port} - ${errorMessage}`;
          errors.push(fullError);
          lastError = errorMessage;
          
          console.error(`❌ SMTP verification failed (${strategy.name}, Port ${portConfig.port}, Attempt ${attempt}/${retries + 1}):`, errorMessage);
          
          if (attempt === retries + 1) {
            break; 
          }
          
          const waitTime = Math.min(500 * Math.pow(2, attempt - 1), 3000);
          await new Promise(resolve => setTimeout(resolve, waitTime));
        }
      }
    }
  }
  
  const errorMessage = lastError || 'Connection failed after all retry attempts';
  
  if (errorMessage.includes('Invalid login') || errorMessage.includes('535-5.7.8') || errorMessage.includes('BadCredentials')) {
    return { 
      success: false, 
      error: 'Authentication failed. Please verify:\n1. Gmail App Password is correct (not regular password)\n2. 2-Step Verification is enabled\n3. App Password has no spaces\n4. Generate new App Password from https://myaccount.google.com/apppasswords'
    };
  }
  
  if (errorMessage.includes('ETIMEDOUT') || errorMessage.includes('timeout') || errorMessage.includes('ECONNREFUSED')) {
    return {
      success: false,
      error: `SMTP connection failed on all ports and connection methods.\n\nTried:\n${errors.map(e => `- ${e}`).join('\n')}\n\nPossible solutions:\n1. Network/Firewall is blocking SMTP ports (465, 587)\n2. Try different network (mobile hotspot, office WiFi)\n3. Temporarily disable firewall/antivirus\n4. Contact your ISP - they may block SMTP ports\n5. Check if VPN is enabled and blocking connections\n6. For production, consider using Gmail OAuth2 or alternative SMTP service`
    };
  }
  
  return { 
    success: false, 
    error: `SMTP connection failed. Errors:\n${errors.map(e => `- ${e}`).join('\n')}`
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
  
  const connectionStrategies: Array<{ host: string; name: string }> = [];
  
  try {
    if (config.host === 'smtp.gmail.com') {
      const ipv6 = await dnsLookup(config.host, { family: 6 });
      connectionStrategies.push({ host: ipv6.address, name: 'IPv6' });
    }
  } catch {
    // Ignore DNS errors
  }
  
  try {
    if (config.host === 'smtp.gmail.com') {
      const ipv4 = await dnsLookup(config.host, { family: 4 });
      connectionStrategies.push({ host: ipv4.address, name: 'IPv4' });
    }
  } catch {
    // Ignore DNS errors
  }
  
  connectionStrategies.push({ host: config.host, name: 'hostname' });
  
  const gmailPorts = config.host === 'smtp.gmail.com' 
    ? [
        { port: 587, secure: false }, 
        { port: 465, secure: true }
      ]
    : [{ port: config.port, secure: config.secure }];
  
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
  
  let lastError: string | null = null;
  const errors: string[] = [];
  
  for (const strategy of connectionStrategies) {
    for (const portConfig of gmailPorts) {
      for (let attempt = 1; attempt <= retries + 1; attempt++) {
        try {
          console.log(`Sending email (${strategy.name}, Port ${portConfig.port}, Attempt ${attempt}/${retries + 1})...`);
          
          const transport = createSMTPTransport(
            strategy.host,
            portConfig.port,
            portConfig.secure,
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
          
          console.log(`✅ Email sent successfully (${strategy.name}, Port ${portConfig.port}):`, info.messageId);
          return {
            success: true,
            messageId: info.messageId,
          };
          
        } catch (error) {
          const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
          const fullError = `${strategy.name}:${portConfig.port} - ${errorMessage}`;
          errors.push(fullError);
          lastError = errorMessage;
          
          console.error(`❌ Error sending email (${strategy.name}, Port ${portConfig.port}, Attempt ${attempt}/${retries + 1}):`, errorMessage);
          
          if (attempt === retries + 1) {
            break; 
          }
          
          const waitTime = Math.min(500 * Math.pow(2, attempt - 1), 3000);
          await new Promise(resolve => setTimeout(resolve, waitTime));
        }
      }
    }
  }
  
  const errorMessage = lastError || 'Failed to send email after all retry attempts';
  
  if (errorMessage.includes('ETIMEDOUT') || errorMessage.includes('timeout') || errorMessage.includes('ECONNREFUSED')) {
    return {
      success: false,
      error: `Email sending failed on all ports and connection methods.\n\nTried:\n${errors.map(e => `- ${e}`).join('\n')}\n\nPossible solutions:\n1. Network/Firewall is blocking SMTP ports\n2. Try different network (mobile hotspot, office WiFi)\n3. Temporarily disable firewall/antivirus\n4. Contact your ISP - they may block SMTP ports\n5. For production, consider using Gmail OAuth2 or alternative SMTP service`
    };
  }
  
  return {
    success: false,
    error: `Email sending failed. Errors:\n${errors.map(e => `- ${e}`).join('\n')}`
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

// Booking Confirmation Email Template
export const generateBookingConfirmationEmail = (booking: Booking): string => {
  const nights = calculateNights(booking.checkIn, booking.checkOut);
  const guestName = `${booking.guestDetails.firstName} ${booking.guestDetails.lastName}`;
  
  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Booking Confirmation</title>
</head>
<body style="margin: 0; padding: 0; font-family: Arial, sans-serif; background-color: #f4f4f4;">
  <table role="presentation" style="width: 100%; border-collapse: collapse;">
    <tr>
      <td style="padding: 20px 0; text-align: center; background-color: #1a1a1a;">
        <h1 style="color: #ffffff; margin: 0; font-size: 28px;">Hotel Sultan</h1>
      </td>
    </tr>
    <tr>
      <td style="padding: 40px 20px; background-color: #ffffff; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #333333; margin-top: 0;">Booking Confirmation</h2>
        <p style="color: #666666; font-size: 16px; line-height: 1.6;">
          Dear ${guestName},
        </p>
        <p style="color: #666666; font-size: 16px; line-height: 1.6;">
          Thank you for choosing Hotel Sultan Palace! We are pleased to confirm your reservation.
        </p>
        
        <div style="background-color: #f9f9f9; padding: 20px; border-radius: 8px; margin: 30px 0;">
          <h3 style="color: #333333; margin-top: 0; border-bottom: 2px solid #FF6A00; padding-bottom: 10px;">
            Booking Details
          </h3>
          <table style="width: 100%; border-collapse: collapse;">
            <tr>
              <td style="padding: 8px 0; color: #666666; font-weight: bold; width: 40%;">Booking ID:</td>
              <td style="padding: 8px 0; color: #333333;">${booking.bookingId}</td>
            </tr>
            <tr>
              <td style="padding: 8px 0; color: #666666; font-weight: bold;">Check-in:</td>
              <td style="padding: 8px 0; color: #333333;">${formatDate(booking.checkIn)}</td>
            </tr>
            <tr>
              <td style="padding: 8px 0; color: #666666; font-weight: bold;">Check-out:</td>
              <td style="padding: 8px 0; color: #333333;">${formatDate(booking.checkOut)}</td>
            </tr>
            <tr>
              <td style="padding: 8px 0; color: #666666; font-weight: bold;">Duration:</td>
              <td style="padding: 8px 0; color: #333333;">${nights} ${nights === 1 ? 'night' : 'nights'}</td>
            </tr>
            <tr>
              <td style="padding: 8px 0; color: #666666; font-weight: bold;">Guests:</td>
              <td style="padding: 8px 0; color: #333333;">
                ${booking.guests.adults} ${booking.guests.adults === 1 ? 'Adult' : 'Adults'}
                ${booking.guests.children > 0 ? `, ${booking.guests.children} ${booking.guests.children === 1 ? 'Child' : 'Children'}` : ''}
              </td>
            </tr>
            <tr>
              <td style="padding: 8px 0; color: #666666; font-weight: bold;">Rooms:</td>
              <td style="padding: 8px 0; color: #333333;">${booking.guests.rooms}</td>
            </tr>
            <tr>
              <td style="padding: 8px 0; color: #666666; font-weight: bold;">Status:</td>
              <td style="padding: 8px 0; color: #28a745; font-weight: bold; text-transform: capitalize;">${booking.status}</td>
            </tr>
          </table>
        </div>

        <div style="background-color: #f9f9f9; padding: 20px; border-radius: 8px; margin: 30px 0;">
          <h3 style="color: #333333; margin-top: 0; border-bottom: 2px solid #FF6A00; padding-bottom: 10px;">
            Room Details
          </h3>
          ${booking.rooms.map((room, index) => `
            <div style="margin-bottom: ${index < booking.rooms.length - 1 ? '20px' : '0'}; padding-bottom: ${index < booking.rooms.length - 1 ? '20px' : '0'}; border-bottom: ${index < booking.rooms.length - 1 ? '1px solid #e0e0e0' : 'none'};">
              <p style="margin: 5px 0; color: #333333; font-weight: bold;">${room.type}</p>
              ${room.allocatedRoomType ? `<p style="margin: 5px 0; color: #666666; font-size: 14px;">Room: ${room.allocatedRoomType}</p>` : ''}
              <p style="margin: 5px 0; color: #666666; font-size: 14px;">Price: ${formatCurrency(room.price)}</p>
            </div>
          `).join('')}
        </div>

        ${booking.addOns.length > 0 ? `
        <div style="background-color: #f9f9f9; padding: 20px; border-radius: 8px; margin: 30px 0;">
          <h3 style="color: #333333; margin-top: 0; border-bottom: 2px solid #FF6A00; padding-bottom: 10px;">
            Add-ons
          </h3>
          ${booking.addOns.map(addon => `
            <p style="margin: 5px 0; color: #333333;">
              ${addon.name} (Qty: ${addon.quantity}) - ${formatCurrency(addon.price * addon.quantity)}
            </p>
          `).join('')}
        </div>
        ` : ''}

        <div style="background-color: #FF6A00; padding: 20px; border-radius: 8px; margin: 30px 0; text-align: center;">
          <p style="color: #ffffff; font-size: 24px; font-weight: bold; margin: 0;">
            Total Amount: ${formatCurrency(booking.totalAmount)}
          </p>
        </div>

        <div style="background-color: #f9f9f9; padding: 20px; border-radius: 8px; margin: 30px 0;">
          <h3 style="color: #333333; margin-top: 0; border-bottom: 2px solid #FF6A00; padding-bottom: 10px;">
            Guest Information
          </h3>
          <p style="margin: 5px 0; color: #333333;"><strong>Name:</strong> ${guestName}</p>
          <p style="margin: 5px 0; color: #333333;"><strong>Email:</strong> ${booking.guestDetails.email}</p>
          <p style="margin: 5px 0; color: #333333;"><strong>Phone:</strong> ${booking.guestDetails.prefix} ${booking.guestDetails.phone}</p>
        </div>

        <p style="color: #666666; font-size: 16px; line-height: 1.6;">
          We look forward to welcoming you to Hotel Sultan. If you have any questions or need to make changes to your reservation, please don't hesitate to contact us.
        </p>
        
        <p style="color: #666666; font-size: 16px; line-height: 1.6;">
          Best regards,<br>
          <strong>Hotel Sultan Palace Team</strong>
        </p>
      </td>
    </tr>
    <tr>
      <td style="padding: 20px; text-align: center; background-color: #1a1a1a; color: #ffffff;">
        <p style="margin: 0; font-size: 14px;">© ${new Date().getFullYear()} Hotel Sultan Palace   . All rights reserved.</p>
      </td>
    </tr>
  </table>
</body>
</html>
  `.trim();
};

// Booking Cancellation Email Template
export const generateBookingCancellationEmail = (booking: Booking, cancellationReason?: string): string => {
  const guestName = `${booking.guestDetails.firstName} ${booking.guestDetails.lastName}`;
  
  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Booking Cancellation</title>
</head>
<body style="margin: 0; padding: 0; font-family: Arial, sans-serif; background-color: #f4f4f4;">
  <table role="presentation" style="width: 100%; border-collapse: collapse;">
    <tr>
      <td style="padding: 20px 0; text-align: center; background-color: #1a1a1a;">
        <h1 style="color: #ffffff; margin: 0; font-size: 28px;">Hotel Sultan</h1>
      </td>
    </tr>
    <tr>
      <td style="padding: 40px 20px; background-color: #ffffff; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #333333; margin-top: 0;">Booking Cancellation</h2>
        <p style="color: #666666; font-size: 16px; line-height: 1.6;">
          Dear ${guestName},
        </p>
        <p style="color: #666666; font-size: 16px; line-height: 1.6;">
          We have received your request to cancel your reservation. Your booking has been cancelled as requested.
        </p>
        
        <div style="background-color: #fff3cd; padding: 20px; border-radius: 8px; margin: 30px 0; border-left: 4px solid #ffc107;">
          <h3 style="color: #333333; margin-top: 0;">Cancelled Booking Details</h3>
          <table style="width: 100%; border-collapse: collapse;">
            <tr>
              <td style="padding: 8px 0; color: #666666; font-weight: bold; width: 40%;">Booking ID:</td>
              <td style="padding: 8px 0; color: #333333;">${booking.bookingId}</td>
            </tr>
            <tr>
              <td style="padding: 8px 0; color: #666666; font-weight: bold;">Check-in:</td>
              <td style="padding: 8px 0; color: #333333;">${formatDate(booking.checkIn)}</td>
            </tr>
            <tr>
              <td style="padding: 8px 0; color: #666666; font-weight: bold;">Check-out:</td>
              <td style="padding: 8px 0; color: #333333;">${formatDate(booking.checkOut)}</td>
            </tr>
            <tr>
              <td style="padding: 8px 0; color: #666666; font-weight: bold;">Amount:</td>
              <td style="padding: 8px 0; color: #333333;">${formatCurrency(booking.totalAmount)}</td>
            </tr>
          </table>
        </div>

        ${cancellationReason ? `
        <div style="background-color: #f9f9f9; padding: 20px; border-radius: 8px; margin: 30px 0;">
          <p style="margin: 0; color: #666666;"><strong>Reason:</strong> ${cancellationReason}</p>
        </div>
        ` : ''}

        <div style="background-color: #f9f9f9; padding: 20px; border-radius: 8px; margin: 30px 0;">
          <h3 style="color: #333333; margin-top: 0;">Refund Information</h3>
          <p style="color: #666666; line-height: 1.6;">
            If you are eligible for a refund, it will be processed according to our cancellation policy. 
            Refunds typically take 5-10 business days to appear in your account.
          </p>
        </div>

        <p style="color: #666666; font-size: 16px; line-height: 1.6;">
          We're sorry to see you go. If you have any questions about this cancellation or would like to make a new reservation, please don't hesitate to contact us.
        </p>
        
        <p style="color: #666666; font-size: 16px; line-height: 1.6;">
          Best regards,<br>
          <strong>Hotel Sultan Team</strong>
        </p>
      </td>
    </tr>
    <tr>
      <td style="padding: 20px; text-align: center; background-color: #1a1a1a; color: #ffffff;">
        <p style="margin: 0; font-size: 14px;">© ${new Date().getFullYear()} Hotel Sultan. All rights reserved.</p>
      </td>
    </tr>
  </table>
</body>
</html>
  `.trim();
};


