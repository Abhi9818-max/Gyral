"use client";

import { useSearchParams, useRouter } from "next/navigation";
import { Suspense } from "react";


function ErrorContent() {
    const searchParams = useSearchParams();
    const router = useRouter();
    const error = searchParams.get("error");

    return (
        <div className="flex min-h-screen flex-col items-center justify-center p-4 text-center">
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
