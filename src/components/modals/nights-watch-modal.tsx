"use client";

import { useState } from 'react';
import { X, Snowflake, Sword, Shield, Flame, Skull, Ghost, ChevronRight } from 'lucide-react';
import { useUserData } from '@/context/user-data-context';
import { motion, AnimatePresence } from 'framer-motion';

interface NightsWatchModalProps {
    isOpen: boolean;
    onClose: () => void;
}

export function NightsWatchModal({ isOpen, onClose }: NightsWatchModalProps) {
    const { vows, addVow, completeVowDaily } = useUserData();
    const [newVowText, setNewVowText] = useState("");
    const [view, setView] = useState<'watch' | 'broken'>('watch');

    if (!isOpen) return null;

    const activeVows = vows?.filter(v => v.status === 'active') || [];
    const brokenVows = vows?.filter(v => v.status === 'broken') || [];

    const handleTakeVow = () => {
        if (!newVowText.trim()) return;
        addVow(newVowText);
        setNewVowText("");
    };

    const isCompletedToday = (dateString?: string) => {
        if (!dateString) return false;
        const today = new Date().toISOString().split('T')[0];
        return dateString === today;
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/90 backdrop-blur-md">
            <motion.div
                initial={{ opacity: 0, scale: 0.95, y: 20 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95, y: 20 }}
                transition={{ duration: 0.4, ease: [0.32, 0.72, 0, 1] }}
                className="w-full max-w-3xl bg-[#030303] border border-white/5 shadow-[0_0_100px_rgba(255,255,255,0.02)] overflow-hidden relative rounded-sm flex flex-col max-h-[90vh]"
            >
                {/* Cinematic Letterbox Effects */}
                <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-transparent via-slate-800/30 to-transparent opacity-50" />
                <div className="absolute bottom-0 left-0 right-0 h-1 bg-gradient-to-r from-transparent via-slate-800/30 to-transparent opacity-50" />

                {/* Snow Effect Overlay - localized */}
                <div className="absolute inset-0 pointer-events-none opacity-[0.03] bg-[url('https://grainy-gradients.vercel.app/noise.svg')]" />

                {/* Close Button - Minimal */}
                <button
                    onClick={onClose}
                    className="absolute top-6 right-6 text-zinc-600 hover:text-zinc-300 transition-colors z-20 group"
                >
                    <X className="w-6 h-6 group-hover:rotate-90 transition-transform duration-500" />
                </button>

                {/* Header Section */}
                <div className="relative pt-16 pb-8 px-8 text-center bg-gradient-to-b from-zinc-900/20 to-transparent">
                    <motion.div
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.1 }}
                        className="flex justify-center mb-6"
                    >
                        <Shield className="w-12 h-12 text-slate-400/80 drop-shadow-[0_0_15px_rgba(148,163,184,0.3)]" strokeWidth={1} />
                    </motion.div>

                    <motion.h2
                        initial={{ opacity: 0, scale: 0.9 }}
                        animate={{ opacity: 1, scale: 1 }}
                        transition={{ delay: 0.2 }}
                        className="text-4xl md:text-5xl font-serif font-medium text-slate-200 tracking-wider mb-3 drop-shadow-lg"
                    >
                        THE NIGHT'S WATCH
                    </motion.h2>

                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ delay: 0.3 }}
                        className="flex justify-center items-center gap-6 text-xs font-mono uppercase tracking-[0.2em] text-zinc-600"
                    >
                        <button
                            onClick={() => setView('watch')}
                            className={`transition-colors duration-300 ${view === 'watch' ? 'text-slate-200 drop-shadow-[0_0_8px_rgba(255,255,255,0.5)]' : 'hover:text-zinc-400'}`}
                        >
                            Active Oaths
                        </button>
                        <span className="text-zinc-800">|</span>
                        <button
                            onClick={() => setView('broken')}
                            className={`transition-colors duration-300 ${view === 'broken' ? 'text-red-500 drop-shadow-[0_0_8px_rgba(239,68,68,0.5)]' : 'hover:text-zinc-400'}`}
                        >
                            The Fallen
                        </button>
                    </motion.div>
                </div>

                {/* Main Content */}
                <div className="flex-1 overflow-y-auto px-6 md:px-12 pb-12 custom-scrollbar">

                    <AnimatePresence mode="wait">
                        {view === 'watch' ? (
                            <motion.div
                                key="watch"
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                exit={{ opacity: 0 }}
                                transition={{ duration: 0.3 }}
                                className="space-y-12"
                            >
                                {/* Active Vows List */}
                                <div className="space-y-4">
                                    {activeVows.length === 0 ? (
                                        <div className="text-center py-12 border border-zinc-900 bg-zinc-950/30">
                                            <p className="font-serif text-xl text-zinc-500 italic mb-2">"And now my watch begins..."</p>
                                            <p className="text-xs text-zinc-700 uppercase tracking-widest">No active oaths taken</p>
                                        </div>
                                    ) : (
                                        activeVows.map((vow) => {
                                            const completed = isCompletedToday(vow.lastCompletedDate);
                                            return (
                                                <div
                                                    key={vow.id}
                                                    className="group relative flex flex-col md:flex-row items-center justify-between gap-6 p-6 border-b border-zinc-900 hover:border-zinc-800 transition-colors bg-gradient-to-r from-transparent via-transparent hover:via-zinc-900/20 to-transparent"
                                                >
                                                    <div className="text-center md:text-left flex-1">
                                                        <h3 className="text-xl md:text-2xl font-serif text-slate-300 tracking-wide group-hover:text-white transition-colors">
                                                            "{vow.text}"
                                                        </h3>
                                                        <div className="flex items-center justify-center md:justify-start gap-4 mt-3 text-[10px] md:text-xs font-mono uppercase tracking-widest text-zinc-600 group-hover:text-zinc-500 transition-colors">
                                                            <span className="flex items-center gap-1.5">
                                                                <Flame className={`w-3 h-3 ${vow.currentStreak > 0 ? 'text-blue-500 animate-pulse' : 'text-zinc-700'}`} />
                                                                {vow.currentStreak} Days
                                                            </span>
                                                            <span className="w-1 h-1 bg-zinc-800 rounded-full" />
                                                            <span>Since {new Date(vow.startDate).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}</span>
                                                        </div>
                                                    </div>

                                                    <button
                                                        onClick={() => !completed && completeVowDaily(vow.id)}
                                                        disabled={completed}
                                                        className={`
                                                            relative px-6 py-3 min-w-[160px] flex items-center justify-center gap-3
                                                            font-mono text-xs font-bold uppercase tracking-widest transition-all duration-500
                                                            ${completed
                                                                ? 'text-zinc-600 bg-transparent border border-zinc-900 cursor-not-allowed'
                                                                : 'text-orange-100 bg-orange-900/10 border border-orange-500/30 hover:bg-orange-900/20 hover:border-orange-500/60 hover:shadow-[0_0_30px_-5px_rgba(249,115,22,0.3)]'
                                                            }
                                                        `}
                                                    >
                                                        {completed ? (
                                                            <>
                                                                <Shield className="w-3 h-3" /> Vigil Kept
                                                            </>
                                                        ) : (
                                                            <>
                                                                <Flame className="w-3 h-3 text-orange-500" /> Hold Wall
                                                            </>
                                                        )}
                                                    </button>
                                                </div>
                                            );
                                        })
                                    )}
                                </div>

                                {/* New Vow Input Area */}
                                <div className="pt-8 border-t border-zinc-900/50">
                                    <h4 className="text-center text-xs font-mono text-zinc-600 uppercase tracking-[0.3em] mb-6">Speak a New Oath</h4>
                                    <div className="relative max-w-lg mx-auto group">
                                        <div className="absolute inset-x-0 bottom-0 h-[1px] bg-zinc-800 group-focus-within:bg-slate-500 transition-colors duration-500" />
                                        <input
                                            type="text"
                                            value={newVowText}
                                            onChange={(e) => setNewVowText(e.target.value)}
                                            onKeyDown={(e) => e.key === 'Enter' && handleTakeVow()}
                                            className="w-full bg-transparent p-4 text-center text-lg font-serif text-slate-300 placeholder:text-zinc-800 focus:outline-none focus:placeholder:text-zinc-700 transition-all"
                                            placeholder="I shall..."
                                        />
                                        <button
                                            onClick={handleTakeVow}
                                            disabled={!newVowText.trim()}
                                            className="absolute right-0 top-1/2 -translate-y-1/2 p-2 text-zinc-600 hover:text-white disabled:opacity-0 transition-all duration-300"
                                        >
                                            <ChevronRight className="w-5 h-5" />
                                        </button>
                                    </div>
                                </div>

                            </motion.div>
                        ) : (
                            <motion.div
                                key="broken"
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                exit={{ opacity: 0 }}
                                transition={{ duration: 0.3 }}
                                className="grid gap-4"
                            >
                                {brokenVows.length === 0 ? (
                                    <div className="text-center py-20">
                                        <p className="font-serif text-lg text-zinc-700 italic">"Honor remains intact."</p>
                                    </div>
                                ) : (
                                    brokenVows.map((vow) => (
                                        <div key={vow.id} className="p-6 bg-red-950/5 border border-red-900/10 flex items-center justify-between gap-4 grayscale hover:grayscale-0 transition-all duration-500 group">
                                            <div className="opacity-50 group-hover:opacity-80 transition-opacity">
                                                <p className="font-serif text-lg text-red-300/60 line-through decoration-red-900/50">"{vow.text}"</p>
                                                <div className="text-[10px] font-mono text-red-900 uppercase tracking-widest mt-1">
                                                    Broken {vow.brokenOn ? new Date(vow.brokenOn).toLocaleDateString() : 'Unknown'} • Max Streak: {vow.maxStreak}
                                                </div>
                                            </div>
                                            <Skull className="w-6 h-6 text-red-900/20 group-hover:text-red-900/50 transition-colors" />
                                        </div>
                                    ))
                                )}
                            </motion.div>
                        )}
                    </AnimatePresence>
                </div>

                {/* Footer Quote */}
                <div className="py-6 text-center border-t border-white/5 bg-[#050505]">
                    <p className="font-serif text-zinc-700 text-sm italic tracking-wide">
                        "I am the sword in the darkness."
                    </p>
                </div>
            </motion.div>
        </div>
    );
}
