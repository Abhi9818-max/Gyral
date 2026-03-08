"use client";

import { useFCM } from "@/hooks/use-fcm";

/**
 * Empty client component that simply invokes the FCM hook
 * to request notification permissions and register the device on mount.
 */
export function FCMHandler() {
    useFCM();
    return null;
}
