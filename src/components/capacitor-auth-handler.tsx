"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/utils/supabase/client";

export function CapacitorAuthHandler() {
    const router = useRouter();

    useEffect(() => {
        // Only run in Capacitor (native) context
        const isCapacitor =
            typeof window !== "undefined" &&
            (window as unknown as Record<string, unknown>).Capacitor !== undefined;

        if (!isCapacitor) return;

        let cleanup: (() => void) | undefined;

        const setupListener = async () => {
            try {
                const { App } = await import("@capacitor/app");

                const handle = await App.addListener("appUrlOpen", async (event) => {
                    console.log("[CapacitorAuth] Deep link received:", event.url);

                    try {
                        const url = new URL(event.url);

                        // Case 1: URL has tokens in the fragment (hash)
                        // e.g. https://gyral.vercel.app/#access_token=...&refresh_token=...
                        const hash = url.hash;
                        if (hash) {
                            const params = new URLSearchParams(hash.substring(1));
                            const accessToken = params.get("access_token");
                            const refreshToken = params.get("refresh_token");

                            if (accessToken && refreshToken) {
                                console.log("[CapacitorAuth] Tokens found in hash, setting session...");
                                const supabase = createClient();
                                const { error } = await supabase.auth.setSession({
                                    access_token: accessToken,
                                    refresh_token: refreshToken,
                                });

                                if (error) {
                                    console.error("[CapacitorAuth] setSession error:", error);
                                } else {
                                    console.log("[CapacitorAuth] Session set successfully!");
                                    router.push("/");
                                    router.refresh();
                                }
                                return;
                            }
                        }

                        // Case 2: URL has an auth code in query params
                        // e.g. https://gyral.vercel.app/auth/callback?code=...
                        const code = url.searchParams.get("code");
                        if (code && url.pathname.includes("/auth/callback")) {
                            console.log("[CapacitorAuth] Auth code found, exchanging for session...");
                            const supabase = createClient();
                            const { data, error } = await supabase.auth.exchangeCodeForSession(code);

                            if (error) {
                                console.error("[CapacitorAuth] Code exchange error:", error);
                            } else if (data.session) {
                                console.log("[CapacitorAuth] Code exchange successful!");
                                router.push("/");
                                router.refresh();
                            }
                            return;
                        }

                        // Case 3: Normal deep link (not auth-related)
                        // Navigate to the path within the app
                        const path = url.pathname + url.search;
                        if (path && path !== "/") {
                            console.log("[CapacitorAuth] Navigating to deep link path:", path);
                            router.push(path);
                        }
                    } catch (e) {
                        console.error("[CapacitorAuth] Error processing deep link:", e);
                    }
                });

                cleanup = () => {
                    handle.remove();
                };
            } catch (e) {
                console.error("[CapacitorAuth] Failed to setup deep link listener:", e);
            }
        };

        setupListener();

        return () => {
            cleanup?.();
        };
    }, [router]);

    return null;
}
