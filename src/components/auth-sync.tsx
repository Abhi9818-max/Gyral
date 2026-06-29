"use client";

import { useEffect } from "react";
import { createClient } from "@/utils/supabase/client";
import { useRouter } from "next/navigation";

export function AuthSync() {
    const router = useRouter();

    useEffect(() => {
        const handleAuthSync = async () => {
            // Check for tokens in the hash
            const hash = window.location.hash;
            if (!hash) return;

            const params = new URLSearchParams(hash.substring(1)); // Remove the leading '#'
            const accessToken = params.get("access_token");
            const refreshToken = params.get("refresh_token");

            if (accessToken && refreshToken) {
                const supabase = createClient();

                try {
                    const { error } = await supabase.auth.setSession({
                        access_token: accessToken,
                        refresh_token: refreshToken,
                    });

                    if (error) {
                        console.error("Auth Sync Error:", error);
                    } else {
                        console.log("Auth Sync Success: Session set from URL.");
                        // Redirect to dashboard
                        window.location.href = '/dashboard';
                    }
                } catch (e) {
                    console.error("Unexpected error during Auth Sync:", e);
                }
            }
        };

        handleAuthSync();
    }, [router]);

    return null; // This component renders nothing
}
