"use client";

import { Header } from "@/components/header";
import { PactWidget } from "@/components/pacts-widget";

export default function CitadelPage() {
    return (
        <div className="min-h-screen bg-black text-white font-sans selection:bg-blue-500/30 flex flex-col">
            <Header />

            <main className="flex-1 p-4 md:p-8 max-w-7xl mx-auto w-full pb-20 md:pb-8">
                <PactWidget />
            </main>
        </div>
    );
}
