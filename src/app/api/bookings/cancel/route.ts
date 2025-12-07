import { NextRequest, NextResponse } from 'next/server';
import { cancelBooking } from '@/lib/bookingService';

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
      const emailResponse = await fetch(`${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/api/email/send-cancellation`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ bookingId, cancellationReason }),
      });

      if (!emailResponse.ok) {
        console.warn('Failed to send cancellation email:', await emailResponse.text());
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

