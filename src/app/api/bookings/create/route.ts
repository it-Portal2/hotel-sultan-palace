import { NextRequest, NextResponse } from 'next/server';
import { createBookingService } from '@/lib/bookingService';
import { Booking } from '@/lib/firestoreService';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const bookingData = body as Omit<Booking, 'id' | 'createdAt' | 'updatedAt'>;

    // Create booking
    const bookingId = await createBookingService(bookingData);

    if (!bookingId) {
      return NextResponse.json(
        { success: false, error: 'Failed to create booking' },
        { status: 500 }
      );
    }

    // Note: Confirmation email will be sent after payment is successful

    return NextResponse.json({
      success: true,
      bookingId,
      message: 'Booking created successfully',
    });
  } catch (error) {
    console.error('Error creating booking:', error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error occurred',
      },
      { status: 500 }
    );
  }
}

