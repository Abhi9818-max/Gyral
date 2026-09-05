"use client";

import { useEffect, useRef } from "react";
import { createClient } from "@/utils/supabase/client";

export function AuthSync() {
    const hasRun = useRef(false);

    useEffect(() => {
        if (hasRun.current) return;

        const handleAuthSync = async () => {
            // Check for tokens in the hash
            const hash = window.location.hash;
            if (!hash) return;

            const params = new URLSearchParams(hash.substring(1));
            const accessToken = params.get("access_token");
            const refreshToken = params.get("refresh_token");

            if (!accessToken || !refreshToken) return;

            // Prevent double-processing
            hasRun.current = true;

            // Clear hash fragment immediately to prevent re-processing on re-renders
            if (window.history.replaceState) {
                window.history.replaceState(null, '', window.location.pathname + window.location.search);
            }

            console.log("[AuthSync] Found tokens in URL hash, setting session...");

            const supabase = createClient();

            try {
                const { error } = await supabase.auth.setSession({
                    access_token: accessToken,
                    refresh_token: refreshToken,
                });

                if (error) {
                    console.error("[AuthSync] setSession error:", error);
                    // Redirect to login with error
                    window.location.href = '/login?error=' + encodeURIComponent('Session sync failed. Please try again.');
                    return;
                }

                console.log("[AuthSync] Session set successfully! Redirecting to dashboard...");
                window.location.href = '/dashboard';
            } catch (e) {
                console.error("[AuthSync] Unexpected error:", e);
                window.location.href = '/login?error=' + encodeURIComponent('Authentication failed. Please try again.');
            }
        };

        handleAuthSync();
    }, []);

    return null;
}
