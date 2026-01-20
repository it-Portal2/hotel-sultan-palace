import { NextRequest, NextResponse } from 'next/server';
import { confirmBooking } from '@/lib/bookingService';
import { sendEmail, generateBookingConfirmationEmail } from '@/lib/emailService';
import { getBooking } from '@/lib/firestoreService';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { bookingId } = body;

    if (!bookingId) {
      return NextResponse.json(
        { success: false, error: 'Booking ID is required' },
        { status: 400 }
      );
    }

    // Confirm booking
    await confirmBooking(bookingId);


    // Send confirmation email (non-blocking)
    try {
      const booking = await getBooking(bookingId);
      if (booking) {
        const emailHtml = generateBookingConfirmationEmail(booking);
        await sendEmail({
          to: booking.guestDetails.email,
          subject: `Booking Confirmation - ${booking.bookingId}`,
          html: emailHtml,
        });
        console.log('Confirmation email sent directly');
      }
    } catch (emailError) {
      // Don't fail the booking confirmation if email fails
      console.error('Error sending confirmation email:', emailError);
    }

    return NextResponse.json({
      success: true,
      message: 'Booking confirmed successfully',
    });
  } catch (error) {
    console.error('Error confirming booking:', error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error occurred',
      },
      { status: 500 }
    );
  }
}

