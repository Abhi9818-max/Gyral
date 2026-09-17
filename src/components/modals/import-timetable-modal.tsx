"use client";

import { useState, useRef, useEffect } from "react";
import { useUserData } from "@/context/user-data-context";
import { useToday } from "@/hooks/use-today";
import { parseISO, format, isBefore, addDays } from "date-fns";
import {
    X,
    Sparkles,
    Upload,
    Check,
    FileText,
    Dumbbell,
    Target,
    Zap,
    Image as ImageIcon,
    Loader2,
    RefreshCw,
    CheckCircle2,
    Copy,
    Repeat,
    HelpCircle,
    Clock,
    TrendingUp,
    Trash2,
    History,
    AlertTriangle,
    Plus,
    Edit3,
    Calendar
} from "lucide-react";

interface ImportTimetableModalProps {
    isOpen: boolean;
    onClose: () => void;
}

export interface ParsedPactItem {
    text: string;
    subTasks?: string[];
    phase?: string;
    startDate?: string;
    endDate?: string;
}

interface ParsedTimetableData {
    title: string;
    duration?: string;
    phases?: string[];
    pacts: (string | ParsedPactItem)[];
    tasks: string[];
    goals: string[];
    fullTimetableNote: string;
}

export interface ImportLog {
    id: string;
    title: string;
    duration?: string;
    importedAt: string;
    noteId?: string;
    pactTexts: string[];
    taskNames: string[];
    goalTitles: string[];
}

const UNIVERSAL_AI_PROMPT = `Great! Now please organize and format the entire routine and advice we just discussed into a structured, progressive timetable for my Gyral discipline system.

Requirements:
1. Target Timeframe & Duration: Specify a realistic total duration (e.g. 3 Months, 12 Weeks, 30 Days) to see drastic results and noticeable transformation.
2. Progressive Phased Variation: Break the plan down into progressive phases so intensity scales over time (e.g. Phase 1: Light Foundation/Form start, Phase 2: Moderate intensity, Phase 3: Advanced peak). Do NOT recommend a flat, static workload for 8 months.
3. Daily Habits & Pacts: Actionable daily items with time blocks (e.g. 7:00 AM Gym Workout, Read 20 pages before bed, No sugar after 8 PM).
4. Core Habit Trackers: Key habits and metrics to track daily.
5. Target Goals & Milestones: Realistic transformation achievements.
6. Full Timetable: A clean, time-blocked daily & weekly schedule from morning to night formatted with bullet points.

Make it clear, structured, and easy to copy so I can paste it directly into Gyral.`;

export function ImportTimetableModal({ isOpen, onClose }: ImportTimetableModalProps) {
    const {
        pacts,
        dailyPacts,
        tasks,
        notes,
        lifeEvents,
        addPact,
        deletePact,
        addDailyPact,
        deleteDailyPact,
        addTask,
        deleteTask,
        addLifeEvent,
        deleteLifeEvent,
        addNote,
        deleteNote
    } = useUserData();

    const todayStr = useToday();

    // Step state: 'INPUT' | 'PREVIEW' | 'SUCCESS' | 'HISTORY'
    const [step, setStep] = useState<'INPUT' | 'PREVIEW' | 'SUCCESS' | 'HISTORY'>('INPUT');

    // Input state
    const [rawText, setRawText] = useState("");
    const [fileBase64, setFileBase64] = useState<string | null>(null);
    const [fileName, setFileName] = useState<string | null>(null);
    const [fileMimeType, setFileMimeType] = useState<string | null>(null);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [copiedPrompt, setCopiedPrompt] = useState(false);
    const [showPromptHelp, setShowPromptHelp] = useState(false);

    // Parsed data state
    const [parsedData, setParsedData] = useState<ParsedTimetableData | null>(null);
    const [selectedPacts, setSelectedPacts] = useState<boolean[]>([]);
    const [makePactsRecurring, setMakePactsRecurring] = useState(true); // Auto-present across all days!
    const [selectedTasks, setSelectedTasks] = useState<boolean[]>([]);
    const [selectedGoals, setSelectedGoals] = useState<boolean[]>([]);
    const [includeNote, setIncludeNote] = useState(true);
    const [previewFilterDate, setPreviewFilterDate] = useState<string | null>(null);

    // History / Logs state
    const [importLogs, setImportLogs] = useState<ImportLog[]>([]);
    const [deletingLogId, setDeletingLogId] = useState<string | null>(null);

    const fileInputRef = useRef<HTMLInputElement>(null);

    // Preview Edit Handlers
    const handleUpdateTitle = (newTitle: string) => {
        if (!parsedData) return;
        setParsedData({ ...parsedData, title: newTitle });
    };

    const handleUpdateNote = (newNote: string) => {
        if (!parsedData) return;
        setParsedData({ ...parsedData, fullTimetableNote: newNote });
    };

    const handleUpdatePact = (index: number, newText: string) => {
        if (!parsedData) return;
        const updated = [...parsedData.pacts];
        const existing = updated[index];
        if (typeof existing === 'string') {
            updated[index] = { text: newText, subTasks: [] };
        } else {
            updated[index] = { ...existing, text: newText };
        }
        setParsedData({ ...parsedData, pacts: updated });
    };

    const handleUpdatePactSubTask = (pactIdx: number, subIdx: number, newText: string) => {
        if (!parsedData) return;
        const updated = [...parsedData.pacts];
        const existing = updated[pactIdx];
        const itemObj = typeof existing === 'string' ? { text: existing, subTasks: [] } : { ...existing };
        const updatedSubs = [...(itemObj.subTasks || [])];
        updatedSubs[subIdx] = newText;
        itemObj.subTasks = updatedSubs;
        updated[pactIdx] = itemObj;
        setParsedData({ ...parsedData, pacts: updated });
    };

    const handleRemovePactSubTask = (pactIdx: number, subIdx: number) => {
        if (!parsedData) return;
        const updated = [...parsedData.pacts];
        const existing = updated[pactIdx];
        const itemObj = typeof existing === 'string' ? { text: existing, subTasks: [] } : { ...existing };
        const updatedSubs = (itemObj.subTasks || []).filter((_, i) => i !== subIdx);
        itemObj.subTasks = updatedSubs;
        updated[pactIdx] = itemObj;
        setParsedData({ ...parsedData, pacts: updated });
    };

    const handleAddPactSubTask = (pactIdx: number) => {
        if (!parsedData) return;
        const updated = [...parsedData.pacts];
        const existing = updated[pactIdx];
        const itemObj = typeof existing === 'string' ? { text: existing, subTasks: [] } : { ...existing };
        const updatedSubs = [...(itemObj.subTasks || []), "New Exercise / Step"];
        itemObj.subTasks = updatedSubs;
        updated[pactIdx] = itemObj;
        setParsedData({ ...parsedData, pacts: updated });
    };

    const handleRemovePact = (index: number) => {
        if (!parsedData) return;
        const updatedPacts = parsedData.pacts.filter((_, i) => i !== index);
        const updatedSelected = selectedPacts.filter((_, i) => i !== index);
        setParsedData({ ...parsedData, pacts: updatedPacts });
        setSelectedPacts(updatedSelected);
    };

    const handleAddPact = () => {
        if (!parsedData) return;
        setParsedData({ ...parsedData, pacts: [...parsedData.pacts, "New Daily Pact"] });
        setSelectedPacts([...selectedPacts, true]);
    };

    const handleUpdateTask = (index: number, newText: string) => {
        if (!parsedData) return;
        const updated = [...parsedData.tasks];
        updated[index] = newText;
        setParsedData({ ...parsedData, tasks: updated });
    };

    const handleRemoveTask = (index: number) => {
        if (!parsedData) return;
        const updatedTasks = parsedData.tasks.filter((_, i) => i !== index);
        const updatedSelected = selectedTasks.filter((_, i) => i !== index);
        setParsedData({ ...parsedData, tasks: updatedTasks });
        setSelectedTasks(updatedSelected);
    };

    const handleAddTask = () => {
        if (!parsedData) return;
        setParsedData({ ...parsedData, tasks: [...parsedData.tasks, "New Habit Tracker"] });
        setSelectedTasks([...selectedTasks, true]);
    };

    const handleUpdateGoal = (index: number, newText: string) => {
        if (!parsedData) return;
        const updated = [...parsedData.goals];
        updated[index] = newText;
        setParsedData({ ...parsedData, goals: updated });
    };

    const handleRemoveGoal = (index: number) => {
        if (!parsedData) return;
        const updatedGoals = parsedData.goals.filter((_, i) => i !== index);
        const updatedSelected = selectedGoals.filter((_, i) => i !== index);
        setParsedData({ ...parsedData, goals: updatedGoals });
        setSelectedGoals(updatedSelected);
    };

    const handleAddGoal = () => {
        if (!parsedData) return;
        setParsedData({ ...parsedData, goals: [...parsedData.goals, "New Goal"] });
        setSelectedGoals([...selectedGoals, true]);
    };

    // Load import logs from localStorage when modal opens
    useEffect(() => {
        if (isOpen && typeof window !== "undefined") {
            try {
                const stored = localStorage.getItem('gyral_ai_import_logs');
                if (stored) {
                    setImportLogs(JSON.parse(stored));
                }
            } catch (e) {
                console.error("[ImportLogs] Failed to parse logs:", e);
            }
        }
    }, [isOpen]);

    if (!isOpen) return null;

    // Copy Prompt Helper
    const handleCopyPrompt = () => {
        navigator.clipboard.writeText(UNIVERSAL_AI_PROMPT);
        setCopiedPrompt(true);
        setTimeout(() => setCopiedPrompt(false), 2500);
    };

    // Handle File / Screenshot / PDF Selection
    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        const isImage = file.type.startsWith("image/");
        const isPdf = file.type === "application/pdf" || file.name.endsWith(".pdf");

        if (!isImage && !isPdf) {
            setError("Please upload a PDF document (.pdf) or image file (PNG, JPG, WEBP)");
            return;
        }

        setFileName(file.name);
        setFileMimeType(isPdf ? "application/pdf" : file.type);
        setError(null);

        const reader = new FileReader();
        reader.onload = (event) => {
            setFileBase64(event.target?.result as string);
        };
        reader.readAsDataURL(file);
    };

    const handleClearFile = () => {
        setFileBase64(null);
        setFileName(null);
        setFileMimeType(null);
        if (fileInputRef.current) fileInputRef.current.value = "";
    };

    // Trigger Gemini API Parser
    const handleParse = async () => {
        if (!rawText.trim() && !fileBase64) {
            setError("Please paste routine text or upload a PDF document / screenshot.");
            return;
        }

        setIsLoading(true);
        setError(null);

        try {
            const res = await fetch("/api/ai/parse-timetable", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    text: rawText.trim() || undefined,
                    fileBase64: fileBase64 || undefined,
                    fileMimeType: fileMimeType || undefined
                })
            });

            const json = await res.json();

            if (!res.ok || json.error) {
                throw new Error(json.error || "Failed to parse timetable");
            }

            const data: ParsedTimetableData = json.data;
            setParsedData(data);
            setSelectedPacts(new Array(data.pacts.length).fill(true));
            setSelectedTasks(new Array(data.tasks.length).fill(true));
            setSelectedGoals(new Array(data.goals.length).fill(true));
            setIncludeNote(true);
            setStep('PREVIEW');
        } catch (err: any) {
            console.error("[Parse error]:", err);
            setError(err.message || "An error occurred while analyzing the timetable. Please try again.");
        } finally {
            setIsLoading(false);
        }
    };

    // Confirm Import into Gyral Context
    const handleImport = async () => {
        if (!parsedData) return;

        setIsLoading(true);
        try {
            const importId = crypto.randomUUID();
            const importedPactTexts: string[] = [];
            const importedTaskNames: string[] = [];
            const importedGoalTitles: string[] = [];

            // 1. Add selected Pacts (with Sub-Tasks & Date Range Expansion)
            const seenPacts = new Set<string>();
            parsedData.pacts.forEach((pactObj, idx) => {
                if (selectedPacts[idx]) {
                    const pactText = typeof pactObj === 'string' ? pactObj : pactObj.text;
                    const pactSubs = typeof pactObj === 'string' ? [] : pactObj.subTasks || [];
                    const startDateStr = typeof pactObj === 'string' ? undefined : pactObj.startDate;
                    const endDateStr = typeof pactObj === 'string' ? undefined : pactObj.endDate;

                    if (!pactText.trim()) return;

                    const cleanPact = pactText.trim();
                    const lower = cleanPact.toLowerCase();
                    if (seenPacts.has(lower)) return;
                    seenPacts.add(lower);

                    importedPactTexts.push(cleanPact);

                    // If a date range is specified (e.g. 12 Sept to 25 Sept), expand pact to EVERY date in range!
                    if (startDateStr && endDateStr) {
                        try {
                            const start = parseISO(startDateStr);
                            const end = parseISO(endDateStr);
                            if (!isNaN(start.getTime()) && !isNaN(end.getTime()) && !isBefore(end, start)) {
                                let curr = start;
                                while (!isBefore(end, curr)) {
                                    const dStr = format(curr, 'yyyy-MM-dd');
                                    addPact(cleanPact, dStr, pactSubs);
                                    curr = addDays(curr, 1);
                                }
                                return;
                            }
                        } catch (e) {
                            console.error("[DateRangeExpand Error]:", e);
                        }
                    }

                    if (makePactsRecurring) {
                        addDailyPact(cleanPact);
                    }
                    addPact(cleanPact, todayStr, pactSubs);
                }
            });

            // 2. Add selected Habit Tasks
            const seenTasks = new Set<string>();
            const taskColors = ["#3b82f6", "#10b981", "#8b5cf6", "#ec4899", "#f59e0b"];
            parsedData.tasks.forEach((taskName, idx) => {
                if (selectedTasks[idx] && taskName.trim()) {
                    const cleanTask = taskName.trim();
                    const lower = cleanTask.toLowerCase();
                    if (seenTasks.has(lower)) return;
                    seenTasks.add(lower);

                    importedTaskNames.push(cleanTask);
                    const color = taskColors[importedTaskNames.length % taskColors.length];
                    addTask(cleanTask, color);
                }
            });

            // 3. Add selected Goals
            const seenGoals = new Set<string>();
            parsedData.goals.forEach((goalText, idx) => {
                if (selectedGoals[idx] && goalText.trim()) {
                    const cleanGoal = goalText.trim();
                    const lower = cleanGoal.toLowerCase();
                    if (seenGoals.has(lower)) return;
                    seenGoals.add(lower);

                    importedGoalTitles.push(cleanGoal);
                    addLifeEvent({
                        event_date: todayStr,
                        title: cleanGoal,
                        description: `Extracted from AI Routine: ${parsedData.title} (${parsedData.duration || 'Progressive'})`,
                        type: 'GOAL'
                    });
                }
            });

            // 4. Save formatted Markdown timetable note with embedded importId tag
            let createdNoteId: string | undefined;
            if (includeNote && parsedData.fullTimetableNote) {
                const noteContent = `<!-- GYRAL_AI_IMPORT:${importId} -->\n` + parsedData.fullTimetableNote;
                const newNote = await addNote(
                    parsedData.title || "AI Timetable & Routine",
                    noteContent
                );
                if (newNote && newNote.id) {
                    createdNoteId = newNote.id;
                }
            }

            // 5. Save log to localStorage
            const newLog: ImportLog = {
                id: importId,
                title: parsedData.title || "AI Timetable & Routine",
                duration: parsedData.duration,
                importedAt: new Date().toISOString(),
                noteId: createdNoteId,
                pactTexts: importedPactTexts,
                taskNames: importedTaskNames,
                goalTitles: importedGoalTitles
            };

            const updatedLogs = [newLog, ...importLogs];
            setImportLogs(updatedLogs);
            if (typeof window !== "undefined") {
                localStorage.setItem('gyral_ai_import_logs', JSON.stringify(updatedLogs));
            }

            setStep('SUCCESS');
        } catch (err: any) {
            console.error("[Import error]:", err);
            setError("Failed to import items into Gyral.");
        } finally {
            setIsLoading(false);
        }
    };

    // Purge / Delete an Import Log Completely
    const handleDeleteImportLog = async (log: ImportLog) => {
        setDeletingLogId(log.id);
        try {
            // 1. Delete associated Note
            if (log.noteId) {
                await deleteNote(log.noteId);
            }
            // Fallback: search notes for GYRAL_AI_IMPORT tag matching log.id or title
            const matchingNote = notes.find(n => n.content.includes(`GYRAL_AI_IMPORT:${log.id}`) || (log.title && n.title === log.title));
            if (matchingNote && matchingNote.id !== log.noteId) {
                await deleteNote(matchingNote.id);
            }

            // 2. Delete associated Daily Pacts
            dailyPacts.forEach(dp => {
                if (log.pactTexts.includes(dp.text)) {
                    deleteDailyPact(dp.id);
                }
            });

            // 3. Delete date-specific Pacts across dates
            Object.entries(pacts).forEach(([dateStr, datePactsList]) => {
                datePactsList.forEach(p => {
                    if (log.pactTexts.includes(p.text)) {
                        deletePact(p.id, dateStr);
                    }
                });
            });

            // 4. Delete associated Tasks
            tasks.forEach(t => {
                if (log.taskNames.includes(t.name)) {
                    deleteTask(t.id);
                }
            });

            // 5. Delete associated Life Events / Goals
            lifeEvents.forEach(le => {
                if (log.goalTitles.includes(le.title)) {
                    deleteLifeEvent(le.id);
                }
            });

            // 6. Remove log entry from localStorage and state
            const updatedLogs = importLogs.filter(l => l.id !== log.id);
            setImportLogs(updatedLogs);
            if (typeof window !== "undefined") {
                localStorage.setItem('gyral_ai_import_logs', JSON.stringify(updatedLogs));
            }
        } catch (err: any) {
            console.error("[Delete import log error]:", err);
            setError("Failed to completely remove all imported items.");
        } finally {
            setDeletingLogId(null);
        }
    };

    const handleReset = () => {
        setStep('INPUT');
        setRawText("");
        setFileBase64(null);
        setFileName(null);
        setFileMimeType(null);
        setParsedData(null);
        setError(null);
    };

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
            {/* Backdrop */}
            <div className="absolute inset-0 bg-black/80 backdrop-blur-md" onClick={onClose} />

            {/* Modal Container */}
            <div className="relative w-full max-w-2xl bg-[#09090b] border border-white/10 rounded-3xl p-6 sm:p-8 shadow-[0_0_50px_rgba(0,0,0,0.9)] max-h-[90vh] flex flex-col overflow-hidden animate-in fade-in zoom-in-95 duration-200">
                {/* Header */}
                <div className="flex items-center justify-between pb-4 border-b border-white/10 mb-4">
                    <div className="flex items-center gap-3">
                        <div className="p-2.5 bg-accent/10 border border-accent/20 rounded-2xl text-accent">
                            <Sparkles className="w-5 h-5 animate-pulse" />
                        </div>
                        <div>
                            <h2 className="text-xl font-bold tracking-wide text-white flex items-center gap-2">
                                AI Timetable & Routine Importer
                            </h2>
                            <p className="text-xs text-zinc-400">
                                Import gym schedules & timetables from ChatGPT / Claude
                            </p>
                        </div>
                    </div>
                    <button
                        onClick={onClose}
                        className="p-2 text-zinc-400 hover:text-white hover:bg-white/5 rounded-full transition-all"
                    >
                        <X className="w-5 h-5" />
                    </button>
                </div>

                {/* Step Switcher Tabs (New Import vs Manage & Delete Imports) */}
                <div className="flex items-center gap-2 mb-6 bg-white/5 p-1 rounded-2xl border border-white/10">
                    <button
                        type="button"
                        onClick={() => { if (step !== 'PREVIEW') setStep('INPUT'); }}
                        className={`flex-1 py-2 px-3 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-2 ${
                            step === 'INPUT' || step === 'PREVIEW' || step === 'SUCCESS'
                                ? 'bg-accent text-black shadow-md'
                                : 'text-zinc-400 hover:text-white'
                        }`}
                    >
                        <Sparkles className="w-3.5 h-3.5" />
                        Import Timetable
                    </button>

                    <button
                        type="button"
                        onClick={() => setStep('HISTORY')}
                        className={`flex-1 py-2 px-3 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-2 ${
                            step === 'HISTORY'
                                ? 'bg-accent text-black shadow-md'
                                : 'text-zinc-400 hover:text-white'
                        }`}
                    >
                        <History className="w-3.5 h-3.5" />
                        Manage & Delete Logs ({importLogs.length})
                    </button>
                </div>

                {/* Error Banner */}
                {error && (
                    <div className="mb-6 p-4 bg-red-500/10 border border-red-500/20 text-red-400 text-sm rounded-xl flex items-center justify-between animate-in fade-in">
                        <span>{error}</span>
                        <button onClick={() => setError(null)} className="text-red-400 hover:text-white">
                            <X className="w-4 h-4" />
                        </button>
                    </div>
                )}

                {/* STEP 1: INPUT VIEW */}
                {step === 'INPUT' && (
                    <div className="space-y-6 overflow-y-auto pr-1">
                        {/* Copy Universal AI Follow-Up Prompt Box */}
                        <div className="bg-accent/5 border border-accent/20 rounded-2xl p-4 space-y-3">
                            <div className="flex items-center justify-between">
                                <div className="flex items-center gap-2 text-accent font-bold text-xs uppercase tracking-wider">
                                    <Sparkles className="w-4 h-4" />
                                    Universal AI Follow-Up Prompt
                                </div>
                                <button
                                    type="button"
                                    onClick={() => setShowPromptHelp(!showPromptHelp)}
                                    className="text-xs text-zinc-400 hover:text-white flex items-center gap-1"
                                >
                                    <HelpCircle className="w-3.5 h-3.5" />
                                    {showPromptHelp ? "Hide Prompt" : "Show Prompt"}
                                </button>
                            </div>
                            <p className="text-xs text-zinc-300">
                                Already chatting with ChatGPT, Claude, or Gemini? Copy and paste this prompt at the end of your conversation to instantly format your routine for Gyral!
                            </p>
                            
                            {showPromptHelp && (
                                <div className="bg-black/50 border border-white/10 rounded-xl p-3 text-xs font-mono text-zinc-300 leading-relaxed max-h-36 overflow-y-auto select-all">
                                    {UNIVERSAL_AI_PROMPT}
                                </div>
                            )}

                            <button
                                type="button"
                                onClick={handleCopyPrompt}
                                className="w-full bg-accent/10 hover:bg-accent/20 border border-accent/30 text-accent font-bold text-xs py-2.5 rounded-xl transition-all flex items-center justify-center gap-2"
                            >
                                {copiedPrompt ? (
                                    <>
                                        <Check className="w-4 h-4 text-emerald-400" />
                                        <span className="text-emerald-400">Copied to Clipboard! Paste into your ChatGPT/Claude chat</span>
                                    </>
                                ) : (
                                    <>
                                        <Copy className="w-4 h-4" />
                                        Copy Follow-Up Prompt to Clipboard
                                    </>
                                )}
                            </button>
                        </div>

                        {/* Textarea Input */}
                        <div className="space-y-2">
                            <label className="text-xs uppercase tracking-widest text-zinc-400 font-mono flex items-center gap-2">
                                <FileText className="w-4 h-4 text-accent" />
                                Paste ChatGPT / Claude / Gemini Timetable Response
                            </label>
                            <textarea
                                value={rawText}
                                onChange={(e) => setRawText(e.target.value)}
                                placeholder="Paste your AI-generated timetable here... (e.g. '7:00 AM - Gym Workout: Heavy Push Day, 8:30 AM - Breakfast, 9:00 PM - Read 20 pages...')"
                                className="w-full h-32 bg-white/5 border border-white/10 rounded-2xl p-4 text-sm text-white placeholder:text-zinc-600 focus:outline-none focus:border-accent/40 focus:ring-1 focus:ring-accent/40 transition-all font-mono resize-none"
                            />
                        </div>

                        {/* Document & Image Upload Input */}
                        <div className="space-y-2">
                            <label className="text-xs uppercase tracking-widest text-zinc-400 font-mono flex items-center gap-2">
                                <Upload className="w-4 h-4 text-purple-400" />
                                Or Upload PDF Routine / Screenshot
                            </label>
                            <div className="relative border border-dashed border-white/15 hover:border-accent/40 rounded-2xl p-5 text-center transition-all bg-white/[0.02] hover:bg-white/[0.04] group">
                                <input
                                    type="file"
                                    ref={fileInputRef}
                                    onChange={handleFileChange}
                                    accept=".pdf,application/pdf,image/*"
                                    className="absolute inset-0 opacity-0 cursor-pointer w-full h-full z-10"
                                />
                                {fileBase64 ? (
                                    <div className="flex items-center justify-between p-3 bg-white/5 border border-white/10 rounded-xl">
                                        <div className="flex items-center gap-3 overflow-hidden">
                                            {fileMimeType === "application/pdf" ? (
                                                <FileText className="w-8 h-8 text-rose-400 shrink-0" />
                                            ) : (
                                                <img src={fileBase64} alt="Routine screenshot preview" className="w-10 h-10 object-cover rounded-lg border border-white/10" />
                                            )}
                                            <div className="flex flex-col text-left overflow-hidden">
                                                <span className="text-sm font-mono text-zinc-200 truncate max-w-[200px]">{fileName}</span>
                                                <span className="text-[10px] text-emerald-400 font-semibold">{fileMimeType === "application/pdf" ? "PDF Document Ready" : "Image Ready"}</span>
                                            </div>
                                        </div>
                                        <button
                                            type="button"
                                            onClick={(e) => { e.stopPropagation(); handleClearFile(); }}
                                            className="p-1.5 text-zinc-400 hover:text-red-400 z-20 transition-colors"
                                        >
                                            <X className="w-4 h-4" />
                                        </button>
                                    </div>
                                ) : (
                                    <div className="flex flex-col items-center gap-2">
                                        <Upload className="w-7 h-7 text-zinc-500 group-hover:text-accent transition-colors" />
                                        <p className="text-sm text-zinc-300 font-medium">Click or drag PDF document or image</p>
                                        <p className="text-xs text-zinc-500">Supports PDF, PNG, JPG, WEBP</p>
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* Submit Parse Button */}
                        <div className="pt-2">
                            <button
                                onClick={handleParse}
                                disabled={isLoading}
                                className="w-full bg-accent hover:bg-accent/90 text-black font-bold py-4 rounded-2xl transition-all shadow-[0_0_25px_rgba(255,255,255,0.2)] flex items-center justify-center gap-3 disabled:opacity-50"
                            >
                                {isLoading ? (
                                    <>
                                        <Loader2 className="w-5 h-5 animate-spin" />
                                        Analyzing Routine with AI...
                                    </>
                                ) : (
                                    <>
                                        <Sparkles className="w-5 h-5" />
                                        Parse Routine & Extract Items
                                    </>
                                )}
                            </button>
                        </div>
                    </div>
                )}

                {/* STEP 2: PREVIEW & CUSTOMIZATION VIEW */}
                {step === 'PREVIEW' && parsedData && (
                    <div className="space-y-6 overflow-y-auto pr-1 max-h-[65vh]">
                        {/* Title & Progressive Timeframe Card */}
                        <div className="p-4 bg-white/5 border border-white/10 rounded-2xl space-y-3">
                            <div className="flex items-center justify-between gap-2">
                                <span className="text-[10px] uppercase tracking-widest text-zinc-400 font-mono flex items-center gap-1">
                                    <Edit3 className="w-3 h-3 text-accent" /> Routine Title (Editable)
                                </span>
                                {parsedData.duration && (
                                    <span className="text-xs font-mono font-bold text-accent px-2.5 py-1 bg-accent/10 border border-accent/20 rounded-full flex items-center gap-1.5 shrink-0">
                                        <Clock className="w-3.5 h-3.5" />
                                        {parsedData.duration}
                                    </span>
                                )}
                            </div>
                            <input
                                type="text"
                                value={parsedData.title}
                                onChange={(e) => handleUpdateTitle(e.target.value)}
                                className="w-full text-base font-bold text-white bg-black/40 border border-white/20 rounded-xl px-3 py-1.5 focus:outline-none focus:border-accent"
                                placeholder="Routine title..."
                            />

                            {/* Progressive Phases Breakdown */}
                            {parsedData.phases && parsedData.phases.length > 0 && (
                                <div className="pt-3 border-t border-white/10 space-y-2">
                                    <span className="text-[10px] uppercase tracking-widest text-zinc-400 font-mono block">Progressive Workload Scaling</span>
                                    <div className="space-y-1.5">
                                        {parsedData.phases.map((phase, pIdx) => (
                                            <div key={pIdx} className="text-xs text-zinc-300 flex items-start gap-2 bg-white/5 p-2.5 rounded-xl border border-white/5">
                                                <TrendingUp className="w-4 h-4 text-accent shrink-0 mt-0.5" />
                                                <span className="font-mono">{phase}</span>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}
                        </div>

                        {/* Category 1: Daily Pacts */}
                        <div className="space-y-3">
                            <div className="flex flex-col gap-2">
                                <div className="flex items-center justify-between">
                                    <h4 className="text-xs uppercase tracking-widest text-zinc-400 font-mono flex items-center gap-2">
                                        <Dumbbell className="w-4 h-4 text-accent" />
                                        Daily Pacts ({parsedData.pacts.length})
                                    </h4>
                                    <div className="flex items-center gap-2">
                                        <button
                                            onClick={handleAddPact}
                                            className="text-xs px-2.5 py-1 rounded-lg bg-accent/20 hover:bg-accent/30 text-accent font-semibold flex items-center gap-1 transition-all"
                                        >
                                            <Plus className="w-3 h-3" /> Add Pact
                                        </button>
                                    </div>
                                </div>

                                {/* Calendar Date Picker Bar */}
                                <div className="flex items-center justify-between gap-2 bg-white/5 border border-white/10 p-2 rounded-xl">
                                    <div className="flex items-center gap-1.5 text-xs text-accent font-semibold">
                                        <Calendar className="w-4 h-4 text-accent shrink-0" />
                                        <span>Preview Date:</span>
                                    </div>
                                    <div className="flex items-center gap-1">
                                        <input
                                            type="date"
                                            value={previewFilterDate || ''}
                                            onChange={(e) => setPreviewFilterDate(e.target.value || null)}
                                            className="bg-black/60 border border-white/20 rounded-lg px-2 py-1 text-[11px] text-white font-mono focus:outline-none focus:border-accent"
                                        />
                                        {previewFilterDate && (
                                            <button
                                                onClick={() => setPreviewFilterDate(null)}
                                                className="p-1 rounded-lg text-zinc-400 hover:text-white hover:bg-white/10 transition-colors text-[10px]"
                                                title="Clear date filter"
                                            >
                                                <X className="w-3.5 h-3.5" />
                                            </button>
                                        )}
                                    </div>
                                </div>

                                {previewFilterDate && (
                                    <div className="text-[11px] font-mono text-emerald-300 bg-emerald-500/10 border border-emerald-500/30 px-3 py-1 rounded-xl flex items-center justify-between">
                                        <span>Showing active pacts for: {previewFilterDate}</span>
                                        <span className="font-bold">
                                            {parsedData.pacts.filter(pObj => {
                                                const pStart = typeof pObj === 'string' ? undefined : pObj.startDate;
                                                const pEnd = typeof pObj === 'string' ? undefined : pObj.endDate;
                                                if (!pStart || !pEnd) return true;
                                                return previewFilterDate >= pStart && previewFilterDate <= pEnd;
                                            }).length} Active
                                        </span>
                                    </div>
                                )}
                            </div>

                            <label className="flex items-center justify-between p-3.5 bg-accent/5 border border-accent/20 rounded-xl cursor-pointer hover:bg-accent/10 transition-all">
                                <div className="flex items-center gap-2.5">
                                    <Repeat className="w-4 h-4 text-accent" />
                                    <div>
                                        <span className="text-xs font-bold text-white block">Make Pacts Recurring Daily</span>
                                        <span className="text-[11px] text-zinc-400">Pacts automatically populate on every day</span>
                                    </div>
                                </div>
                                <input
                                    type="checkbox"
                                    checked={makePactsRecurring}
                                    onChange={(e) => setMakePactsRecurring(e.target.checked)}
                                    className="w-4 h-4 rounded border-white/20 bg-black text-accent focus:ring-accent"
                                />
                            </label>

                            <div className="space-y-3">
                                {parsedData.pacts.map((pactObj, idx) => {
                                    const pactText = typeof pactObj === 'string' ? pactObj : pactObj.text;
                                    const pactSubTasks = typeof pactObj === 'string' ? [] : pactObj.subTasks || [];
                                    const pactPhase = typeof pactObj === 'string' ? undefined : pactObj.phase;
                                    const pactStart = typeof pactObj === 'string' ? undefined : pactObj.startDate;
                                    const pactEnd = typeof pactObj === 'string' ? undefined : pactObj.endDate;

                                    const isFilteredOut = previewFilterDate && pactStart && pactEnd &&
                                        (previewFilterDate < pactStart || previewFilterDate > pactEnd);

                                    if (isFilteredOut) return null;

                                    return (
                                        <div
                                            key={idx}
                                            className={`p-3 rounded-2xl border transition-all space-y-2 ${
                                                selectedPacts[idx]
                                                    ? 'bg-accent/10 border-accent/30 text-white'
                                                    : 'bg-white/5 border-white/5 text-zinc-500'
                                            }`}
                                        >
                                            {/* Date Range Badge if available */}
                                            {pactStart && pactEnd && (
                                                <div className="flex items-center justify-between text-[10px] font-mono text-emerald-300 bg-emerald-500/15 border border-emerald-400/30 px-2.5 py-0.5 rounded-full">
                                                    <span className="flex items-center gap-1 font-bold">
                                                        <Calendar className="w-3 h-3 text-emerald-400" />
                                                        Active: {pactStart} → {pactEnd}
                                                    </span>
                                                    <span className="text-emerald-200 font-sans text-[9px] font-semibold">
                                                        (Applies to all dates in range)
                                                    </span>
                                                </div>
                                            )}

                                            <div className="flex items-center gap-3">
                                                <input
                                                    type="checkbox"
                                                    checked={selectedPacts[idx] || false}
                                                    onChange={(e) => {
                                                        const updated = [...selectedPacts];
                                                        updated[idx] = e.target.checked;
                                                        setSelectedPacts(updated);
                                                    }}
                                                    className="rounded border-white/20 bg-black text-accent focus:ring-accent shrink-0"
                                                />
                                                <input
                                                    type="text"
                                                    value={pactText}
                                                    onChange={(e) => handleUpdatePact(idx, e.target.value)}
                                                    className={`flex-1 bg-transparent text-xs font-bold text-white placeholder-zinc-500 focus:outline-none border-b border-transparent focus:border-accent/40 py-0.5 ${!selectedPacts[idx] ? 'line-through opacity-40' : ''}`}
                                                    placeholder="Pact description..."
                                                />
                                                {pactPhase && (
                                                    <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-accent/20 text-accent border border-accent/30 shrink-0">
                                                        {pactPhase}
                                                    </span>
                                                )}
                                                <button
                                                    onClick={() => handleRemovePact(idx)}
                                                    className="p-1 rounded-lg text-zinc-500 hover:text-rose-400 hover:bg-rose-500/10 transition-colors"
                                                    title="Remove pact"
                                                >
                                                    <Trash2 className="w-3.5 h-3.5" />
                                                </button>
                                            </div>

                                            {/* Sub-Tasks Checklist Section */}
                                            <div className="pl-6 space-y-1.5 border-l-2 border-accent/20 ml-2">
                                                {pactSubTasks.map((sub, sIdx) => (
                                                    <div key={sIdx} className="flex items-center gap-2 text-xs">
                                                        <span className="w-1.5 h-1.5 rounded-full bg-accent/60 shrink-0" />
                                                        <input
                                                            type="text"
                                                            value={sub}
                                                            onChange={(e) => handleUpdatePactSubTask(idx, sIdx, e.target.value)}
                                                            placeholder="Sub-task / exercise step..."
                                                            className="flex-1 bg-black/40 border border-white/10 rounded-lg px-2.5 py-1 text-[11px] text-zinc-200 placeholder-zinc-500 focus:outline-none focus:border-accent/50"
                                                        />
                                                        <button
                                                            onClick={() => handleRemovePactSubTask(idx, sIdx)}
                                                            className="p-1 text-zinc-500 hover:text-red-400 transition-colors"
                                                            title="Remove sub-task"
                                                        >
                                                            <X className="w-3 h-3" />
                                                        </button>
                                                    </div>
                                                ))}

                                                <button
                                                    onClick={() => handleAddPactSubTask(idx)}
                                                    className="text-[10px] font-mono text-accent/80 hover:text-accent flex items-center gap-1 pt-0.5 transition-colors"
                                                >
                                                    <Plus className="w-2.5 h-2.5" /> Add Sub-Task / Exercise
                                                </button>
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        </div>

                        {/* Category 2: Habit Trackers */}
                        <div className="space-y-3">
                            <div className="flex items-center justify-between">
                                <h4 className="text-xs uppercase tracking-widest text-zinc-400 font-mono flex items-center gap-2">
                                    <Zap className="w-4 h-4 text-blue-400" />
                                    Habit Trackers ({parsedData.tasks.length})
                                </h4>
                                <button
                                    onClick={handleAddTask}
                                    className="text-xs px-2.5 py-1 rounded-lg bg-blue-500/20 hover:bg-blue-500/30 text-blue-300 font-semibold flex items-center gap-1 transition-all"
                                >
                                    <Plus className="w-3 h-3" /> Add Habit
                                </button>
                            </div>
                            <div className="space-y-2">
                                {parsedData.tasks.map((task, idx) => (
                                    <div
                                        key={idx}
                                        className={`flex items-center gap-3 p-2.5 rounded-xl border transition-all ${
                                            selectedTasks[idx]
                                                ? 'bg-blue-500/10 border-blue-500/30 text-white'
                                                : 'bg-white/5 border-white/5 text-zinc-500'
                                        }`}
                                    >
                                        <input
                                            type="checkbox"
                                            checked={selectedTasks[idx] || false}
                                            onChange={(e) => {
                                                const updated = [...selectedTasks];
                                                updated[idx] = e.target.checked;
                                                setSelectedTasks(updated);
                                            }}
                                            className="rounded border-white/20 bg-black text-blue-500 focus:ring-blue-500 shrink-0"
                                        />
                                        <input
                                            type="text"
                                            value={task}
                                            onChange={(e) => handleUpdateTask(idx, e.target.value)}
                                            className={`flex-1 bg-transparent text-xs text-white placeholder-zinc-500 focus:outline-none border-b border-transparent focus:border-blue-400/40 py-0.5 ${!selectedTasks[idx] ? 'line-through opacity-40' : ''}`}
                                            placeholder="Habit tracker name..."
                                        />
                                        <button
                                            onClick={() => handleRemoveTask(idx)}
                                            className="p-1 rounded-lg text-zinc-500 hover:text-blue-400 hover:bg-blue-500/10 transition-colors"
                                            title="Remove habit"
                                        >
                                            <Trash2 className="w-3.5 h-3.5" />
                                        </button>
                                    </div>
                                ))}
                            </div>
                        </div>

                        {/* Category 3: Goals */}
                        <div className="space-y-3">
                            <div className="flex items-center justify-between">
                                <h4 className="text-xs uppercase tracking-widest text-zinc-400 font-mono flex items-center gap-2">
                                    <Target className="w-4 h-4 text-purple-400" />
                                    Long-Term Goals ({parsedData.goals.length})
                                </h4>
                                <button
                                    onClick={handleAddGoal}
                                    className="text-xs px-2.5 py-1 rounded-lg bg-purple-500/20 hover:bg-purple-500/30 text-purple-300 font-semibold flex items-center gap-1 transition-all"
                                >
                                    <Plus className="w-3 h-3" /> Add Goal
                                </button>
                            </div>
                            <div className="space-y-2">
                                {parsedData.goals.map((goal, idx) => (
                                    <div
                                        key={idx}
                                        className={`flex items-center gap-3 p-2.5 rounded-xl border transition-all ${
                                            selectedGoals[idx]
                                                ? 'bg-purple-500/10 border-purple-500/30 text-white'
                                                : 'bg-white/5 border-white/5 text-zinc-500'
                                        }`}
                                    >
                                        <input
                                            type="checkbox"
                                            checked={selectedGoals[idx] || false}
                                            onChange={(e) => {
                                                const updated = [...selectedGoals];
                                                updated[idx] = e.target.checked;
                                                setSelectedGoals(updated);
                                            }}
                                            className="rounded border-white/20 bg-black text-purple-500 focus:ring-purple-500 shrink-0"
                                        />
                                        <input
                                            type="text"
                                            value={goal}
                                            onChange={(e) => handleUpdateGoal(idx, e.target.value)}
                                            className={`flex-1 bg-transparent text-xs text-white placeholder-zinc-500 focus:outline-none border-b border-transparent focus:border-purple-400/40 py-0.5 ${!selectedGoals[idx] ? 'line-through opacity-40' : ''}`}
                                            placeholder="Goal title..."
                                        />
                                        <button
                                            onClick={() => handleRemoveGoal(idx)}
                                            className="p-1 rounded-lg text-zinc-500 hover:text-purple-400 hover:bg-purple-500/10 transition-colors"
                                            title="Remove goal"
                                        >
                                            <Trash2 className="w-3.5 h-3.5" />
                                        </button>
                                    </div>
                                ))}
                            </div>
                        </div>

                        {/* Category 4: Timetable Reference Note */}
                        <div className="space-y-3">
                            <label className="flex items-center justify-between p-4 bg-white/5 border border-white/10 rounded-2xl cursor-pointer hover:bg-white/[0.07] transition-all">
                                <div className="flex items-center gap-3">
                                    <FileText className="w-5 h-5 text-emerald-400" />
                                    <div>
                                        <h5 className="text-sm font-bold text-white">Save Complete Reference Note</h5>
                                        <p className="text-xs text-zinc-400">Creates a structured Markdown note in Notes tab</p>
                                    </div>
                                </div>
                                <input
                                    type="checkbox"
                                    checked={includeNote}
                                    onChange={(e) => setIncludeNote(e.target.checked)}
                                    className="w-4 h-4 rounded border-white/20 bg-black text-emerald-500"
                                />
                            </label>

                            {includeNote && (
                                <textarea
                                    value={parsedData.fullTimetableNote}
                                    onChange={(e) => handleUpdateNote(e.target.value)}
                                    rows={6}
                                    placeholder="Detailed markdown timetable note..."
                                    className="w-full bg-black/50 border border-white/20 rounded-xl p-3 text-xs text-zinc-200 font-mono leading-relaxed focus:outline-none focus:border-accent resize-y"
                                />
                            )}
                        </div>

                        {/* Action Buttons */}
                        <div className="flex gap-4 pt-4 border-t border-white/10">
                            <button
                                onClick={handleReset}
                                className="px-6 py-4 bg-white/5 hover:bg-white/10 border border-white/10 text-white font-bold rounded-2xl transition-all flex items-center justify-center gap-2"
                            >
                                <RefreshCw className="w-4 h-4" />
                                Start Over
                            </button>
                            <button
                                onClick={handleImport}
                                disabled={isLoading}
                                className="flex-1 bg-accent hover:bg-accent/90 text-black font-bold py-4 rounded-2xl transition-all shadow-[0_0_25px_rgba(255,255,255,0.2)] flex items-center justify-center gap-2 disabled:opacity-50"
                            >
                                {isLoading ? (
                                    <>
                                        <Loader2 className="w-5 h-5 animate-spin" />
                                        Importing into Gyral...
                                    </>
                                ) : (
                                    <>
                                        <Check className="w-5 h-5" />
                                        Import Selected Items into Gyral
                                    </>
                                )}
                            </button>
                        </div>
                    </div>
                )}

                {/* STEP 3: SUCCESS CONFIRMATION VIEW */}
                {step === 'SUCCESS' && (
                    <div className="py-12 flex flex-col items-center justify-center text-center space-y-4">
                        <div className="w-16 h-16 bg-emerald-500/10 border border-emerald-500/30 rounded-full flex items-center justify-center text-emerald-400 animate-bounce">
                            <CheckCircle2 className="w-10 h-10" />
                        </div>
                        <h3 className="text-2xl font-bold text-white">Routine Successfully Imported!</h3>
                        <p className="text-sm text-zinc-400 max-w-md">
                            Your timetable items have been auto-populated into your <strong>Pacts</strong>, <strong>Habit Trackers</strong>, <strong>Goals</strong>, and <strong>Notes</strong>.
                        </p>
                        <div className="pt-6 flex gap-4">
                            <button
                                onClick={() => setStep('HISTORY')}
                                className="px-6 py-3.5 bg-white/5 hover:bg-white/10 border border-white/10 text-white font-bold rounded-2xl transition-all"
                            >
                                View / Manage Imports
                            </button>
                            <button
                                onClick={onClose}
                                className="px-8 py-3.5 bg-accent hover:bg-accent/90 text-black font-bold rounded-2xl transition-all shadow-lg"
                            >
                                Return to Dashboard
                            </button>
                        </div>
                    </div>
                )}

                {/* STEP 4: HISTORY / DELETE IMPORT LOGS VIEW */}
                {step === 'HISTORY' && (
                    <div className="space-y-4 overflow-y-auto pr-1 max-h-[65vh]">
                        <div className="flex items-center justify-between pb-2 border-b border-white/10">
                            <div>
                                <h3 className="text-sm font-bold text-white uppercase tracking-wider">Past Imported Timetables</h3>
                                <p className="text-xs text-zinc-400">Purge an import log to remove all its associated pacts, notes, and items</p>
                            </div>
                            <button
                                onClick={() => setStep('INPUT')}
                                className="text-xs text-accent hover:underline font-mono"
                            >
                                + New Import
                            </button>
                        </div>

                        {importLogs.length === 0 ? (
                            <div className="py-12 text-center text-zinc-500 space-y-2">
                                <History className="w-10 h-10 mx-auto opacity-30" />
                                <p className="text-sm font-medium">No past import logs found.</p>
                                <p className="text-xs text-zinc-600">Imported AI timetables will be listed here with one-click purge options.</p>
                            </div>
                        ) : (
                            <div className="space-y-3">
                                {importLogs.map((log) => (
                                    <div
                                        key={log.id}
                                        className="p-4 bg-white/5 border border-white/10 rounded-2xl space-y-3 hover:border-white/20 transition-all"
                                    >
                                        <div className="flex items-start justify-between">
                                            <div>
                                                <h4 className="text-sm font-bold text-white">{log.title}</h4>
                                                <div className="flex items-center gap-2 mt-1">
                                                    <span className="text-[10px] font-mono text-zinc-400">
                                                        {new Date(log.importedAt).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric', hour: '2-digit', minute: '2-digit' })}
                                                    </span>
                                                    {log.duration && (
                                                        <span className="text-[10px] font-mono px-2 py-0.5 bg-accent/10 text-accent rounded-full border border-accent/20">
                                                            {log.duration}
                                                        </span>
                                                    )}
                                                </div>
                                            </div>

                                            <button
                                                onClick={() => handleDeleteImportLog(log)}
                                                disabled={deletingLogId === log.id}
                                                className="px-3 py-1.5 bg-red-500/10 hover:bg-red-500/20 border border-red-500/20 text-red-400 hover:text-red-300 text-xs font-bold rounded-xl transition-all flex items-center gap-1.5 disabled:opacity-50"
                                            >
                                                {deletingLogId === log.id ? (
                                                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                                                ) : (
                                                    <Trash2 className="w-3.5 h-3.5" />
                                                )}
                                                Delete Log & Purge All
                                            </button>
                                        </div>

                                        {/* Items Summary Chips */}
                                        <div className="flex flex-wrap gap-2 pt-1 border-t border-white/5">
                                            {log.pactTexts.length > 0 && (
                                                <span className="text-[10px] font-mono bg-white/5 text-zinc-300 px-2.5 py-1 rounded-lg border border-white/5">
                                                    ⚔️ {log.pactTexts.length} Pacts
                                                </span>
                                            )}
                                            {log.taskNames.length > 0 && (
                                                <span className="text-[10px] font-mono bg-blue-500/10 text-blue-300 px-2.5 py-1 rounded-lg border border-blue-500/20">
                                                    ⚡ {log.taskNames.length} Habit Trackers
                                                </span>
                                            )}
                                            {log.goalTitles.length > 0 && (
                                                <span className="text-[10px] font-mono bg-purple-500/10 text-purple-300 px-2.5 py-1 rounded-lg border border-purple-500/20">
                                                    🎯 {log.goalTitles.length} Goals
                                                </span>
                                            )}
                                            {log.noteId && (
                                                <span className="text-[10px] font-mono bg-emerald-500/10 text-emerald-300 px-2.5 py-1 rounded-lg border border-emerald-500/20">
                                                    📝 Reference Note
                                                </span>
                                            )}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                )}
            </div>
        </div>
    );
}
