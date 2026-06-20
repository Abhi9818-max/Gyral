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

            <div className="w-full flex flex-col font-sans gap-2">
                {/* Header */}
                <div className="flex items-center px-2 pb-2 border-b border-white/10">
                    <div className="flex-1 font-medium tracking-[0.2em] text-[10px] md:text-xs uppercase text-zinc-500">Habit</div>
                    <div style={{ display: 'flex', gap: 6, alignItems: 'center', paddingRight: 4 }}>
                        <div style={{ width: 14, textAlign: 'center', fontSize: 8, letterSpacing: '0.1em' }} className="font-medium uppercase text-zinc-500">1</div>
                        <div style={{ width: 14, textAlign: 'center', fontSize: 8, letterSpacing: '0.1em' }} className="font-medium uppercase text-zinc-500">2</div>
                        <div style={{ width: 14, textAlign: 'center', fontSize: 8, letterSpacing: '0.1em' }} className="font-medium uppercase text-zinc-500">3</div>
                        <div style={{ width: 14, textAlign: 'center', fontSize: 8, letterSpacing: '0.1em' }} className="font-medium uppercase text-zinc-500">4</div>
                    </div>
                </div>
                
                {/* Body */}
                <div className="flex flex-col gap-2">
                    {activeTasks.map((task, index) => {
                        const { isCompleted, intensity } = getRecordStatus(task.id);
                        const isBooleanTask = !task.metricConfig || !task.metricConfig.phases || task.metricConfig.phases.length === 0;

                        return (
                            <div key={task.id} className="flex items-center py-1.5 px-2 bg-white/[0.02] rounded-md hover:bg-white/[0.04] transition-colors border border-white/5">
                                <div className="flex-1 font-normal text-zinc-300 pr-4">
                                    <div className="line-clamp-2 text-[11px] md:text-[14px] tracking-wide leading-snug">
                                        {index + 1}. {task.name}
                                    </div>
                                </div>
                                {isBooleanTask ? (
                                    <div className="flex justify-end pr-1">
                                        <button
                                            onClick={() => handleToggleBoolean(task.id)}
                                            className={`w-[80px] py-1 text-[9px] md:text-xs rounded-md flex items-center justify-center gap-1.5 transition-all duration-300 active:scale-95 border-[1px] ${isCompleted ? 'bg-white text-black border-white shadow-[0_0_10px_rgba(255,255,255,0.3)]' : 'bg-transparent text-zinc-400 border-white/30 hover:border-white/60'}`}
                                        >
                                            {isCompleted && <Check className="w-2.5 h-2.5" strokeWidth={3} />}
                                            {isCompleted ? 'DONE' : 'MARK'}
                                        </button>
                                    </div>
                                ) : (
                                    <div style={{ display: 'flex', gap: 6, alignItems: 'center', paddingRight: 4 }}>
                                        {[1, 2, 3, 4].map((phase) => {
                                            const isChecked = intensity >= phase;
                                            return (
                                                <div
                                                    key={phase}
                                                    role="button"
                                                    tabIndex={0}
                                                    onClick={() => handleTogglePhased(task.id, phase)}
                                                    style={{
                                                        width: 14,
                                                        height: 14,
                                                        minWidth: 14,
                                                        minHeight: 14,
                                                        maxWidth: 14,
                                                        maxHeight: 14,
                                                        borderRadius: 3,
                                                        border: isChecked ? '1px solid white' : '1px solid rgba(255,255,255,0.3)',
                                                        backgroundColor: isChecked ? 'white' : 'transparent',
                                                        boxShadow: isChecked ? '0 0 8px rgba(255,255,255,0.3)' : 'none',
                                                        display: 'flex',
                                                        alignItems: 'center',
                                                        justifyContent: 'center',
                                                        cursor: 'pointer',
                                                        transition: 'all 0.3s',
                                                        flexShrink: 0,
                                                    }}
                                                    title={`Set Phase ${phase}`}
                                                >
                                                    {isChecked && (
                                                        <Check style={{ width: 9, height: 9 }} className="text-black" strokeWidth={3} />
                                                    )}
                                                </div>
                                            );
                                        })}
                                    </div>
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
