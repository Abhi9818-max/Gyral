"use client";

import { useEffect, useState } from 'react';
import { useUserData } from '@/context/user-data-context';
import { Flame, AlertCircle } from 'lucide-react';

export function StreakLossModal() {
    const { showLossModal, setShowLossModal, longestStreak, records } = useUserData();
    const [isOpen, setIsOpen] = useState(false);

    // Sync with context state
    useEffect(() => {
        if (showLossModal) {
            setIsOpen(true);
        }
    }, [showLossModal]);

    const handleClose = () => {
        setIsOpen(false);
        setShowLossModal(false);
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 backdrop-blur-xl bg-black/80 transition-all duration-700 animate-[fadeIn_1s_ease-out]">
            <div className="absolute inset-0 bg-black/40" />

            <div className="relative max-w-sm w-full text-center space-y-8 p-8 animate-[fadeInUp_1s_ease-out_0.2s_both]">

                {/* Icon: Extinguished Flame */}
                <div className="flex justify-center text-muted-foreground/30 relative">
                    <Flame size={64} strokeWidth={1} />
                    <XMark />
                </div>

                <div className="space-y-4">
                    <h2 className="text-3xl font-serif text-white/50 tracking-wide">
                        The fire went out.
                    </h2>
                    <p className="text-muted-foreground font-medium text-sm leading-relaxed">
                        Not because you failed.<br />
                        Because you stopped.
                    </p>
                </div>

                {/* Historical Context */}
                {longestStreak > 0 && (
                    <div className="inline-block px-4 py-2 border border-white/5 bg-white/5 rounded-lg text-xs text-muted-foreground">
                        Longest fire: <span className="text-white font-mono">{longestStreak} days</span>
                    </div>
                )}

                <div>
                    <button
                        onClick={handleClose}
                        className="text-sm font-bold text-white border-b border-white/20 hover:border-white transition-colors pb-1 uppercase tracking-widest mt-8 opacity-60 hover:opacity-100"
                    >
                        Continue
                    </button>
                </div>
            </div>
        </div>
    );
}

function XMark() {
    return (
        <div className="absolute inset-0 flex items-center justify-center">
            <div className="w-[1px] h-16 bg-red-500/50 rotate-45 transform" />
            <div className="w-[1px] h-16 bg-red-500/50 -rotate-45 transform" />
        </div>
    )
}
