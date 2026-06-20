"use client";

import { useMemo } from 'react';
import { TrendingUp, Activity } from 'lucide-react';
import { useUserData } from '@/context/user-data-context';
import { AreaChart, Area, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

export function StatsCard() {
    const { records, activeFilterTaskId, getTaskAnalytics, showStatsCard, tasks } = useUserData();

    if (!showStatsCard) return null;

    // Get analytics if filter is on
    const analytics = activeFilterTaskId && getTaskAnalytics ? getTaskAnalytics(activeFilterTaskId) : null;
    const activeTask = activeFilterTaskId ? tasks.find(t => t.id === activeFilterTaskId) : null;

    // Calculate chart data for last 30 days
    const { chartData, totalLast30Days } = useMemo(() => {
        const data = [];
        const today = new Date();
        let totalCount = 0;

        for (let i = 29; i >= 0; i--) {
            const d = new Date(today);
            d.setDate(d.getDate() - i);
            // Format strictly as YYYY-MM-DD
            const yyyy = d.getFullYear();
            const mm = String(d.getMonth() + 1).padStart(2, '0');
            const dd = String(d.getDate()).padStart(2, '0');
            const dateStr = `${yyyy}-${mm}-${dd}`;
            
            const dayRecords = records[dateStr] || [];
            
            let count = 0;
            let intensitySum = 0;
            
            if (activeFilterTaskId) {
                const filtered = dayRecords.filter(r => r.taskId === activeFilterTaskId);
                count = filtered.length;
                intensitySum = filtered.reduce((sum, r) => sum + (r.intensity || 1), 0);
            } else {
                count = dayRecords.length;
                intensitySum = dayRecords.reduce((sum, r) => sum + (r.intensity || 1), 0);
            }

            totalCount += count;

            data.push({
                date: d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
                count,
                intensity: intensitySum
            });
        }
        return { chartData: data, totalLast30Days: totalCount };
    }, [records, activeFilterTaskId]);

    // Custom Tooltip for Recharts
    const CustomTooltip = ({ active, payload, label }: any) => {
        if (active && payload && payload.length) {
            return (
                <div className="bg-zinc-900/90 border border-white/10 p-3 rounded-lg shadow-xl backdrop-blur-md">
                    <p className="text-white font-medium mb-1">{label}</p>
                    {payload.map((entry: any, index: number) => (
                        <p key={index} className="text-xs flex items-center gap-2" style={{ color: entry.color }}>
                            <span className="w-2 h-2 rounded-full" style={{ backgroundColor: entry.color }}></span>
                            {entry.name}: <span className="font-bold">{entry.value}</span>
                        </p>
                    ))}
                </div>
            );
        }
        return null;
    };

    return (
        <div className="bg-white/5 border border-white/20 rounded-xl p-4 md:p-6 w-full max-w-sm md:max-w-md mx-auto shadow-[0_0_20px_rgba(0,0,0,0.5)] hover:shadow-[0_0_30px_rgba(255,255,255,0.1)] transition-all duration-500 backdrop-blur-xl relative overflow-hidden group">
            {/* Ambient Glow Effect */}
            <div className="absolute inset-0 bg-gradient-to-br from-indigo-500/5 to-purple-500/5 opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none" />

            <div className="flex justify-between items-start mb-4 relative z-10">
                <div>
                    <div className="flex items-center gap-2">
                        <span className="text-xs md:text-sm text-muted-foreground uppercase tracking-wider font-bold">30-Day Activity</span>
                        <Activity className="w-4 h-4 text-indigo-400 group-hover:text-indigo-300 transition-colors duration-300" />
                    </div>
                    <div className="text-3xl md:text-4xl font-bold text-white mt-1 relative z-10 group-hover:text-shadow-[0_0_20px_rgba(255,255,255,0.5)] transition-all duration-300 flex items-baseline gap-2">
                        {totalLast30Days} <span className="text-xs font-normal text-zinc-500 tracking-normal lowercase">{activeTask ? `reps` : `total actions`}</span>
                    </div>
                </div>
                <div className="bg-white/10 rounded-full p-2">
                    <TrendingUp className="w-5 h-5 text-white/80" />
                </div>
            </div>
            
            {/* Recharts Area Chart */}
            <div className="h-40 w-full mt-4 mb-2 relative z-10">
                <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={chartData} margin={{ top: 5, right: 0, left: 0, bottom: 0 }}>
                        <defs>
                            <linearGradient id="colorCount" x1="0" y1="0" x2="0" y2="1">
                                <stop offset="5%" stopColor={activeTask?.color || "#818cf8"} stopOpacity={0.8}/>
                                <stop offset="95%" stopColor={activeTask?.color || "#818cf8"} stopOpacity={0}/>
                            </linearGradient>
                        </defs>
                        <Tooltip content={<CustomTooltip />} cursor={{ fill: 'rgba(255,255,255,0.05)' }} />
                        <Area 
                            type="monotone" 
                            dataKey="count" 
                            name={activeTask ? activeTask.name : "Actions"}
                            stroke={activeTask?.color || "#818cf8"} 
                            strokeWidth={3}
                            fillOpacity={1} 
                            fill="url(#colorCount)" 
                            animationDuration={1500}
                        />
                    </AreaChart>
                </ResponsiveContainer>
            </div>

            <div className="text-xs text-muted-foreground relative z-10 text-center">
                {activeFilterTaskId ? `Viewing: ${activeTask?.name}` : 'Combined Activity Matrix'}
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
