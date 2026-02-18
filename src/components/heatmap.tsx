"use client";

import { useState, useEffect, useRef } from 'react';
import { Calendar as CalendarIcon } from 'lucide-react';
import { useUserData, Record } from '@/context/user-data-context';
import { LogActivityModal } from './modals/log-activity-modal';
import { format, setYear, setMonth, setDate, getDay, getDaysInMonth, startOfYear } from 'date-fns';

export function Heatmap() {
    const { records, tasks, activeFilterTaskId } = useUserData();
    const [selectedDate, setSelectedDate] = useState<string | null>(null);
    const scrollContainerRef = useRef<HTMLDivElement>(null);
    const currentMonthRef = useRef<HTMLDivElement>(null);

    // Current Year 2026 Logic
    const currentYear = 2026;
    const currentMonth = new Date().getMonth(); // 0-11

    // Generate months data dynamically for 2026
    const months = Array.from({ length: 12 }, (_, monthIndex) => {
        const date = new Date(currentYear, monthIndex, 1);
        return {
            name: format(date, 'MMM'),
            days: getDaysInMonth(date),
            startDay: getDay(date), // 0 = Sunday
            monthIndex: monthIndex
        };
    });

    // Get today's date string YYYY-MM-DD
    const today = new Date();
    const todayStr = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`;

    // Auto-scroll to current month on mount
    useEffect(() => {
        if (currentMonthRef.current && scrollContainerRef.current) {
            const container = scrollContainerRef.current;
            const currentMonthElement = currentMonthRef.current;

            // Calculate scroll position to center the current month
            const containerWidth = container.clientWidth;
            const elementLeft = currentMonthElement.offsetLeft;
            const elementWidth = currentMonthElement.clientWidth;

            // Center the current month
            const scrollPosition = elementLeft - (containerWidth / 2) + (elementWidth / 2);

            // Smooth scroll to position
            container.scrollTo({
                left: scrollPosition,
                behavior: 'smooth'
            });
        }
    }, []);

    const getDayColor = (dateStr: string) => {
        const dayRecords = records[dateStr];
        if (!dayRecords || dayRecords.length === 0) return null;

        // FILTER LOGIC:
        // If a filter is active, only consider records for that task.
        // If filtered list is empty, return null (gray).
        let filteredRecords = dayRecords;
        if (activeFilterTaskId) {
            filteredRecords = dayRecords.filter(r => r.taskId === activeFilterTaskId);
        }

        if (filteredRecords.length === 0) return null;

        // Visualizing the last added record for now, or could be a mix
        // For simplicity, let's take the last record of the filtered set
        const lastRecord = filteredRecords[filteredRecords.length - 1];
        const task = tasks.find(t => t.id === lastRecord.taskId);

        if (!task) return null;

        const intensity = lastRecord.intensity || 0; // 0 if null (standard)

        // Intensity Logic for Glow
        // Instead of fading out the color (opacity), let's keep the color vibrant
        // and change the strength of the GLOW.

        let glowStrength = 0;
        let opacity = 1;

        if (intensity === 0) {
            // Standard completed (no specific intensity)
            glowStrength = 15; // Moderate glow
            opacity = 1;
        } else {
            // Scale glow with intensity
            // 1: Subtle
            // 4: Super bright neon
            glowStrength = 5 + (intensity * 8);
            opacity = 0.6 + (intensity * 0.1);
        }

        return {
            color: task.color,
            boxShadow: `0 0 ${glowStrength}px ${task.color}, 0 0 ${glowStrength * 2}px ${task.color}40`,
            opacity
        };
    };

    return (
        <div className="space-y-4 md:space-y-6">
            {/* Scrollable Container with auto-scroll to current month */}
            <div
                ref={scrollContainerRef}
                className="flex gap-4 md:gap-6 overflow-x-auto pb-4 scrollbar-thin scrollbar-thumb-muted scrollbar-track-transparent -mx-4 px-4 md:mx-0 md:px-0"
            >
                {months.map((month) => (
                    <div
                        key={month.name}
                        ref={month.monthIndex === currentMonth ? currentMonthRef : null}
                        className="flex-none"
                    >
                        <div className="text-center text-xs md:text-sm text-muted-foreground font-medium mb-2 md:mb-3">{month.name}</div>

                        {/* Calendar grid with proper alignment */}
                        <div className="grid grid-cols-7 gap-1 md:gap-1.5">
                            {/* Add empty boxes for offset (days before the 1st) */}
                            {/* Adjustment: getDay returns 0 for Sunday. If we want Mon start, we need to shift. 
                                Let's assume Standard JS getDay: 0=Sun, 1=Mon... 6=Sat.
                                If UI expects Mon=0, Tue=1.. Sun=6.
                                
                                JS: Sun=0, Mon=1, Tue=2, Wed=3, Thu=4, Fri=5, Sat=6
                                UI Target: Mon=0, Tue=1 ... Sun=6
                                Conversion: (day + 6) % 7
                            */}
                            {Array.from({ length: (month.startDay + 6) % 7 }).map((_, i) => (
                                <div key={`empty-${i}`} className="w-[28px] h-[28px] md:w-[25px] md:h-[25px]" />
                            ))}

                            {/* Actual day boxes - responsive size */}
                            {Array.from({ length: month.days }).map((_, i) => {
                                const day = i + 1;
                                // Create date string YYYY-MM-DD
                                // Note: monthIndex is 0-11, so +1 for string
                                const dateStr = `${currentYear}-${String(month.monthIndex + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
                                const isToday = dateStr === todayStr;
                                const style = getDayColor(dateStr);

                                // Base glow from activity
                                let boxStyle: React.CSSProperties | undefined = style ? {
                                    backgroundColor: style.color,
                                    opacity: style.opacity,
                                    boxShadow: style.boxShadow,
                                    border: `1px solid ${style.color}80`
                                } : undefined;

                                // Override/Enhance for Today
                                if (isToday) {
                                    boxStyle = {
                                        ...boxStyle,
                                        boxShadow: style
                                            ? `0 0 15px white, ${style.boxShadow}` // Combine white glow with activity glow
                                            : `0 0 10px rgba(255, 255, 255, 0.8)`, // Pure white glow if no activity
                                        border: '1px solid rgba(255, 255, 255, 0.9)',
                                    };
                                }

                                return (
                                    <div
                                        key={i}
                                        onClick={() => setSelectedDate(dateStr)}
                                        className={`w-[28px] h-[28px] md:w-[25px] md:h-[25px] rounded-[5px] md:rounded-[4px] transition-all duration-300 cursor-pointer hover:scale-110 active:scale-95 relative group ${!style ? 'bg-gradient-to-br from-[#1a1a1a] to-[#0f0f0f] shadow-[inset_0_1px_2px_rgba(0,0,0,0.5)] hover:from-[#2a2a2a] hover:to-[#1a1a1a] hover:shadow-[0_0_15px_rgba(16,185,129,0.4),inset_0_1px_2px_rgba(0,0,0,0.3)]' : ''} ${isToday ? 'z-20 scale-110' : 'hover:z-10'}`}
                                        style={boxStyle}
                                        title={`${month.name} ${day}${isToday ? ' (Today)' : ''}`}
                                    >
                                        {/* Shimmer Effect */}
                                        <div className="absolute inset-0 bg-gradient-to-br from-white/40 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500 rounded-[4px]" />
                                    </div>
                                );
                            })}
                        </div>
                    </div>
                ))}
            </div>

            <div className="flex justify-center">
                <a href="/calendar" className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-card to-card/80 border border-border/60 rounded-lg text-xs md:text-sm text-[#f5f5f5] hover:bg-gradient-to-r hover:from-muted hover:to-muted/80 transition-all duration-500 cursor-pointer shadow-[0_10px_40px_rgba(0,0,0,0.5)] hover:shadow-[0_15px_60px_rgba(16,185,129,0.2)] hover:scale-105 hover:-translate-y-1 backdrop-blur-xl group">
                    <CalendarIcon className="w-4 h-4 group-hover:text-accent transition-colors duration-300" />
                    View Full Calendar
                </a>
            </div>

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
