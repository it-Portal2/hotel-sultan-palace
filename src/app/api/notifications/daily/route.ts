import { NextResponse } from 'next/server';
import { getAdminFirestore } from '@/lib/firebaseAdmin';
import { broadcastNotification } from '@/lib/notifications';

const parseDate = (value?: string | null) => {
  if (!value) return null;
  const date = new Date(value);
  return isNaN(date.getTime()) ? null : date;
};

export async function POST() {
  try {
    const firestore = getAdminFirestore();
    const offersSnapshot = await firestore.collection('specialOffers').get();
    const now = new Date();
    const todayKey = now.toISOString().slice(0, 10);

    const validOffers = offersSnapshot.docs
      .map((doc) => ({ id: doc.id, data: doc.data() }))
      .filter(({ data }) => data.sendNotification && data.isActive)
      .filter(({ data }) => {
        const start = parseDate(data.startDate);
        const end = parseDate(data.endDate);
        if (start && now < start) return false;
        if (end) {
          const endOfDay = new Date(end);
          endOfDay.setHours(23, 59, 59, 999);
          if (now > endOfDay) return false;
        }
        return true;
      })
      .filter(({ data }) => {
        const lastSent = data.lastNotificationSentAt?.toDate
          ? data.lastNotificationSentAt.toDate()
          : data.lastNotificationSentAt
            ? new Date(data.lastNotificationSentAt)
            : null;
        if (!lastSent) return true;
        const lastKey = lastSent.toISOString().slice(0, 10);
        return lastKey !== todayKey;
      });

    if (validOffers.length === 0) {
      return NextResponse.json({
        success: true,
        message: 'No active offers require notifications today.',
      });
    }

    const results = [];

    for (const offer of validOffers) {
      const description = offer.data.description || 'Check out our latest offer.';
      const mergedBody = offer.data.couponCode
        ? `${description}\n\n🎫 Use code ${offer.data.couponCode}`
        : description;

      await broadcastNotification({
        title: `🎉 ${offer.data.title}`,
        body: mergedBody,
        imageUrl: offer.data.imageUrl,
        url: '/offers',
        bookUrl: `/hotel?specialOffer=${offer.id}`,
        couponCode: offer.data.couponCode || undefined,
      });

      await firestore.collection('specialOffers').doc(offer.id).update({
        lastNotificationSentAt: new Date(),
      });

      results.push(offer.id);
    }

    return NextResponse.json({
      success: true,
      message: `Notifications sent for ${results.length} offer(s).`,
      offers: results,
    });
  } catch (error) {
    console.error('Daily notification error:', error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}

