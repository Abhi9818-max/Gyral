"use client";

import { useUserData } from '@/context/user-data-context';
// eslint-disable-next-line @typescript-eslint/no-unused-vars
import { Dumbbell, BookOpen, Droplet, Carrot, Circle, Check, Zap, Brain, Moon, Plus, Calendar as CalendarIcon, ChevronLeft, ChevronRight, MoreVertical, Sparkles, ChevronDown, ChevronUp, Trash2, ListChecks, Edit3, X, Save, Layers } from 'lucide-react';
import { useState, useRef, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useToday } from '@/hooks/use-today';

export function PactWidget() {
    const router = useRouter();
    const {
        pacts, addPact, togglePact, deletePact, shiftPact,
        addDailyPact, dailyPacts, deleteDailyPact,
        addPactSubTask, togglePactSubTask, deletePactSubTask,
        updatePactText, updatePactSubTaskText
    } = useUserData();

    const [newPactText, setNewPactText] = useState('');
    const [isAdding, setIsAdding] = useState(false);
    const [deleteCandidateId, setDeleteCandidateId] = useState<string | null>(null);

    // Initial Sub-Tasks during creation
    const [initialSubTasks, setInitialSubTasks] = useState<string[]>([]);
    const [newSubTaskStepText, setNewSubTaskStepText] = useState('');
    const [showInitialSubTasks, setShowInitialSubTasks] = useState(false);

    // Editing Pact Mode (from 3 dots menu)
    const [editingPactId, setEditingPactId] = useState<string | null>(null);
    const [editPactTitle, setEditPactTitle] = useState('');
    const [editingSubTaskId, setEditingSubTaskId] = useState<string | null>(null);
    const [editSubTaskText, setEditSubTaskText] = useState('');
    const [editAddSubTaskInput, setEditAddSubTaskInput] = useState('');

    // Double click expansion state
    const [expandedPactIds, setExpandedPactIds] = useState<Record<string, boolean>>({});
    const clickTimerRef = useRef<Record<string, NodeJS.Timeout>>({});

    const handlePactClick = (pactId: string) => {
        if (clickTimerRef.current[pactId]) {
            clearTimeout(clickTimerRef.current[pactId]);
            delete clickTimerRef.current[pactId];
            setExpandedPactIds(prev => ({ ...prev, [pactId]: !prev[pactId] }));
        } else {
            clickTimerRef.current[pactId] = setTimeout(() => {
                delete clickTimerRef.current[pactId];
                togglePact(pactId, selectedDate);
            }, 220);
        }
    };

    const todayStr = useToday();
    const [selectedDate, setSelectedDate] = useState(todayStr);
    const dateInputRef = useRef<HTMLInputElement>(null);

    const previousToday = useRef(todayStr);
    useEffect(() => {
        if (todayStr !== previousToday.current) {
            if (selectedDate === previousToday.current) {
                setSelectedDate(todayStr);
            }
            previousToday.current = todayStr;
        }
    }, [todayStr, selectedDate]);
    const isToday = selectedDate === todayStr;
    const displayDate = isToday ? "Today" : new Date(selectedDate).toLocaleDateString(undefined, { month: 'short', day: 'numeric' });

    const currentPacts = pacts[selectedDate] || [];

    const completedCount = currentPacts.filter(p => p.isCompleted).length;
    const totalCount = currentPacts.length;
    const progress = totalCount > 0 ? (completedCount / totalCount) * 100 : 0;

    // Helper: Icon Mapper
    const getIcon = (name: string) => {
        const lower = name.toLowerCase();
        if (lower.includes('workout') || lower.includes('gym') || lower.includes('exercise')) return <Dumbbell className="w-4 h-4" />;
        if (lower.includes('read') || lower.includes('book') || lower.includes('study')) return <BookOpen className="w-4 h-4" />;
        if (lower.includes('water') || lower.includes('drink')) return <Droplet className="w-4 h-4" />;
        if (lower.includes('diet') || lower.includes('eat') || lower.includes('food')) return <Carrot className="w-4 h-4" />;
        if (lower.includes('meditat') || lower.includes('mind')) return <Brain className="w-4 h-4" />;
        if (lower.includes('sleep')) return <Moon className="w-4 h-4" />;
        return <Zap className="w-4 h-4" />; // Generic energetic icon
    };

    const handleAddPact = async (e: React.FormEvent) => {
        e.preventDefault();
        const pactTitle = newPactText.trim();
        if (pactTitle) {
            addPact(pactTitle, selectedDate);

            // Add initial sub-tasks if provided
            if (initialSubTasks.length > 0) {
                const stepsToAdd = [...initialSubTasks];
                setTimeout(() => {
                    const dayPacts = pacts[selectedDate] || [];
                    const createdPact = dayPacts.find(p => p.text.trim().toLowerCase() === pactTitle.toLowerCase());
                    if (createdPact) {
                        stepsToAdd.forEach(step => {
                            if (step.trim()) addPactSubTask(createdPact.id, selectedDate, step.trim());
                        });
                    }
                }, 100);
            }

            setNewPactText('');
            setInitialSubTasks([]);
            setNewSubTaskStepText('');
            setShowInitialSubTasks(false);
            setIsAdding(false);
        }
    };

    const showInput = isAdding;

    return (
        <div className="w-full max-w-2xl mx-auto">
            {/* The Widget Card */}
            <div className="bg-zinc-900/60 backdrop-blur-xl border border-white/10 rounded-3xl p-6 shadow-2xl relative overflow-hidden group transition-all duration-500">

                {/* Header Section */}
                <div className="flex justify-between items-start mb-6">
                    <div>
                        <h2 className="text-2xl font-bold text-white tracking-tight flex items-center gap-2">
                            {displayDate}'s Pacts
                        </h2>
                        <p className="text-zinc-500 font-medium text-sm mt-1">
                            {totalCount === 0
                                ? "What will you conquer?"
                                : completedCount === totalCount
                                    ? "All pacts sealed."
                                    : completedCount > 0
                                        ? "Momentum building..."
                                        : "The path is set."}
                        </p>
                    </div>

                    {/* Controls Group */}
                    <div className="flex items-center gap-4">

                        {/* Hidden (but layout-present) Date Input for positioning */}
                        <div className="relative">
                            <input
                                type="date"
                                ref={dateInputRef}
                                className="absolute top-full right-0 opacity-0 pointer-events-none w-0 h-0"
                                onChange={(e) => {
                                    if (e.target.value) setSelectedDate(e.target.value);
                                }}
                            />
                            {/* Calendar Button */}
                            <button
                                onClick={() => dateInputRef.current?.showPicker()}
                                className="w-10 h-10 rounded-full bg-white/5 hover:bg-white/10 flex items-center justify-center text-zinc-400 hover:text-white transition-all border border-transparent hover:border-white/20"
                                title="Select Date"
                            >
                                <CalendarIcon className="w-5 h-5" />
                            </button>
                        </div>

                        {/* Add Button */}
                        {!showInput && (
                            <button
                                onClick={() => setIsAdding(true)}
                                className="w-10 h-10 bg-white/5 hover:bg-white/10 rounded-full flex items-center justify-center text-zinc-400 hover:text-white transition-all border border-transparent hover:border-white/20"
                                title="Add Pact"
                            >
                                <Plus className="w-5 h-5" />
                            </button>
                        )}

                        {/* Circular Progress */}
                        <div className="relative w-12 h-12 flex items-center justify-center">
                            {/* Track */}
                            <svg className="w-full h-full -rotate-90">
                                <circle
                                    cx="24"
                                    cy="24"
                                    r="20"
                                    className="stroke-white/10 fill-none"
                                    strokeWidth="4"
                                />
                                {/* Progress */}
                                <circle
                                    cx="24"
                                    cy="24"
                                    r="20"
                                    className={`fill-none transition-all duration-1000 ease-out ${completedCount === totalCount ? 'stroke-accent' : 'stroke-white'}`}
                                    strokeWidth="4"
                                    strokeDasharray="125.6"
                                    strokeDashoffset={125.6 - (125.6 * progress) / 100}
                                    strokeLinecap="round"
                                />
                            </svg>
                            <span className="absolute text-xs font-bold text-white">
                                {completedCount}/{totalCount}
                            </span>
                        </div>
                    </div>
                </div>

                {/* Input Form with Sub-Task Steps Option */}
                {showInput && (
                    <form onSubmit={handleAddPact} className="mb-6 bg-black/40 border border-white/15 rounded-2xl p-4 space-y-3 animate-[fadeIn_0.3s_ease-out]">
                        <div className="flex items-center gap-2">
                            <input
                                type="text"
                                value={newPactText}
                                onChange={(e) => setNewPactText(e.target.value)}
                                placeholder={`Add a pact for ${displayDate}...`}
                                autoFocus={isAdding}
                                className="flex-1 bg-black/50 border border-white/10 rounded-xl px-4 py-2.5 text-white placeholder:text-zinc-500 focus:outline-none focus:border-white/30 transition-all text-sm font-medium"
                            />
                            <button
                                type="submit"
                                disabled={!newPactText.trim()}
                                className="px-4 py-2.5 bg-white text-black font-bold rounded-xl text-xs disabled:opacity-50 transition-all hover:scale-105 flex items-center gap-1.5 shrink-0 shadow-md"
                            >
                                <Plus className="w-4 h-4" />
                                <span>Seal Pact</span>
                            </button>
                        </div>

                        {/* Button to expand Initial Sub-Tasks */}
                        {!showInitialSubTasks ? (
                            <button
                                type="button"
                                onClick={() => setShowInitialSubTasks(true)}
                                className="text-xs text-orange-400 hover:text-orange-300 font-semibold flex items-center gap-1.5 transition-colors pt-1"
                            >
                                <Plus className="w-3.5 h-3.5" />
                                <span>+ Add Sub-Task Steps</span>
                            </button>
                        ) : (
                            <div className="space-y-2 pt-2 border-t border-white/10">
                                <div className="flex items-center justify-between">
                                    <span className="text-xs font-bold text-orange-400 flex items-center gap-1">
                                        <ListChecks className="w-3.5 h-3.5" /> Initial Sub-Task Steps ({initialSubTasks.length})
                                    </span>
                                    <button
                                        type="button"
                                        onClick={() => setShowInitialSubTasks(false)}
                                        className="text-[11px] text-zinc-500 hover:text-zinc-300"
                                    >
                                        Hide
                                    </button>
                                </div>

                                {initialSubTasks.map((step, sIdx) => (
                                    <div key={sIdx} className="flex items-center justify-between gap-2 bg-white/5 px-3 py-1.5 rounded-xl text-xs text-zinc-200 border border-white/5">
                                        <span className="font-medium">• {step}</span>
                                        <button
                                            type="button"
                                            onClick={() => setInitialSubTasks(prev => prev.filter((_, idx) => idx !== sIdx))}
                                            className="text-zinc-500 hover:text-red-400 p-0.5"
                                        >
                                            <X className="w-3.5 h-3.5" />
                                        </button>
                                    </div>
                                ))}

                                <div className="flex items-center gap-2">
                                    <input
                                        type="text"
                                        value={newSubTaskStepText}
                                        onChange={(e) => setNewSubTaskStepText(e.target.value)}
                                        placeholder="Add sub-task step (e.g. 10 Warmup Laps)..."
                                        className="flex-1 bg-black/60 border border-white/10 rounded-xl px-3 py-1.5 text-xs text-white placeholder:text-zinc-600 focus:outline-none focus:border-orange-500/40"
                                        onKeyDown={(e) => {
                                            if (e.key === 'Enter') {
                                                e.preventDefault();
                                                if (newSubTaskStepText.trim()) {
                                                    setInitialSubTasks(prev => [...prev, newSubTaskStepText.trim()]);
                                                    setNewSubTaskStepText('');
                                                }
                                            }
                                        }}
                                    />
                                    <button
                                        type="button"
                                        onClick={() => {
                                            if (newSubTaskStepText.trim()) {
                                                setInitialSubTasks(prev => [...prev, newSubTaskStepText.trim()]);
                                                setNewSubTaskStepText('');
                                            }
                                        }}
                                        disabled={!newSubTaskStepText.trim()}
                                        className="px-3 py-1.5 bg-orange-500/20 hover:bg-orange-500/30 border border-orange-500/30 text-orange-300 font-bold rounded-xl text-xs disabled:opacity-40"
                                    >
                                        + Step
                                    </button>
                                </div>
                            </div>
                        )}
                    </form>
                )}

                {/* List */}
                <div className="flex flex-col gap-3">
                    {currentPacts.map(pact => {
                        const isDeleting = deleteCandidateId === pact.id;
                        const isEditing = editingPactId === pact.id;
                        const subTasks = pact.subTasks || [];
                        const completedSubCount = subTasks.filter(s => s.isCompleted).length;
                        const totalSubCount = subTasks.length;

                        // EDIT PACT CARD MODE
                        if (isEditing) {
                            return (
                                <div key={pact.id} className="relative flex flex-col p-4 rounded-2xl bg-zinc-900 border border-orange-500/40 shadow-2xl z-10 animate-[fadeIn_0.2s_ease-out] space-y-4">
                                    <div className="flex items-center justify-between pb-2 border-b border-white/10">
                                        <span className="text-orange-400 font-bold text-xs uppercase tracking-wider flex items-center gap-1.5">
                                            <Edit3 className="w-4 h-4" /> Edit Pact & Sub-Tasks
                                        </span>
                                        <button
                                            onClick={() => setEditingPactId(null)}
                                            className="text-xs px-3.5 py-1 bg-orange-500 text-black font-bold rounded-lg hover:bg-orange-400 transition-colors"
                                        >
                                            Done
                                        </button>
                                    </div>

                                    {/* Edit Main Pact Title */}
                                    <div className="space-y-1">
                                        <label className="text-[11px] text-zinc-400 font-mono">Main Pact Title:</label>
                                        <div className="flex items-center gap-2">
                                            <input
                                                type="text"
                                                value={editPactTitle}
                                                onChange={(e) => setEditPactTitle(e.target.value)}
                                                className="flex-1 bg-black/50 border border-white/20 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-orange-500/50"
                                            />
                                            <button
                                                onClick={() => {
                                                    if (editPactTitle.trim()) {
                                                        updatePactText(pact.id, selectedDate, editPactTitle.trim());
                                                    }
                                                }}
                                                className="px-3 py-2 bg-white/10 hover:bg-white/20 text-white font-bold text-xs rounded-xl border border-white/20 transition-all"
                                            >
                                                Save
                                            </button>
                                        </div>
                                    </div>

                                    {/* Sub-Tasks Management */}
                                    <div className="space-y-2 pt-2 border-t border-white/10">
                                        <span className="text-[11px] text-zinc-400 font-mono flex items-center gap-1">
                                            <ListChecks className="w-3.5 h-3.5 text-orange-400" /> Manage Sub-Tasks ({subTasks.length}):
                                        </span>

                                        {subTasks.map(sub => (
                                            <div key={sub.id} className="flex items-center justify-between gap-2 bg-black/40 p-2.5 rounded-xl border border-white/10">
                                                {editingSubTaskId === sub.id ? (
                                                    <div className="flex items-center gap-2 flex-1">
                                                        <input
                                                            type="text"
                                                            value={editSubTaskText}
                                                            onChange={(e) => setEditSubTaskText(e.target.value)}
                                                            className="flex-1 bg-black border border-orange-500/40 rounded-lg px-2.5 py-1 text-xs text-white"
                                                            autoFocus
                                                        />
                                                        <button
                                                            onClick={() => {
                                                                if (editSubTaskText.trim()) {
                                                                    updatePactSubTaskText(pact.id, selectedDate, sub.id, editSubTaskText.trim());
                                                                }
                                                                setEditingSubTaskId(null);
                                                            }}
                                                            className="px-2.5 py-1 bg-emerald-500 text-white font-bold text-xs rounded-lg"
                                                        >
                                                            Save
                                                        </button>
                                                    </div>
                                                ) : (
                                                    <>
                                                        <span className="text-xs text-zinc-200 flex-1 truncate font-medium">{sub.text}</span>
                                                        <div className="flex items-center gap-1">
                                                            <button
                                                                onClick={() => {
                                                                    setEditingSubTaskId(sub.id);
                                                                    setEditSubTaskText(sub.text);
                                                                }}
                                                                className="p-1 text-zinc-400 hover:text-white rounded"
                                                                title="Rename Sub-task"
                                                            >
                                                                <Edit3 className="w-3.5 h-3.5" />
                                                            </button>
                                                            <button
                                                                onClick={() => deletePactSubTask(pact.id, selectedDate, sub.id)}
                                                                className="p-1 text-zinc-500 hover:text-red-400 rounded"
                                                                title="Delete Sub-task"
                                                            >
                                                                <Trash2 className="w-3.5 h-3.5" />
                                                            </button>
                                                        </div>
                                                    </>
                                                )}
                                            </div>
                                        ))}

                                        {/* Form to Add New Sub-Task in Edit Mode */}
                                        <form
                                            onSubmit={(e) => {
                                                e.preventDefault();
                                                if (editAddSubTaskInput.trim()) {
                                                    addPactSubTask(pact.id, selectedDate, editAddSubTaskInput.trim());
                                                    setEditAddSubTaskInput('');
                                                }
                                            }}
                                            className="flex items-center gap-2 pt-1"
                                        >
                                            <input
                                                type="text"
                                                value={editAddSubTaskInput}
                                                onChange={(e) => setEditAddSubTaskInput(e.target.value)}
                                                placeholder="Add new sub-task step..."
                                                className="flex-1 bg-black/60 border border-white/10 rounded-xl px-3 py-1.5 text-xs text-white placeholder:text-zinc-600 focus:outline-none focus:border-orange-500/40"
                                            />
                                            <button
                                                type="submit"
                                                disabled={!editAddSubTaskInput.trim()}
                                                className="px-3 py-1.5 bg-orange-500/20 hover:bg-orange-500/30 border border-orange-500/30 text-orange-300 font-bold text-xs rounded-xl disabled:opacity-40"
                                            >
                                                + Sub-Task
                                            </button>
                                        </form>
                                    </div>
                                </div>
                            );
                        }

                        // 3 DOTS OPTIONS MENU MODE
                        if (isDeleting) {
                            const matchedDailyPact = dailyPacts?.find(dp => dp.text.trim().toLowerCase() === pact.text.trim().toLowerCase());

                            return (
                                <div key={pact.id} className="relative flex flex-col p-4 rounded-2xl bg-zinc-900/90 border border-zinc-700/50 shadow-xl z-10 animate-[fadeIn_0.2s_ease-out]">
                                    <div className="flex items-center justify-between mb-3">
                                        <span className="text-zinc-300 font-bold text-sm">Pact Options</span>
                                        {matchedDailyPact && (
                                            <span className="text-[10px] px-2 py-0.5 rounded-full bg-orange-500/20 text-orange-300 border border-orange-500/30 uppercase tracking-widest font-bold">
                                                Recurring Daily
                                            </span>
                                        )}
                                    </div>
                                    <div className="flex flex-wrap gap-2">
                                        <button
                                            onClick={() => setDeleteCandidateId(null)}
                                            className="px-3 py-2 rounded-lg bg-white/5 hover:bg-white/10 text-xs font-bold text-zinc-400 hover:text-white transition-colors"
                                        >
                                            CANCEL
                                        </button>

                                        {/* EDIT PACT & SUB-TASKS BUTTON */}
                                        <button
                                            onClick={() => {
                                                setEditingPactId(pact.id);
                                                setEditPactTitle(pact.text);
                                                setDeleteCandidateId(null);
                                            }}
                                            className="px-3 py-2 rounded-lg bg-orange-500/20 hover:bg-orange-500/30 border border-orange-500/30 text-orange-300 text-xs font-bold transition-all flex items-center gap-1.5 shadow-md"
                                        >
                                            <Edit3 className="w-3.5 h-3.5" /> EDIT / SUB-TASKS
                                        </button>

                                        {!matchedDailyPact && (!pact.shiftedCount || pact.shiftedCount < 1) && (
                                            <button
                                                onClick={() => {
                                                    shiftPact(pact.id, selectedDate);
                                                    setDeleteCandidateId(null);
                                                }}
                                                className="px-3 py-2 rounded-lg bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-xs font-bold text-white transition-all flex items-center gap-1 shadow-md"
                                                title="Move to tomorrow"
                                            >
                                                SHIFT <ChevronRight className="w-3 h-3" />
                                            </button>
                                        )}

                                        {!matchedDailyPact && (
                                            <button
                                                onClick={() => {
                                                    addDailyPact(pact.text);
                                                    setDeleteCandidateId(null);
                                                }}
                                                className="px-3 py-2 rounded-lg bg-emerald-600/80 hover:bg-emerald-500 text-xs font-bold text-white transition-colors shadow-md"
                                            >
                                                MAKE DAILY
                                            </button>
                                        )}

                                        {matchedDailyPact && (
                                            <button
                                                onClick={() => {
                                                    deleteDailyPact(matchedDailyPact.id);
                                                    setDeleteCandidateId(null);
                                                }}
                                                className="px-3 py-2 rounded-lg bg-orange-600/80 hover:bg-orange-500 text-xs font-bold text-white transition-colors shadow-md"
                                            >
                                                STOP RECURRING
                                            </button>
                                        )}

                                        <button
                                            onClick={() => {
                                                if (matchedDailyPact) {
                                                    deleteDailyPact(matchedDailyPact.id);
                                                }
                                                deletePact(pact.id, selectedDate);
                                                setDeleteCandidateId(null);
                                            }}
                                            className="px-3 py-2 rounded-lg bg-red-600 hover:bg-red-500 text-xs font-bold text-white transition-colors shadow-md ml-auto"
                                        >
                                            DELETE
                                        </button>
                                    </div>
                                </div>
                            );
                        }

                        const isExpanded = expandedPactIds[pact.id] || false;

                        return (
                            <div
                                key={pact.id}
                                className={`
                                    relative flex flex-col p-3.5 rounded-2xl transition-all duration-300 group/item text-left select-none
                                    ${pact.isCompleted
                                        ? 'bg-white text-black shadow-[0_0_20px_rgba(255,255,255,0.3)]'
                                        : 'bg-zinc-800/40 text-zinc-400 hover:bg-zinc-800/60 hover:text-zinc-200 border border-transparent hover:border-white/5'}
                                `}
                            >
                                <div className="flex items-center justify-between w-full">
                                    <button
                                        onClick={() => handlePactClick(pact.id)}
                                        className="flex items-center gap-3 flex-1 min-w-0 text-left focus:outline-none group/btn cursor-pointer"
                                        title="Click to toggle completion, Double-click to view sub-tasks"
                                    >
                                        <div className={`p-2 rounded-full shrink-0 transition-transform group-hover/btn:scale-105 ${pact.isCompleted ? 'bg-black text-white' : 'bg-white/5 text-current'}`}>
                                            {getIcon(pact.text)}
                                        </div>
                                        <div className="flex items-center gap-2 flex-wrap flex-1 min-w-0">
                                            <span className={`font-bold text-sm break-words whitespace-normal ${pact.isCompleted ? 'line-through decoration-black/20' : ''}`}>
                                                {pact.text}
                                            </span>

                                            {(pact.shiftedCount ?? 0) > 0 && (
                                                <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-blue-500/20 text-blue-300 border border-blue-500/30 whitespace-nowrap">
                                                    Shifted
                                                </span>
                                            )}

                                            {/* VIBRANT ORANGE LOGO BADGE FOR PACTS WITH SUB-TASKS */}
                                            {totalSubCount > 0 && (
                                                <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full border text-[10px] font-mono font-bold shrink-0 shadow-sm ${
                                                    pact.isCompleted
                                                        ? 'bg-orange-500/20 text-orange-950 border-orange-500/50 font-extrabold'
                                                        : 'bg-orange-500/20 text-orange-300 border-orange-500/40'
                                                }`} title="Contains sub-tasks (Double click to view)">
                                                    <ListChecks className="w-3 h-3 text-orange-400 animate-pulse" />
                                                    <span>{completedSubCount}/{totalSubCount}</span>
                                                </span>
                                            )}
                                        </div>
                                    </button>

                                    <div className="flex items-center gap-2 shrink-0 ml-2">
                                        <button
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                setDeleteCandidateId(pact.id);
                                            }}
                                            className={`p-1.5 rounded-lg transition-colors duration-300 ${
                                                pact.isCompleted
                                                    ? 'text-black/40 hover:text-black/70 hover:bg-black/5'
                                                    : 'text-zinc-500 hover:text-white hover:bg-white/5'
                                            }`}
                                            title="Pact Options & Sub-tasks Edit"
                                        >
                                            <MoreVertical className="w-4 h-4" />
                                        </button>

                                        <button
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                togglePact(pact.id, selectedDate);
                                            }}
                                            className={`
                                                w-6 h-6 rounded-full border-2 flex items-center justify-center transition-all duration-300
                                                ${pact.isCompleted
                                                    ? 'border-black bg-black text-white'
                                                    : 'border-zinc-600 hover:border-zinc-400'}
                                            `}
                                            title="Check/Uncheck Pact"
                                        >
                                            {pact.isCompleted && <Check className="w-3.5 h-3.5 stroke-[3]" />}
                                        </button>
                                    </div>
                                </div>

                                {/* Expandable Sub-Tasks Checklist Section (Triggered via Double-Click) */}
                                {isExpanded && (
                                    <div className={`mt-3 pt-3 border-t text-xs space-y-2.5 animate-[fadeIn_0.2s_ease-out] ${
                                        pact.isCompleted ? 'border-black/15 text-black' : 'border-white/10 text-zinc-300'
                                    }`}>
                                        {subTasks.length > 0 ? (
                                            <div className="space-y-1.5">
                                                {subTasks.map(sub => (
                                                    <div
                                                        key={sub.id}
                                                        className={`flex items-center justify-between gap-2 p-2.5 rounded-xl transition-all ${
                                                            pact.isCompleted ? 'bg-black/5 hover:bg-black/10' : 'bg-black/30 hover:bg-black/50 border border-white/5'
                                                        }`}
                                                    >
                                                        <label className="flex items-center gap-2.5 cursor-pointer flex-1 min-w-0">
                                                            <input
                                                                type="checkbox"
                                                                checked={sub.isCompleted}
                                                                onChange={() => togglePactSubTask(pact.id, selectedDate, sub.id)}
                                                                className="w-3.5 h-3.5 accent-orange-500 rounded cursor-pointer shrink-0"
                                                            />
                                                            <span className={`leading-relaxed font-medium break-words ${sub.isCompleted ? 'line-through opacity-60' : ''}`}>
                                                                {sub.text}
                                                            </span>
                                                        </label>
                                                    </div>
                                                ))}
                                            </div>
                                        ) : (
                                            <div className="py-2 text-center text-[11px] text-zinc-400 font-mono italic">
                                                No sub-tasks. Open 3 dots menu ➔ &quot;EDIT / SUB-TASKS&quot; to add steps.
                                            </div>
                                        )}
                                    </div>
                                )}
                            </div>
                        );
                    })}

                    {currentPacts.length === 0 && !showInput && (
                        <div className="text-center py-6 text-zinc-600 italic text-sm">
                            No pacts defined for {displayDate}.
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}

