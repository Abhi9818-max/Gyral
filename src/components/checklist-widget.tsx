"use client";

import { useUserData } from "@/context/user-data-context";
import { useToday } from "@/hooks/use-today";
import { Check } from "lucide-react";

export function ChecklistWidget() {
    const { tasks, records, addRecord, deleteRecord } = useUserData();
    const todayStr = useToday();

    const activeTasks = tasks.filter(t => !t.isArchived).sort((a, b) => {
        const aIsBoolean = !a.metricConfig || !a.metricConfig.phases || a.metricConfig.phases.length === 0;
        const bIsBoolean = !b.metricConfig || !b.metricConfig.phases || b.metricConfig.phases.length === 0;
        if (aIsBoolean && !bIsBoolean) return 1;
        if (!aIsBoolean && bIsBoolean) return -1;
        return 0;
    });

    const getRecordStatus = (taskId: string) => {
        const todaysRecords = records[todayStr] || [];
        const record = todaysRecords.find(r => r.taskId === taskId);
        if (!record) return { isCompleted: false, intensity: 0 };
        return { 
            isCompleted: true, 
            intensity: record.intensity === null ? 4 : record.intensity 
        };
    };

    const handleToggleSingleBox = async (taskId: string, isBooleanTask: boolean) => {
        const { isCompleted } = getRecordStatus(taskId);
        if (isCompleted) {
            await deleteRecord(todayStr, taskId);
        } else {
            if (isBooleanTask) {
                // Log as standard completion (null intensity), silence the modal
                await addRecord(todayStr, taskId, null, undefined, true);
            } else {
                // For phased tasks, set to phase 4 (full completion), silence the modal
                await addRecord(todayStr, taskId, 4, undefined, true);
            }
        }
    };

    if (activeTasks.length === 0) {
        return (
            <div className="bg-zinc-900/40 border border-white/10 rounded-2xl p-6 text-center text-zinc-400 text-sm font-serif">
                No active routines to display.
            </div>
        );
    }

    // Format date nicely if possible, otherwise use todayStr
    const formattedDate = new Date(todayStr).toLocaleDateString('en-US', { month: 'long', day: 'numeric' });

    return (
        <div className="bg-black/60 backdrop-blur-xl text-zinc-200 p-4 md:p-10 rounded-2xl border border-white/5 shadow-[0_20px_50px_rgba(0,0,0,0.5)] transform-gpu transition-all duration-500 animate-in fade-in slide-in-from-bottom-4 max-w-4xl mx-auto w-full">
            
            <div className="text-center mb-6 md:mb-10">
                <h2 className="text-3xl md:text-5xl font-serif italic mb-1 md:mb-2 tracking-tight text-white/90">
                    Daily Routine
                </h2>
                <p className="text-[10px] md:text-sm font-sans tracking-[0.2em] uppercase opacity-50">
                    ({formattedDate})
                </p>
            </div>

            <div className="w-full flex flex-col font-sans gap-2">
                {/* Header */}
                <div className="flex items-center px-2 pb-2 border-b border-white/10 select-none">
                    <div className="flex-1 font-medium tracking-[0.2em] text-[10px] md:text-xs uppercase text-zinc-500">Habit</div>
                    <div className="font-medium tracking-[0.2em] text-[10px] md:text-xs uppercase text-zinc-500 pr-1.5">Status</div>
                </div>
                
                {/* Body */}
                <div className="flex flex-col gap-2">
                    {activeTasks.map((task, index) => {
                        const { isCompleted } = getRecordStatus(task.id);
                        const isBooleanTask = !task.metricConfig || !task.metricConfig.phases || task.metricConfig.phases.length === 0;

                        return (
                            <div key={task.id} className="flex items-center py-1.5 px-2 bg-white/[0.02] rounded-md hover:bg-white/[0.04] transition-colors border border-white/5">
                                <div className="flex-1 font-normal text-zinc-300 pr-4">
                                    <div className="line-clamp-2 text-[11px] md:text-[14px] tracking-wide leading-snug">
                                        {index + 1}. {task.name}
                                    </div>
                                </div>
                                <div className="flex justify-end pr-1.5 select-none">
                                    <div
                                        role="button"
                                        tabIndex={0}
                                        onClick={() => handleToggleSingleBox(task.id, isBooleanTask)}
                                        style={{
                                            width: 15,
                                            height: 15,
                                            minWidth: 15,
                                            minHeight: 15,
                                            maxWidth: 15,
                                            maxHeight: 15,
                                            borderRadius: 3,
                                            border: isCompleted ? '1px solid white' : '1px solid rgba(255,255,255,0.3)',
                                            backgroundColor: isCompleted ? 'white' : 'transparent',
                                            boxShadow: isCompleted ? '0 0 8px rgba(255,255,255,0.3)' : 'none',
                                            display: 'flex',
                                            alignItems: 'center',
                                            justifyContent: 'center',
                                            cursor: 'pointer',
                                            transition: 'all 0.2s',
                                            flexShrink: 0,
                                        }}
                                        title={isCompleted ? "Mark incomplete" : "Mark complete"}
                                    >
                                        {isCompleted && (
                                            <Check style={{ width: 10, height: 10 }} className="text-black stroke-[3.5]" />
                                        )}
                                    </div>
                                </div>
                            </div>
                        );
                    })}
                </div>
            </div>

            <div className="mt-8 md:mt-16 text-center">
                <p className="font-serif italic text-sm md:text-xl text-zinc-400 tracking-wide">
                    remember, <span className="font-bold text-zinc-300">consistency over perfection.</span>
                </p>
            </div>
        </div>
    );
}
