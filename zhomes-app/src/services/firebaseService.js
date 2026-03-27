/**
 * Firebase Cloud Messaging Service
 * FREE unlimited push notifications
 * Console: https://console.firebase.google.com
 */

import { initializeApp } from 'firebase/app';
import { getMessaging, getToken, onMessage } from 'firebase/messaging';
import { supabase } from '../lib/supabaseClient';

// Firebase config — set these in .env
const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY || '',
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN || '',
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID || '',
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET || '',
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID || '',
  appId: import.meta.env.VITE_FIREBASE_APP_ID || ''
};

let app = null;
let messaging = null;

/**
 * Initialize Firebase only if config is present
 */
function initFirebase() {
  if (app) return;
  if (!firebaseConfig.apiKey) {
    console.warn('Firebase not configured. Set VITE_FIREBASE_* variables in .env');
    return;
  }
  try {
    app = initializeApp(firebaseConfig);
    messaging = getMessaging(app);
  } catch (error) {
    console.error('Firebase init error:', error);
  }
}

export const FCMService = {
  /**
   * Request notification permission and get FCM token
   * Stores the token in Supabase for later use
   */
  async requestPermissionAndGetToken() {
    initFirebase();
    if (!messaging) return null;

    try {
      const permission = await Notification.requestPermission();
      if (permission !== 'granted') {
        console.log('Notification permission denied');
        return null;
      }

      const vapidKey = import.meta.env.VITE_FIREBASE_VAPID_KEY || '';
      const token = await getToken(messaging, { vapidKey });

      if (token) {
        // Save token to Supabase for this user
        const { data: { session } } = await supabase.auth.getSession();
        if (session) {
          await supabase
            .from('push_tokens')
            .upsert({
              user_id: session.user.id,
              token: token,
              platform: 'web',
              updated_at: new Date().toISOString()
            }, { onConflict: 'user_id' });
        }
        console.log('FCM Token saved:', token.substring(0, 20) + '...');
        return token;
      }
    } catch (error) {
      console.error('FCM token error:', error);
    }
    return null;
  },

  /**
   * Listen for foreground messages
   * @param {function} callback - Called with message payload
   */
  onForegroundMessage(callback) {
    initFirebase();
    if (!messaging) return () => {};

    return onMessage(messaging, (payload) => {
      console.log('Foreground message:', payload);
      callback(payload);
    });
  },

  /**
   * Show a local notification (for foreground messages)
   */
  showNotification(title, body, icon = '/assets/logo/fav.png') {
    if (Notification.permission === 'granted') {
      new Notification(title, {
        body,
        icon,
        badge: icon,
        vibrate: [200, 100, 200]
      });
    }
  }
};
