"use client";

import { useState, useEffect } from 'react';
import { X, Check, ChevronDown } from 'lucide-react';
import { useUserData, MetricConfig } from '@/context/user-data-context';
import { METRIC_TEMPLATES } from '@/data/metric-templates';

/* Cinematic Deep Colors */
const PRESET_COLORS = [
    { name: 'Emerald', value: '#10b981' },
    { name: 'Red', value: '#ef4444' },
    { name: 'Blue', value: '#3b82f6' },
    { name: 'Purple', value: '#a855f7' },
    { name: 'Amber', value: '#f59e0b' },
    { name: 'Pink', value: '#ec4899' },
    { name: 'Cyan', value: '#06b6d4' },
];

interface AddTaskModalProps {
    isOpen: boolean;
    onClose: () => void;
}

export function AddTaskModal({ isOpen, onClose }: AddTaskModalProps) {
    const { tasks, addTask, updateTask, deleteTask, toggleTaskArchive } = useUserData();
    const [isEditing, setIsEditing] = useState<string | null>(null);
    const [taskName, setTaskName] = useState('');
    const [selectedColor, setSelectedColor] = useState(PRESET_COLORS[0].value);
    const [isDeleteConfirm, setIsDeleteConfirm] = useState<string | null>(null);

    // Metric State
    const [useMetric, setUseMetric] = useState(false);
    const [selectedTemplate, setSelectedTemplate] = useState('');
    const [metricUnit, setMetricUnit] = useState('');
    const [metricPhases, setMetricPhases] = useState<MetricConfig['phases']>([]);

    // Reset state when modal opens/closes
    useEffect(() => {
        if (!isOpen) {
            resetForm();
        }
    }, [isOpen]);

    const resetForm = () => {
        setTaskName('');
        setSelectedColor(PRESET_COLORS[0].value);
        setIsEditing(null);
        setIsDeleteConfirm(null);
        setUseMetric(false);
        setSelectedTemplate('');
        setMetricUnit('');
        setMetricPhases([]);
    };

    if (!isOpen) return null;

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (taskName.trim()) {
            if (isEditing) {
                // If editing, we might be adding metrics to an existing task
                // For now, complex edit logic might be needed if preserving old data, 
                // but let's allow overwriting config.
                updateTask(isEditing, {
                    name: taskName,
                    color: selectedColor,
                    metricConfig: useMetric ? { unit: metricUnit, phases: metricPhases } : undefined
                });
            } else {
                addTask(
                    taskName,
                    selectedColor,
                    useMetric ? { unit: metricUnit, phases: metricPhases } : undefined
                );
            }
            resetForm();
            // Don't close immediately so they can see/add more, unless it was an edit? 
            // UX choice: Close on create, keep open on edit? Let's close for now to be simple.
            onClose();
        }
    };

    const handleEditClick = (task: any) => {
        setIsEditing(task.id);
        setTaskName(task.name);
        setSelectedColor(task.color);
        setIsDeleteConfirm(null); // Cancel any delete in progress

        if (task.metricConfig) {
            setUseMetric(true);
            setMetricUnit(task.metricConfig.unit);
            setMetricPhases(task.metricConfig.phases);
            // Try to match template name? Not strictly necessary
        } else {
            setUseMetric(false);
            setMetricUnit('');
            setMetricPhases([]);
        }
    };

    const applyTemplate = (templateKey: string) => {
        const template = METRIC_TEMPLATES[templateKey];
        if (template) {
            setMetricUnit(template.unit);
            setMetricPhases(template.phases);
            setSelectedTemplate(templateKey);
        }
    };

    const handlePhaseChange = (index: number, field: 'threshold' | 'name', value: string | number) => {
        const newPhases = [...metricPhases];
        newPhases[index] = { ...newPhases[index], [field]: value };
        setMetricPhases(newPhases);
    };

    const handleDeleteClick = (taskId: string) => {
        if (isDeleteConfirm === taskId) {
            deleteTask(taskId);
            setIsDeleteConfirm(null);
            if (isEditing === taskId) resetForm();
        } else {
            setIsDeleteConfirm(taskId);
        }
    };

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
            {/* Backdrop */}
            <div
                className="absolute inset-0 bg-black/60 backdrop-blur-sm animate-[fadeIn_0.3s_ease-out]"
                onClick={onClose}
            />

            {/* Modal Content */}
            <div className="relative w-full max-w-md bg-[#0a0a0a] border border-white/10 rounded-xl p-6 shadow-[0_20px_60px_rgba(0,0,0,0.8)] animate-[scaleIn_0.3s_ease-out] max-h-[90vh] overflow-y-auto custom-scrollbar">
                <button
                    onClick={onClose}
                    className="absolute right-4 top-4 text-muted-foreground hover:text-white transition-colors"
                >
                    <X className="w-5 h-5" />
                </button>

                <h2 className="text-xl font-bold text-white mb-6 flex items-center gap-2">
                    <span className="text-accent">●</span> {isEditing ? 'Edit Habit' : 'Manage Habits'}
                </h2>

                <form onSubmit={handleSubmit} className="space-y-6">
                    <div className="space-y-2">
                        <label className="text-sm text-muted-foreground font-medium uppercase tracking-wider">
                            {isEditing ? 'Update Name' : 'New Habit Name'}
                        </label>
                        <input
                            type="text"
                            value={taskName}
                            onChange={(e) => setTaskName(e.target.value)}
                            placeholder="e.g. Reading, Running, Meditation"
                            className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-3 text-white placeholder:text-white/20 focus:outline-none focus:border-accent/50 focus:bg-white/10 transition-all"
                            autoFocus={!isEditing}
                        />
                    </div>



                    {/* Metric Configuration Section */}
                    <div className="pt-2 border-t border-white/10">
                        <div className="flex items-center justify-between mb-4">
                            <label className="text-sm text-muted-foreground font-medium uppercase tracking-wider">
                                Measurement Strategy
                            </label>
                            <button
                                type="button"
                                onClick={() => {
                                    setUseMetric(!useMetric);
                                    if (!useMetric && metricPhases.length === 0) {
                                        // Default init if turning on
                                        setMetricUnit('Units');
                                        setMetricPhases([
                                            { name: 'Start', threshold: 1, intensity: 1 },
                                            { name: 'Build', threshold: 5, intensity: 2 },
                                            { name: 'High', threshold: 10, intensity: 3 },
                                            { name: 'Max', threshold: 20, intensity: 4 },
                                        ]);
                                    }
                                }}
                                className={`text-xs px-2 py-1 rounded transition-colors ${useMetric ? 'bg-accent/20 text-accent border border-accent/50' : 'bg-white/5 text-muted-foreground hover:bg-white/10'}`}
                            >
                                {useMetric ? 'Custom Metrics ON' : 'Standard (Yes/No)'}
                            </button>
                        </div>

                        {useMetric && (
                            <div className="space-y-4 animate-[fadeIn_0.3s_ease-out]">
                                {/* Template Selector */}
                                <div className="space-y-2">
                                    <label className="text-xs text-muted-foreground">Load Template (Optional)</label>
                                    <div className="grid grid-cols-2 gap-2">
                                        {Object.entries(METRIC_TEMPLATES).map(([key, temp]) => (
                                            <button
                                                key={key}
                                                type="button"
                                                onClick={() => applyTemplate(key)}
                                                className={`text-left px-3 py-2 rounded border text-xs transition-all ${selectedTemplate === key ? 'bg-white/10 border-accent text-white' : 'bg-black/20 border-white/10 text-muted-foreground hover:bg-white/5'}`}
                                            >
                                                <div className="font-bold">{temp.name}</div>
                                                <div className="opacity-60">{temp.unit}</div>
                                            </button>
                                        ))}
                                    </div>
                                </div>

                                <div className="space-y-2">
                                    <label className="text-xs text-muted-foreground">Unit Name</label>
                                    <input
                                        type="text"
                                        value={metricUnit}
                                        onChange={(e) => setMetricUnit(e.target.value)}
                                        className="w-full bg-white/5 border border-white/10 rounded px-3 py-2 text-sm text-white"
                                        placeholder="e.g. Pages, Minutes"
                                    />
                                </div>

                                <div className="space-y-3">
                                    <label className="text-xs text-muted-foreground">Phase Thresholds</label>
                                    <div className="space-y-2">
                                        {metricPhases.map((phase, idx) => (
                                            <div key={idx} className="flex items-center gap-2 bg-white/5 p-2 rounded border border-white/5">
                                                <div className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold text-black shrink-0 ${idx === 0 ? 'bg-yellow-400' :
                                                        idx === 1 ? 'bg-orange-500' :
                                                            idx === 2 ? 'bg-red-500' : 'bg-blue-500'
                                                    }`}>
                                                    {idx + 1}
                                                </div>
                                                <div className="flex-1">
                                                    <input
                                                        type="text"
                                                        value={phase.name}
                                                        onChange={(e) => handlePhaseChange(idx, 'name', e.target.value)}
                                                        className="w-full bg-transparent text-xs text-white placeholder:text-white/20 focus:outline-none"
                                                        placeholder="Phase Name"
                                                    />
                                                </div>
                                                <div className="flex items-center gap-2">
                                                    <span className="text-xs text-muted-foreground">≥</span>
                                                    <input
                                                        type="number"
                                                        value={phase.threshold}
                                                        onChange={(e) => handlePhaseChange(idx, 'threshold', parseInt(e.target.value) || 0)}
                                                        className="w-16 bg-black/40 border border-white/10 rounded px-2 py-1 text-xs text-white text-right focus:border-accent"
                                                    />
                                                    <span className="text-xs text-muted-foreground w-8 truncate">{metricUnit}</span>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            </div>
                        )}
                    </div>

                    <div className="pt-2">
                        <button
                            type="submit"
                            disabled={!taskName.trim()}
                            className="w-full bg-white text-black font-bold py-3 rounded-lg hover:bg-gray-200 transition-all hover:scale-[1.02] active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed shadow-[0_0_20px_rgba(255,255,255,0.2)]"
                        >
                            {isEditing ? 'Save Changes' : 'Start Tracking'}
                        </button>
                        {isEditing && (
                            <button
                                type="button"
                                onClick={resetForm}
                                className="w-full mt-2 text-sm text-muted-foreground hover:text-white py-2"
                            >
                                Cancel Edit
                            </button>
                        )}
                    </div>
                </form >

                {/* Existing Habits List */}
                {
                    tasks.length > 0 && !isEditing && (
                        <div className="mt-8 pt-6 border-t border-white/10">
                            <h3 className="text-sm text-muted-foreground font-medium uppercase tracking-wider mb-4">Existing Habits</h3>
                            <div className="space-y-2">
                                {tasks.map(task => (
                                    <div key={task.id} className={`flex items-center justify-between p-3 rounded-lg border transition-all ${task.isArchived ? 'opacity-50 bg-black/40 border-white/5' : 'bg-white/5 border-white/10 hover:border-white/20'}`}>
                                        <div className="flex items-center gap-3">
                                            <div
                                                className="w-3 h-3 rounded-full shadow-[0_0_8px_currentColor]"
                                                style={{ backgroundColor: task.color, color: task.color }}
                                            />
                                            <div className="flex flex-col">
                                                <span className={`font-medium text-white ${task.isArchived ? 'line-through text-muted-foreground' : ''}`}>{task.name}</span>
                                                {task.isArchived && <span className="text-[10px] text-accent uppercase tracking-wider">Archived</span>}
                                            </div>
                                        </div>

                                        <div className="flex items-center gap-1">
                                            <button
                                                onClick={() => handleEditClick(task)}
                                                className="p-2 text-muted-foreground hover:text-white hover:bg-white/10 rounded-md transition-colors"
                                                title="Edit"
                                            >
                                                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M17 3a2.85 2.83 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5Z" /></svg>
                                            </button>
                                            <button
                                                onClick={() => toggleTaskArchive(task.id)}
                                                className="p-2 text-muted-foreground hover:text-amber-400 hover:bg-white/10 rounded-md transition-colors"
                                                title={task.isArchived ? "Restore" : "End Journey (Archive)"}
                                            >
                                                {task.isArchived ?
                                                    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74-2.74L3 12" /></svg>
                                                    :
                                                    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect width="20" height="5" x="2" y="3" rx="1" /><path d="M4 8v11a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8" /></svg>
                                                }
                                            </button>
                                            <button
                                                onClick={() => handleDeleteClick(task.id)}
                                                className={`p-2 rounded-md transition-colors ${isDeleteConfirm === task.id ? 'bg-red-500/20 text-red-500 animate-pulse' : 'text-muted-foreground hover:text-red-500 hover:bg-white/10'}`}
                                                title="Delete"
                                            >
                                                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M3 6h18" /><path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6" /><path d="M8 6V4c0-1 1-2 2-2h4c0 1 1 2 2 2v2" /></svg>
                                            </button>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )
                }
            </div >
        </div >
    );
}
