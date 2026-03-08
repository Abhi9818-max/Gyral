import { useEffect, useState } from 'react';
import { messaging } from '@/lib/firebase';
import { getToken, onMessage } from 'firebase/messaging';
import { createClient } from '@/utils/supabase/client';
import { PushNotifications } from '@capacitor/push-notifications';
import { Capacitor } from '@capacitor/core';
import { FirebaseMessaging } from '@capacitor-firebase/messaging';

export function useFCM() {
    const [fcmToken, setFcmToken] = useState<string | null>(null);
    const supabase = createClient();

    useEffect(() => {
        const initFCM = async () => {
            const { data: { session } } = await supabase.auth.getSession();
            if (!session) return; // User isn't logged in, don't request push token

            if (Capacitor.isNativePlatform()) {
                await initMobileFCM(session.user.id);
            } else {
                await initWebFCM(session.user.id);
            }
        };

        initFCM();
    }, []);

    const initWebFCM = async (userId: string) => {
        try {
            const msg = await messaging();
            if (!msg) return; // Not supported or error

            const permission = await Notification.requestPermission();
            if (permission === 'granted') {
                // VAPID key is required to use FCM with Web Push
                const vapidKey = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY;
                if (!vapidKey) {
                    console.error('VAPID Key not found in environment');
                    return;
                }

                const token = await getToken(msg, { vapidKey });

                if (token) {
                    setFcmToken(token);
                    await saveTokenToDatabase(userId, token, 'web');
                }

                onMessage(msg, (payload) => {
                    console.log('[Web FCM] Message received. ', payload);
                    // Handle foreground messages if needed
                });
            }
        } catch (error) {
            console.error('Error initializing Web FCM:', error);
        }
    };

    const initMobileFCM = async (userId: string) => {
        try {
            // Check and request permissions
            let permStatus = await PushNotifications.checkPermissions();
            if (permStatus.receive === 'prompt') {
                permStatus = await PushNotifications.requestPermissions();
            }

            if (permStatus.receive !== 'granted') {
                throw new Error('User denied permissions!');
            }

            // We use @capacitor-firebase/messaging for FCM tokens
            const { token } = await FirebaseMessaging.getToken();
            if (token) {
                setFcmToken(token);
                const platform = Capacitor.getPlatform() === 'ios' ? 'ios' : 'android';
                await saveTokenToDatabase(userId, token, platform);
            }

            // Listen for incoming foreground messages
            FirebaseMessaging.addListener('notificationReceived', (event) => {
                console.log('[Mobile FCM] Notification received:', event);
            });

        } catch (error) {
            console.error('Error initializing Mobile FCM:', error);
        }
    };

    const saveTokenToDatabase = async (userId: string, token: string, platform: string) => {
        try {
            // Upsert the token to the database
            const { error } = await supabase
                .from('fcm_tokens')
                .upsert({ user_id: userId, token, platform }, { onConflict: 'user_id, token' });

            if (error) {
                console.error('Error saving FCM token to DB:', error);
            }
        } catch (err) {
            console.error('Failed to save token:', err);
        }
    };

    return { fcmToken };
}
