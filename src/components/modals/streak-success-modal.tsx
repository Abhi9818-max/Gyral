"use client";

import { useEffect, useState, useMemo } from 'react';
import { useUserData } from '@/context/user-data-context';
import { Flame, X } from 'lucide-react';
import { STREAK_QUOTES, STREAK_TITLES } from '@/data/quotes';

export function StreakSuccessModal() {
    const { lastCompletion, setLastCompletion, getStreakForDate, streakTier, rebuildMode, getTaskAnalytics, getRecordsForDate } = useUserData();
    const [isOpen, setIsOpen] = useState(false);
    const [isClosing, setIsClosing] = useState(false);

    // Memoize content so it doesn't change on re-renders
    const content = useMemo(() => {
        if (!lastCompletion) return null;

        const isCloseCall = new Date().getHours() >= 21; // 9 PM or later
        const titles = STREAK_TITLES[streakTier];
        const quotes = STREAK_QUOTES[streakTier];

        const randomTitle = titles[Math.floor(Math.random() * titles.length)];
        const randomQuote = quotes[Math.floor(Math.random() * quotes.length)];

        // Helper to get streak specific to this completion event
        const relevantStreak = getStreakForDate(lastCompletion.date, lastCompletion.taskId);

        // SILENCE LOGIC
        let shouldSilence = streakTier === 'committed';
        let override = false;
        if (isCloseCall) override = true;
        if (rebuildMode) override = true;

        // Always show if early streak 
        if (relevantStreak < 15) shouldSilence = false;

        if (shouldSilence && !override) {
            return null; // SILENCE
        }

        // Check for specific "Below Usual" insight
        let insight = null;
        if (!override) {
            const todaysRecords = getRecordsForDate(lastCompletion.date);
            if (todaysRecords && todaysRecords.length > 0) {
                const analytics = getTaskAnalytics ? getTaskAnalytics(lastCompletion.taskId) : null;
                // Find the record matching relevant criteria if needed, or just last one
                const lastRecord = todaysRecords.find(r => r.taskId === lastCompletion.taskId);

                if (analytics && lastRecord && lastRecord.value && lastRecord.value < analytics.baselineValue * 0.9) {
                    insight = "Below your usual.";
                }
            }
        }

        return {
            title: rebuildMode ? "You Showed Up." : randomTitle,
            quote: rebuildMode ? "That's enough today." : randomQuote,
            isCloseCall,
            isRebuild: rebuildMode,
            insight,
            streakCount: relevantStreak
        };
    }, [lastCompletion, streakTier, rebuildMode, getRecordsForDate, getTaskAnalytics, getStreakForDate]);

    useEffect(() => {
        if (lastCompletion) {
            if (content) {
                setIsOpen(true);
            } else {
                setLastCompletion(null);
            }
        }
    }, [lastCompletion, content]);

    const handleClose = () => {
        setIsClosing(true);
        setTimeout(() => {
            setIsOpen(false);
            setLastCompletion(null);
            setIsClosing(false);
        }, 500); // 500ms fade out
    };

    if (!isOpen || !content) return null;

    // Visuals based on tier
    const getFlameStyles = () => {
        if (content.isRebuild) return "text-emerald-500 drop-shadow-[0_0_15px_rgba(16,185,129,0.5)] animate-pulse"; // Calm Green

        switch (streakTier) {
            case 'committed':
                return "text-blue-500 drop-shadow-[0_0_25px_rgba(59,130,246,0.8)] animate-[pulse-slow_3s_ease-in-out_infinite]";
            case 'habit':
                return "text-orange-500 drop-shadow-[0_0_20px_rgba(249,115,22,0.6)] animate-[pulse-slow_4s_ease-in-out_infinite]";
            default: // spark
                return "text-yellow-400 drop-shadow-[0_0_15px_rgba(250,204,21,0.5)]";
        }
    };

    const getFlameSize = () => {
        switch (streakTier) {
            case 'committed': return 80;
            case 'habit': return 64;
            default: return 48;
        }
    };

    return (
        <div className={`fixed inset-0 z-[100] flex items-center justify-center p-4 transition-all duration-500 ${isClosing ? 'opacity-0 backdrop-blur-none' : 'opacity-100 backdrop-blur-md'}`}>
            <div className={`absolute inset-0 bg-black/60 transition-opacity duration-500 ${isClosing ? 'opacity-0' : 'opacity-100'}`} onClick={handleClose} />

            <div className={`
                relative bg-black border border-white/10 rounded-2xl p-8 max-w-md w-full 
                shadow-[0_0_50px_rgba(0,0,0,0.8)] 
                transform transition-all duration-500 cubic-bezier(0.16, 1, 0.3, 1)
                ${isClosing ? 'scale-95 translate-y-4 opacity-0' : 'scale-100 translate-y-0 opacity-100'}
            `}>

                {/* Close Button */}
                <button onClick={handleClose} className="absolute top-4 right-4 text-muted-foreground hover:text-white transition-colors">
                    <X className="w-5 h-5" />
                </button>

                <div className="flex flex-col items-center text-center space-y-6">

                    {/* Flame Visual */}
                    <div className="relative">
                        <Flame
                            size={getFlameSize()}
                            className={getFlameStyles()}
                            strokeWidth={streakTier === 'committed' ? 2 : 1.5}
                        />
                        {/* Inner intense glow for committed */}
                        {!content.isRebuild && streakTier === 'committed' && (
                            <div className="absolute inset-0 bg-blue-500/20 blur-xl rounded-full animate-pulse" />
                        )}
                    </div>

                    {/* Header Copy */}
                    <div className="space-y-2">
                        <h2 className="text-2xl font-bold tracking-tight text-white">
                            {content.title}
                        </h2>
                        <div className="flex items-center justify-center gap-2">
                            <span className="text-sm font-medium text-accent">Day {content.streakCount}</span>
                            {content.isCloseCall && (
                                <>
                                    <span className="text-white/20">•</span>
                                    <span className="text-sm font-medium text-red-400 italic">
                                        You almost didn't. But you did.
                                    </span>
                                </>
                            )}
                            {content.isRebuild && (
                                <>
                                    <span className="text-white/20">•</span>
                                    <span className="text-sm font-medium text-emerald-400 uppercase tracking-widest">
                                        REBUILDING
                                    </span>
                                </>
                            )}
                        </div>
                    </div>

                    {/* Divider */}
                    <div className="w-12 h-[1px] bg-white/10 my-2" />

                    {/* Quote */}
                    <blockquote className="text-muted-foreground italic font-serif leading-relaxed">
                        "{content.quote}"
                    </blockquote>

                    {/* Behavioral Insight Footer */}
                    {content.insight && (
                        <div className="text-xs text-white/40 font-mono uppercase tracking-widest pt-2 border-t border-white/5 w-full">
                            Insight: {content.insight}
                        </div>
                    )}

                    {/* CTA */}
                    <button
                        onClick={handleClose}
                        className={`mt-4 px-8 py-3 font-bold rounded-full transition-all duration-300 ${content.isRebuild
                            ? 'bg-emerald-900/50 text-emerald-100 hover:bg-emerald-900 border border-emerald-500/30'
                            : 'bg-white text-black hover:scale-105 hover:shadow-[0_0_20px_rgba(255,255,255,0.4)]'
                            }`}
                    >
                        {content.isRebuild ? "Step by Step" : "Keep Burning"}
                    </button>

                </div>
            </div>
        </div>
    );
}
