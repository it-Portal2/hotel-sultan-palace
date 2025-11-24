// Service Worker for Firebase Cloud Messaging
importScripts('https://www.gstatic.com/firebasejs/12.4.0/firebase-app-compat.js');
importScripts('https://www.gstatic.com/firebasejs/12.4.0/firebase-messaging-compat.js');

// Fetch Firebase config from the main window or use default
let firebaseConfig = {
  apiKey: "YOUR_API_KEY",
  authDomain: "YOUR_AUTH_DOMAIN",
  projectId: "YOUR_PROJECT_ID",
  storageBucket: "YOUR_STORAGE_BUCKET",
  messagingSenderId: "YOUR_MESSAGING_SENDER_ID",
  appId: "YOUR_APP_ID"
};

// Try to get config from message (sent during registration)
self.addEventListener('message', (event) => {
  if (event.data && event.data.type === 'FIREBASE_CONFIG') {
    firebaseConfig = event.data.config;
    if (!firebase.messaging.isSupported()) {
      return;
    }
    firebase.initializeApp(firebaseConfig);
    const messaging = firebase.messaging();
    setupMessaging(messaging);
  }
});

// Initialize with default config if message not received
if (firebase.messaging.isSupported()) {
  firebase.initializeApp(firebaseConfig);
  const messaging = firebase.messaging();
  setupMessaging(messaging);
}

function setupMessaging(messaging) {
  // Handle background messages
  messaging.onBackgroundMessage((payload) => {
    console.log('Background message received:', payload);
    
    const notificationTitle = payload.notification?.title || 'New Offer!';
    const notificationOptions = {
      body: payload.notification?.body || 'Check out our latest offer',
      icon: payload.notification?.icon || '/logo.jpg',
      badge: '/logo.jpg',
      image: payload.notification?.image,
      data: payload.data,
      requireInteraction: true,
      actions: [
        {
          action: 'view-offer',
          title: 'View Offer'
        },
        {
          action: 'book-now',
          title: 'Book Now'
        }
      ]
    };

    self.registration.showNotification(notificationTitle, notificationOptions);
  });
}

// Handle notification clicks
self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  
  const data = event.notification.data || {};
  const defaultUrl = data.url || '/offers';
  const bookingUrl = data.bookUrl || '/hotel';
  const targetUrl = event.action === 'book-now' ? bookingUrl : defaultUrl;
  
  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true }).then((clientList) => {
      for (let i = 0; i < clientList.length; i++) {
        const client = clientList[i];
        if (client.url === targetUrl && 'focus' in client) {
          return client.focus();
        }
      }
      if (clients.openWindow) {
        return clients.openWindow(targetUrl);
      }
    })
  );
});
