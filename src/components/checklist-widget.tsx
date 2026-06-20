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

    const handleTogglePhased = async (taskId: string, targetPhase: number) => {
        const { intensity } = getRecordStatus(taskId);
        if (intensity === targetPhase) {
            // Uncheck
            await deleteRecord(todayStr, taskId);
        } else {
            // Update to target phase, passing true to silence the Streak Success Modal
            await addRecord(todayStr, taskId, targetPhase, undefined, true);
        }
    };

    const handleToggleBoolean = async (taskId: string) => {
        const { isCompleted } = getRecordStatus(taskId);
        if (isCompleted) {
            await deleteRecord(todayStr, taskId);
        } else {
            // Log as standard completion (null intensity), silence the modal
            await addRecord(todayStr, taskId, null, undefined, true);
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

            <div className="w-full flex flex-col font-sans">
                {/* Header */}
                <div className="flex items-center border-y border-white/10 py-3 px-2">
                    <div className="w-[44%] font-medium tracking-[0.1em] md:tracking-[0.2em] text-[9px] md:text-xs uppercase text-zinc-500">Habit</div>
                    <div className="w-[14%] text-center font-medium tracking-[0.1em] md:tracking-[0.2em] text-[9px] md:text-xs uppercase text-zinc-500">P1</div>
                    <div className="w-[14%] text-center font-medium tracking-[0.1em] md:tracking-[0.2em] text-[9px] md:text-xs uppercase text-zinc-500">P2</div>
                    <div className="w-[14%] text-center font-medium tracking-[0.1em] md:tracking-[0.2em] text-[9px] md:text-xs uppercase text-zinc-500">P3</div>
                    <div className="w-[14%] text-center font-medium tracking-[0.1em] md:tracking-[0.2em] text-[9px] md:text-xs uppercase text-zinc-500">P4</div>
                </div>
                
                {/* Body */}
                <div className="flex flex-col divide-y divide-white/5">
                    {activeTasks.map((task, index) => {
                        const { isCompleted, intensity } = getRecordStatus(task.id);
                        const isBooleanTask = !task.metricConfig || !task.metricConfig.phases || task.metricConfig.phases.length === 0;

                        return (
                            <div key={task.id} className="flex items-center py-3 md:py-4 px-2 group hover:bg-white/[0.02] transition-colors">
                                <div className="w-[44%] font-normal text-zinc-300 pr-2">
                                    <div className="line-clamp-2 md:truncate md:max-w-[300px] text-[11px] md:text-[15px] tracking-wide leading-snug">
                                        {index + 1}. {task.name}
                                    </div>
                                </div>
                                {isBooleanTask ? (
                                    <div className="w-[56%] flex justify-center px-1">
                                        <button
                                            onClick={() => handleToggleBoolean(task.id)}
                                            className={`w-full max-w-[140px] py-2 md:py-2.5 text-[9px] md:text-xs rounded-full flex items-center justify-center gap-1.5 transition-all duration-300 active:scale-95 border-[1px] md:border-[1.5px] ${isCompleted ? 'bg-white text-black border-white shadow-[0_0_10px_rgba(255,255,255,0.3)]' : 'bg-transparent text-zinc-400 border-white/30 hover:border-white/60'}`}
                                        >
                                            {isCompleted && <Check className="w-3 h-3 md:w-3.5 md:h-3.5" strokeWidth={3} />}
                                            {isCompleted ? 'COMPLETED' : 'MARK DONE'}
                                        </button>
                                    </div>
                                ) : (
                                    [1, 2, 3, 4].map((phase) => {
                                        const isChecked = intensity >= phase;
                                        return (
                                            <div key={phase} className="w-[14%] flex justify-center items-center">
                                                <button
                                                    onClick={() => handleTogglePhased(task.id, phase)}
                                                    className={`w-2.5 h-2.5 md:w-4 md:h-4 rounded-[3px] md:rounded-sm flex items-center justify-center transition-all duration-300 active:scale-90 border-[1px] md:border-[1.5px] ${isChecked ? 'bg-white border-white shadow-[0_0_8px_rgba(255,255,255,0.3)]' : 'bg-transparent border-white/30 hover:border-white/60'}`}
                                                    title={`Set Phase ${phase}`}
                                                >
                                                    {isChecked && (
                                                        <Check className="w-[7px] h-[7px] md:w-2.5 md:h-2.5 text-black" strokeWidth={3} />
                                                    )}
                                                </button>
                                            </div>
                                        );
                                    })
                                )}
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
