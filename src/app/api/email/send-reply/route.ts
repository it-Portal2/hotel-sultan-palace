import { NextRequest, NextResponse } from 'next/server';
import { sendEmail, generateGeneralReplyEmail } from '@/lib/emailService';
import { updateBookingEnquiryStatus, updateContactFormStatus } from '@/lib/firestoreService';

export async function POST(request: NextRequest) {
    try {
        const body = await request.json();
        const { to, subject, message, referenceId, type, recipientName } = body;

        // Validation
        if (!to || !subject || !message) {
            return NextResponse.json(
                { success: false, error: 'Missing required fields: to, subject, or message' },
                { status: 400 }
            );
        }

        // Generate HTML with template
        const emailHtml = generateGeneralReplyEmail(message, recipientName || 'Guest');

        // Send email
        const result = await sendEmail({
            to,
            subject,
            html: emailHtml,
        });

        if (!result.success) {
            return NextResponse.json(
                { success: false, error: result.error || 'Failed to send email' },
                { status: 500 }
            );
        }

        // Update status in Firestore if referenceId provided
        if (referenceId && type) {
            if (type === 'booking') {
                await updateBookingEnquiryStatus(referenceId, 'replied');
            } else if (type === 'contact') {
                await updateContactFormStatus(referenceId, 'replied');
            }
        }

        return NextResponse.json({
            success: true,
            messageId: result.messageId,
            message: 'Reply sent successfully',
        });
    } catch (error) {
        console.error('Error sending reply email:', error);
        return NextResponse.json(
            {
                success: false,
                error: error instanceof Error ? error.message : 'Unknown error occurred',
            },
            { status: 500 }
        );
    }
}
