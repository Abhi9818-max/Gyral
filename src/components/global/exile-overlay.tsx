"use client";

import { useUserData } from "@/context/user-data-context";
import { Snowflake, Wind, Lock, Timer } from "lucide-react";
import { useState, useEffect } from "react";
import { formatDistanceToNow } from "date-fns";

export function ExileOverlay() {
    const { isExiled, exiledUntil, redeemExile } = useUserData();
    const [isRedeeming, setIsRedeeming] = useState(false);
    const [progress, setProgress] = useState(0);

    // Only show if exiled
    if (!isExiled) return null;

    const handleRedeem = async () => {
        setIsRedeeming(true);
        // Simulate a 5-second "meditation" or "focus" redemption task
        const interval = setInterval(() => {
            setProgress(prev => {
                if (prev >= 100) {
                    clearInterval(interval);
                    return 100;
                }
                return prev + 2;
            });
        }, 100);

        setTimeout(async () => {
            await redeemExile();
            setIsRedeeming(false);
            setProgress(0);
        }, 5500);
    };

    return (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center overflow-hidden">
            {/* Frozen Backdrop */}
            <div className="absolute inset-0 bg-blue-900/40 backdrop-blur-[20px] pointer-events-none" />

            {/* Animated Snow/Particles */}
            <div className="absolute inset-0 pointer-events-none opacity-50">
                <div className="absolute top-[-10%] left-0 w-full h-[120%] bg-[radial-gradient(circle_at_50%_50%,rgba(255,255,255,0.1)_0%,transparent_50%)] animate-pulse" />
                <div className="absolute inset-0 flex flex-wrap gap-20 p-20 justify-around">
                    {Array.from({ length: 10 }).map((_, i) => (
                        <Snowflake key={i} className={`text-blue-200/20 animate-bounce duration-[${3 + i % 5}s]`} size={24 + (i % 40)} />
                    ))}
                </div>
            </div>

            {/* Content Card */}
            <div className="relative max-w-lg w-full mx-4 bg-zinc-950/80 border border-blue-500/30 rounded-3xl p-8 md:p-12 shadow-[0_0_50px_rgba(59,130,246,0.2)] text-center space-y-8 animate-in zoom-in-95 duration-700">
                <div className="flex flex-col items-center gap-4">
                    <div className="relative">
                        <div className="absolute inset-0 bg-blue-500 blur-3xl opacity-20 animate-pulse" />
                        <div className="relative w-24 h-24 rounded-full bg-gradient-to-br from-blue-600 to-indigo-900 flex items-center justify-center border-2 border-blue-400/50 shadow-2xl">
                            <Wind className="w-12 h-12 text-white animate-pulse" />
                        </div>
                        <div className="absolute -bottom-2 -right-2 bg-zinc-950 p-2 rounded-full border border-blue-500/50">
                            <Lock className="w-4 h-4 text-blue-400" />
                        </div>
                    </div>

                    <h1 className="text-3xl md:text-4xl font-bold tracking-tighter text-transparent bg-clip-text bg-gradient-to-b from-white to-blue-200">
                        Beyond the Wall
                    </h1>
                    <p className="text-blue-200/60 font-medium tracking-wide uppercase text-xs">
                        Exiled for Breaking a Vow
                    </p>
                </div>

                <div className="space-y-4">
                    <p className="text-zinc-400 text-sm md:text-base leading-relaxed">
                        The Night’s Watch does not forget a broken oath. You have been cast into the shivering cold. Your exile ends when the sun rises or your penance is paid.
                    </p>

                    {exiledUntil && (
                        <div className="inline-flex items-center gap-2 px-4 py-2 bg-blue-500/10 border border-blue-500/20 rounded-full text-blue-300 text-sm">
                            <Timer className="w-4 h-4" />
                            <span>Natural Return: {formatDistanceToNow(new Date(exiledUntil), { addSuffix: true })}</span>
                        </div>
                    )}
                </div>

                {isRedeeming ? (
                    <div className="space-y-6">
                        <div className="text-xs font-mono text-blue-400 animate-pulse">
                            PURIFYING INTENTIONS...
                        </div>
                        <div className="w-full h-2 bg-zinc-900 rounded-full overflow-hidden border border-blue-500/20">
                            <div
                                className="h-full bg-gradient-to-r from-blue-600 to-indigo-400 transition-all duration-300"
                                style={{ width: `${progress}%` }}
                            />
                        </div>
                        <p className="text-zinc-500 text-xs italic">
                            Stay focused. The cold only yields to inner fire.
                        </p>
                    </div>
                ) : (
                    <div className="flex flex-col gap-4">
                        <button
                            onClick={handleRedeem}
                            className="group relative px-8 py-4 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white font-bold rounded-2xl shadow-lg shadow-blue-500/30 transition-all duration-500 hover:scale-[1.02] active:scale-95"
                        >
                            <span className="relative z-10 flex items-center justify-center gap-2">
                                Begin Penance (Keep Focus)
                            </span>
                            <div className="absolute inset-0 bg-white/20 opacity-0 group-hover:opacity-100 transition-opacity rounded-2xl" />
                        </button>

                        <p className="text-zinc-600 text-[10px] uppercase tracking-[0.2em]">
                            Warning: Closing this page will reset penance
                        </p>
                    </div>
                )}
            </div>

            {/* Custom CSS for Snowfall effect */}
            <style jsx global>{`
                @keyframes snowfall {
                    0% { transform: translateY(-10vh) rotate(0deg); }
                    100% { transform: translateY(110vh) rotate(360deg); }
                }
            `}</style>
        </div>
    );
}
