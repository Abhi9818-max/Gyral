"use client";

import { usePresence } from '@/hooks/usePresence';

export function PresenceProvider({ children }: { children: React.ReactNode }) {
    usePresence(); // Initialize presence tracking
    return <>{children}</>;
}
