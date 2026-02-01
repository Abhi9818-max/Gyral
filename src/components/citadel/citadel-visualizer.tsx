"use client";

import { useUserData } from "@/context/user-data-context";
import { CloudRain, Sun, Zap, Wind } from "lucide-react";

export function CitadelVisualizer() {
    const { consistencyScore, streakTier, streakStatus } = useUserData();

    // Visual Logic - Use percentages for responsive heights
    const wallHeightPercent = Math.max(20, consistencyScore); // 20-100%
    const towerCount = streakTier === 'committed' ? 4 : streakTier === 'habit' ? 2 : 0;

    // Weather Logic
    const isStormy = streakStatus === 'at-risk';
    const isLost = streakStatus === 'lost';

    return (
        <div className={`relative w-full h-full flex flex-col items-center justify-end overflow-hidden transition-colors duration-1000 
            ${isLost ? 'bg-zinc-950' : isStormy ? 'bg-zinc-900' : 'bg-gradient-to-t from-zinc-900 to-zinc-800'}
        `}>

            {/* SKY / ATMOSPHERE */}
            <div className="absolute inset-0 z-0 pointer-events-none">
                {isStormy && (
                    <>
                        <div className="absolute top-10 right-20 animate-pulse text-yellow-500/20"><Zap size={200} /></div>
                        <div className="absolute top-0 w-full h-full bg-black/40" />
                        <div className="rain-container absolute inset-0 opacity-30" />
                    </>
                )}
                {!isStormy && !isLost && (
                    <div className="absolute top-20 left-1/2 -translate-x-1/2 w-96 h-96 bg-orange-500/10 rounded-full blur-3xl animate-[pulse-slow_8s_ease-in-out_infinite]" />
                )}
                {isLost && (
                    <div className="absolute inset-0 bg-red-900/10 z-10" />
                )}
            </div>

            {/* FORTRESS CONTAINER */}
            <div className="relative z-10 w-full max-w-2xl px-4 md:px-8 flex items-end justify-center gap-1 perspective-1000 h-[60%]">

                {/* Left Tower (Habit Tier) */}
                {towerCount >= 2 && (
                    <div className="w-12 md:w-16 bg-zinc-800 border-2 border-zinc-700 relative animate-in slide-in-from-bottom duration-1000" style={{ height: `${wallHeightPercent * 0.6}%` }}>
                        <div className="absolute -top-6 md:-top-8 left-0 w-full h-6 md:h-8 bg-zinc-900 border-2 border-zinc-700 flex justify-between px-1">
                            <div className="w-1.5 md:w-2 h-3 md:h-4 bg-black/50" />
                            <div className="w-1.5 md:w-2 h-3 md:h-4 bg-black/50" />
                            <div className="w-1.5 md:w-2 h-3 md:h-4 bg-black/50" />
                        </div>
                        {/* Lit Window */}
                        <div className="absolute top-[20%] left-1/2 -translate-x-1/2 w-3 md:w-4 h-6 md:h-8 bg-yellow-500/50 blur-[2px] rounded-t-full animate-pulse" />
                    </div>
                )}

                {/* Main Wall */}
                <div
                    className="flex-1 bg-zinc-900/80 backdrop-blur-sm border-2 border-zinc-700 relative transition-all duration-1000 ease-in-out group hover:bg-zinc-800"
                    style={{ height: `${wallHeightPercent}%` }}
                >
                    {/* Battlements */}
                    <div className="absolute -top-3 md:-top-4 w-full h-3 md:h-4 flex justify-between px-1 md:px-2">
                        {Array.from({ length: 6 }).map((_, i) => (
                            <div key={i} className="w-3 md:w-4 h-3 md:h-4 bg-zinc-900 border-x-2 border-t-2 border-zinc-700" />
                        ))}
                    </div>

                    {/* Gate */}
                    <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-16 md:w-24 h-20 md:h-32 bg-zinc-950 border-x-2 border-t-2 border-zinc-600 rounded-t-full flex items-end justify-center overflow-hidden">
                        <div className="w-full h-full bg-[linear-gradient(45deg,transparent_25%,rgba(0,0,0,0.8)_25%,rgba(0,0,0,0.8)_50%,transparent_50%,transparent_75%,rgba(0,0,0,0.8)_75%,rgba(0,0,0,0.8)_100%)] bg-[length:10px_10px]" />
                        {streakStatus === 'safe' && <div className="absolute bottom-0 w-full h-1 bg-yellow-500 shadow-[0_0_20px_rgba(234,179,8,0.5)]" />}
                    </div>

                    {/* Stats Display on Hover/Touch */}
                    <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                        <span className="bg-black/80 px-3 py-1 rounded text-xs font-mono border border-white/20">
                            Fortitude: {consistencyScore}%
                        </span>
                    </div>
                </div>

                {/* Right Tower (Habit + Committed) */}
                {towerCount >= 2 && (
                    <div className="w-12 md:w-16 bg-zinc-800 border-2 border-zinc-700 relative animate-in slide-in-from-bottom duration-1000 delay-100" style={{ height: `${wallHeightPercent * 0.6}%` }}>
                        <div className="absolute -top-6 md:-top-8 left-0 w-full h-6 md:h-8 bg-zinc-900 border-2 border-zinc-700 flex justify-between px-1">
                            <div className="w-1.5 md:w-2 h-3 md:h-4 bg-black/50" />
                            <div className="w-1.5 md:w-2 h-3 md:h-4 bg-black/50" />
                            <div className="w-1.5 md:w-2 h-3 md:h-4 bg-black/50" />
                        </div>
                        {/* Lit Window */}
                        <div className="absolute top-[20%] left-1/2 -translate-x-1/2 w-3 md:w-4 h-6 md:h-8 bg-yellow-500/50 blur-[2px] rounded-t-full animate-pulse delay-500" />
                    </div>
                )}

                {/* Keep (Committed Tier) */}
                {towerCount >= 4 && (
                    <div className="absolute bottom-[100%] z-[-1] w-32 md:w-40 bg-zinc-800 border-2 border-zinc-600 animate-in slide-in-from-bottom duration-1000 delay-200 h-[40%] max-h-[150px]">
                        <div className="absolute -top-10 left-1/2 -translate-x-1/2 w-full h-10 bg-zinc-900 border-2 border-zinc-600 flex justify-around items-end">
                            <div className="w-4 h-6 bg-black/50" />
                            <div className="w-4 h-6 bg-black/50" />
                            <div className="w-4 h-6 bg-black/50" />
                        </div>
                        {/* Banner */}
                        <div className="absolute -top-24 left-1/2 -translate-x-1/2 flex flex-col items-center">
                            <div className="w-1 h-14 bg-zinc-400" />
                            <div className="w-12 h-8 bg-blue-600 animate-[wave_3s_ease-in-out_infinite] origin-left rounded-tr-lg rounded-br-lg opacity-80" />
                        </div>
                    </div>
                )}

            </div>

            {/* GROUND */}
            <div className="w-full h-20 md:h-32 bg-black border-t border-white/10 relative z-20">
                <div className="absolute top-0 w-full h-4 bg-gradient-to-b from-black/50 to-transparent" />
            </div>
        </div>
    );
}
