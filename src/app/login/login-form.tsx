"use client";

import { useEffect, useState, useCallback } from "react";
import { login, signup, continueAsGuest, signInWithGoogle } from "./actions";
import { createClient as createSupabaseClient } from "@supabase/supabase-js";

export function LoginForm({
    message,
    error: initialError,
}: {
    message?: string;
    error?: string;
}) {
    const [isCapacitor, setIsCapacitor] = useState(false);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(initialError);

    useEffect(() => {
        const cap = (window as unknown as { Capacitor?: { isNativePlatform?: () => boolean } }).Capacitor;
        if (cap?.isNativePlatform?.()) {
            setIsCapacitor(true);
        }
    }, []);

    const handleGoogleSignIn = useCallback(async () => {
        if (!isCapacitor) return;
        setLoading(true);
        setError(undefined);

        try {
            // IMPORTANT: Use @supabase/supabase-js directly (NOT @supabase/ssr)
            // with flowType: 'implicit' to avoid PKCE.
            // The @supabase/ssr createBrowserClient defaults to PKCE which stores
            // a code_verifier in cookies — but the callback opens in Chrome which
            // doesn't share the WebView's cookies.
            const supabase = createSupabaseClient(
                process.env.NEXT_PUBLIC_SUPABASE_URL!,
                process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
                {
                    auth: {
                        flowType: "implicit",
                        autoRefreshToken: false,
                        persistSession: false,
                    },
                }
            );

            const { data, error: oauthError } = await supabase.auth.signInWithOAuth({
                provider: "google",
                options: {
                    redirectTo: "com.diogenes.app://callback",
                    skipBrowserRedirect: true,
                    queryParams: {
                        access_type: "offline",
                        prompt: "consent",
                    },
                },
            });

            if (oauthError) {
                setError("Could not initiate Google login");
                setLoading(false);
                return;
            }

            if (data.url) {
                // Navigate the WebView to the OAuth URL.
                // Capacitor will intercept the external domain (accounts.google.com)
                // and open it in the system browser (Chrome).
                // After OAuth, Google will redirect to:
                //   https://gyral.vercel.app/#access_token=...&refresh_token=...
                // The deep link intent filter intercepts this and opens the app.
                // CapacitorAuthHandler picks up the tokens and calls setSession().
                window.location.href = data.url;
                return; // Don't reset loading — we're navigating away
            }
        } catch (e) {
            console.error("[Login] Google sign-in error:", e);
            setError("Something went wrong. Please try again.");
        }

        setLoading(false);
    }, [isCapacitor]);

    return (
        <>
            {/* Message / Error */}
            {message && (
                <div className="mb-6 p-4 bg-blue-500/10 border border-blue-500/20 text-blue-400 text-sm rounded-lg text-center backdrop-blur-sm">
                    {message}
                </div>
            )}
            {error && (
                <div className="mb-6 p-4 bg-red-500/10 border border-red-500/20 text-red-400 text-sm rounded-lg text-center backdrop-blur-sm">
                    {error}
                </div>
            )}

            <form className="space-y-6">
                <div className="space-y-2">
                    <label className="text-xs uppercase tracking-wider text-zinc-500 ml-1" htmlFor="email">Email</label>
                    <input
                        id="email"
                        name="email"
                        type="email"
                        required
                        placeholder="initiate@gyral.com"
                        className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-3 text-white placeholder:text-zinc-700 focus:outline-none focus:border-white/30 focus:ring-1 focus:ring-white/30 transition-all font-mono"
                    />
                </div>

                <div className="space-y-2">
                    <label className="text-xs uppercase tracking-wider text-zinc-500 ml-1" htmlFor="password">Password</label>
                    <input
                        id="password"
                        name="password"
                        type="password"
                        required
                        placeholder="••••••••"
                        className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-3 text-white placeholder:text-zinc-700 focus:outline-none focus:border-white/30 focus:ring-1 focus:ring-white/30 transition-all font-mono"
                    />
                </div>

                <div className="flex flex-col gap-4 pt-4">
                    <button
                        formAction={login}
                        className="w-full bg-white text-black font-bold py-3 rounded-lg hover:scale-105 transition-transform shadow-[0_0_20px_rgba(255,255,255,0.2)] hover:shadow-[0_0_30px_rgba(255,255,255,0.4)]"
                    >
                        Log In
                    </button>
                    <div className="flex gap-4">
                        <button
                            formAction={signup}
                            className="flex-1 bg-transparent border border-white/20 text-white font-bold py-3 rounded-lg hover:bg-white/5 hover:border-white/40 transition-all text-sm"
                        >
                            Sign Up (Email)
                        </button>
                    </div>
                </div>
            </form>

            <div className="flex flex-col gap-4">
                <div className="relative flex py-2 items-center">
                    <div className="flex-grow border-t border-white/10"></div>
                    <span className="flex-shrink-0 mx-4 text-zinc-600 text-[10px] uppercase tracking-widest">Or Authenticate With</span>
                    <div className="flex-grow border-t border-white/10"></div>
                </div>

                {isCapacitor ? (
                    /* Capacitor: client-side IMPLICIT flow — no PKCE, no code_verifier, no cookies */
                    <button
                        onClick={handleGoogleSignIn}
                        disabled={loading}
                        type="button"
                        className="w-full bg-white/10 hover:bg-white/20 border border-white/20 text-white font-bold py-3 rounded-lg transition-all flex items-center justify-center gap-3 shadow-lg group disabled:opacity-50"
                    >
                        <svg className="w-5 h-5 bg-white rounded-full p-0.5 group-hover:scale-110 transition-transform" viewBox="0 0 24 24">
                            <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4" />
                            <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
                            <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05" />
                            <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335" />
                        </svg>
                        {loading ? "Connecting..." : "Google"}
                    </button>
                ) : (
                    /* Web: server action with PKCE (unchanged) */
                    <form>
                        <button
                            formAction={signInWithGoogle}
                            className="w-full bg-white/10 hover:bg-white/20 border border-white/20 text-white font-bold py-3 rounded-lg transition-all flex items-center justify-center gap-3 shadow-lg group"
                        >
                            <svg className="w-5 h-5 bg-white rounded-full p-0.5 group-hover:scale-110 transition-transform" viewBox="0 0 24 24">
                                <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4" />
                                <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
                                <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05" />
                                <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335" />
                            </svg>
                            Google
                        </button>
                    </form>
                )}

                <form>
                    <button
                        formAction={continueAsGuest}
                        className="w-full bg-transparent border border-white/10 text-zinc-500 hover:text-white font-mono text-xs uppercase tracking-widest py-3 rounded-lg hover:bg-white/5 transition-all"
                    >
                        Continue as Guest
                    </button>
                </form>
            </div>
        </>
    );
}
