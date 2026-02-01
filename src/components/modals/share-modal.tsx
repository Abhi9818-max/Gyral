"use client";

import { useRef, useState, useEffect } from 'react';
import { X, Download, Share2, Shield } from 'lucide-react';
import { useUserData } from '@/context/user-data-context';
import { Sigil } from '../sigil';
import { toPng } from 'html-to-image';
import { PactsCard } from '../share/pacts-card';
import { CalendarCard } from '../share/calendar-card';

interface ShareModalProps {
    isOpen: boolean;
    onClose: () => void;
}

export function ShareModal({ isOpen, onClose }: ShareModalProps) {
    const { consistencyScore, currentStreak, streakTier, activeFilterTaskId, tasks, pacts, records } = useUserData();
    const cardRef = useRef<HTMLDivElement>(null);
    const [isGenerating, setIsGenerating] = useState(false);
    const [activeTab, setActiveTab] = useState<'identity' | 'pacts' | 'calendar'>('identity');

    // Local selection state, initialized with global filter but changeable
    const [selectedTaskId, setSelectedTaskId] = useState<string | null>(activeFilterTaskId);

    // Update local state when modal opens or global filter changes
    useEffect(() => {
        if (isOpen) {
            setSelectedTaskId(activeFilterTaskId);
        }
    }, [isOpen, activeFilterTaskId]);

    const activeTask = selectedTaskId ? tasks.find(t => t.id === selectedTaskId) : null;
    const protocolName = activeTask ? activeTask.name.toUpperCase() : "S.I.G.I.L.";
    const todayStr = new Date().toISOString().split('T')[0];

    if (!isOpen) return null;

    const handleDownload = async () => {
        if (!cardRef.current) return;
        setIsGenerating(true);
        try {
            const dataUrl = await toPng(cardRef.current, { cacheBust: true, pixelRatio: 2 });
            const link = document.createElement('a');
            link.download = `diogenes-${activeTab}-${activeTask ? activeTask.name.toLowerCase().replace(/\s+/g, '-') : 'status'}-${todayStr}.png`;
            link.href = dataUrl;
            link.click();
        } catch (err) {
            console.error(err);
        } finally {
            setIsGenerating(false);
        }
    };

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
            {/* Backdrop */}
            <div
                className="absolute inset-0 bg-black/80 backdrop-blur-md animate-[fadeIn_0.3s_ease-out]"
                onClick={onClose}
            />

            <div className="relative w-full max-w-lg bg-transparent animate-[scaleIn_0.3s_ease-out] flex flex-col items-center gap-6">

                {/* Tab Navigation & Selector */}
                <div className="flex flex-col items-center gap-4 w-full">
                    <div className="flex bg-white/5 border border-white/10 rounded-full p-1 gap-1">
                        <button
                            onClick={() => setActiveTab('identity')}
                            className={`px-4 py-1.5 rounded-full text-xs font-bold transition-all ${activeTab === 'identity' ? 'bg-white text-black shadow-lg' : 'text-zinc-400 hover:text-white'}`}
                        >
                            IDENTITY
                        </button>
                        <button
                            onClick={() => setActiveTab('pacts')}
                            className={`px-4 py-1.5 rounded-full text-xs font-bold transition-all ${activeTab === 'pacts' ? 'bg-white text-black shadow-lg' : 'text-zinc-400 hover:text-white'}`}
                        >
                            PACTS
                        </button>
                        <button
                            onClick={() => setActiveTab('calendar')}
                            className={`px-4 py-1.5 rounded-full text-xs font-bold transition-all ${activeTab === 'calendar' ? 'bg-white text-black shadow-lg' : 'text-zinc-400 hover:text-white'}`}
                        >
                            CALENDAR
                        </button>
                    </div>

                    {/* Task Selector (Only for Calendar) */}
                    {activeTab === 'calendar' && (
                        <select
                            value={selectedTaskId || ""}
                            onChange={(e) => setSelectedTaskId(e.target.value || null)}
                            className="bg-black/50 border border-white/10 text-white text-sm rounded-lg px-3 py-1.5 focus:outline-none focus:border-white/30 backdrop-blur-sm cursor-pointer hover:bg-white/5 transition-colors"
                        >
                            <option value="">Overview (All Tasks)</option>
                            {tasks.map(task => (
                                <option key={task.id} value={task.id}>{task.name}</option>
                            ))}
                        </select>
                    )}
                </div>

                {/* The Card to Capture */}
                <div
                    ref={cardRef}
                    className="w-full aspect-[4/5] bg-black border border-white/20 rounded-3xl overflow-hidden shadow-2xl relative"
                >
                    {activeTab === 'identity' && (
                        <div className="w-full h-full p-8 flex flex-col items-center justify-between" style={{ background: 'linear-gradient(145deg, #000000 0%, #1a1a1a 100%)' }}>
                            {/* Background Elements */}
                            <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_0%,_rgba(255,255,255,0.05),_transparent_70%)] pointer-events-none" />
                            <div className="absolute bottom-0 left-0 right-0 h-32 bg-gradient-to-t from-black to-transparent pointer-events-none" />

                            <div className="w-full flex justify-between items-center z-10 opacity-50">
                                <span className="text-xs font-mono tracking-widest text-white">{protocolName} PROTOCOL</span>
                                <span className="text-xs font-mono tracking-widest text-white">V1.0</span>
                            </div>

                            <div className="z-10 flex flex-col items-center gap-6">
                                <div
                                    className="scale-150 p-4 rounded-full bg-white/5 border border-white/10 shadow-[0_0_50px_rgba(255,255,255,0.1)] transition-colors duration-500"
                                    style={activeTask ? { borderColor: activeTask.color, boxShadow: `0 0 50px ${activeTask.color}33` } : {}}
                                >
                                    <Sigil score={consistencyScore} size={120} />
                                </div>

                                <div className="text-center space-y-1">
                                    <h2
                                        className="text-3xl font-black text-white tracking-tighter uppercase"
                                        style={activeTask ? { color: activeTask.color, textShadow: `0 0 20px ${activeTask.color}66` } : {}}
                                    >
                                        {streakTier === 'spark' ? 'INITIATE' : streakTier}
                                    </h2>
                                    <p className="text-sm text-zinc-400 tracking-widest uppercase">
                                        {activeTask ? `${activeTask.name} Rank` : 'Current Rank'}
                                    </p>
                                </div>
                            </div>

                            <div className="w-full grid grid-cols-2 gap-4 z-10">
                                <div className="bg-white/5 border border-white/10 p-4 rounded-2xl text-center">
                                    <div className="text-2xl font-bold text-white">{currentStreak}</div>
                                    <div className="text-[10px] text-zinc-500 uppercase tracking-wider">Day Streak</div>
                                </div>
                                <div className="bg-white/5 border border-white/10 p-4 rounded-2xl text-center">
                                    <div className="text-2xl font-bold text-white">{consistencyScore}%</div>
                                    <div className="text-[10px] text-zinc-500 uppercase tracking-wider">Consistency</div>
                                </div>
                            </div>

                            <div className="z-10 mt-4 opacity-30 text-[10px] text-white font-mono">
                                DIOGENES.APP // {todayStr}
                            </div>
                        </div>
                    )}

                    {activeTab === 'pacts' && <PactsCard pacts={pacts} date={todayStr} />}
                    {activeTab === 'calendar' && <CalendarCard records={records} activeTask={activeTask || null} />}
                </div>

                {/* Actions */}
                <div className="flex items-center gap-4">
                    <button
                        onClick={handleDownload}
                        disabled={isGenerating}
                        className="flex items-center gap-2 px-6 py-3 bg-white text-black font-bold rounded-full hover:scale-105 transition-transform shadow-[0_0_20px_rgba(255,255,255,0.3)] disabled:opacity-50"
                    >
                        {isGenerating ? <Share2 className="w-5 h-5 animate-spin" /> : <Download className="w-5 h-5" />}
                        {isGenerating ? 'Forging...' : 'Save to Gallery'}
                    </button>
                    <button
                        onClick={onClose}
                        className="w-12 h-12 flex items-center justify-center rounded-full bg-white/10 text-white hover:bg-white/20 transition-colors"
                    >
                        <X className="w-6 h-6" />
                    </button>
                </div>
            </div>
        </div>
    );
}
