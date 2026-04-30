"use client";

import { useUserData, LifeEvent } from '@/context/user-data-context';
// eslint-disable-next-line @typescript-eslint/no-unused-vars
import { Skull, ArrowLeft, Calendar, Settings, Plus, Star, Flag } from 'lucide-react';
import Link from 'next/link';
import { useState, useEffect } from 'react';
import { SettingsModal } from '@/components/modals/settings-modal';
import { AddLifeEventModal } from '@/components/modals/add-life-event-modal';

export default function MementoPage() {
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { birthDate, lifeEvents, deleteLifeEvent, mementoViewMode, user } = useUserData();
    const [isSettingsOpen, setIsSettingsOpen] = useState(false);
    const [isMobile, setIsMobile] = useState(false);

    // Interaction State
    const [selectedId, setSelectedId] = useState<number | null>(null); // Week or Day index
    const [hoveredEvent, setHoveredEvent] = useState<LifeEvent | null>(null);

    // Detect mobile screen size
    useEffect(() => {
        const checkMobile = () => {
            setIsMobile(window.innerWidth < 768);
        };

        checkMobile();
        window.addEventListener('resize', checkMobile);
        return () => window.removeEventListener('resize', checkMobile);
    }, []);

    const calculateStats = () => {
        if (!birthDate) return null;
        const birth = new Date(birthDate);
        const today = new Date();

        if (mementoViewMode === 'year') {
            const startOfYear = new Date(today.getFullYear(), 0, 1);
            const isLeap = (year: number) => (year % 4 === 0 && year % 100 !== 0) || (year % 400 === 0);
            const totalDays = isLeap(today.getFullYear()) ? 366 : 365;

            // Days passed since start of year
            const diffTime = today.getTime() - startOfYear.getTime();
            const daysPassed = Math.floor(diffTime / (1000 * 60 * 60 * 24));

            return {
                passed: daysPassed,
                total: totalDays,
                percentage: (daysPassed / totalDays) * 100,
                labelPassed: 'Days Passed',
                labelRemaining: 'Days Remaining',
                labelTotal: 'Year Progress'
            };
        } else {
            // Life View (Weeks)
            const diffTime = Math.abs(today.getTime() - birth.getTime());
            const weeksLived = Math.floor(diffTime / (1000 * 60 * 60 * 24 * 7));
            const totalWeeks = 60 * 52; // 60 years lifespan
            return {
                passed: weeksLived,
                total: totalWeeks,
                percentage: (weeksLived / totalWeeks) * 100,
                labelPassed: 'Weeks Lived',
                labelRemaining: 'Weeks Remaining',
                labelTotal: 'Life Complete'
            };
        }
    };

    const stats = calculateStats();

    const getEventForIndex = (index: number) => {
        if (!birthDate || !lifeEvents.length) return null;

        if (mementoViewMode === 'year') {
            // Check if any event falls on this day of the current year
            // index 0 = Jan 1st
            const today = new Date();
            const year = today.getFullYear();
            const targetDate = new Date(year, 0, 1);
            targetDate.setDate(targetDate.getDate() + index);
            const targetDateStr = targetDate.toISOString().split('T')[0];

            return lifeEvents.find(e => e.event_date === targetDateStr);
        } else {
            // Life mode (Weeks)
            const birth = new Date(birthDate);
            const weekStart = new Date(birth);
            weekStart.setDate(birth.getDate() + (index * 7));
            const weekEnd = new Date(weekStart);
            weekEnd.setDate(weekStart.getDate() + 6);

            return lifeEvents.find(e => {
                const eDate = new Date(e.event_date);
                return eDate >= weekStart && eDate <= weekEnd;
            });
        }
    };

    const getJoinedIndex = () => {
        if (!birthDate || !user?.created_at) return -1;
        const joined = new Date(user.created_at);
        const today = new Date();
        
        if (mementoViewMode === 'year') {
            if (joined.getFullYear() !== today.getFullYear()) return -1;
            const startOfYear = new Date(today.getFullYear(), 0, 1);
            const diff = joined.getTime() - startOfYear.getTime();
            return Math.floor(diff / (1000 * 60 * 60 * 24));
        } else {
            const birth = new Date(birthDate);
            const diffTime = Math.abs(joined.getTime() - birth.getTime());
            return Math.floor(diffTime / (1000 * 60 * 60 * 24 * 7));
        }
    };
    
    const joinedIndex = getJoinedIndex();

    return (
        <main className="min-h-screen bg-black text-white p-4 md:p-6 lg:p-12 font-sans selection:bg-white/20 pb-20 md:pb-12">
            {/* Header / Nav */}
            <div className="max-w-7xl mx-auto flex items-center justify-between mb-8 md:mb-12 animate-[fadeIn_0.5s_ease-out]">
                <Link href="/" className="flex items-center gap-2 text-zinc-500 hover:text-white transition-colors group">
                    <ArrowLeft className="w-5 h-5 group-hover:-translate-x-1 transition-transform" />
                    <span className="font-bold tracking-wide">RETURN</span>
                </Link>

                <div className="flex items-center gap-4">
                    <div className="px-3 py-1 bg-zinc-800 rounded-full text-xs font-mono text-zinc-400 border border-white/10">
                        {mementoViewMode === 'year' ? 'YEAR VIEW' : 'LIFE VIEW'}
                    </div>
                    <button
                        onClick={() => setIsSettingsOpen(true)}
                        className="flex items-center gap-2 px-4 py-2 rounded-full border border-white/10 hover:bg-white/5 transition-colors text-sm text-zinc-400 hover:text-white"
                    >
                        <Settings className="w-4 h-4" />
                        <span>Configure</span>
                    </button>
                </div>
            </div>

            <div className="max-w-5xl mx-auto animate-[slideUp_0.6s_ease-out]">
                {/* Title Section */}
                <div className="text-center mb-8 md:mb-16 space-y-4">
                    <div className="inline-flex items-center justify-center p-3 md:p-4 rounded-full bg-white/5 mb-4 border border-white/10">
                        <Skull className="w-6 h-6 md:w-8 md:h-8 text-white/80" />
                    </div>
                    <h1 className="text-3xl md:text-4xl lg:text-6xl font-black tracking-tighter text-transparent bg-clip-text bg-gradient-to-b from-white to-zinc-600">
                        MEMENTO MORI
                    </h1>
                    <p className="text-zinc-500 text-sm md:text-base lg:text-lg max-w-xl mx-auto px-4">
                        {mementoViewMode === 'year'
                            ? "A single orbit around the sun. Make today count."
                            : "Your life is a finite grit. Click a square to etch a memory or set a goal."}
                    </p>
                </div>

                {!birthDate ? (
                    <div className="flex flex-col items-center justify-center py-20 border border-dashed border-white/10 rounded-2xl bg-white/5">
                        <Calendar className="w-12 h-12 text-zinc-600 mb-4" />
                        <h3 className="text-xl font-bold text-white mb-2">No Birth Date Set</h3>
                        <p className="text-zinc-500 mb-6">Enter your birth date to generate your life grid.</p>
                        <button
                            onClick={() => setIsSettingsOpen(true)}
                            className="px-6 py-3 bg-white text-black font-bold rounded-full hover:scale-105 transition-transform"
                        >
                            Set Birth Date
                        </button>
                    </div>
                ) : (
                    <div className="space-y-12">
                        {/* Stats Bar */}
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                            <div className="p-6 rounded-2xl bg-zinc-900/40 backdrop-blur-md border border-white/10 text-center group hover:border-white/30 hover:bg-zinc-800/60 transition-all duration-300 shadow-lg">
                                <div className="text-4xl font-black text-white mb-2 group-hover:scale-110 group-hover:text-zinc-200 transition-all duration-300">
                                    {stats?.passed.toLocaleString()}
                                </div>
                                <div className="text-xs font-bold text-zinc-500 uppercase tracking-widest">{stats?.labelPassed}</div>
                            </div>
                            <div className="p-6 rounded-2xl bg-zinc-900/40 backdrop-blur-md border border-white/10 text-center group hover:border-white/30 hover:bg-zinc-800/60 transition-all duration-300 shadow-lg">
                                <div className="text-4xl font-black text-white mb-2 group-hover:scale-110 group-hover:text-zinc-200 transition-all duration-300">
                                    {stats && (stats.total - stats.passed).toLocaleString()}
                                </div>
                                <div className="text-xs font-bold text-zinc-500 uppercase tracking-widest">{stats?.labelRemaining}</div>
                            </div>
                            <div className="p-6 rounded-2xl bg-zinc-900/40 backdrop-blur-md border border-white/10 text-center group hover:border-white/30 hover:bg-zinc-800/60 transition-all duration-300 shadow-lg">
                                <div className="text-4xl font-black text-white mb-2 group-hover:scale-110 group-hover:text-zinc-200 transition-all duration-300">
                                    {stats?.percentage.toFixed(1)}%
                                </div>
                                <div className="text-xs font-bold text-zinc-500 uppercase tracking-widest">{stats?.labelTotal}</div>
                            </div>
                        </div>

                        {/* The Grid */}
                        <div className="p-6 md:p-10 bg-zinc-950/80 backdrop-blur-xl border border-white/10 rounded-2xl md:rounded-[2rem] shadow-[0_0_40px_rgba(0,0,0,0.5)] relative overflow-hidden">

                            <div className="flex flex-col md:flex-row justify-between items-center mb-8 gap-4">
                                <div className="text-xs font-mono text-zinc-500 bg-black/50 px-3 py-1 rounded-full border border-white/5">{mementoViewMode === 'year' ? 'JAN 1' : 'YEAR 0'}</div>

                                {/* Active Event Display on Hover/Selection */}
                                <div className="h-8 flex items-center justify-center min-w-[200px]">
                                    {hoveredEvent ? (
                                        <div className="flex items-center gap-2 animate-in fade-in slide-in-from-bottom-2 bg-white/10 px-4 py-1.5 rounded-full border border-white/20 backdrop-blur-md">
                                            {hoveredEvent.type === 'MEMORY' ? (
                                                <Star className="w-3.5 h-3.5 text-yellow-500 fill-current" />
                                            ) : (
                                                <Flag className="w-3.5 h-3.5 text-blue-500 fill-current" />
                                            )}
                                            <span className="text-sm font-bold text-white tracking-wide">{hoveredEvent.title}</span>
                                            <span className="text-xs text-zinc-400 font-mono">({hoveredEvent.event_date})</span>
                                        </div>
                                    ) : (
                                        <span className="text-xs text-zinc-600 font-mono tracking-widest uppercase">Hover {mementoViewMode === 'year' ? 'days' : 'squares'} to inspect</span>
                                    )}
                                </div>

                                <div className="text-xs font-mono text-zinc-500 bg-black/50 px-3 py-1 rounded-full border border-white/5">{mementoViewMode === 'year' ? 'DEC 31' : 'YEAR 60'}</div>
                            </div>

                            {/* Grid container - scrollable on mobile */}
                            <div className="overflow-x-auto -mx-4 px-4 md:mx-0 md:px-0 scrollbar-thin scrollbar-thumb-zinc-700 scrollbar-track-transparent">
                                {/* Mobile: 26 columns (half), Desktop: 52 columns (full) */}
                                <div
                                    className="grid gap-[4px] w-full"
                                    style={{
                                        gridTemplateColumns: `repeat(${isMobile ? 26 : 52}, minmax(0, 1fr))`
                                    }}
                                >
                                    {Array.from({ length: stats!.total }).map((_, i) => {
                                        const isLived = i < stats!.passed;
                                        const isCurrent = i === stats!.passed;
                                        const isJoinedDate = i === joinedIndex;

                                        // Check for event
                                        const event = getEventForIndex(i);

                                        let cellClass = "bg-zinc-800 border-transparent opacity-40 hover:opacity-80 hover:scale-110";

                                        if (isLived) cellClass = "bg-zinc-600 active:bg-zinc-500 hover:bg-zinc-400";
                                        if (isCurrent) cellClass = "bg-white animate-pulse shadow-[0_0_12px_2px_rgba(255,255,255,0.8)] z-10 scale-110";

                                        if (event) {
                                            if (event.type === 'MEMORY') {
                                                cellClass = "bg-yellow-500 shadow-[0_0_10px_rgba(234,179,8,0.6)] z-10 scale-110";
                                            } else {
                                                cellClass = "bg-blue-500 shadow-[0_0_10px_rgba(59,130,246,0.6)] z-10 scale-110 animate-pulse";
                                            }
                                        }

                                        // Override with joined date styling if it's the day user joined
                                        if (isJoinedDate) {
                                            cellClass = "bg-red-500 shadow-[0_0_15px_5px_rgba(255,255,255,0.8)] z-20 scale-125 ring-2 ring-white/50";
                                        }

                                        let tooltipText = mementoViewMode === 'year' ? `Day ${i + 1}` : `Week ${i + 1}`;
                                        if (isJoinedDate) tooltipText += " - The day you joined";

                                        return (
                                            <button
                                                key={i}
                                                onClick={() => setSelectedId(i)}
                                                onMouseEnter={() => event && setHoveredEvent(event)}
                                                onMouseLeave={() => setHoveredEvent(null)}
                                                className={`
                                                    aspect-square rounded-full transition-all duration-300 relative
                                                    ${cellClass}
                                                    active:scale-95 cursor-crosshair
                                                `}
                                                style={{ minWidth: isMobile ? '8px' : '10px', minHeight: isMobile ? '8px' : '10px' }}
                                                title={tooltipText}
                                            />
                                        );
                                    })}
                                </div>
                            </div>
                        </div>

                        {/* Legend */}
                        <div className="flex flex-wrap items-center justify-center gap-6 mt-8 p-4 bg-zinc-900/30 rounded-2xl border border-white/5">
                            <div className="flex items-center gap-2">
                                <div className="w-3 h-3 rounded-full bg-red-500 shadow-[0_0_8px_rgba(255,255,255,0.6)] ring-1 ring-white/50"></div>
                                <span className="text-xs text-zinc-400 font-mono">Day Joined</span>
                            </div>
                            <div className="flex items-center gap-2">
                                <div className="w-3 h-3 rounded-full bg-white animate-pulse shadow-[0_0_8px_rgba(255,255,255,0.8)]"></div>
                                <span className="text-xs text-zinc-400 font-mono">Current {mementoViewMode === 'year' ? 'Day' : 'Week'}</span>
                            </div>
                            <div className="flex items-center gap-2">
                                <div className="w-3 h-3 rounded-full bg-yellow-500 shadow-[0_0_8px_rgba(234,179,8,0.5)]"></div>
                                <span className="text-xs text-zinc-400 font-mono">Memory</span>
                            </div>
                            <div className="flex items-center gap-2">
                                <div className="w-3 h-3 rounded-full bg-blue-500 shadow-[0_0_8px_rgba(59,130,246,0.5)]"></div>
                                <span className="text-xs text-zinc-400 font-mono">Goal</span>
                            </div>
                        </div>
                    </div>
                )}
            </div>

            <SettingsModal isOpen={isSettingsOpen} onClose={() => setIsSettingsOpen(false)} />

            {/* Add/View Event Modal */}
            <AddLifeEventModal
                isOpen={selectedId !== null}
                onClose={() => setSelectedId(null)}
                weekIndex={selectedId || 0}
                birthDate={birthDate || new Date().toISOString()}
            />
        </main>
    );
}
