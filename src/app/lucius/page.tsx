"use client";

import { useEffect, useState, useRef } from 'react';
import { Ghost, Minimize2, Maximize2 } from 'lucide-react'; // Simpler icons
import { Header } from "@/components/header";
import { useUserData } from '@/context/user-data-context';
import { LuciusReflection } from '@/lib/lucius-core';
import { LuciusChat } from '@/components/lucius/lucius-chat';
import { LuciusDenial } from '@/components/lucius/lucius-denial';

export default function LuciusPage() {
    const { currentStreak, consistencyScore, records } = useUserData();
    const [reflection, setReflection] = useState<LuciusReflection | null>(null);
    const [isLoading, setIsLoading] = useState(true);

    // Consciousness Interface state
    const [chatOpen, setChatOpen] = useState(false);
    const [chatHistory, setChatHistory] = useState<{ role: 'user' | 'lucius', text: string }[]>([]);
    const [turns, setTurns] = useState(0);
    const [isChatLocked, setIsChatLocked] = useState(true);

    const [showHistory, setShowHistory] = useState(false); // Toggle for timeline
    const [showDenial, setShowDenial] = useState(false);

    useEffect(() => {
        const logs = Object.entries(records).flatMap(([date, recs]) => recs);

        const fetchReflection = async () => {
            try {
                const response = await fetch('/api/lucius/reflect', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ streak: currentStreak, consistency: consistencyScore, logs })
                });
                if (response.ok) {
                    const data = await response.json();
                    setReflection(data);
                    setIsChatLocked(!data.canActivateConsciousness);
                }
            } catch (e) {
                console.error(e);
            } finally {
                setIsLoading(false);
            }
        };
        fetchReflection();
    }, [currentStreak, consistencyScore, records]);

    const handleSendMessage = async (message: string) => {
        const newHistory = [...chatHistory, { role: 'user' as const, text: message }];
        setChatHistory(newHistory);
        setTurns(prev => prev + 1);

        try {
            const logs = Object.entries(records).flatMap(([date, recs]) => recs);
            // Dramatic pause
            await new Promise(r => setTimeout(r, 1200));

            const response = await fetch('/api/lucius/chat', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    streak: currentStreak,
                    consistency: consistencyScore,
                    logs,
                    message
                })
            });

            if (response.status === 403) {
                setChatHistory(prev => [...prev, { role: 'lucius', text: "The reflection fades..." }]);
                setIsChatLocked(true);
                setTimeout(() => setShowDenial(true), 2500);
                return;
            }

            const data = await response.json();
            setChatHistory(prev => [...prev, { role: 'lucius', text: data.reply }]);

            if (turns >= 2) {
                setTimeout(() => {
                    setChatHistory(prev => [...prev, { role: 'lucius', text: "Enough for now." }]);
                    setIsChatLocked(true);
                    setTimeout(() => setShowDenial(true), 2500);
                }, 2000);
            }

        } catch (e) {
            setChatHistory(prev => [...prev, { role: 'lucius', text: "..." }]);
        }
    };

    if (showDenial) {
        return <LuciusDenial onReturn={() => {
            setShowDenial(false);
            setChatOpen(false);
        }} />;
    }

    return (
        <div className="min-h-screen flex flex-col bg-[var(--lucius-void-900)] text-[var(--lucius-text-primary)] relative selection:bg-white/20">
            <Header />

            {/* Living Background */}
            <div className="lucius-aura" />

            {/* AVATAR PRESENCE */}
            <div className={`absolute inset-0 z-0 flex items-center justify-center transition-opacity duration-1000 pointer-events-none ${chatOpen ? 'opacity-40 scale-105' : 'opacity-20 scale-100'}`}>
                <img
                    src="/lucius-avatar.png"
                    alt=""
                    className="h-[80vh] w-auto object-cover opacity-80 mix-blend-screen"
                    style={{
                        maskImage: 'linear-gradient(to bottom, transparent 0%, black 20%, black 60%, transparent 100%)',
                        WebkitMaskImage: 'linear-gradient(to bottom, transparent 0%, black 20%, black 60%, transparent 100%)',
                        filter: 'grayscale(100%) contrast(120%) brightness(0.8)'
                    }}
                />
            </div>

            {/* Main Content Area - Center Stage */}
            <main className="flex-1 flex flex-col justify-center items-center p-6 relative z-10 w-full max-w-5xl mx-auto">

                {isLoading ? (
                    <div className="animate-pulse space-y-4 text-center">
                        <div className="h-2 w-24 bg-white/10 mx-auto rounded-full" />
                        <p className="text-xs uppercase tracking-[0.2em] text-white/30">Gazing into the mirror...</p>
                    </div>
                ) : (
                    <div className="w-full max-w-3xl space-y-12 transition-all duration-1000 ease-out">

                        {/* State Header (Minimal) */}
                        {!chatOpen && (
                            <div className="text-center space-y-2 lucius-enter-active">
                                <p className="text-[10px] uppercase tracking-[0.4em] text-white/20">Current State</p>
                                <h2 className={`text-xl font-mono tracking-[0.2em] ${reflection?.state === 'ALIGNED' ? 'text-white drop-shadow-[0_0_10px_rgba(255,255,255,0.3)]' :
                                    reflection?.state === 'RETURNING' ? 'text-emerald-500/80' :
                                        'text-white/60'
                                    }`}>
                                    {reflection?.state}
                                </h2>
                            </div>
                        )}

                        {/* Core Interaction */}
                        {!chatOpen ? (
                            <div className="text-center space-y-12 lucius-enter-active">
                                {/* The Message */}
                                <div className="space-y-6 max-w-2xl mx-auto">
                                    <p className="text-3xl md:text-5xl font-serif leading-tight italic text-transparent bg-clip-text bg-gradient-to-b from-white to-white/60 drop-shadow-lg">
                                        "{reflection?.message}"
                                    </p>
                                </div>

                                {/* Actions */}
                                <div className="flex flex-col items-center gap-6">
                                    {!isChatLocked ? (
                                        <button
                                            onClick={() => setChatOpen(true)}
                                            className="group relative px-8 py-4 overflow-hidden rounded-sm bg-white/5 hover:bg-white/10 transition-all duration-500 border border-white/5 hover:border-white/20"
                                        >
                                            <div className="absolute inset-0 bg-white/5 opacity-0 group-hover:opacity-100 transition-opacity blur-xl" />
                                            <span className="relative z-10 font-serif italic text-lg tracking-wide flex items-center gap-3">
                                                <Ghost className="w-5 h-5 opacity-50 group-hover:opacity-100 transition-opacity" />
                                                <span>Invoke Consciousness</span>
                                            </span>
                                        </button>
                                    ) : (
                                        <div className="text-xs text-white/20 uppercase tracking-[0.2em] flex items-center gap-2 cursor-not-allowed">
                                            <span>Silence reigns</span>
                                        </div>
                                    )}

                                    {/* History Toggle */}
                                    <button
                                        onClick={() => setShowHistory(!showHistory)}
                                        className="text-xs text-white/20 hover:text-white/50 uppercase tracking-widest transition-colors flex items-center gap-2 mt-8"
                                    >
                                        {showHistory ? <Minimize2 className="w-3 h-3" /> : <Maximize2 className="w-3 h-3" />}
                                        {showHistory ? "Hide Reflection" : "View Reflection Path"}
                                    </button>
                                </div>
                            </div>
                        ) : (
                            <LuciusChat
                                initialHistory={chatHistory}
                                onSendMessage={handleSendMessage}
                                isLocked={isChatLocked}
                                turnsLeft={3 - turns}
                                onClose={() => setChatOpen(false)}
                            />
                        )}

                        {/* Timeline / History Drawer (Conditional) */}
                        {showHistory && !chatOpen && reflection?.checkpoints && (
                            <div className="border-t border-white/5 pt-12 mt-12 grid grid-cols-1 md:grid-cols-3 gap-8 lucius-enter-active">
                                {reflection.checkpoints.map((cp, idx) => (
                                    <div key={idx} className="space-y-2 group">
                                        <div className="flex items-center gap-3 mb-2">
                                            <div className={`h-1.5 w-1.5 rounded-full ${cp.status === 'BOTH_ACTED' ? 'bg-white shadow-[0_0_8px_rgba(255,255,255,0.5)]' : 'bg-white/10'
                                                }`} />
                                            <span className="text-[10px] font-mono text-white/30">{cp.day}</span>
                                        </div>
                                        <p className="text-sm text-white/60 font-serif leading-relaxed group-hover:text-white/90 transition-colors">
                                            {cp.description}
                                        </p>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                )}
            </main>
        </div>
    );
}
