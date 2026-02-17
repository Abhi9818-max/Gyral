
"use client";

import { useEffect, useState } from "react";
import { useUserData, Vow } from "@/context/user-data-context";
import { AlertTriangle, Shield, Archive, CheckCircle, XCircle } from "lucide-react";
import { createPortal } from "react-dom";

export function MissedVowModal() {
    const { vows, getBrokenVows, restoreVowStreak, breakVow } = useUserData();
    const [missedVows, setMissedVows] = useState<Vow[]>([]);
    const [currentIndex, setCurrentIndex] = useState(0);
    const [isOpen, setIsOpen] = useState(false);

    useEffect(() => {
        // Run check on mount
        const broken = getBrokenVows(vows);
        if (broken.length > 0) {
            setMissedVows(broken);
            setIsOpen(true);
        }
    }, [vows, getBrokenVows]);

    if (!isOpen || missedVows.length === 0) return null;

    const currentVow = missedVows[currentIndex];

    // Helper to advance or close
    const handleNext = () => {
        if (currentIndex < missedVows.length - 1) {
            setCurrentIndex(prev => prev + 1);
        } else {
            setIsOpen(false);
        }
    };

    const handleKept = async () => {
        await restoreVowStreak(currentVow.id);
        handleNext();
    };

    const handleBroken = async () => {
        await breakVow(currentVow.id);
        handleNext(); // Proceed to next or close
        // Note: Breaking a vow usually triggers Exile/Modal via Context updates, 
        // so context might trigger another modal (StreakLossModal) which is fine.
    };

    // Use Portal to ensure it sits on top of everything
    if (typeof window === 'undefined') return null;

    return createPortal(
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-300">
            <div className="w-full max-w-md bg-zinc-900 border border-red-500/30 rounded-2xl shadow-[0_0_50px_rgba(220,38,38,0.2)] overflow-hidden animate-in zoom-in-95 duration-300">
                {/* Header */}
                <div className="bg-red-950/30 p-6 text-center border-b border-red-900/20 relative">
                    <div className="absolute inset-0 bg-repeat opacity-10" style={{ backgroundImage: 'url("/noise.png")' }}></div>
                    <div className="w-16 h-16 mx-auto bg-red-900/20 rounded-full flex items-center justify-center mb-4 border border-red-500/30">
                        <AlertTriangle className="w-8 h-8 text-red-500" />
                    </div>
                    <h2 className="text-2xl font-bold text-white mb-2">Watch Report</h2>
                    <p className="text-zinc-400 text-sm">
                        You did not report in yesterday.
                    </p>
                </div>

                {/* Content */}
                <div className="p-6 space-y-6">
                    <div className="bg-black/40 rounded-xl p-4 border border-zinc-800 text-center">
                        <p className="text-xs text-zinc-500 uppercase tracking-widest mb-2">Vow of</p>
                        <p className="text-xl text-white font-serif italic">"{currentVow.text}"</p>
                    </div>

                    <div className="text-center space-y-4">
                        <p className="text-zinc-300 text-sm">
                            Did you keep your vow yesterday?
                        </p>

                        <div className="grid grid-cols-2 gap-3">
                            <button
                                onClick={handleBroken}
                                className="px-4 py-3 rounded-lg border border-red-500/20 bg-red-500/10 text-red-400 hover:bg-red-500/20 transition-colors flex items-center justify-center gap-2 font-medium"
                            >
                                <XCircle className="w-4 h-4" />
                                No, I Failed
                            </button>

                            <button
                                onClick={handleKept}
                                className="px-4 py-3 rounded-lg bg-green-600 hover:bg-green-500 text-white shadow-lg shadow-green-900/20 transition-all hover:scale-105 flex items-center justify-center gap-2 font-bold"
                            >
                                <CheckCircle className="w-4 h-4" />
                                Yes, I Kept It
                            </button>
                        </div>

                        <p className="text-xs text-zinc-600 mt-4">
                            Honesty is the only currency here.
                        </p>
                    </div>
                </div>
            </div>
        </div>,
        document.body
    );
}
