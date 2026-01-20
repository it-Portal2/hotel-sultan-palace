import { NextRequest, NextResponse } from 'next/server';
import { cancelBooking } from '@/lib/bookingService';
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

    // Cancel booking
    await cancelBooking(bookingId);

    // Send cancellation email (non-blocking)
    try {
      const booking = await getBooking(bookingId);
      if (booking) {
        const emailHtml = generateBookingCancellationEmail(booking, cancellationReason);
        await sendEmail({
          to: booking.guestDetails.email,
          subject: `Booking Cancellation - ${booking.bookingId}`,
          html: emailHtml,
        });
        console.log('Cancellation email sent directly');
      }
    } catch (emailError) {
      // Don't fail the booking cancellation if email fails
      console.error('Error sending cancellation email:', emailError);
    }

    return NextResponse.json({
      success: true,
      message: 'Booking cancelled successfully',
    });
  } catch (error) {
    console.error('Error cancelling booking:', error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error occurred',
      },
      { status: 500 }
    );
  }
}

