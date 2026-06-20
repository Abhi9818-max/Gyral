"use client";

import { useUserData } from "@/context/user-data-context";
import { useToday } from "@/hooks/use-today";
import { Check } from "lucide-react";

export function ChecklistWidget() {
    const { tasks, records, addRecord, deleteRecord } = useUserData();
    const todayStr = useToday();

    const activeTasks = tasks.filter(t => !t.isArchived);

    const getIntensity = (taskId: string) => {
        const todaysRecords = records[todayStr] || [];
        const record = todaysRecords.find(r => r.taskId === taskId);
        return record?.intensity || 0;
    };

    const handleToggle = async (taskId: string, targetPhase: number) => {
        const currentIntensity = getIntensity(taskId);
        if (currentIntensity === targetPhase) {
            // Uncheck
            await deleteRecord(todayStr, taskId);
        } else {
            // Update to target phase
            await addRecord(todayStr, taskId, targetPhase);
        }
    };

    if (activeTasks.length === 0) {
        return (
            <div className="bg-zinc-900/40 border border-white/10 rounded-2xl p-6 text-center text-muted-foreground text-sm shadow-xl">
                No active tasks to display in Checklist Mode.
            </div>
        );
    }

    return (
        <div className="bg-black/60 backdrop-blur-xl border border-white/10 rounded-3xl overflow-hidden shadow-[0_8px_30px_rgba(0,0,0,0.5)] transform-gpu transition-all duration-500 animate-in fade-in slide-in-from-bottom-4">
            <div className="px-6 py-4 border-b border-white/10 bg-white/5 flex items-center justify-between">
                <h2 className="text-lg font-bold text-white tracking-wider flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-accent animate-pulse" />
                    DAILY CHECKLIST
                </h2>
                <span className="text-xs font-mono text-muted-foreground bg-white/5 px-2 py-1 rounded">
                    {todayStr}
                </span>
            </div>
            <div className="overflow-x-auto custom-scrollbar">
                <table className="w-full text-left text-sm whitespace-nowrap">
                    <thead>
                        <tr className="border-b border-white/5">
                            <th className="px-6 py-4 font-semibold text-muted-foreground/80 tracking-widest text-xs uppercase w-1/3">Task</th>
                            <th className="px-4 py-4 font-semibold text-muted-foreground/80 tracking-widest text-xs uppercase text-center w-1/6">P1</th>
                            <th className="px-4 py-4 font-semibold text-muted-foreground/80 tracking-widest text-xs uppercase text-center w-1/6">P2</th>
                            <th className="px-4 py-4 font-semibold text-muted-foreground/80 tracking-widest text-xs uppercase text-center w-1/6">P3</th>
                            <th className="px-4 py-4 font-semibold text-muted-foreground/80 tracking-widest text-xs uppercase text-center w-1/6">P4</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-white/5">
                        {activeTasks.map((task) => {
                            const currentIntensity = getIntensity(task.id);

                            return (
                                <tr key={task.id} className="hover:bg-white/[0.03] transition-colors group">
                                    <td className="px-6 py-5 font-medium text-white flex items-center gap-3">
                                        <div className="w-2.5 h-2.5 rounded-full shadow-sm" style={{ backgroundColor: task.color || '#3b82f6', boxShadow: `0 0 10px ${task.color || '#3b82f6'}40` }} />
                                        <span className="truncate max-w-[140px] md:max-w-[250px] text-[15px] group-hover:text-white text-zinc-300 transition-colors">{task.name}</span>
                                    </td>
                                    {[1, 2, 3, 4].map((phase) => {
                                        const isChecked = currentIntensity >= phase;
                                        const isExact = currentIntensity === phase;
                                        return (
                                            <td key={phase} className="px-2 py-3 text-center align-middle">
                                                <button
                                                    onClick={() => handleToggle(task.id, phase)}
                                                    className={`mx-auto w-7 h-7 md:w-9 md:h-9 rounded-lg flex items-center justify-center transition-all duration-300 active:scale-90 ${isChecked ? 'bg-accent/10 border-accent/50 text-accent shadow-[0_0_15px_rgba(52,211,153,0.2)]' : 'bg-black/40 border-white/10 text-transparent hover:bg-white/10 hover:border-white/30'} border-[1.5px]`}
                                                    title={`Set Phase ${phase}`}
                                                >
                                                    {isExact ? (
                                                        <Check className="w-4 h-4 md:w-5 md:h-5 drop-shadow-[0_0_5px_rgba(52,211,153,0.8)]" strokeWidth={3} />
                                                    ) : isChecked ? (
                                                        <div className="w-1.5 h-1.5 rounded-full bg-accent/60 drop-shadow-[0_0_2px_rgba(52,211,153,0.5)]" />
                                                    ) : null}
                                                </button>
                                            </td>
                                        );
                                    })}
                                </tr>
                            );
                        })}
                    </tbody>
                </table>
            </div>
        </div>
    );
}
