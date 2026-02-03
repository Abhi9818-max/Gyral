"use client";

import { useUserData, LifeEvent } from '@/context/user-data-context';
import { Skull, ArrowLeft, Calendar, Settings, Plus, Star, Flag } from 'lucide-react';
import Link from 'next/link';
import { useState, useEffect } from 'react';
import { SettingsModal } from '@/components/modals/settings-modal';
import { AddLifeEventModal } from '@/components/modals/add-life-event-modal';

export default function MementoPage() {
    const { birthDate, lifeEvents, deleteLifeEvent, mementoViewMode } = useUserData();
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
            const totalWeeks = 90 * 52; // Assuming 90 years
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
                            <div className="p-6 rounded-2xl bg-zinc-900/50 border border-white/5 text-center group hover:border-white/20 transition-colors">
                                <div className="text-3xl font-black text-white mb-1 group-hover:scale-110 transition-transform duration-300">
                                    {stats?.passed.toLocaleString()}
                                </div>
                                <div className="text-xs font-bold text-zinc-500 uppercase tracking-widest">{stats?.labelPassed}</div>
                            </div>
                            <div className="p-6 rounded-2xl bg-zinc-900/50 border border-white/5 text-center group hover:border-white/20 transition-colors">
                                <div className="text-3xl font-black text-white mb-1 group-hover:scale-110 transition-transform duration-300">
                                    {stats && (stats.total - stats.passed).toLocaleString()}
                                </div>
                                <div className="text-xs font-bold text-zinc-500 uppercase tracking-widest">{stats?.labelRemaining}</div>
                            </div>
                            <div className="p-6 rounded-2xl bg-zinc-900/50 border border-white/5 text-center group hover:border-white/20 transition-colors">
                                <div className="text-3xl font-black text-white mb-1 group-hover:scale-110 transition-transform duration-300">
                                    {stats?.percentage.toFixed(1)}%
                                </div>
                                <div className="text-xs font-bold text-zinc-500 uppercase tracking-widest">{stats?.labelTotal}</div>
                            </div>
                        </div>

                        {/* The Grid */}
                        <div className="p-4 md:p-8 bg-zinc-950 border border-white/10 rounded-2xl md:rounded-3xl shadow-2xl relative overflow-hidden">

                            <div className="flex justify-between items-center mb-4 md:mb-6">
                                <div className="text-[10px] font-mono text-zinc-700">{mementoViewMode === 'year' ? 'JAN 1' : 'YEAR 0'}</div>

                                {/* Active Event Display on Hover/Selection */}
                                <div className="h-6 flex items-center justify-center">
                                    {hoveredEvent ? (
                                        <div className="flex items-center gap-2 animate-in fade-in slide-in-from-bottom-2">
                                            {hoveredEvent.type === 'MEMORY' ? (
                                                <Star className="w-3 h-3 text-yellow-500 fill-current" />
                                            ) : (
                                                <Flag className="w-3 h-3 text-blue-500 fill-current" />
                                            )}
                                            <span className="text-xs md:text-sm font-bold text-white">{hoveredEvent.title}</span>
                                            <span className="text-[10px] md:text-xs text-zinc-500">({hoveredEvent.event_date})</span>
                                        </div>
                                    ) : (
                                        <span className="text-[10px] md:text-xs text-zinc-800">Hover {mementoViewMode === 'year' ? 'days' : 'squares'} to inspect</span>
                                    )}
                                </div>

                                <div className="text-[10px] font-mono text-zinc-700">{mementoViewMode === 'year' ? 'DEC 31' : 'YEAR 90'}</div>
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

                                        // Check for event
                                        const event = getEventForIndex(i);

                                        let cellClass = "bg-zinc-900 border-transparent opacity-50";

                                        if (isLived) cellClass = "bg-zinc-700/50 active:bg-zinc-500";
                                        if (isCurrent) cellClass = "bg-white animate-pulse shadow-[0_0_10px_white]";

                                        if (event) {
                                            if (event.type === 'MEMORY') {
                                                cellClass = "bg-yellow-500 shadow-[0_0_10px_rgba(234,179,8,0.5)] z-10 scale-110 rounded-sm";
                                            } else {
                                                cellClass = "bg-blue-500 shadow-[0_0_10px_rgba(59,130,246,0.5)] z-10 scale-110 animate-pulse rounded-sm";
                                            }
                                        }

                                        return (
                                            <button
                                                key={i}
                                                onClick={() => setSelectedId(i)}
                                                onMouseEnter={() => event && setHoveredEvent(event)}
                                                onMouseLeave={() => setHoveredEvent(null)}
                                                className={`
                                                    aspect-square rounded-full transition-all duration-200 relative
                                                    ${cellClass}
                                                    active:scale-110
                                                `}
                                                style={{ minWidth: isMobile ? '8px' : '10px', minHeight: isMobile ? '8px' : '10px' }}
                                                title={mementoViewMode === 'year' ? `Day ${i + 1}` : `Week ${i + 1}`}
                                            />
                                        );
                                    })}
                                </div>
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
