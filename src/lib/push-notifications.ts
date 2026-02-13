
import { createClient } from "@/utils/supabase/client";

const PUBLIC_KEY = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY;

function urlBase64ToUint8Array(base64String: string) {
    const padding = '='.repeat((4 - base64String.length % 4) % 4);
    const base64 = (base64String + padding)
        .replace(/\-/g, '+')
        .replace(/_/g, '/');
    const rawData = window.atob(base64);
    const outputArray = new Uint8Array(rawData.length);
    for (let i = 0; i < rawData.length; ++i) {
        outputArray[i] = rawData.charCodeAt(i);
    }
    return outputArray;
}

export async function isPushSupported(): Promise<boolean> {
    if (typeof window === 'undefined') return false;
    return 'serviceWorker' in navigator && 'PushManager' in window;
}

export async function isPushSubscribed(): Promise<boolean> {
    if (!await isPushSupported()) return false;

    const registration = await navigator.serviceWorker.ready;
    const subscription = await registration.pushManager.getSubscription();
    return !!subscription;
}

export function getNotificationPermission(): NotificationPermission {
    if (typeof window === 'undefined') return 'default';
    return Notification.permission;
}

export async function enablePushNotifications(): Promise<boolean> {
    if (!await isPushSupported()) return false;

    if (!PUBLIC_KEY) {
        console.warn("VAPID public key not found — push subscription skipped");
        return false;
    }

    try {
        const registration = await navigator.serviceWorker.ready;

        // Subscribe to push
        const subscription = await registration.pushManager.subscribe({
            userVisibleOnly: true,
            applicationServerKey: urlBase64ToUint8Array(PUBLIC_KEY)
        });

        console.log("Push Subscription:", JSON.stringify(subscription));

        // Save to DB via API
        const res = await fetch('/api/push/subscribe', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ subscription })
        });

        if (!res.ok) {
            console.error('Failed to save subscription to server:', await res.text());
            return false;
        }

        return true;
    } catch (error) {
        console.error('Failed to subscribe to push:', error);
        return false;
    }
}

export async function disablePushNotifications(): Promise<boolean> {
    if (!await isPushSupported()) return false;

    try {
        const registration = await navigator.serviceWorker.ready;
        const subscription = await registration.pushManager.getSubscription();

        if (subscription) {
            await subscription.unsubscribe();
            // Optional: Notify server to remove subscription
            // await fetch('/api/push/unsubscribe', { ... });
        }
        return true;
    } catch (error) {
        console.error('Error unsubscribing:', error);
        return false;
    }
}

// Legacy export compatibility
export const subscribeUserToPush = async () => {
    const success = await enablePushNotifications();
    return { success };
};
