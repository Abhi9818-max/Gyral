"use client";

import Link from 'next/link';
import { ChevronLeft } from 'lucide-react';
import { SettingsView } from '@/components/settings-view';

export default function SettingsPage() {
    return (
        <div className="min-h-screen bg-black text-white p-4 pb-24 md:p-8">
            <div className="max-w-5xl mx-auto">
                {/* Header */}
                <div className="flex items-center gap-4 mb-8">
                    <Link
                        href="/"
                        className="p-2 -ml-2 rounded-full hover:bg-white/10 text-zinc-400 hover:text-white transition-colors"
                    >
                        <ChevronLeft className="w-6 h-6" />
                    </Link>
                    <h1 className="text-2xl font-bold tracking-tight">System Settings</h1>
                </div>

                <SettingsView />
            </div>
        </div>
    );
}
