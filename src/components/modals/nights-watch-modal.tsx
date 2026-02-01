"use client";

import { useState, useEffect } from 'react';
import { X, Snowflake, Sword, Shield, Flame, Skull, Ghost } from 'lucide-react';
import { useUserData } from '@/context/user-data-context';
import { motion, AnimatePresence } from 'framer-motion';

interface NightsWatchModalProps {
    isOpen: boolean;
    onClose: () => void;
}

export function NightsWatchModal({ isOpen, onClose }: NightsWatchModalProps) {
    const { vows, addVow, completeVowDaily } = useUserData();
    const [newVowText, setNewVowText] = useState("");
    const [activeTab, setActiveTab] = useState<'watch' | 'broken'>('watch');

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
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
            <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                className="w-full max-w-2xl bg-[#0a0a0b] border border-slate-800 rounded-lg shadow-[0_0_50px_rgba(100,200,255,0.05)] overflow-hidden relative"
            >
                {/* Snow Effect Overlay */}
                <div className="absolute inset-0 pointer-events-none opacity-5 bg-[url('https://grainy-gradients.vercel.app/noise.svg')]" />

                {/* Header */}
                <div className="relative p-6 border-b border-slate-800 bg-gradient-to-b from-slate-900/50 to-transparent">
                    <button
                        onClick={onClose}
                        className="absolute top-4 right-4 text-slate-500 hover:text-white transition-colors"
                    >
                        <X className="w-5 h-5" />
                    </button>

                    <div className="flex items-center gap-3 mb-2">
                        <Shield className="w-6 h-6 text-slate-300" />
                        <h2 className="text-2xl font-bold text-slate-100 tracking-wider font-serif">THE NIGHT'S WATCH</h2>
                    </div>
                    <p className="text-slate-400 text-sm italic">
                        "Night gathers, and now my watch begins. It shall not end until my death."
                    </p>
                </div>

                {/* Content */}
                <div className="p-6">
                    {/* Tabs */}
                    <div className="flex items-center gap-4 mb-6 border-b border-slate-800/50 pb-2">
                        <button
                            onClick={() => setActiveTab('watch')}
                            className={`flex items-center gap-2 pb-2 text-sm font-medium transition-colors relative ${activeTab === 'watch' ? 'text-white' : 'text-slate-500 hover:text-slate-300'}`}
                        >
                            <Sword className="w-4 h-4" /> The Watch ({activeVows.length})
                            {activeTab === 'watch' && <motion.div layoutId="tab-indicator" className="absolute bottom-0 left-0 right-0 h-0.5 bg-slate-200" />}
                        </button>
                        <button
                            onClick={() => setActiveTab('broken')}
                            className={`flex items-center gap-2 pb-2 text-sm font-medium transition-colors relative ${activeTab === 'broken' ? 'text-red-400' : 'text-slate-500 hover:text-slate-300'}`}
                        >
                            <Skull className="w-4 h-4" /> The Fallen ({brokenVows.length})
                            {activeTab === 'broken' && <motion.div layoutId="tab-indicator" className="absolute bottom-0 left-0 right-0 h-0.5 bg-red-900" />}
                        </button>
                    </div>

                    {activeTab === 'watch' && (
                        <div className="space-y-6">
                            {/* Add Vow Input */}
                            <div className="flex gap-2">
                                <input
                                    type="text"
                                    value={newVowText}
                                    onChange={(e) => setNewVowText(e.target.value)}
                                    placeholder="I vow to..."
                                    className="flex-1 bg-black/20 border border-slate-800 rounded px-4 py-2 text-slate-200 placeholder:text-slate-600 focus:outline-none focus:border-slate-500 transition-colors"
                                    onKeyDown={(e) => e.key === 'Enter' && handleTakeVow()}
                                />
                                <button
                                    onClick={handleTakeVow}
                                    className="px-4 py-2 bg-slate-900 hover:bg-slate-800 text-slate-200 border border-slate-700 rounded transition-colors text-sm font-medium flex items-center gap-2"
                                >
                                    <Snowflake className="w-4 h-4" /> Take Vow
                                </button>
                            </div>

                            {/* Vows List */}
                            <div className="space-y-3 max-h-[400px] overflow-y-auto pr-2 custom-scrollbar">
                                {activeVows.length === 0 ? (
                                    <div className="text-center py-10 text-slate-600">
                                        <Ghost className="w-8 h-8 mx-auto mb-2 opacity-50" />
                                        <p>The Watch is empty.</p>
                                    </div>
                                ) : (
                                    activeVows.map((vow) => {
                                        const completed = isCompletedToday(vow.lastCompletedDate);

                                        return (
                                            <div
                                                key={vow.id}
                                                className={`group relative p-4 rounded border transition-all duration-300 ${completed ? 'bg-slate-900/30 border-slate-800/50' : 'bg-black/40 border-slate-800 hover:border-slate-600'}`}
                                            >
                                                <div className="flex justify-between items-start">
                                                    <div>
                                                        <p className="text-slate-200 font-medium text-lg leading-relaxed">"{vow.text}"</p>
                                                        <div className="flex items-center gap-3 mt-2 text-xs text-slate-500">
                                                            <span className="flex items-center gap-1"><Flame className="w-3 h-3 text-blue-400" /> Streak: {vow.currentStreak} days</span>
                                                            <span>•</span>
                                                            <span>Started: {new Date(vow.startDate).toLocaleDateString()}</span>
                                                        </div>
                                                    </div>

                                                    <button
                                                        onClick={() => !completed && completeVowDaily(vow.id)}
                                                        disabled={completed}
                                                        className={`px-3 py-1.5 rounded text-xs font-bold uppercase tracking-wider transition-all duration-300 ${completed
                                                                ? 'bg-slate-800 text-slate-500 cursor-not-allowed border border-transparent'
                                                                : 'bg-slate-100 text-black hover:bg-white hover:scale-105 shadow-[0_0_15px_rgba(255,255,255,0.1)]'
                                                            }`}
                                                    >
                                                        {completed ? "Vigil Kept" : "Hold the Wall"}
                                                    </button>
                                                </div>
                                            </div>
                                        );
                                    })
                                )}
                            </div>
                        </div>
                    )}

                    {activeTab === 'broken' && (
                        <div className="space-y-3 max-h-[400px] overflow-y-auto pr-2 custom-scrollbar">
                            {brokenVows.length === 0 ? (
                                <div className="text-center py-10 text-slate-600">
                                    <p>No vows have been broken... yet.</p>
                                </div>
                            ) : (
                                brokenVows.map((vow) => (
                                    <div key={vow.id} className="p-4 rounded border border-red-900/20 bg-red-950/5 relative overflow-hidden">
                                        <div className="absolute top-0 right-0 p-2 opacity-10">
                                            <Skull className="w-12 h-12 text-red-500" />
                                        </div>
                                        <p className="text-red-400/80 font-medium line-through decoration-red-900">"{vow.text}"</p>
                                        <div className="flex items-center gap-3 mt-2 text-xs text-red-900/60">
                                            <span>Broken after {vow.maxStreak} days</span>
                                            <span>•</span>
                                            <span>{vow.brokenOn ? new Date(vow.brokenOn).toLocaleDateString() : 'Unknown'}</span>
                                        </div>
                                        <div className="mt-2 text-xs text-red-500 font-mono uppercase tracking-widest opacity-60">
                                            OATHBREAKER
                                        </div>
                                    </div>
                                ))
                            )}
                        </div>
                    )}
                </div>
            </motion.div>
        </div>
    );
}
