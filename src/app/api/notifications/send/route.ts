import { NextRequest, NextResponse } from 'next/server';
import { broadcastNotification } from '@/lib/notifications';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { title, body: messageBody, imageUrl, url, bookUrl, couponCode } = body;

    if (!title || !messageBody) {
      return NextResponse.json(
        { success: false, error: 'Title and body are required' },
        { status: 400 }
      );
    }

    const mergedBody = couponCode
      ? `${messageBody}\n\n🎫 Coupon Code: ${couponCode}`
      : messageBody;

    const response = await broadcastNotification({
      title,
      body: mergedBody,
      imageUrl,
      url,
      bookUrl,
      couponCode,
    });

    if ('successCount' in response && 'failureCount' in response) {
      return NextResponse.json({
        success: true,
        message: `Notifications sent to ${response.successCount} devices, failed for ${response.failureCount}`,
      });
    }

    return NextResponse.json(
      {
        success: false,
        error: 'No tokens registered for notifications.',
      },
      { status: 200 }
    );
  } catch (error) {
    console.error('Error sending notifications:', error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}
