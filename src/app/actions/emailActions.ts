'use server';

import { sendEmail, generateBookingConfirmationEmail, generateBookingEnquiryEmail } from '@/lib/emailService';
import { Booking } from '@/lib/firestoreService';

export async function sendBookingConfirmationEmailAction(booking: Booking): Promise<{ success: boolean; error?: string }> {
    try {
        const guestEmail = booking.guestDetails?.email;

        if (!guestEmail) {
            console.warn('No guest email provided for booking confirmation.');
            return { success: false, error: 'No guest email provided.' };
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
            console.error('Failed to send booking confirmation email:', result.error);
            return { success: false, error: result.error };
        }
    } catch (error: any) {
        console.error('Unexpected error in sendBookingConfirmationEmailAction:', error);
        return { success: false, error: error.message };
    }
}

export async function sendContactEmailAction(contactData: { name: string; email: string; phone: string; message: string; subject: string }): Promise<{ success: boolean; error?: string }> {
    try {
        // Send notification to ADMIN (or Hotel Reservations)
        const adminEmail = process.env.SMTP_FROM_EMAIL || 'reservations@sultanpalacehotelznz.com'; // Default fallback
        const htmlContent = generateBookingEnquiryEmail(contactData);

        const result = await sendEmail({
            to: adminEmail,
            subject: `New Contact Inquiry: ${contactData.subject} - ${contactData.name}`,
            html: htmlContent,
            text: `Name: ${contactData.name}\nEmail: ${contactData.email}\nPhone: ${contactData.phone}\nMessage: ${contactData.message}`
        });

        // Optional: Send auto-reply to user?
        // const replyHtml = generateGeneralReplyEmail(`Thank you for contacting us. We have received your message and will get back to you shortly.`, contactData.name);
        // await sendEmail({ to: contactData.email, subject: 'We received your message', html: replyHtml });

        if (result.success) {
            return { success: true };
        } else {
            console.error('Failed to send contact email:', result.error);
            return { success: false, error: result.error };
        }
    } catch (error: any) {
        console.error('Unexpected error in sendContactEmailAction:', error);
        return { success: false, error: error.message };
    }
}
