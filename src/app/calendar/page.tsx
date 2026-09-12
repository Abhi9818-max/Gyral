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
    const [currentDate, setCurrentDate] = useState(new Date(2026, 1, 20)); // Default Feb 2026
    const [selectedDateStr, setSelectedDateStr] = useState<string | null>("2026-02-20");
    const [viewMode, setViewMode] = useState<'MONTH' | 'YEAR'>('MONTH');
    const [modalDate, setModalDate] = useState<string | null>(null);

    const today = new Date();
    const todayStr = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`;

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
                            <p className="text-xs text-zinc-400 font-medium">
                                Track phased routine consistency & logged activities
                            </p>
                        </div>
                    </div>

                    {/* View Switcher */}
                    <div className="flex items-center gap-1.5 bg-white/10 border border-white/20 p-1 rounded-full backdrop-blur-2xl shadow-lg self-start sm:self-auto">
                        <button
                            onClick={() => setViewMode('MONTH')}
                            className={`flex items-center gap-2 px-4 py-1.5 rounded-full text-xs font-semibold transition-all ${viewMode === 'MONTH' ? 'bg-white text-black font-bold shadow-md' : 'text-zinc-400 hover:text-white'}`}
                        >
                            <CalendarIcon className="w-3.5 h-3.5" />
                            <span>Month View</span>
                        </button>
                        <button
                            onClick={() => setViewMode('YEAR')}
                            className={`flex items-center gap-2 px-4 py-1.5 rounded-full text-xs font-semibold transition-all ${viewMode === 'YEAR' ? 'bg-white text-black font-bold shadow-md' : 'text-zinc-400 hover:text-white'}`}
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
                            className="w-full max-w-[420px] rounded-[36px] bg-[#161618] border border-white/15 p-7 shadow-[0_30px_90px_rgba(0,0,0,0.85)] relative overflow-hidden backdrop-blur-3xl"
                        >
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

                {/* YEAR GRID VIEW: Strictly 2 Months per Horizontal Row */}
                {viewMode === 'YEAR' && (
                    <div className="grid grid-cols-2 gap-3 sm:gap-6 w-full">
                        {Array.from({ length: 12 }, (_, mIdx) => {
                            const monthDate = new Date(2026, mIdx, 1);
                            const mDays = getDaysInMonth(monthDate);
                            const mFirstDay = new Date(2026, mIdx, 1);
                            const mStartDay = (getDay(mFirstDay) + 6) % 7;

                            // Previous Month Days
                            const prevMDate = subMonths(monthDate, 1);
                            const daysInPrevM = getDaysInMonth(prevMDate);
                            const prevMList = Array.from({ length: mStartDay }, (_, i) => daysInPrevM - mStartDay + 1 + i);

                            // Current Month Days
                            const currentMList = Array.from({ length: mDays }, (_, i) => i + 1);

                            // Next Month Days
                            const totalMCells = (mStartDay + mDays) > 35 ? 42 : 35;
                            const nextMCount = totalMCells - (mStartDay + mDays);
                            const nextMList = Array.from({ length: nextMCount }, (_, i) => i + 1);

                            return (
                                <motion.div
                                    key={mIdx}
                                    initial={{ opacity: 0, y: 15 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    transition={{ delay: mIdx * 0.03 }}
                                    className="bg-[#161618] border border-white/10 rounded-[24px] sm:rounded-[32px] p-3 sm:p-5 backdrop-blur-xl shadow-lg relative overflow-hidden space-y-2"
                                >
                                    <div className="pb-1.5 border-b border-white/10">
                                        <h3 className="text-xs sm:text-base font-bold text-white tracking-wide">
                                            {format(monthDate, 'MMMM yyyy')}
                                        </h3>
                                    </div>
                                    <div className="grid grid-cols-7 gap-0.5 sm:gap-1 text-center">
                                        {['MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT', 'SUN'].map((d, idx) => (
                                            <span key={idx} className="text-[9px] sm:text-[10px] font-semibold text-zinc-500 uppercase tracking-wider py-0.5">
                                                {d}
                                            </span>
                                        ))}

                                        {/* Previous Month Overflow Days */}
                                        {prevMList.map((dNum, i) => (
                                            <div key={`p-${i}`} className="h-7 sm:h-9 flex items-center justify-center text-zinc-600 font-medium text-[11px] sm:text-xs select-none">
                                                {dNum}
                                            </div>
                                        ))}

                                        {/* Current Month Days */}
                                        {currentMList.map((dNum) => {
                                            const dStr = `2026-${String(mIdx + 1).padStart(2, '0')}-${String(dNum).padStart(2, '0')}`;
                                            const actStyle = getDayColor(dStr);
                                            const isTod = dStr === todayStr;
                                            const isSel = selectedDateStr === dStr;

                                            return (
                                                <div
                                                    key={dNum}
                                                    onClick={() => {
                                                        setSelectedDateStr(dStr);
                                                        setModalDate(dStr);
                                                    }}
                                                    className="h-7 sm:h-9 flex items-center justify-center relative cursor-pointer group"
                                                >
                                                    <div
                                                        className={`w-6 h-6 sm:w-8 sm:h-8 rounded-full flex items-center justify-center text-[11px] sm:text-xs font-medium transition-all ${
                                                            isSel || isTod
                                                                ? 'bg-white/20 text-white font-bold border border-white/40 shadow-sm'
                                                                : 'text-zinc-200 hover:text-white hover:bg-white/10'
                                                        }`}
                                                    >
                                                        <span>{dNum}</span>
                                                        {actStyle && !(isSel || isTod) && (
                                                            <span
                                                                className="w-1 h-1 sm:w-1.5 sm:h-1.5 rounded-full absolute bottom-0.5"
                                                                style={{
                                                                    backgroundColor: actStyle.color,
                                                                    boxShadow: actStyle.boxShadow
                                                                }}
                                                            />
                                                        )}
                                                    </div>
                                                </div>
                                            );
                                        })}

                                        {/* Next Month Overflow Days */}
                                        {nextMList.map((dNum, i) => (
                                            <div key={`n-${i}`} className="h-7 sm:h-9 flex items-center justify-center text-zinc-600 font-medium text-[11px] sm:text-xs select-none">
                                                {dNum}
                                            </div>
                                        ))}
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
