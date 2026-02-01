"use client";

import { RecordsMap, Task } from '@/context/user-data-context';

interface CalendarCardProps {
    records: RecordsMap;
    activeTask: Task | null;
}

export function CalendarCard({ records, activeTask }: CalendarCardProps) {
    const today = new Date();
    // Get last 42 days (6 weeks) for a nice block
    const dates = Array.from({ length: 42 }, (_, i) => {
        const d = new Date(today);
        d.setDate(d.getDate() - (41 - i));
        return d;
    });

    const getIntensity = (dateStr: string) => {
        const recs = records[dateStr] || [];
        if (!recs.length) return 0;

        if (activeTask) {
            const taskRec = recs.find(r => r.taskId === activeTask.id);
            return taskRec ? (taskRec.intensity || 1) : 0;
        } else {
            return Math.min(4, recs.reduce((acc, r) => acc + (r.intensity || 1), 0));
        }
    };

    return (
        <div className="w-full h-full bg-[#0a0a0a] flex flex-col p-8 relative overflow-hidden font-sans">

            <div className="flex justify-between items-start mb-8 z-10">
                <div>
                    <h2 className="text-2xl font-bold text-white tracking-tight">
                        {activeTask ? activeTask.name : 'Consistency'}
                    </h2>
                    <p className="text-zinc-500 font-medium text-sm mt-1">
                        Last 42 Days
                    </p>
                </div>
                <div className="text-right">
                    <span className="text-xs font-mono text-zinc-600 uppercase tracking-wider">Status Report</span>
                </div>
            </div>

            {/* Exact Grid Style replica */}
            <div className="flex-1 flex items-center justify-center">
                <div className="grid grid-cols-7 gap-2">
                    {dates.map((date) => {
                        const dateStr = date.toISOString().split('T')[0];
                        const intensity = getIntensity(dateStr);
                        const isToday = dateStr === today.toISOString().split('T')[0];

                        // Determine color
                        let bgClass = "bg-[#1a1a1a]"; // Empty
                        let style = {};

                        if (intensity > 0) {
                            if (activeTask) {
                                style = { backgroundColor: activeTask.color, opacity: intensity >= 4 ? 1 : 0.4 + (intensity * 0.15) };
                            } else {
                                // Default green scale if logic requires, or white
                                const opacity = 0.2 + (intensity * 0.2);
                                style = { backgroundColor: 'white', opacity };
                            }
                        }

                        return (
                            <div key={dateStr} className="relative">
                                <div
                                    className={`w-10 h-10 rounded-sm transition-colors ${intensity === 0 ? bgClass : ''}`}
                                    style={style}
                                />
                                {isToday && (
                                    <div className="absolute -inset-1 border border-white/40 rounded-md pointer-events-none" />
                                )}
                            </div>
                        );
                    })}
                </div>
            </div>

            {/* Footer with Legend */}
            <div className="mt-auto pt-6 border-t border-white/5 flex justify-between items-center z-10">
                <div className="text-[10px] text-zinc-600 font-mono tracking-widest uppercase opacity-50">Diogenes Protocol</div>

                <div className="flex items-center gap-2">
                    <span className="text-[10px] text-zinc-600">LESS</span>
                    <div className="flex gap-1">
                        <div className="w-3 h-3 rounded-sm bg-[#1a1a1a]" />
                        <div className="w-3 h-3 rounded-sm" style={{ backgroundColor: activeTask ? activeTask.color : 'white', opacity: 0.4 }} />
                        <div className="w-3 h-3 rounded-sm" style={{ backgroundColor: activeTask ? activeTask.color : 'white', opacity: 0.7 }} />
                        <div className="w-3 h-3 rounded-sm" style={{ backgroundColor: activeTask ? activeTask.color : 'white', opacity: 1 }} />
                    </div>
                    <span className="text-[10px] text-zinc-600">MORE</span>
                </div>
            </div>
        </div>
    );
}
