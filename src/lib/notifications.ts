import { getAdminFirestore, getAdminMessaging } from './firebaseAdmin';

interface BroadcastPayload {
  title: string;
  body: string;
  imageUrl?: string;
  url?: string;
  bookUrl?: string;
  couponCode?: string;
}

export const broadcastNotification = async ({
  title,
  body,
  imageUrl,
  url,
  bookUrl,
  couponCode,
}: BroadcastPayload) => {
  const firestore = getAdminFirestore();
  const messaging = getAdminMessaging();

  const tokensSnapshot = await firestore.collection('fcmTokens').get();
  const tokens = tokensSnapshot.docs.map((doc) => doc.data().token).filter(Boolean);

  if (tokens.length === 0) {
    return { success: false, message: 'No tokens registered.' };
  }

  const message = {
    notification: {
      title,
      body,
      imageUrl: imageUrl || undefined,
    },
    data: {
      url: url || '/offers',
      click_action: url || '/offers',
      bookUrl: bookUrl || '/hotel',
      couponCode: couponCode || '',
    },
    webpush: {
      notification: {
        title,
        body,
        icon: '/logo.jpg',
        image: imageUrl || undefined,
        requireInteraction: true,
        actions: [
          { action: 'view-offer', title: 'View Offer' },
          { action: 'book-now', title: 'Book Now' },
        ],
      },
      fcmOptions: {
        link: url || '/offers',
      },
    },
  };

  const response = await messaging.sendEachForMulticast({
    tokens,
    ...message,
  });

  if (response.failureCount > 0) {
    const invalidTokens: string[] = [];
    response.responses.forEach((resp, idx) => {
      if (!resp.success) {
        invalidTokens.push(tokens[idx]);
        console.warn(`Failed to send to token index ${idx}:`, resp.error);
      }
    });

    if (invalidTokens.length > 0) {
      const batch = firestore.batch();
      tokensSnapshot.docs.forEach((doc) => {
        if (invalidTokens.includes(doc.data().token)) {
          batch.delete(doc.ref);
        }
      });
      await batch.commit();
    }
  }

  return response;
};

