"use client";

import { useUserData } from "@/context/user-data-context";
import { format, getDaysInMonth, getDay } from "date-fns";
import { Header } from "@/components/header";
import { useState } from "react";
import { LogActivityModal } from "@/components/modals/log-activity-modal";
import { ChevronLeft } from "lucide-react";
import Link from "next/link";
import { motion } from "framer-motion";

export default function CalendarPage() {
    const { records, tasks, activeFilterTaskId } = useUserData();
    const [selectedDate, setSelectedDate] = useState<string | null>(null);

    const currentYear = 2026;
    const today = new Date();
    const todayStr = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`;

    const months = Array.from({ length: 12 }, (_, monthIndex) => {
        const date = new Date(currentYear, monthIndex, 1);
        return {
            name: format(date, 'MMMM'), // Full Name
            days: getDaysInMonth(date),
            startDay: getDay(date),
            monthIndex: monthIndex
        };
    });

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
        let glowStrength = intensity === 0 ? 5 : 2 + (intensity * 3);
        let opacity = intensity === 0 ? 0.8 : 0.5 + (intensity * 0.1);

        return {
            color: task.color,
            boxShadow: `0 0 ${glowStrength}px ${task.color}`,
            opacity
        };
    };

    return (
        <div className="min-h-screen flex flex-col bg-zinc-950">
            <Header />

            <main className="flex-1 p-4 md:p-8 pt-24 md:pt-28 max-w-7xl mx-auto w-full pb-20">
                <div className="flex items-center gap-4 mb-8">
                    <Link
                        href="/"
                        className="p-2 rounded-full bg-white/5 hover:bg-white/10 text-zinc-400 hover:text-white transition-colors"
                    >
                        <ChevronLeft className="w-5 h-5" />
                    </Link>
                    <div>
                        <h1 className="text-3xl font-bold text-white tracking-tight">Year View</h1>
                        <p className="text-zinc-500 font-medium">{currentYear}</p>
                    </div>
                </div>

                {/* Calendar Grid: 2 cols on mobile, 3 on md, 4 on lg */}
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6 md:gap-8">
                    {months.map((month, mIdx) => (
                        <motion.div
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: mIdx * 0.05 }}
                            key={month.name}
                            className="bg-black/20 border border-white/5 rounded-2xl p-4 hover:border-white/10 transition-colors"
                        >
                            <h3 className="text-sm font-bold text-zinc-300 mb-3 ml-1">{month.name}</h3>

                            <div className="grid grid-cols-7 gap-1">
                                {/* Day Headers */}
                                {['S', 'M', 'T', 'W', 'T', 'F', 'S'].map((d, i) => (
                                    <div key={i} className="text-[10px] text-zinc-600 text-center font-medium mb-1">{d}</div>
                                ))}

                                {/* Offset */}
                                {Array.from({ length: month.startDay }).map((_, i) => (
                                    <div key={`empty-${i}`} />
                                ))}

                                {/* Days */}
                                {Array.from({ length: month.days }).map((_, i) => {
                                    const day = i + 1;
                                    const dateStr = `${currentYear}-${String(month.monthIndex + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
                                    const isToday = dateStr === todayStr;
                                    const style = getDayColor(dateStr);

                                    return (
                                        <div
                                            key={i}
                                            onClick={() => setSelectedDate(dateStr)}
                                            className={`aspect-square rounded-[3px] cursor-pointer transition-all duration-300 relative group
                                                ${!style ? 'bg-white/5 hover:bg-white/10' : ''}
                                                ${isToday ? 'ring-1 ring-white z-10' : ''}
                                            `}
                                            style={style ? {
                                                backgroundColor: style.color,
                                                opacity: style.opacity,
                                                boxShadow: style.boxShadow,
                                            } : undefined}
                                        >
                                            {/* Tooltip on hover */}
                                            <div className="opacity-0 group-hover:opacity-100 absolute bottom-full left-1/2 -translate-x-1/2 mb-1 px-2 py-1 bg-black text-white text-[10px] rounded pointer-events-none whitespace-nowrap z-20 border border-white/10">
                                                {format(new Date(dateStr), 'MMM d')}
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        </motion.div>
                    ))}
                </div>
            </main>

            {selectedDate && (
                <LogActivityModal
                    isOpen={!!selectedDate}
                    onClose={() => setSelectedDate(null)}
                    dateStr={selectedDate}
                />
            )}
        </div>
    );
}
