"use client";

import { useState, useMemo } from 'react';
import { TrendingUp, Settings } from 'lucide-react';
import { useUserData } from '@/context/user-data-context';
import { startOfWeek, endOfWeek, eachDayOfInterval, format, subDays, isSameDay, startOfMonth, endOfMonth } from 'date-fns';

type ViewPeriod = 'Day' | 'Week' | 'Month';

export function WeeklyProgress() {
    const { records, tasks, activeFilterTaskId } = useUserData();
    const [viewPeriod, setViewPeriod] = useState<ViewPeriod>('Week');

    // Get the active task color or default green
    const activeTask = activeFilterTaskId ? tasks.find(t => t.id === activeFilterTaskId) : null;
    const primaryColor = activeTask ? activeTask.color : '#22c55e'; // Default Green

    // --- Data Processing Logic ---
    const { chartPoints, labels, totalCompleted, totalValue, maxValue } = useMemo(() => {
        // Use a fixed date to align with Heatmap's 2026 calendar and User Context
        // This ensures records made in the 2026 heatmap appear in this "current" view
        const anchorDate = new Date(2026, 0, 22); // Jan 22, 2026

        let dateRange: Date[] = [];
        let dateFormat = 'EEE'; // Mon, Tue...

        if (viewPeriod === 'Day') {
            // 24 Hours view? Or simply show last 7 days but focused?
            // "Day" view usually shows hours of the day. 
            // Since we only track per-day completion, let's make "Day" view show the last 7 days details roughly?
            // actually, better: Day view -> Today's breakdown? Detailed intensity?
            // Since we don't track time-of-day, "Day" view is tricky.
            // Let's make "Day" actually = "Last 14 Days" for granular recent history?
            // Or let's just do Last 7 Days for "Day" too but labeled differently?
            // Re-interpreting: 
            // Week = This Week (Sun-Sat)
            // Month = This Month (1-31)
            const start = subDays(anchorDate, 6);
            dateRange = eachDayOfInterval({ start, end: anchorDate });
            dateFormat = 'dd';
        } else if (viewPeriod === 'Week') {
            const start = subDays(anchorDate, 6); // Rolling 7 days
            dateRange = eachDayOfInterval({ start, end: anchorDate });
            dateFormat = 'EEE';
        } else if (viewPeriod === 'Month') {
            const start = subDays(anchorDate, 29); // Rolling 30 days
            dateRange = eachDayOfInterval({ start, end: anchorDate });
            dateFormat = 'dd';
        }

        let totalVal = 0;
        let completedCount = 0;

        const points = dateRange.map((date, index) => {
            const dateStr = format(date, 'yyyy-MM-dd');
            const dayRecords = records[dateStr] || [];

            // DEBUG LOGGING
            if (Object.keys(records).length > 0) {
                console.log("WeeklyProgress Debug:", {
                    dateStr,
                    dayRecords,
                    activeFilterTaskId,
                    hasRecords: dayRecords.length > 0
                });
            }

            // Filter
            const relevantRecords = activeFilterTaskId
                ? dayRecords.filter(r => r.taskId === activeFilterTaskId)
                : dayRecords;

            // Calculate Value
            // If filtered by task with metrics, use RAW VALUE
            // Else, use Intensity
            let value = 0;
            if (relevantRecords.length > 0) {
                completedCount++;
                if (activeTask?.metricConfig) {
                    value = relevantRecords.reduce((sum, r) => sum + (r.value || 0), 0);
                } else {
                    value = relevantRecords.reduce((sum, r) => sum + (r.intensity || 1), 0);
                }
            }

            totalVal += value;
            return { date, value, label: format(date, dateFormat) };
        });

        // Normalize points for chart
        // If metric, max might be huge (e.g. 500 pages). If intensity, max is 5.
        const dynamicMax = activeTask?.metricConfig
            ? Math.max(...points.map(p => p.value)) * 1.1 // Add 10% headroom
            : 5;

        // Ensure max is at least 1 to avoid division by zero
        const effectiveMax = Math.max(dynamicMax, 1);

        return {
            chartPoints: points,
            labels: points.map(p => p.label),
            totalCompleted: completedCount,
            totalValue: totalVal,
            maxValue: effectiveMax
        };
    }, [records, activeFilterTaskId, viewPeriod, activeTask]);


    // Calculate SVG path
    const width = 400;
    const height = 180;
    const paddingX = 20;
    const paddingY = 20;
    const graphWidth = width - paddingX * 2;
    const graphHeight = height - paddingY * 2;

    // Safety max check
    // Use calculated max
    const max = maxValue;

    const svgPoints = chartPoints.map((p, index) => {
        const x = paddingX + (index / (chartPoints.length - 1)) * graphWidth;
        // Avoid division by zero if max is 0
        const normalizedY = max === 0 ? 0 : (p.value / max);
        const y = paddingY + graphHeight - (normalizedY * graphHeight);
        return { x, y, value: p.value };
    });

    const linePath = svgPoints.map((p, i) => `${i === 0 ? 'M' : 'L'} ${p.x} ${p.y}`).join(' ');
    const areaPath = `${linePath} L ${svgPoints[svgPoints.length - 1].x} ${height - paddingY} L ${paddingX} ${height - paddingY} Z`;

    // Only show some labels for Month view
    const labelStep = viewPeriod === 'Month' ? 5 : 1;

    return (
        <div className="bg-gradient-to-b from-card/80 to-card/40 border border-border/50 rounded-xl p-4 md:p-6 space-y-4 md:space-y-6 shadow-[0_20px_60px_rgba(0,0,0,0.6)] backdrop-blur-xl relative overflow-hidden group">
            {/* Dramatic Background Glow - Dynamic Color */}
            <div
                className="absolute top-0 right-0 w-[300px] h-[300px] rounded-full blur-[100px] pointer-events-none opacity-20 transition-colors duration-500"
                style={{ backgroundColor: primaryColor }}
            />

            {/* Header */}
            <div className="flex items-center justify-between relative z-10">
                <h3 className="text-base md:text-lg font-semibold text-white flex items-center gap-2 drop-shadow-[0_2px_4px_rgba(0,0,0,0.8)]">
                    <span
                        className="text-black text-xs font-bold px-1.5 py-0.5 rounded-sm shadow-[0_0_15px_rgba(255,255,255,0.4)] transition-colors duration-500"
                        style={{ backgroundColor: 'white' }}
                    >
                        ↗
                    </span>
                    Progress
                </h3>
            </div>

            {/* Top Keywords / Task Info */}
            <div className="space-y-1 relative z-10">
                <div className="text-[10px] md:text-xs text-muted-foreground uppercase tracking-widest font-light">Target</div>
                <div
                    className="text-sm md:text-sm text-white font-medium drop-shadow-md transition-colors duration-300"
                    style={{ color: activeTask ? primaryColor : 'white' }}
                >
                    {activeTask ? activeTask.name : "All Activity"}
                </div>
            </div>

            {/* Period Selector */}
            <div className="flex gap-2 bg-black/40 rounded-lg p-1 border border-white/5 relative z-10 backdrop-blur-sm">
                {(['Week', 'Month'] as ViewPeriod[]).map((period) => (
                    <button
                        key={period}
                        onClick={() => setViewPeriod(period)}
                        className={`flex-1 px-2 md:px-3 py-1.5 text-xs md:text-sm transition-all duration-300 rounded-md ${viewPeriod === period
                            ? 'bg-white/10 text-white shadow-[0_2px_10px_rgba(0,0,0,0.2)] border border-white/5'
                            : 'text-muted-foreground hover:text-white hover:bg-white/5'
                            }`}
                    >
                        {period}
                    </button>
                ))}
            </div>

            {/* Chart */}
            <div className="relative z-10 group/chart">
                <svg width={width} height={height} className="w-full overflow-visible" viewBox={`0 0 ${width} ${height}`}>
                    <defs>
                        <linearGradient id="chartGradient" x1="0" x2="0" y1="0" y2="1">
                            <stop offset="0%" stopColor={primaryColor} stopOpacity="0.4" />
                            <stop offset="100%" stopColor={primaryColor} stopOpacity="0.0" />
                        </linearGradient>
                        <linearGradient id="lineGradient" x1="0" y1="0" x2="1" y2="0">
                            <stop offset="0%" stopColor={primaryColor} />
                            <stop offset="100%" stopColor={primaryColor} />
                        </linearGradient>
                        <filter id="glow" x="-20%" y="-20%" width="140%" height="140%">
                            <feGaussianBlur stdDeviation="4" result="coloredBlur" />
                            <feMerge>
                                <feMergeNode in="coloredBlur" />
                                <feMergeNode in="SourceGraphic" />
                            </feMerge>
                        </filter>
                    </defs>

                    {/* Grid lines */}
                    {[0, 1, 2, 3].map((i) => {
                        const y = paddingY + (i / 3) * graphHeight;
                        return <line key={i} x1={paddingX} y1={y} x2={width - paddingX} y2={y} stroke="#27272a" strokeWidth="1" strokeDasharray="4 4" opacity="0.5" />;
                    })}

                    {/* Area fill */}
                    <path d={areaPath} fill="url(#chartGradient)" className="opacity-70 group-hover/chart:opacity-90 transition-opacity duration-500" />

                    {/* Line with glow */}
                    <path
                        d={linePath}
                        fill="none"
                        stroke="url(#lineGradient)"
                        strokeWidth="3"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        filter="url(#glow)"
                        className="drop-shadow-lg transition-all duration-500"
                    />

                    {/* Data Points on Hover */}
                    {svgPoints.map((p, i) => (
                        <circle
                            key={i}
                            cx={p.x}
                            cy={p.y}
                            r="6"
                            fill="#18181b"
                            stroke={primaryColor}
                            strokeWidth="2"
                            className={`opacity-0 group-hover/chart:opacity-100 transition-opacity duration-300`}
                        />
                    ))}
                </svg>

                {/* X-axis labels */}
                <div className="flex justify-between px-5 mt-2">
                    {labels.map((label, i) => (
                        (i % labelStep === 0 || i === labels.length - 1) && (
                            <div key={i} className="text-[10px] text-muted-foreground uppercase tracking-widest font-medium">
                                {label}
                            </div>
                        )
                    ))}
                </div>
            </div>

            {/* Stats */}
            <div className="pt-4 border-t border-border/50 relative z-10">
                <div className="text-xs text-muted-foreground mb-2 uppercase tracking-wider">
                    {activeTask?.metricConfig ? `Total ${activeTask.metricConfig.unit}` : 'Total Intensity Score'}
                </div>
                <div className="flex items-baseline justify-between">
                    <div className="flex items-baseline gap-2">
                        <span className="text-4xl font-bold text-white drop-shadow-[0_0_20px_rgba(255,255,255,0.3)]">{totalValue}</span>
                    </div>
                </div>
            </div>
        </div>
    );
}
