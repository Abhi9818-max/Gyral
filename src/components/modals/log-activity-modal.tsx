"use client";

import { useState, useEffect } from 'react';
import { X } from 'lucide-react';
import { useUserData, Task } from '@/context/user-data-context';

interface LogActivityModalProps {
    isOpen: boolean;
    onClose: () => void;
    dateStr: string; // Format: YYYY-MM-DD
}

export function LogActivityModal({ isOpen, onClose, dateStr }: LogActivityModalProps) {
    const { tasks, addRecord, deleteRecord, getRecordsForDate, getTaskAnalytics } = useUserData();
    const [selectedTaskId, setSelectedTaskId] = useState<string>('');
    const [useIntensity, setUseIntensity] = useState(false);
    const [intensity, setIntensity] = useState<number>(1);
    const [metricValue, setMetricValue] = useState<string>(''); // Raw input as string
    const [activePhase, setActivePhase] = useState<number | null>(null); // Calculated intensity
    const [existingRecords, setExistingRecords] = useState<any[]>([]);
    const [analytics, setAnalytics] = useState<any>(null);
    const [expandedRecords, setExpandedRecords] = useState<Set<string>>(new Set());

    const toggleRecordView = (taskId: string) => {
        setExpandedRecords(prev => {
            const next = new Set(prev);
            if (next.has(taskId)) {
                next.delete(taskId);
            } else {
                next.add(taskId);
            }
            return next;
        });
    };

    // Filter out archived tasks for the selection list
    const activeTasks = tasks.filter(t => !t.isArchived);

    useEffect(() => {
        if (isOpen) {
            // Default to first active task if none selected
            if (!selectedTaskId && activeTasks.length > 0) {
                setSelectedTaskId(activeTasks[0].id);
            }

            // Load info for this date
            const records = getRecordsForDate(dateStr);
            setExistingRecords(records);
        }
    }, [isOpen, dateStr, tasks, getRecordsForDate, selectedTaskId]);

    // Load analytics when task changes
    useEffect(() => {
        if (selectedTaskId && getTaskAnalytics) {
            const data = getTaskAnalytics(selectedTaskId);
            setAnalytics(data);
        }
    }, [selectedTaskId, getTaskAnalytics]);

    if (!isOpen) return null;

    const selectedTask = tasks.find(t => t.id === selectedTaskId);

    // Auto-calculate intensity when metric value changes
    useEffect(() => {
        if (!selectedTask?.metricConfig || !metricValue) {
            setActivePhase(null);
            return;
        }

        const val = parseFloat(metricValue);
        if (isNaN(val)) return;

        // Find highest threshold met
        const sortedPhases = [...selectedTask.metricConfig.phases].sort((a, b) => b.threshold - a.threshold);
        const matchedPhase = sortedPhases.find(p => val >= p.threshold);

        if (matchedPhase) {
            setActivePhase(matchedPhase.intensity);
        } else {
            // Below lowest threshold
            setActivePhase(null); // Or phase 0?
        }

    }, [metricValue, selectedTask]);

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (selectedTaskId) {
            if (selectedTask?.metricConfig) {
                // Use calculated intensity or 1 if valid value but defined poorly? 
                // If valid value >= min threshold, use activePhase.
                // If value < min, maybe just default to 1 (Attendance)? Or 0?
                // Let's assume ANY value entry counts as Intensity 1 minimum if strictly below threshold, 
                // or maybe we enforce threshold? 
                // Simple logic: If valid input, use calculated phase (or 1 if below all thresholds but activity done).
                const finalIntensity = activePhase || (parseFloat(metricValue) > 0 ? 1 : null);
                addRecord(dateStr, selectedTaskId, finalIntensity, parseFloat(metricValue));
            } else {
                addRecord(dateStr, selectedTaskId, useIntensity ? intensity : null);
            }
            onClose();
        }
    };

    const handleDeleteRecord = (taskId: string) => {
        deleteRecord(dateStr, taskId);
        // Refresh local view immediately (though useEffect normally handles it if context updates trigger re-render)
        setExistingRecords(prev => prev.filter(r => r.taskId !== taskId));
    };

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
            {/* Backdrop */}
            <div
                className="absolute inset-0 bg-black/80 backdrop-blur-md animate-[fadeIn_0.3s_ease-out]"
                onClick={onClose}
            />

            {/* Modal Content */}
            <div className="relative w-full max-w-md bg-[#0a0a0a] border border-white/10 rounded-xl p-6 shadow-[0_20px_60px_rgba(0,0,0,0.8)] animate-[scaleIn_0.3s_ease-out]">
                <button
                    onClick={onClose}
                    className="absolute right-4 top-4 text-muted-foreground hover:text-white transition-colors"
                >
                    <X className="w-5 h-5" />
                </button>

                <h2 className="text-xl font-bold text-white mb-1 flex items-center gap-2">
                    Log Activity
                </h2>
                <p className="text-sm text-muted-foreground mb-6">{dateStr}</p>

                {/* Existing Records Display */}
                {existingRecords.length > 0 && (
                    <div className="mb-6 space-y-2 animate-[fadeIn_0.3s_ease-out]">
                        <h3 className="text-xs font-bold text-muted-foreground uppercase tracking-widest mb-3">Recorded Activity</h3>
                        {existingRecords.map((record, idx) => {
                            const task = tasks.find(t => t.id === record.taskId);
                            if (!task) return null;

                            const isExpanded = expandedRecords.has(record.taskId);
                            const hasValue = record.value !== undefined && record.value !== null;

                            return (
                                <div key={idx} className="flex items-center justify-between p-3 rounded-lg bg-white/5 border border-white/10 group hover:border-white/30 transition-all">
                                    <div className="flex items-center gap-3">
                                        <div
                                            className="w-3 h-3 rounded-full shadow-[0_0_8px_currentColor]"
                                            style={{ backgroundColor: task.color, color: task.color }}
                                        />
                                        <div className="flex flex-col">
                                            <span className="font-medium text-white">{task.name}</span>
                                            {task.isArchived && <span className="text-[10px] text-accent uppercase tracking-wider">Archived</span>}
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-3">
                                        {(hasValue && isExpanded) ? (
                                            <div
                                                className="text-sm font-bold text-accent select-none cursor-pointer"
                                                onDoubleClick={() => toggleRecordView(record.taskId)}
                                                title="Double-click to see phases"
                                            >
                                                {record.value} {task.metricConfig?.unit}
                                            </div>
                                        ) : (
                                            record.intensity && (
                                                <div
                                                    className="flex gap-0.5 cursor-pointer"
                                                    onDoubleClick={() => hasValue && toggleRecordView(record.taskId)}
                                                    title={hasValue ? "Double-click to see exact value" : "Intensity"}
                                                >
                                                    {Array.from({ length: 4 }).map((_, i) => (
                                                        <div
                                                            key={i}
                                                            className={`w-1 h-3 rounded-full ${i < record.intensity! ? 'bg-accent' : 'bg-white/10'}`}
                                                        />
                                                    ))}
                                                </div>
                                            )
                                        )}
                                        <button
                                            onClick={() => handleDeleteRecord(task.id)}
                                            className="text-muted-foreground hover:text-red-500 transition-colors p-1"
                                            title="Delete Record"
                                        >
                                            <X className="w-4 h-4" />
                                        </button>
                                    </div>
                                </div>
                            );
                        })}
                        <div className="h-px bg-white/10 my-4" />
                    </div>
                )}

                {activeTasks.length === 0 ? (
                    <div className="text-center py-8">
                        <p className="text-muted-foreground mb-4">No active habits available.</p>
                        <button
                            onClick={onClose}
                            className="text-white underline hover:text-accent"
                        >
                            Manage habits
                        </button>
                    </div>
                ) : (
                    <form onSubmit={handleSubmit} className="space-y-6">
                        <div className="space-y-2">
                            <label className="text-sm text-muted-foreground font-medium uppercase tracking-wider">Select Habit</label>
                            <div className="grid grid-cols-1 gap-2 max-h-[200px] overflow-y-auto custom-scrollbar pr-1">
                                {activeTasks.map(task => (
                                    <button
                                        key={task.id}
                                        type="button"
                                        onClick={() => {
                                            setSelectedTaskId(task.id);
                                            setMetricValue('');
                                            setActivePhase(null);
                                        }}
                                        className={`flex items-center gap-3 px-4 py-3 rounded-lg border transition-all ${selectedTaskId === task.id
                                            ? 'bg-white/10 border-accent/50 text-white'
                                            : 'bg-white/5 border-transparent text-muted-foreground hover:bg-white/10'
                                            }`}
                                    >
                                        <div
                                            className="w-3 h-3 rounded-full shadow-[0_0_8px_currentColor]"
                                            style={{ backgroundColor: task.color, color: task.color }}
                                        />
                                        <span className="font-medium">{task.name}</span>
                                    </button>
                                ))}
                            </div>
                        </div>

                        <div className="space-y-4 pt-2 border-t border-white/5">
                            {selectedTask?.metricConfig ? (
                                // --- CUSTOM METRIC INPUT UI ---
                                <div className="space-y-4 animate-[fadeIn_0.3s_ease-out]">
                                    <div className="space-y-2">
                                        <label className="text-sm text-muted-foreground font-medium uppercase tracking-wider flex justify-between">
                                            <span>{selectedTask.metricConfig.unit}</span>
                                            {activePhase && <span className="text-accent">{selectedTask.metricConfig.phases.find(p => p.intensity === activePhase)?.name} (Phase {activePhase})</span>}
                                        </label>
                                        <input
                                            type="number"
                                            value={metricValue}
                                            onChange={(e) => setMetricValue(e.target.value)}
                                            placeholder={analytics ? `Usually ~${analytics.baselineValue} ${selectedTask.metricConfig.unit}` : `Enter ${selectedTask.metricConfig.unit}...`}
                                            className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-4 text-2xl text-white font-bold placeholder:text-white/10 focus:outline-none focus:border-accent/50 focus:bg-white/10 transition-all"
                                            autoFocus
                                        />
                                    </div>

                                    {/* Phase Progress Indicator */}
                                    {metricValue && (
                                        <div className="flex gap-1 h-2">
                                            {selectedTask.metricConfig.phases.map((phase) => (
                                                <div
                                                    key={phase.intensity}
                                                    className={`flex-1 rounded-full transition-all duration-500 ${(activePhase && activePhase >= phase.intensity)
                                                        ? 'bg-accent shadow-[0_0_8px_currentColor]'
                                                        : 'bg-white/10'
                                                        }`}
                                                    title={`${phase.name}: ${phase.threshold} ${selectedTask.metricConfig!.unit}`}
                                                />
                                            ))}
                                        </div>
                                    )}

                                    {/* Feedback text */}
                                    {activePhase && (
                                        <div className="text-xs text-center text-muted-foreground">
                                            Great job! You've hit the <span className="text-white font-bold">"{selectedTask.metricConfig.phases.find(p => p.intensity === activePhase)?.name}"</span> threshold.
                                        </div>
                                    )}
                                </div>
                            ) : (
                                // --- LEGACY INTENSITY UI --- 
                                <>
                                    <div className="flex items-center justify-between">
                                        <label className="text-sm text-muted-foreground font-medium uppercase tracking-wider">Record Intensity?</label>
                                        <button
                                            type="button"
                                            onClick={() => setUseIntensity(!useIntensity)}
                                            className={`w-12 h-6 rounded-full transition-colors relative ${useIntensity ? 'bg-accent' : 'bg-white/20'}`}
                                        >
                                            <div className={`absolute top-1 left-1 bg-white w-4 h-4 rounded-full transition-transform ${useIntensity ? 'translate-x-6' : 'translate-x-0'}`} />
                                        </button>
                                    </div>

                                    {useIntensity && (
                                        <div className="animate-[fadeIn_0.3s_ease-out]">
                                            <div className="flex justify-between gap-2 mt-2">
                                                {[1, 2, 3, 4].map((level) => (
                                                    <button
                                                        key={level}
                                                        type="button"
                                                        onClick={() => setIntensity(level)}
                                                        className={`flex-1 h-12 rounded-lg border flex items-center justify-center font-bold text-lg transition-all ${intensity === level
                                                            ? 'border-white text-white scale-105 shadow-[0_0_15px_rgba(255,255,255,0.2)]'
                                                            : 'border-white/10 bg-white/5 text-muted-foreground hover:bg-white/10'
                                                            }`}
                                                        style={{
                                                            backgroundColor: intensity === level && selectedTask ? selectedTask.color : undefined,
                                                            borderColor: intensity === level && selectedTask ? selectedTask.color : undefined,
                                                            opacity: intensity === level ? 1 : 0.5 + (level * 0.1)
                                                        }}
                                                    >
                                                        {level}
                                                    </button>
                                                ))}
                                            </div>
                                            <div className="flex justify-between text-[10px] text-muted-foreground uppercase mt-2 px-1">
                                                <span>Light</span>
                                                <span>Extreme</span>
                                            </div>
                                        </div>
                                    )}
                                </>
                            )}
                        </div>

                        <div className="pt-4">
                            <button
                                type="submit"
                                className="w-full bg-white text-black font-bold py-3 rounded-lg hover:bg-gray-200 transition-all hover:scale-[1.02] active:scale-[0.98] shadow-[0_0_20px_rgba(255,255,255,0.2)]"
                            >
                                Save Record
                            </button>
                        </div>
                    </form>
                )}
            </div>
        </div>
    );
}
