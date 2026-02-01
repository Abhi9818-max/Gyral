"use client";

import { useMemo } from 'react';
import { TrendingUp } from 'lucide-react';
import { useUserData } from '@/context/user-data-context';

export function StatsCard() {
    const { records, activeFilterTaskId, getTaskAnalytics, showStatsCard } = useUserData();

    if (!showStatsCard) return null;

    // Get analytics if filter is on
    const analytics = activeFilterTaskId && getTaskAnalytics ? getTaskAnalytics(activeFilterTaskId) : null;

    // Calculate total for last 30 days
    const totalLast30Days = useMemo(() => {
        const today = new Date();
        const thirtyDaysAgo = new Date();
        thirtyDaysAgo.setDate(today.getDate() - 30);

        let count = 0;

        Object.entries(records).forEach(([dateStr, dayRecords]) => {
            const recordDate = new Date(dateStr);
            // Check if date is within window
            // We compare timestamps to handle time zones roughly, or just string compare if simpler
            if (recordDate >= thirtyDaysAgo && recordDate <= today) {
                if (activeFilterTaskId) {
                    // Count only specific task
                    count += dayRecords.filter(r => r.taskId === activeFilterTaskId).length;
                } else {
                    // Count all tasks
                    count += dayRecords.length;
                }
            }
        });

        return count;
    }, [records, activeFilterTaskId]);

    return (
        <div className="bg-white/5 border border-white/20 rounded-xl p-4 md:p-6 w-full max-w-sm mx-auto shadow-[0_0_20px_rgba(0,0,0,0.5)] hover:shadow-[0_0_30px_rgba(255,255,255,0.1)] transition-all duration-500 hover:scale-[1.02] hover:-translate-y-1 backdrop-blur-xl relative overflow-hidden group">
            {/* Ambient Glow Effect */}
            <div className="absolute inset-0 bg-gradient-to-br from-accent/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none" />

            <div className="flex justify-between items-start mb-2 relative z-10">
                <span className="text-xs md:text-sm text-muted-foreground">Total Last 30 Days</span>
                <TrendingUp className="w-4 h-4 text-muted-foreground group-hover:text-accent transition-colors duration-300" />
            </div>
            <div className="text-3xl md:text-4xl font-bold text-white mb-1 relative z-10 group-hover:text-shadow-[0_0_20px_rgba(255,255,255,0.5)] transition-all duration-300">
                {totalLast30Days}
            </div>
            <div className="text-xs text-muted-foreground relative z-10">
                {activeFilterTaskId ? 'in selected task' : 'across all tasks'}
                {activeFilterTaskId ? 'in selected task' : 'across all tasks'}
            </div>

            {/* Trajectory Simulation Warning */}
            {analytics && analytics.trajectory && analytics.driftStatus !== 'stable' && (
                <div className="mt-4 pt-3 border-t border-white/10 animate-[fadeIn_0.5s_ease-out]">
                    <div className="flex items-center gap-2 mb-1">
                        <div className={`w-2 h-2 rounded-full ${analytics.driftStatus === 'collapsing' ? 'bg-red-500 animate-pulse' : 'bg-amber-500'}`} />
                        <span className={`text-xs font-bold uppercase tracking-wider ${analytics.driftStatus === 'collapsing' ? 'text-red-400' : 'text-amber-400'}`}>
                            {analytics.driftStatus === 'collapsing' ? 'Critical Drift' : 'Pattern Alert'}
                        </span>
                    </div>
                    <p className="text-sm font-medium text-white/80 italic">
                        "{analytics.trajectory}"
                    </p>
                </div>
            )}
        </div>
    );
}
