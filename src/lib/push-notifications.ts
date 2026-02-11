
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

export async function subscribeUserToPush(): Promise<{ success: boolean; error?: string }> {
    if (!('serviceWorker' in navigator)) {
        return { success: false, error: "Service workers not supported" };
    }

    if (!PUBLIC_KEY) {
        console.warn("VAPID public key not found — push subscription skipped");
        return { success: false, error: "VAPID key not configured" };
    }

    try {
        const registration = await navigator.serviceWorker.ready;

        // Check if already subscribed
        let subscription = await registration.pushManager.getSubscription();

        if (!subscription) {
            subscription = await registration.pushManager.subscribe({
                userVisibleOnly: true,
                applicationServerKey: urlBase64ToUint8Array(PUBLIC_KEY)
            });
        }

        console.log("Push Subscription:", JSON.stringify(subscription));

        // Save to DB via API
        const res = await fetch('/api/push/subscribe', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ subscription })
        });

        if (!res.ok) {
            const data = await res.json().catch(() => ({}));
            return { success: false, error: data.error || `Server returned ${res.status}` };
        }

        return { success: true };
    } catch (error: any) {
        console.error('Failed to subscribe to push:', error);
        return { success: false, error: error?.message || 'Unknown error' };
    }
}
