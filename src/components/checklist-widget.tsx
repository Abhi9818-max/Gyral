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

            <div className="w-full">
                <table className="w-full text-left font-sans table-fixed">
                    <thead>
                        <tr className="border-y border-white/10">
                            <th className="py-3 font-medium tracking-[0.1em] md:tracking-[0.2em] text-[9px] md:text-xs uppercase w-[40%] md:w-1/2 text-zinc-500">Habit</th>
                            <th className="px-0.5 md:px-2 py-3 font-medium tracking-[0.1em] md:tracking-[0.2em] text-[9px] md:text-xs uppercase text-center text-zinc-500 w-[15%] md:w-auto">P1</th>
                            <th className="px-0.5 md:px-2 py-3 font-medium tracking-[0.1em] md:tracking-[0.2em] text-[9px] md:text-xs uppercase text-center text-zinc-500 w-[15%] md:w-auto">P2</th>
                            <th className="px-0.5 md:px-2 py-3 font-medium tracking-[0.1em] md:tracking-[0.2em] text-[9px] md:text-xs uppercase text-center text-zinc-500 w-[15%] md:w-auto">P3</th>
                            <th className="px-0.5 md:px-2 py-3 font-medium tracking-[0.1em] md:tracking-[0.2em] text-[9px] md:text-xs uppercase text-center text-zinc-500 w-[15%] md:w-auto">P4</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-white/5">
                        {activeTasks.map((task, index) => {
                            const currentIntensity = getIntensity(task.id);

                            return (
                                <tr key={task.id} className="group hover:bg-white/[0.02] transition-colors">
                                    <td className="py-3 md:py-5 font-normal text-zinc-300 pr-2">
                                        <div className="line-clamp-2 md:truncate md:max-w-[300px] text-[11px] md:text-[15px] tracking-wide leading-snug">
                                            {index + 1}. {task.name}
                                        </div>
                                    </td>
                                    {[1, 2, 3, 4].map((phase) => {
                                        const isChecked = currentIntensity >= phase;
                                        return (
                                            <td key={phase} className="px-0.5 md:px-2 py-3 md:py-4 text-center align-middle">
                                                <button
                                                    onClick={() => handleToggle(task.id, phase)}
                                                    className={`mx-auto w-4 h-4 md:w-6 md:h-6 rounded-full flex items-center justify-center transition-all duration-300 active:scale-90 border-[1px] md:border-[1.5px] ${isChecked ? 'bg-white border-white' : 'bg-transparent border-white/30 hover:border-white/60'}`}
                                                    title={`Set Phase ${phase}`}
                                                >
                                                    {isChecked && (
                                                        <Check className="w-2.5 h-2.5 md:w-3.5 md:h-3.5 text-black" strokeWidth={3} />
                                                    )}
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

            <div className="mt-8 md:mt-16 text-center">
                <p className="font-serif italic text-sm md:text-xl text-zinc-400 tracking-wide">
                    remember, <span className="font-bold text-zinc-300">consistency over perfection.</span>
                </p>
            </div>
        </div>
    );
}
