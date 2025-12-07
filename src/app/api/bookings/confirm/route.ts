import { NextRequest, NextResponse } from 'next/server';
import { confirmBooking } from '@/lib/bookingService';

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
      const confirmationResponse = await fetch(`${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/api/email/send-confirmation`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ bookingId }),
      });

      if (!confirmationResponse.ok) {
        console.warn('Failed to send confirmation email:', await confirmationResponse.text());
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

