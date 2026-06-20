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
            <div className="bg-[#FDFBF7] border border-[#1e293b]/10 rounded-sm p-12 text-center text-[#1e293b]/60 text-sm font-serif">
                No active routines to display.
            </div>
        );
    }

    // Format date nicely if possible, otherwise use todayStr
    const formattedDate = new Date(todayStr).toLocaleDateString('en-US', { month: 'long', day: 'numeric' });

    return (
        <div className="bg-[#FDFBF7] text-[#1e293b] p-8 md:p-12 rounded-sm shadow-[0_20px_50px_rgba(0,0,0,0.5)] transform-gpu transition-all duration-500 animate-in fade-in slide-in-from-bottom-4 max-w-4xl mx-auto">
            
            <div className="text-center mb-10">
                <h2 className="text-4xl md:text-5xl font-serif italic mb-2 tracking-tight">
                    Daily Routine
                </h2>
                <p className="text-xs md:text-sm font-sans tracking-[0.2em] uppercase opacity-60">
                    ({formattedDate})
                </p>
            </div>

            <div className="overflow-x-auto">
                <table className="w-full text-left whitespace-nowrap font-sans">
                    <thead>
                        <tr className="border-y border-[#1e293b]/20">
                            <th className="py-4 font-medium tracking-[0.2em] text-xs uppercase w-1/3 text-[#1e293b]/70">Habit</th>
                            <th className="px-2 py-4 font-medium tracking-[0.2em] text-xs uppercase text-center text-[#1e293b]/70">P1</th>
                            <th className="px-2 py-4 font-medium tracking-[0.2em] text-xs uppercase text-center text-[#1e293b]/70">P2</th>
                            <th className="px-2 py-4 font-medium tracking-[0.2em] text-xs uppercase text-center text-[#1e293b]/70">P3</th>
                            <th className="px-2 py-4 font-medium tracking-[0.2em] text-xs uppercase text-center text-[#1e293b]/70">P4</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-[#1e293b]/5">
                        {activeTasks.map((task, index) => {
                            const currentIntensity = getIntensity(task.id);

                            return (
                                <tr key={task.id} className="group hover:bg-[#1e293b]/[0.02] transition-colors">
                                    <td className="py-5 font-normal text-[#1e293b]">
                                        <span className="truncate max-w-[200px] md:max-w-[300px] text-[15px] tracking-wide">
                                            {index + 1}. {task.name}
                                        </span>
                                    </td>
                                    {[1, 2, 3, 4].map((phase) => {
                                        const isChecked = currentIntensity >= phase;
                                        return (
                                            <td key={phase} className="px-2 py-4 text-center align-middle">
                                                <button
                                                    onClick={() => handleToggle(task.id, phase)}
                                                    className={`mx-auto w-5 h-5 md:w-6 md:h-6 rounded-full flex items-center justify-center transition-all duration-300 active:scale-90 border-[1.5px] ${isChecked ? 'bg-[#1e293b] border-[#1e293b]' : 'bg-transparent border-[#1e293b]/40 hover:border-[#1e293b]/60'}`}
                                                    title={`Set Phase ${phase}`}
                                                >
                                                    {isChecked && (
                                                        <Check className="w-3 h-3 md:w-3.5 md:h-3.5 text-[#FDFBF7]" strokeWidth={3} />
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

            <div className="mt-16 text-center">
                <p className="font-serif italic text-lg md:text-xl text-[#1e293b]/80 tracking-wide">
                    remember, <span className="font-bold">consistency over perfection.</span>
                </p>
            </div>
        </div>
    );
}
