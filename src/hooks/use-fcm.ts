import { useEffect, useState } from 'react';
import { messaging } from '@/lib/firebase';
import { getToken, onMessage } from 'firebase/messaging';
import { createClient } from '@/utils/supabase/client';
import { PushNotifications } from '@capacitor/push-notifications';
import { Capacitor } from '@capacitor/core';
import { FirebaseMessaging } from '@capacitor-firebase/messaging';

export function useFCM() {
    const [token, setToken] = useState<string | null>(null);
    const [loading, setLoading] = useState<boolean>(false);
    const supabase = createClient();

    useEffect(() => {
        const checkAutoInit = async () => {
            const { data: { session } } = await supabase.auth.getSession();
            if (!session) return;

            // Only auto-init if we already have permission granted
            if (!Capacitor.isNativePlatform() && Notification.permission === 'granted') {
                // eslint-disable-next-line react-hooks/immutability
                await requestPermission();
            }
        };

        checkAutoInit();
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    const requestPermission = async (): Promise<boolean> => {
        setLoading(true);
        try {
            const { data: { session } } = await supabase.auth.getSession();
            if (!session) {
                console.error("User not logged in");
                setLoading(false);
                return false;
            }

            if (Capacitor.isNativePlatform()) {
                await initMobileFCM(session.user.id);
            } else {
                await initWebFCM(session.user.id);
            }
            setLoading(false);
            return true;
        } catch (e) {
            console.error(e);
            setLoading(false);
            return false;
        }
    };

    const initWebFCM = async (userId: string) => {
        const msg = await messaging();
        if (!msg) throw new Error("Firebase Messaging not supported.");

        const permission = await Notification.requestPermission();
        if (permission === 'granted') {
            const vapidKey = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY;
            if (!vapidKey) throw new Error('VAPID Key not found in environment');

            const fcmToken = await getToken(msg, { vapidKey });

            if (fcmToken) {
                setToken(fcmToken);
                await saveTokenToDatabase(userId, fcmToken, 'web');
            }

            onMessage(msg, (payload) => {
                console.log('[Web FCM] Message received. ', payload);
            });
        } else {
            throw new Error("Notification permission denied");
        }
    };

    const initMobileFCM = async (userId: string) => {
        let permStatus = await PushNotifications.checkPermissions();
        if (permStatus.receive === 'prompt') {
            permStatus = await PushNotifications.requestPermissions();
        }

        if (permStatus.receive !== 'granted') {
            throw new Error('User denied permissions!');
        }

        const { token: fcmToken } = await FirebaseMessaging.getToken();
        if (fcmToken) {
            setToken(fcmToken);
            const platform = Capacitor.getPlatform() === 'ios' ? 'ios' : 'android';
            await saveTokenToDatabase(userId, fcmToken, platform);
        }

        FirebaseMessaging.addListener('notificationReceived', (event) => {
            console.log('[Mobile FCM] Notification received:', event);
        });
    };

    const saveTokenToDatabase = async (userId: string, pushToken: string, platform: string) => {
        try {
            const { error } = await supabase
                .from('fcm_tokens')
                .upsert({ user_id: userId, token: pushToken, platform }); // removed onConflict as it might not be strictly necessary if token is unique pk

            if (error) {
                console.error('Error saving FCM token to DB:', error);
            }
        } catch (err) {
            console.error('Failed to save token:', err);
        }
    };

    return { token, loading, requestPermission };
}
