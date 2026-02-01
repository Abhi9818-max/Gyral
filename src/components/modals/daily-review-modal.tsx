"use client";

import { useState, useEffect } from 'react';
import { X, Check, Moon, Sparkles, ArrowRight } from 'lucide-react';
import { useUserData } from '@/context/user-data-context';

interface DailyReviewModalProps {
    isOpen: boolean;
    onClose: () => void;
}

export function DailyReviewModal({ isOpen, onClose }: DailyReviewModalProps) {
    const { tasks, records, addRecord, deleteRecord } = useUserData();
    const [dateStr, setDateStr] = useState<string>('');
    const [updates, setUpdates] = useState<Record<string, { intensity: number | null, value?: number, isMarked: boolean }>>({});
    const [isSaving, setIsSaving] = useState(false);
    const [reviewedCount, setReviewedCount] = useState(0);

    const activeTasks = tasks.filter(t => !t.isArchived);

    useEffect(() => {
        if (isOpen) {
            const today = new Date();
            const dStr = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`;
            setDateStr(dStr);

            const dayRecords = records[dStr] || [];
            const initialUpdates: Record<string, any> = {};
            let count = 0;

            activeTasks.forEach(task => {
                const rec = dayRecords.find(r => r.taskId === task.id);
                if (rec) {
                    initialUpdates[task.id] = {
                        intensity: rec.intensity,
                        value: rec.value,
                        isMarked: true
                    };
                    count++;
                } else {
                    initialUpdates[task.id] = {
                        intensity: null,
                        value: undefined,
                        isMarked: false
                    };
                }
            });
            setUpdates(initialUpdates);
            setReviewedCount(count);
        }
    }, [isOpen, records, tasks]);

    const handleToggle = (taskId: string) => {
        setUpdates(prev => {
            const isMarked = !prev[taskId]?.isMarked;
            // Update reviewed count roughly
            setReviewedCount(Object.values({ ...prev, [taskId]: { ...prev[taskId], isMarked } }).filter((u: any) => u.isMarked).length);

            return {
                ...prev,
                [taskId]: {
                    ...prev[taskId],
                    isMarked,
                    intensity: isMarked && !prev[taskId]?.intensity ? 1 : prev[taskId]?.intensity
                }
            };
        });
    };

    const handleValueChange = (taskId: string, value: string) => {
        const numVal = parseFloat(value);
        setUpdates(prev => {
            const newState = {
                ...prev,
                [taskId]: {
                    ...prev[taskId],
                    value: isNaN(numVal) ? undefined : numVal,
                    isMarked: value !== ''
                }
            };
            setReviewedCount(Object.values(newState).filter((u: any) => u.isMarked).length);
            return newState;
        });
    };

    const handleSave = async () => {
        setIsSaving(true);
        const promises = activeTasks.map(async (task) => {
            const update = updates[task.id];
            if (update?.isMarked) {
                await addRecord(dateStr, task.id, update.intensity || 1, update.value);
            } else {
                const dayRecords = records[dateStr] || [];
                if (dayRecords.some(r => r.taskId === task.id)) {
                    await deleteRecord(dateStr, task.id);
                }
            }
        });

        await Promise.all(promises);

        // Show success briefly? For now just close.
        setIsSaving(false);
        onClose();
    };

    if (!isOpen) return null;

    const progress = Math.round((reviewedCount / activeTasks.length) * 100) || 0;

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
            {/* Backdrop with Blur */}
            <div className="absolute inset-0 bg-black/80 backdrop-blur-xl animate-[fadeIn_0.5s_ease-out]" onClick={onClose} />

            {/* Main Modal */}
            <div className="relative w-full max-w-lg bg-[#09090b] border border-white/10 rounded-3xl p-0 shadow-[0_0_50px_rgba(0,0,0,0.8)] h-[85vh] flex flex-col animate-[messageSlideIn_0.4s_cubic-bezier(0.16,1,0.3,1)] overflow-hidden">

                {/* Header Section */}
                <div className="relative p-6 pb-2 border-b border-white/5 bg-zinc-900/50">
                    <div className="flex items-center justify-between mb-4">
                        <div>
                            <h2 className="text-2xl font-black text-white flex items-center gap-2 tracking-tight">
                                <Sparkles className="w-5 h-5 text-yellow-500 animate-pulse" /> Ritual Review
                            </h2>
                            <p className="text-zinc-500 text-sm font-medium">{dateStr}</p>
                        </div>
                        <button onClick={onClose} className="p-2 bg-white/5 rounded-full hover:bg-white/10 text-zinc-400 hover:text-white transition-all transform hover:rotate-90">
                            <X className="w-5 h-5" />
                        </button>
                    </div>

                    {/* Progress Bar */}
                    <div className="w-full h-1.5 bg-zinc-800 rounded-full overflow-hidden mb-2">
                        <div
                            className="h-full bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500 transition-all duration-700 ease-out"
                            style={{ width: `${progress}%` }}
                        />
                    </div>
                    <div className="flex justify-between text-[10px] uppercase tracking-widest text-zinc-500 font-bold">
                        <span>Daily Consistency</span>
                        <span>{progress}%</span>
                    </div>
                </div>

                {/* List Container */}
                <div className="flex-1 overflow-y-auto custom-scrollbar p-6 space-y-3">
                    {activeTasks.length === 0 ? (
                        <div className="flex flex-col items-center justify-center h-full text-zinc-500 gap-4">
                            <Moon className="w-12 h-12 opacity-20" />
                            <p>No rituals to review.</p>
                        </div>
                    ) : (
                        activeTasks.map(task => {
                            const state = updates[task.id] || { isMarked: false, intensity: null };
                            const isDone = state.isMarked;

                            return (
                                <div
                                    key={task.id}
                                    onClick={() => handleToggle(task.id)}
                                    className={`group relative p-4 rounded-2xl border transition-all duration-300 cursor-pointer overflow-hidden ${isDone
                                        ? 'bg-zinc-900 border-white/10'
                                        : 'bg-black/20 border-white/5 hover:bg-zinc-900/30 hover:border-white/10'
                                        }`}
                                    style={isDone ? {
                                        boxShadow: `inset 0 0 20px ${task.color}10, 0 4px 20px rgba(0,0,0,0.5)`,
                                        borderColor: `${task.color}40`
                                    } : {}}
                                >
                                    {/* Background Glow Effect */}
                                    {isDone && (
                                        <div
                                            className="absolute inset-0 opacity-10 blur-xl transition-all duration-500"
                                            style={{ background: `radial-gradient(circle at center, ${task.color}, transparent 70%)` }}
                                        />
                                    )}

                                    <div className="relative flex items-center gap-4 z-10">
                                        {/* Custom Checkbox */}
                                        <div
                                            className={`flex-shrink-0 w-10 h-10 rounded-xl border flex items-center justify-center transition-all duration-300 ${isDone
                                                ? 'bg-white text-black scale-100'
                                                : 'bg-white/5 border-white/10 text-transparent scale-90 group-hover:scale-95'
                                                }`}
                                            style={isDone ? {
                                                borderColor: task.color,
                                                backgroundColor: task.color,
                                                color: '#000' // Assuming dark text on colored bg, or white on dark? Let's use black text for vibrant colors.
                                            } : {}}
                                        >
                                            <Check className="w-6 h-6" strokeWidth={3} />
                                        </div>

                                        {/* Task Details */}
                                        <div className="flex-1 min-w-0">
                                            <h3 className={`font-bold text-lg leading-tight transition-colors duration-300 ${isDone ? 'text-white' : 'text-zinc-400 group-hover:text-zinc-200'}`}>
                                                {task.name}
                                            </h3>

                                            <div className="mt-4" onClick={e => e.stopPropagation()}>
                                                {task.metricConfig ? (
                                                    <div className="space-y-3 animate-[fadeIn_0.3s_ease-out]">
                                                        {/* Animated Phase Selector */}
                                                        {task.metricConfig.phases && task.metricConfig.phases.length > 0 && isDone && (
                                                            <div className="space-y-1.5">
                                                                <div className="text-[10px] uppercase tracking-widest text-zinc-500 font-bold pl-1">Select Intensity</div>
                                                                <div className="flex flex-wrap gap-2">
                                                                    {task.metricConfig.phases.sort((a, b) => a.threshold - b.threshold).map(phase => {
                                                                        const isActivePhase = (state.value || 0) >= phase.threshold;
                                                                        // Actually, active means we met the threshold.

                                                                        return (
                                                                            <button
                                                                                key={phase.name}
                                                                                onClick={(e) => {
                                                                                    e.stopPropagation();
                                                                                    handleValueChange(task.id, phase.threshold.toString());
                                                                                }}
                                                                                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all duration-300 relative overflow-hidden group/phase ${isActivePhase
                                                                                    ? 'text-black shadow-[0_0_15px_rgba(255,255,255,0.4)] scale-105'
                                                                                    : 'bg-white/5 text-zinc-500 hover:bg-white/10 hover:text-white border border-white/5'
                                                                                    }`}
                                                                                style={isActivePhase ? {
                                                                                    backgroundColor: 'white',
                                                                                    borderColor: 'white'
                                                                                } : {}}
                                                                            >
                                                                                <span className="relative z-10">{phase.name}</span>
                                                                                {isActivePhase && <div className="absolute inset-0 bg-gradient-to-tr from-transparent via-white to-transparent opacity-50 animate-[shimmer_1s_infinite]" />}
                                                                            </button>
                                                                        );
                                                                    })}
                                                                </div>
                                                            </div>
                                                        )}

                                                        {/* Precision Metric Input */}
                                                        {isDone && (
                                                            <div className="bg-black/40 rounded-xl p-3 border border-white/5 flex items-center justify-between group/input hover:border-white/10 transition-colors">
                                                                <span className="text-xs text-zinc-500 font-bold uppercase tracking-wider pl-1">Exact Value</span>
                                                                <div className="flex items-center gap-2">
                                                                    <input
                                                                        type="number"
                                                                        placeholder="0"
                                                                        value={state.value || ''}
                                                                        onChange={(e) => handleValueChange(task.id, e.target.value)}
                                                                        className="bg-transparent text-right text-xl font-black text-white w-24 focus:outline-none placeholder:text-zinc-800"
                                                                    />
                                                                    <span className="text-xs text-zinc-500 font-bold">{task.metricConfig.unit}</span>
                                                                </div>
                                                            </div>
                                                        )}
                                                    </div>
                                                ) : (
                                                    // "Square Cells" Intensity Bar
                                                    isDone && (
                                                        <div className="animate-[fadeIn_0.3s_ease-out] w-full max-w-[200px]">
                                                            <div className="flex justify-between text-[10px] uppercase font-bold text-zinc-500 mb-2 px-1">
                                                                <span>Effort Level</span>
                                                                <span className="text-white">{state.intensity === 4 ? 'MAXIMUM' : state.intensity === 3 ? 'High' : state.intensity === 2 ? 'Medium' : 'Low'}</span>
                                                            </div>
                                                            <div className="flex gap-2 h-8">
                                                                {[1, 2, 3, 4].map(lvl => {
                                                                    const isActive = (state.intensity || 0) >= lvl;
                                                                    return (
                                                                        <button
                                                                            key={lvl}
                                                                            onClick={(e) => {
                                                                                e.stopPropagation();
                                                                                setUpdates(prev => ({
                                                                                    ...prev,
                                                                                    [task.id]: { ...prev[task.id], intensity: lvl }
                                                                                }));
                                                                            }}
                                                                            className={`flex-1 aspect-square rounded-md transition-all duration-200 ${isActive
                                                                                ? 'bg-white'
                                                                                : 'bg-zinc-800 hover:bg-zinc-700'
                                                                                }`}
                                                                        />
                                                                    );
                                                                })}
                                                            </div>
                                                        </div>
                                                    )
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            );
                        })
                    )}
                </div>

                {/* Footer Action */}
                <div className="p-6 bg-zinc-900/80 backdrop-blur-md border-t border-white/5">
                    <button
                        onClick={handleSave}
                        disabled={isSaving}
                        className="group w-full py-4 bg-white text-black font-black text-lg uppercase tracking-widest rounded-xl hover:bg-slate-200 transition-all duration-300 hover:scale-[1.01] active:scale-[0.99] shadow-[0_0_30px_rgba(255,255,255,0.15)] disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-3 relative overflow-hidden"
                    >
                        {/* Shimmer overlay */}
                        <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/50 to-transparent translate-x-[-100%] group-hover:animate-[shimmer_1.5s_infinite]" />

                        {isSaving ? (
                            <span>Committing to Memory...</span>
                        ) : (
                            <>
                                End The Day <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                            </>
                        )}
                    </button>
                    <p className="text-center text-[10px] text-zinc-600 mt-3 font-medium uppercase tracking-widest">
                        Consistent action creates character
                    </p>
                </div>
            </div>
        </div>
    );
}
