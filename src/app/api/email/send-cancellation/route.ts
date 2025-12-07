import { NextRequest, NextResponse } from 'next/server';
import { sendEmail, generateBookingCancellationEmail } from '@/lib/emailService';
import { getBooking } from '@/lib/firestoreService';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { bookingId, cancellationReason } = body;

    if (!bookingId) {
      return NextResponse.json(
        { success: false, error: 'Booking ID is required' },
        { status: 400 }
      );
    }

    // Fetch booking from Firestore
    const booking = await getBooking(bookingId);

    if (!booking) {
      return NextResponse.json(
        { success: false, error: 'Booking not found' },
        { status: 404 }
      );
    }

    // Generate email HTML
    const emailHtml = generateBookingCancellationEmail(booking, cancellationReason);

    // Send email
    const result = await sendEmail({
      to: booking.guestDetails.email,
      subject: `Booking Cancellation - ${booking.bookingId}`,
      html: emailHtml,
    });

    if (!result.success) {
      return NextResponse.json(
        { success: false, error: result.error || 'Failed to send email' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      messageId: result.messageId,
      message: 'Cancellation email sent successfully',
    });
  } catch (error) {
    console.error('Error sending cancellation email:', error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error occurred',
      },
      { status: 500 }
    );
  }
}

