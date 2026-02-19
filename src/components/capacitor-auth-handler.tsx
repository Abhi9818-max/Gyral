"use client";

import { useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/utils/supabase/client";

export function CapacitorAuthHandler() {
    const router = useRouter();
    const isHandling = useRef(false);

    useEffect(() => {
        // Only run in Capacitor (native) context
        if (typeof window === "undefined") return;

        const win = window as unknown as Record<string, unknown>;
        const isCapacitor = win.Capacitor !== undefined;

        if (!isCapacitor) {
            console.log("[CapacitorAuth] Not in Capacitor context, skipping.");
            return;
        }

        let cleanup: (() => void) | undefined;

        const setupListener = async () => {
            try {
                // Dynamic import — only loads in Capacitor context
                const { App } = await import(
                    /* webpackIgnore: true */
                    "@capacitor/app"
                );

                const handle = await App.addListener("appUrlOpen", async (event) => {
                    // Prevent double-handling
                    if (isHandling.current) return;
                    isHandling.current = true;

                    console.log("[CapacitorAuth] Deep link received:", event.url);

                    try {
                        const url = new URL(event.url);

                        // Case 1: URL has tokens in the fragment (hash)
                        const hash = url.hash;
                        if (hash) {
                            const params = new URLSearchParams(hash.substring(1));
                            const accessToken = params.get("access_token");
                            const refreshToken = params.get("refresh_token");

                            if (accessToken && refreshToken) {
                                console.log("[CapacitorAuth] Tokens found, setting session...");
                                const supabase = createClient();
                                const { error } = await supabase.auth.setSession({
                                    access_token: accessToken,
                                    refresh_token: refreshToken,
                                });

                                if (error) {
                                    console.error("[CapacitorAuth] setSession error:", error);
                                } else {
                                    console.log("[CapacitorAuth] Session set! Reloading...");
                                    // Use window.location for a full page reload to ensure 
                                    // server components re-render with the new session
                                    window.location.href = "/";
                                }
                                isHandling.current = false;
                                return;
                            }
                        }

                        // Case 2: URL has an auth code in query params
                        const code = url.searchParams.get("code");
                        if (code && url.pathname.includes("/auth/callback")) {
                            console.log("[CapacitorAuth] Auth code found, exchanging...");
                            const supabase = createClient();
                            const { data, error } = await supabase.auth.exchangeCodeForSession(code);

                            if (error) {
                                console.error("[CapacitorAuth] Code exchange error:", error);
                            } else if (data.session) {
                                console.log("[CapacitorAuth] Code exchange success! Reloading...");
                                window.location.href = "/";
                            }
                            isHandling.current = false;
                            return;
                        }

                        // Case 3: Normal deep link (not auth-related)
                        const path = url.pathname + url.search;
                        if (path && path !== "/") {
                            console.log("[CapacitorAuth] Navigating to:", path);
                            router.push(path);
                        }
                    } catch (e) {
                        console.error("[CapacitorAuth] Error processing deep link:", e);
                    }

                    isHandling.current = false;
                });

                cleanup = () => {
                    handle.remove();
                };
            } catch (e) {
                // This will only fire if @capacitor/app fails to load
                console.warn("[CapacitorAuth] Could not load @capacitor/app:", e);
            }
        };

        setupListener();

        return () => {
            cleanup?.();
        };
    }, [router]);

    return null;
}
