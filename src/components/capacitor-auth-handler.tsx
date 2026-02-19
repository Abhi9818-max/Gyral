"use client";

import { useEffect, useRef } from "react";
import { createClient } from "@/utils/supabase/client";

// Type for Capacitor's global object
interface CapacitorGlobal {
    isNativePlatform?: () => boolean;
    Plugins?: {
        App?: {
            addListener: (
                event: string,
                callback: (data: { url: string }) => void
            ) => Promise<{ remove: () => void }>;
        };
    };
}

export function CapacitorAuthHandler() {
    const isHandling = useRef(false);

    useEffect(() => {
        if (typeof window === "undefined") return;

        // Access Capacitor through the global window object — no imports needed.
        // The native shell injects this into the WebView.
        const cap = (window as unknown as { Capacitor?: CapacitorGlobal }).Capacitor;

        if (!cap || !cap.isNativePlatform?.()) {
            return; // Not in a native Capacitor app
        }

        const appPlugin = cap.Plugins?.App;
        if (!appPlugin) {
            console.warn("[CapacitorAuth] App plugin not found on global Capacitor object.");
            return;
        }

        let cleanup: (() => void) | undefined;

        const setup = async () => {
            try {
                const handle = await appPlugin.addListener("appUrlOpen", async (event) => {
                    if (isHandling.current) return;
                    isHandling.current = true;

                    console.log("[CapacitorAuth] Deep link received:", event.url);

                    try {
                        const url = new URL(event.url);

                        // Case 1: Tokens in the URL fragment (hash)
                        // e.g. https://gyral.vercel.app/#access_token=...&refresh_token=...
                        if (url.hash) {
                            const params = new URLSearchParams(url.hash.substring(1));
                            const accessToken = params.get("access_token");
                            const refreshToken = params.get("refresh_token");

                            if (accessToken && refreshToken) {
                                console.log("[CapacitorAuth] Setting session from tokens...");
                                const supabase = createClient();
                                const { error } = await supabase.auth.setSession({
                                    access_token: accessToken,
                                    refresh_token: refreshToken,
                                });

                                if (error) {
                                    console.error("[CapacitorAuth] setSession error:", error);
                                } else {
                                    console.log("[CapacitorAuth] Session set! Reloading...");
                                    window.location.href = "/";
                                }
                                isHandling.current = false;
                                return;
                            }
                        }

                        // Case 2: Auth code in query params
                        // e.g. https://gyral.vercel.app/auth/callback?code=...
                        const code = url.searchParams.get("code");
                        if (code && url.pathname.includes("/auth/callback")) {
                            console.log("[CapacitorAuth] Exchanging auth code...");
                            const supabase = createClient();
                            const { data, error } = await supabase.auth.exchangeCodeForSession(code);

                            if (error) {
                                console.error("[CapacitorAuth] Code exchange error:", error);
                            } else if (data.session) {
                                console.log("[CapacitorAuth] Code exchanged! Reloading...");
                                window.location.href = "/";
                            }
                            isHandling.current = false;
                            return;
                        }

                        // Case 3: Non-auth deep link — navigate within the app
                        const path = url.pathname + url.search;
                        if (path && path !== "/") {
                            console.log("[CapacitorAuth] Navigating to:", path);
                            window.location.href = path;
                        }
                    } catch (e) {
                        console.error("[CapacitorAuth] Error processing deep link:", e);
                    }

                    isHandling.current = false;
                });

                cleanup = () => handle.remove();
            } catch (e) {
                console.warn("[CapacitorAuth] Failed to set up listener:", e);
            }
        };

        setup();
        return () => cleanup?.();
    }, []);

    return null;
}
