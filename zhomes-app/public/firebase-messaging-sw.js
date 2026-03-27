/**
 * Firebase Cloud Messaging Service Worker
 * This file MUST be in the /public root for FCM to work
 */

// Give the service worker access to Firebase Messaging.
importScripts('https://www.gstatic.com/firebasejs/10.12.0/firebase-app-compat.js');
importScripts('https://www.gstatic.com/firebasejs/10.12.0/firebase-messaging-compat.js');

// Initialize the Firebase app in the service worker
firebase.initializeApp({
  apiKey: 'AIzaSyB-87pXLoDK0e3vYEaQZmUEeXYS1_o72jA',
  authDomain: 'zhomes-app.firebaseapp.com',
  projectId: 'zhomes-app',
  storageBucket: 'zhomes-app.firebasestorage.app',
  messagingSenderId: '589651082029',
  appId: '1:589651082029:web:c7f7896c230c29b421b1a4'
});

const messaging = firebase.messaging();

// Handle background messages
messaging.onBackgroundMessage((payload) => {
  console.log('[SW] Background message:', payload);

  const { title, body, icon } = payload.notification || {};

  self.registration.showNotification(title || 'ZHomes', {
    body: body || 'Tienes una nueva notificación',
    icon: icon || '/assets/logo/fav.png',
    badge: '/assets/logo/fav.png',
    vibrate: [200, 100, 200],
    tag: 'zhomes-notification',
    data: payload.data || {}
  });
});

// Handle notification click
self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  
  const targetUrl = event.notification.data?.url || '/';
  
  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true }).then((clientList) => {
      for (const client of clientList) {
        if (client.url.includes(self.location.origin) && 'focus' in client) {
          client.navigate(targetUrl);
          return client.focus();
        }
      }
      return clients.openWindow(targetUrl);
    })
  );
});
