"use client";

import { HydrationWidget } from "@/components/hydration-widget";

export default function HydrationWidgetPage() {
    return (
        <div className="min-h-screen bg-black flex items-center justify-center p-4">
            <div className="w-full max-w-md">
                <HydrationWidget />
            </div>
        </div>
    );
}
