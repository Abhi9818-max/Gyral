"use client";

import { useState } from "react";
import Link from "next/link";
import { format, getDaysInMonth, getDay, addMonths, subMonths } from "date-fns";
import { ChevronLeft, ChevronRight, Grid, Calendar as CalendarIcon, Sparkles } from "lucide-react";
import { motion } from "framer-motion";
import { Header } from "@/components/header";
import { useUserData } from "@/context/user-data-context";
import { LogActivityModal } from "@/components/modals/log-activity-modal";

export default function CalendarPage() {
    const { records, tasks, activeFilterTaskId } = useUserData();
    const today = new Date();
    const todayStr = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`;

    const [currentDate, setCurrentDate] = useState(new Date());
    const [selectedDateStr, setSelectedDateStr] = useState<string | null>(todayStr);
    const [viewMode, setViewMode] = useState<'MONTH' | 'YEAR'>('MONTH');
    const [modalDate, setModalDate] = useState<string | null>(null);

    const handlePrevMonth = () => setCurrentDate(prev => subMonths(prev, 1));
    const handleNextMonth = () => setCurrentDate(prev => addMonths(prev, 1));

    // Get day color for activity heatmaps
    const getDayColor = (dateStr: string) => {
        const dayRecords = records[dateStr];
        if (!dayRecords || dayRecords.length === 0) return null;

        let filteredRecords = dayRecords;
        if (activeFilterTaskId) {
            filteredRecords = dayRecords.filter(r => r.taskId === activeFilterTaskId);
        }
        if (filteredRecords.length === 0) return null;

        const lastRecord = filteredRecords[filteredRecords.length - 1];
        const task = tasks.find(t => t.id === lastRecord.taskId);
        if (!task) return null;

        const intensity = lastRecord.intensity || 0;
        const glowStrength = intensity === 0 ? 8 : 4 + (intensity * 4);
        return {
            color: task.color,
            boxShadow: `0 0 ${glowStrength}px ${task.color}`,
        };
    };

    // Calculate Days Matrix for Month View (Mon -> Sun)
    const year = currentDate.getFullYear();
    const month = currentDate.getMonth(); // 0-11
    const firstDay = new Date(year, month, 1);
    const daysInCurrentMonth = getDaysInMonth(currentDate);

    // Monday start offset: 0 for Mon, 1 for Tue ... 6 for Sun
    const dayOfWeek = firstDay.getDay(); // 0 is Sun, 1 is Mon...
    const startOffset = (dayOfWeek + 6) % 7;

    // Previous Month Days
    const prevMonthDate = subMonths(currentDate, 1);
    const daysInPrevMonth = getDaysInMonth(prevMonthDate);

    const prevMonthDaysList = Array.from({ length: startOffset }, (_, i) => {
        return daysInPrevMonth - startOffset + 1 + i;
    });

    // Current Month Days List
    const currentMonthDaysList = Array.from({ length: daysInCurrentMonth }, (_, i) => i + 1);

    // Next Month Days List to complete 35 or 42 grid cells
    const totalCells = (startOffset + daysInCurrentMonth) > 35 ? 42 : 35;
    const nextMonthDaysCount = totalCells - (startOffset + daysInCurrentMonth);
    const nextMonthDaysList = Array.from({ length: nextMonthDaysCount }, (_, i) => i + 1);

    return (
        <div className="min-h-screen flex flex-col bg-zinc-950 text-white selection:bg-purple-500/30 relative overflow-hidden">
            {/* Ambient Background Glow */}
            <div className="fixed inset-0 pointer-events-none overflow-hidden z-0">
                <div className="absolute top-[15%] left-[50%] -translate-x-1/2 w-[600px] h-[600px] rounded-full bg-purple-900/20 blur-[150px]" />
            </div>

            <Header />

            <main className="flex-1 p-4 md:p-8 pt-20 md:pt-24 max-w-5xl mx-auto w-full space-y-6 relative z-10 pb-20">
                {/* Header Control Bar */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <div className="flex items-center gap-3">
                        <Link
                            href="/dashboard"
                            className="p-2.5 rounded-full bg-white/5 hover:bg-white/15 border border-white/10 text-zinc-300 hover:text-white transition-all shadow-md"
                        >
                            <ChevronLeft className="w-5 h-5" />
                        </Link>
                        <div>
                            <h1 className="text-2xl md:text-3xl font-bold tracking-tight text-white flex items-center gap-2">
                                <span>Schedule Calendar</span>
                                <Sparkles className="w-5 h-5 text-purple-400" />
                            </h1>
                        </div>
                    </div>

                    {/* View Switcher */}
                    <div className="flex items-center gap-1.5 bg-white/10 border border-white/20 p-1 rounded-full backdrop-blur-2xl shadow-lg self-start sm:self-auto">
                        <button
                            onClick={() => setViewMode('MONTH')}
                            className={`flex items-center gap-2 px-4 py-1.5 rounded-full text-xs font-semibold transition-all ${viewMode === 'MONTH' ? 'bg-purple-600 text-white shadow-lg shadow-purple-500/30 font-bold' : 'text-zinc-400 hover:text-white'}`}
                        >
                            <CalendarIcon className="w-3.5 h-3.5" />
                            <span>Month View</span>
                        </button>
                        <button
                            onClick={() => setViewMode('YEAR')}
                            className={`flex items-center gap-2 px-4 py-1.5 rounded-full text-xs font-semibold transition-all ${viewMode === 'YEAR' ? 'bg-purple-600 text-white shadow-lg shadow-purple-500/30 font-bold' : 'text-zinc-400 hover:text-white'}`}
                        >
                            <Grid className="w-3.5 h-3.5" />
                            <span>Year Grid</span>
                        </button>
                    </div>
                </div>

                {/* MONTH VIEW: Matching the Reference Image Aesthetic */}
                {viewMode === 'MONTH' && (
                    <div className="flex justify-center pt-2">
                        <motion.div
                            initial={{ opacity: 0, scale: 0.95 }}
                            animate={{ opacity: 1, scale: 1 }}
                            transition={{ duration: 0.3 }}
                            className="w-full max-w-[420px] rounded-[36px] bg-[#161618] border border-white/15 p-7 shadow-[0_30px_90px_rgba(0,0,0,0.85),0_0_50px_rgba(147,51,234,0.15)] relative overflow-hidden backdrop-blur-3xl"
                        >
                            {/* Inner Specular Sheen & Purple Top Accent Bar */}
                            <div className="absolute top-0 inset-x-0 flex justify-center">
                                <div className="h-[4px] w-28 bg-gradient-to-r from-purple-500 via-indigo-400 to-purple-500 rounded-b-full shadow-[0_0_12px_rgba(168,85,247,0.9)]" />
                            </div>
                            <div className="absolute -top-16 left-1/2 -translate-x-1/2 w-48 h-48 rounded-full bg-purple-600/15 blur-3xl pointer-events-none" />

                            {/* Header Month Navigation */}
                            <div className="flex items-center justify-between mb-7 relative z-10 pt-1">
                                <button
                                    onClick={handlePrevMonth}
                                    className="w-10 h-10 rounded-full border border-white/10 bg-white/[0.06] hover:bg-white/15 text-white flex items-center justify-center transition-all hover:scale-105 active:scale-95 shadow-md"
                                >
                                    <ChevronLeft className="w-5 h-5 text-zinc-300" />
                                </button>
                                <h2 className="text-lg md:text-xl font-bold text-white tracking-wide font-sans">
                                    {format(currentDate, 'MMM yyyy')}
                                </h2>
                                <button
                                    onClick={handleNextMonth}
                                    className="w-10 h-10 rounded-full border border-white/10 bg-white/[0.06] hover:bg-white/15 text-white flex items-center justify-center transition-all hover:scale-105 active:scale-95 shadow-md"
                                >
                                    <ChevronRight className="w-5 h-5 text-zinc-300" />
                                </button>
                            </div>

                            {/* Weekday Labels (MON TUE WED THU FRI SAT SUN) */}
                            <div className="grid grid-cols-7 text-center mb-4 relative z-10">
                                {['MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT', 'SUN'].map((day) => (
                                    <span key={day} className="text-[11px] font-semibold text-zinc-500 uppercase tracking-wider">
                                        {day}
                                    </span>
                                ))}
                            </div>

                            {/* Calendar Days Grid */}
                            <div className="grid grid-cols-7 gap-y-3.5 gap-x-1.5 text-center relative z-10">
                                {/* Previous Month Overflow Days */}
                                {prevMonthDaysList.map((dayNum, i) => (
                                    <div
                                        key={`prev-${i}`}
                                        className="h-10 flex items-center justify-center text-zinc-600 font-medium text-sm select-none"
                                    >
                                        {dayNum}
                                    </div>
                                ))}

                                {/* Current Month Days */}
                                {currentMonthDaysList.map((dayNum) => {
                                    const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(dayNum).padStart(2, '0')}`;
                                    const isSelected = selectedDateStr === dateStr;
                                    const isCurrentDay = dateStr === todayStr;
                                    const activityStyle = getDayColor(dateStr);

                                    return (
                                        <div
                                            key={dayNum}
                                            onClick={() => {
                                                setSelectedDateStr(dateStr);
                                                setModalDate(dateStr);
                                            }}
                                            className="h-10 flex items-center justify-center relative cursor-pointer group"
                                        >
                                            <div
                                                className={`w-10 h-10 rounded-full flex items-center justify-center text-sm font-medium transition-all ${
                                                    isSelected
                                                        ? 'bg-purple-600 text-white font-bold shadow-[0_0_20px_rgba(168,85,247,0.85)] border border-purple-400/50 scale-105'
                                                        : isCurrentDay
                                                        ? 'bg-white/10 text-white font-bold border border-white/40 shadow-sm'
                                                        : 'text-zinc-200 hover:text-white hover:bg-white/10'
                                                }`}
                                            >
                                                <span>{dayNum}</span>

                                                {/* Activity Dot Indicator */}
                                                {activityStyle && !isSelected && (
                                                    <span
                                                        className="absolute bottom-1 w-1.5 h-1.5 rounded-full"
                                                        style={{
                                                            backgroundColor: activityStyle.color,
                                                            boxShadow: activityStyle.boxShadow
                                                        }}
                                                    />
                                                )}
                                            </div>
                                        </div>
                                    );
                                })}

                                {/* Next Month Overflow Days */}
                                {nextMonthDaysList.map((dayNum, i) => (
                                    <div
                                        key={`next-${i}`}
                                        className="h-10 flex items-center justify-center text-zinc-600 font-medium text-sm select-none"
                                    >
                                        {dayNum}
                                    </div>
                                ))}
                            </div>
                        </motion.div>
                    </div>
                )}

                {/* YEAR GRID VIEW: 12-Month Overview */}
                {viewMode === 'YEAR' && (
                    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
                        {Array.from({ length: 12 }, (_, mIdx) => {
                            const monthDate = new Date(2026, mIdx, 1);
                            const mDays = getDaysInMonth(monthDate);
                            const mStartDay = (getDay(monthDate) + 6) % 7;

                            return (
                                <motion.div
                                    key={mIdx}
                                    initial={{ opacity: 0, y: 15 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    transition={{ delay: mIdx * 0.03 }}
                                    className="bg-white/[0.06] border border-white/20 rounded-[28px] p-5 backdrop-blur-2xl shadow-xl"
                                >
                                    <h3 className="text-sm font-bold text-white mb-3">
                                        {format(monthDate, 'MMMM')}
                                    </h3>
                                    <div className="grid grid-cols-7 gap-1 text-center">
                                        {['M', 'T', 'W', 'T', 'F', 'S', 'S'].map((d, idx) => (
                                            <span key={idx} className="text-[10px] font-semibold text-zinc-500">
                                                {d}
                                            </span>
                                        ))}
                                        {Array.from({ length: mStartDay }).map((_, i) => (
                                            <div key={`empty-${i}`} />
                                        ))}
                                        {Array.from({ length: mDays }).map((_, i) => {
                                            const dNum = i + 1;
                                            const dStr = `2026-${String(mIdx + 1).padStart(2, '0')}-${String(dNum).padStart(2, '0')}`;
                                            const actStyle = getDayColor(dStr);
                                            const isTod = dStr === todayStr;

                                            return (
                                                <div
                                                    key={dNum}
                                                    onClick={() => {
                                                        setSelectedDateStr(dStr);
                                                        setModalDate(dStr);
                                                    }}
                                                    className={`aspect-square rounded-lg flex items-center justify-center text-[11px] font-medium cursor-pointer transition-all relative ${
                                                        isTod
                                                            ? 'bg-purple-600 text-white font-bold shadow-md'
                                                            : 'text-zinc-300 hover:bg-white/10 hover:text-white'
                                                    }`}
                                                >
                                                    <span>{dNum}</span>

                                                    {/* Activity Dot Indicator */}
                                                    {actStyle && !isTod && (
                                                        <span
                                                            className="absolute bottom-0.5 w-1 h-1 rounded-full"
                                                            style={{
                                                                backgroundColor: actStyle.color,
                                                                boxShadow: actStyle.boxShadow
                                                            }}
                                                        />
                                                    )}
                                                </div>
                                            );
                                        })}
                                    </div>
                                </motion.div>
                            );
                        })}
                    </div>
                )}
            </main>

            {/* Log Activity Modal on date click */}
            {modalDate && (
                <LogActivityModal
                    isOpen={!!modalDate}
                    onClose={() => setModalDate(null)}
                    dateStr={modalDate}
                />
            )}
        </div>
    );
}
