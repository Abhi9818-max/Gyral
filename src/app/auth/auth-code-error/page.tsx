"use client";

import { useSearchParams, useRouter } from "next/navigation";
import { Suspense, useEffect, useState } from "react";


function ErrorContent() {
    const searchParams = useSearchParams();
    const router = useRouter();
    const error = searchParams.get("error");
    const [isSyncing, setIsSyncing] = useState(true);

    useEffect(() => {
        const hasHashToken = typeof window !== 'undefined' && 
            (window.location.hash.includes('access_token') || window.location.hash.includes('refresh_token'));
        
        if (!hasHashToken) {
            setIsSyncing(false);
        }
    }, []);

    if (isSyncing) {
        return (
            <div className="flex min-h-screen flex-col items-center justify-center p-4 text-center bg-black text-white font-mono">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-white mb-4"></div>
                <p className="text-zinc-500 uppercase tracking-widest text-xs">Forging Session...</p>
            </div>
        );
    }

    return (
        <div className="flex min-h-screen flex-col items-center justify-center p-4 text-center bg-black text-white font-mono">
            <h1 className="text-2xl font-bold mb-4 text-red-500">Authentication Error</h1>
            <p className="mb-6 text-gray-400">
                {error || "An unknown error occurred during authentication."}
            </p>
            <button
                onClick={() => router.push("/login")}
                className="px-4 py-2 bg-white text-black rounded hover:bg-gray-200 transition-colors"
            >
                Return to Login
            </button>
        </div>
    );
}

export default function AuthErrorPage() {
    return (
        <Suspense fallback={<div>Loading...</div>}>
            <ErrorContent />
        </Suspense>
    );
}
