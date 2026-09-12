"use client";

import { useState, useRef, useEffect } from "react";
import Link from "next/link";
import { Header } from "@/components/header";
import { useUserData } from "@/context/user-data-context";
import { useToday } from "@/hooks/use-today";
import {
    ChevronLeft,
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
    ArrowRight
} from "lucide-react";

interface ParsedTimetableData {
    title: string;
    duration?: string;
    phases?: string[];
    pacts: string[];
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

export default function ImportTimetablePage() {
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

    // Active View: 'SYNTHESIZER' | 'HISTORY'
    const [activeTab, setActiveTab] = useState<'SYNTHESIZER' | 'HISTORY'>('SYNTHESIZER');
    const [step, setStep] = useState<'INPUT' | 'PREVIEW' | 'SUCCESS'>('INPUT');

    // Input state
    const [rawText, setRawText] = useState("");
    const [imageBase64, setImageBase64] = useState<string | null>(null);
    const [imageFileName, setImageFileName] = useState<string | null>(null);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [copiedPrompt, setCopiedPrompt] = useState(false);
    const [showPromptHelp, setShowPromptHelp] = useState(false);

    // Parsed data state
    const [parsedData, setParsedData] = useState<ParsedTimetableData | null>(null);
    const [selectedPacts, setSelectedPacts] = useState<boolean[]>([]);
    const [makePactsRecurring, setMakePactsRecurring] = useState(true);
    const [selectedTasks, setSelectedTasks] = useState<boolean[]>([]);
    const [selectedGoals, setSelectedGoals] = useState<boolean[]>([]);
    const [includeNote, setIncludeNote] = useState(true);

    // History logs state
    const [importLogs, setImportLogs] = useState<ImportLog[]>([]);
    const [deletingLogId, setDeletingLogId] = useState<string | null>(null);

    const fileInputRef = useRef<HTMLInputElement>(null);

    // Load import logs from localStorage
    useEffect(() => {
        if (typeof window !== "undefined") {
            try {
                const stored = localStorage.getItem('gyral_ai_import_logs');
                if (stored) {
                    setImportLogs(JSON.parse(stored));
                }
            } catch (e) {
                console.error("[ImportLogs] Failed to parse logs:", e);
            }
        }
    }, []);

    // Copy Prompt Helper
    const handleCopyPrompt = () => {
        navigator.clipboard.writeText(UNIVERSAL_AI_PROMPT);
        setCopiedPrompt(true);
        setTimeout(() => setCopiedPrompt(false), 2500);
    };

    // Handle File / Screenshot Selection
    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        if (!file.type.startsWith("image/")) {
            setError("Please upload an image file (PNG, JPG, WEBP)");
            return;
        }

        setImageFileName(file.name);
        setError(null);

        const reader = new FileReader();
        reader.onload = (event) => {
            setImageBase64(event.target?.result as string);
        };
        reader.readAsDataURL(file);
    };

    const handleClearImage = () => {
        setImageBase64(null);
        setImageFileName(null);
        if (fileInputRef.current) fileInputRef.current.value = "";
    };

    // Trigger Gemini API Parser
    const handleParse = async () => {
        if (!rawText.trim() && !imageBase64) {
            setError("Please paste text from ChatGPT/Claude or upload a timetable screenshot.");
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
                    imageBase64: imageBase64 || undefined
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

            // 1. Add selected Pacts
            parsedData.pacts.forEach((pactText, idx) => {
                if (selectedPacts[idx] && pactText.trim()) {
                    const cleanPact = pactText.trim();
                    importedPactTexts.push(cleanPact);
                    if (makePactsRecurring) {
                        addDailyPact(cleanPact);
                    }
                    addPact(cleanPact, todayStr);
                }
            });

            // 2. Add selected Habit Tasks
            const taskColors = ["#3b82f6", "#10b981", "#8b5cf6", "#ec4899", "#f59e0b"];
            parsedData.tasks.forEach((taskName, idx) => {
                if (selectedTasks[idx] && taskName.trim()) {
                    const cleanTask = taskName.trim();
                    importedTaskNames.push(cleanTask);
                    const color = taskColors[idx % taskColors.length];
                    addTask(cleanTask, color);
                }
            });

            // 3. Add selected Goals
            parsedData.goals.forEach((goalText, idx) => {
                if (selectedGoals[idx] && goalText.trim()) {
                    const cleanGoal = goalText.trim();
                    importedGoalTitles.push(cleanGoal);
                    addLifeEvent({
                        event_date: todayStr,
                        title: cleanGoal,
                        description: `Extracted from AI Routine: ${parsedData.title} (${parsedData.duration || 'Progressive'})`,
                        type: 'GOAL'
                    });
                }
            });

            // 4. Save formatted Markdown timetable note
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
            if (log.noteId) {
                await deleteNote(log.noteId);
            }
            const taggedNote = notes.find(n => n.content?.includes(`GYRAL_AI_IMPORT:${log.id}`));
            if (taggedNote && taggedNote.id !== log.noteId) {
                await deleteNote(taggedNote.id);
            }

            if (log.pactTexts && log.pactTexts.length > 0) {
                log.pactTexts.forEach(pactText => {
                    deleteDailyPact(pactText);
                    Object.keys(pacts).forEach(date => {
                        const matchingPact = pacts[date]?.find(p => p.text.trim().toLowerCase() === pactText.trim().toLowerCase());
                        if (matchingPact) {
                            deletePact(matchingPact.id, date);
                        }
                    });
                });
            }

            if (log.taskNames && log.taskNames.length > 0) {
                log.taskNames.forEach(tName => {
                    const matchingTask = tasks.find(t => t.name.trim().toLowerCase() === tName.trim().toLowerCase());
                    if (matchingTask) {
                        deleteTask(matchingTask.id);
                    }
                });
            }

            if (log.goalTitles && log.goalTitles.length > 0) {
                log.goalTitles.forEach(gTitle => {
                    const matchingGoal = lifeEvents.find(e => e.title.trim().toLowerCase() === gTitle.trim().toLowerCase());
                    if (matchingGoal) {
                        deleteLifeEvent(matchingGoal.id);
                    }
                });
            }

            const updatedLogs = importLogs.filter(item => item.id !== log.id);
            setImportLogs(updatedLogs);
            if (typeof window !== "undefined") {
                localStorage.setItem('gyral_ai_import_logs', JSON.stringify(updatedLogs));
            }
        } catch (err) {
            console.error("[Purge error]:", err);
        } finally {
            setDeletingLogId(null);
        }
    };

    return (
        <div className="min-h-screen flex flex-col bg-black text-white selection:bg-indigo-500/30">
            <Header />

            <main className="flex-1 p-4 md:p-8 pt-24 md:pt-28 max-w-5xl mx-auto w-full space-y-6 pb-24">
                {/* Back to Dashboard Link */}
                <div className="flex items-center justify-between">
                    <Link
                        href="/dashboard"
                        className="inline-flex items-center gap-2 text-sm text-zinc-400 hover:text-white transition-colors group"
                    >
                        <ChevronLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" />
                        <span>Back to Dashboard</span>
                    </Link>

                    {/* Tab Navigation */}
                    <div className="flex items-center gap-2 bg-zinc-900/80 border border-white/10 p-1 rounded-full backdrop-blur-xl">
                        <button
                            onClick={() => setActiveTab('SYNTHESIZER')}
                            className={`flex items-center gap-2 px-4 py-1.5 rounded-full text-xs font-semibold transition-all ${activeTab === 'SYNTHESIZER' ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-600/30' : 'text-zinc-400 hover:text-white'}`}
                        >
                            <Sparkles className="w-3.5 h-3.5" />
                            <span>AI Synthesizer</span>
                        </button>
                        <button
                            onClick={() => setActiveTab('HISTORY')}
                            className={`flex items-center gap-2 px-4 py-1.5 rounded-full text-xs font-semibold transition-all ${activeTab === 'HISTORY' ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-600/30' : 'text-zinc-400 hover:text-white'}`}
                        >
                            <History className="w-3.5 h-3.5" />
                            <span>Import History ({importLogs.length})</span>
                        </button>
                    </div>
                </div>

                {/* Hero Title Header */}
                <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-zinc-900/90 via-zinc-900/60 to-indigo-950/30 border border-white/10 p-6 md:p-8 shadow-2xl backdrop-blur-2xl">
                    <div className="absolute top-0 right-0 w-80 h-80 bg-indigo-500/10 rounded-full blur-[100px] pointer-events-none" />
                    <div className="relative z-10 space-y-2">
                        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 text-xs font-mono font-semibold">
                            <Sparkles className="w-3.5 h-3.5 animate-pulse" />
                            <span>Multi-Modal AI Timetable Engine</span>
                        </div>
                        <h1 className="text-2xl md:text-4xl font-bold tracking-tight text-white">
                            AI Timetable & Routine Importer
                        </h1>
                        <p className="text-sm md:text-base text-zinc-400 max-w-2xl leading-relaxed">
                            Paste your routine from ChatGPT, Claude, or DeepSeek, or upload a timetable screenshot. Gyral will automatically extract progressive workload phases, daily pacts, habit trackers, and reference notes.
                        </p>
                    </div>
                </div>

                {/* TAB 1: AI SYNTHESIZER */}
                {activeTab === 'SYNTHESIZER' && (
                    <div className="space-y-6">
                        {step === 'INPUT' && (
                            <>
                                {/* Universal Prompt Card */}
                                <div className="bg-zinc-900/70 border border-indigo-500/20 rounded-2xl p-5 md:p-6 backdrop-blur-xl relative group">
                                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-white/10">
                                        <div className="flex items-center gap-3">
                                            <div className="w-9 h-9 rounded-xl bg-indigo-500/10 border border-indigo-500/30 flex items-center justify-center text-indigo-400">
                                                <Copy className="w-4 h-4" />
                                            </div>
                                            <div>
                                                <h3 className="text-sm font-bold text-white flex items-center gap-2">
                                                    Universal AI Follow-Up Prompt
                                                </h3>
                                                <p className="text-xs text-zinc-400">
                                                    Copy & paste this prompt at the end of your conversation with ChatGPT/Claude for structured outputs.
                                                </p>
                                            </div>
                                        </div>

                                        <div className="flex items-center gap-2">
                                            <button
                                                onClick={() => setShowPromptHelp(!showPromptHelp)}
                                                className="px-3 py-1.5 rounded-full bg-white/5 hover:bg-white/10 text-zinc-400 hover:text-white text-xs transition-colors flex items-center gap-1.5"
                                            >
                                                <HelpCircle className="w-3.5 h-3.5" />
                                                <span>{showPromptHelp ? "Hide Details" : "How it works"}</span>
                                            </button>
                                            <button
                                                onClick={handleCopyPrompt}
                                                className={`px-4 py-2 rounded-full text-xs font-semibold flex items-center gap-2 transition-all shadow-md ${copiedPrompt ? "bg-emerald-600 text-white" : "bg-indigo-600 hover:bg-indigo-500 text-white"}`}
                                            >
                                                {copiedPrompt ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                                                <span>{copiedPrompt ? "Copied Prompt!" : "Copy Prompt"}</span>
                                            </button>
                                        </div>
                                    </div>

                                    {showPromptHelp && (
                                        <div className="mt-4 p-4 rounded-xl bg-black/40 border border-white/5 text-xs text-zinc-300 space-y-2">
                                            <p className="font-semibold text-white">✨ How to get drastic transformation results:</p>
                                            <ul className="list-disc pl-4 space-y-1 text-zinc-400">
                                                <li>Ask ChatGPT/Claude for a complete gym routine, study schedule, or lifestyle discipline plan.</li>
                                                <li>Copy & paste our **Universal Prompt** into your chat conversation with the AI.</li>
                                                <li>The AI will structure the plan into progressive workload phases (e.g. Month 1 Foundation, Month 2 Overload, Month 3 Peak).</li>
                                                <li>Copy the structured output or screenshot the routine, then paste/upload it below!</li>
                                            </ul>
                                        </div>
                                    )}

                                    <div className="mt-4 bg-black/50 rounded-xl p-3 border border-white/5 max-h-32 overflow-y-auto">
                                        <pre className="text-xs text-zinc-300 font-mono whitespace-pre-wrap leading-relaxed">
                                            {UNIVERSAL_AI_PROMPT}
                                        </pre>
                                    </div>
                                </div>

                                {/* Text & Screenshot Input Section */}
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                    {/* Text Area */}
                                    <div className="bg-zinc-900/60 border border-white/10 rounded-2xl p-5 space-y-3 flex flex-col justify-between">
                                        <div className="space-y-2">
                                            <label className="text-xs font-bold uppercase tracking-wider text-zinc-400 flex items-center gap-2">
                                                <FileText className="w-4 h-4 text-indigo-400" />
                                                Option A: Paste AI Timetable Text
                                            </label>
                                            <textarea
                                                value={rawText}
                                                onChange={(e) => setRawText(e.target.value)}
                                                placeholder="Paste routine text from ChatGPT, Claude, DeepSeek, or raw workout text..."
                                                className="w-full h-48 bg-black/50 border border-white/10 rounded-xl p-3 text-xs text-white placeholder-zinc-500 focus:outline-none focus:border-indigo-500 transition-colors resize-none"
                                            />
                                        </div>
                                        <div className="text-[11px] text-zinc-500 flex justify-between">
                                            <span>Supports markdown, bullet points, & time blocks</span>
                                            <span>{rawText.length} chars</span>
                                        </div>
                                    </div>

                                    {/* Screenshot Upload Dropzone */}
                                    <div className="bg-zinc-900/60 border border-white/10 rounded-2xl p-5 space-y-3 flex flex-col justify-between">
                                        <div className="space-y-2">
                                            <label className="text-xs font-bold uppercase tracking-wider text-zinc-400 flex items-center gap-2">
                                                <ImageIcon className="w-4 h-4 text-indigo-400" />
                                                Option B: Upload Timetable Screenshot
                                            </label>

                                            <input
                                                type="file"
                                                ref={fileInputRef}
                                                onChange={handleFileChange}
                                                accept="image/*"
                                                className="hidden"
                                            />

                                            {imageBase64 ? (
                                                <div className="relative h-48 rounded-xl overflow-hidden border border-indigo-500/40 bg-black/60 group">
                                                    {/* eslint-disable-next-line @next/next/no-img-element */}
                                                    <img
                                                        src={imageBase64}
                                                        alt="Timetable Screenshot"
                                                        className="w-full h-full object-cover opacity-80 group-hover:opacity-100 transition-opacity"
                                                    />
                                                    <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent flex items-end p-3 justify-between">
                                                        <span className="text-xs font-mono text-zinc-300 truncate max-w-[200px]">
                                                            {imageFileName}
                                                        </span>
                                                        <button
                                                            onClick={handleClearImage}
                                                            className="px-2.5 py-1 rounded-lg bg-red-500/20 hover:bg-red-500/40 text-red-300 border border-red-500/30 text-xs transition-colors"
                                                        >
                                                            Remove
                                                        </button>
                                                    </div>
                                                </div>
                                            ) : (
                                                <div
                                                    onClick={() => fileInputRef.current?.click()}
                                                    className="h-48 border-2 border-dashed border-white/10 hover:border-indigo-500/50 rounded-xl bg-black/30 hover:bg-indigo-500/5 flex flex-col items-center justify-center p-6 text-center cursor-pointer transition-all group"
                                                >
                                                    <Upload className="w-8 h-8 text-zinc-500 group-hover:text-indigo-400 transition-colors mb-2" />
                                                    <p className="text-xs font-medium text-zinc-300">
                                                        Click or drop routine screenshot here
                                                    </p>
                                                    <p className="text-[10px] text-zinc-500 mt-1">
                                                        PNG, JPG, WEBP supported
                                                    </p>
                                                </div>
                                            )}
                                        </div>
                                        <div className="text-[11px] text-zinc-500">
                                            Gemini Multi-Modal Vision will OCR & analyze image
                                        </div>
                                    </div>
                                </div>

                                {error && (
                                    <div className="p-4 rounded-xl bg-red-500/10 border border-red-500/30 text-red-400 text-xs flex items-center gap-2">
                                        <AlertTriangle className="w-4 h-4 shrink-0" />
                                        <span>{error}</span>
                                    </div>
                                )}

                                {/* Parse Action Button */}
                                <div className="flex justify-end pt-2">
                                    <button
                                        onClick={handleParse}
                                        disabled={isLoading || (!rawText.trim() && !imageBase64)}
                                        className="px-8 py-3.5 rounded-full bg-gradient-to-r from-indigo-600 via-indigo-500 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white font-bold text-sm shadow-xl shadow-indigo-600/30 disabled:opacity-50 disabled:cursor-not-allowed transition-all flex items-center gap-2"
                                    >
                                        {isLoading ? (
                                            <>
                                                <Loader2 className="w-4 h-4 animate-spin" />
                                                <span>Analyzing Timetable with Gemini AI...</span>
                                            </>
                                        ) : (
                                            <>
                                                <Sparkles className="w-4 h-4" />
                                                <span>Synthesize Routine with Gemini AI</span>
                                            </>
                                        )}
                                    </button>
                                </div>
                            </>
                        )}

                        {/* STEP PREVIEW: Interactive Selection */}
                        {step === 'PREVIEW' && parsedData && (
                            <div className="space-y-6">
                                {/* Title & Duration Card */}
                                <div className="bg-zinc-900/80 border border-indigo-500/30 rounded-2xl p-6 backdrop-blur-xl space-y-3">
                                    <div className="flex flex-wrap items-center justify-between gap-3">
                                        <div>
                                            <span className="text-xs font-mono uppercase tracking-wider text-indigo-400">
                                                Extracted Routine Title
                                            </span>
                                            <h2 className="text-xl font-bold text-white mt-0.5">
                                                {parsedData.title}
                                            </h2>
                                        </div>
                                        {parsedData.duration && (
                                            <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-indigo-500/10 border border-indigo-500/30 text-indigo-300 text-xs font-mono font-semibold">
                                                <Clock className="w-3.5 h-3.5" />
                                                <span>Target Timeframe: {parsedData.duration}</span>
                                            </div>
                                        )}
                                    </div>

                                    {/* Progressive Phase Variations */}
                                    {parsedData.phases && parsedData.phases.length > 0 && (
                                        <div className="mt-4 pt-4 border-t border-white/10 space-y-2">
                                            <h4 className="text-xs font-bold text-zinc-400 uppercase tracking-wider flex items-center gap-1.5">
                                                <TrendingUp className="w-4 h-4 text-indigo-400" />
                                                Progressive Workload Phases
                                            </h4>
                                            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                                                {parsedData.phases.map((phase, i) => (
                                                    <div key={i} className="p-3 rounded-xl bg-black/40 border border-white/5 text-xs text-zinc-300">
                                                        <span className="font-mono text-indigo-400 text-[10px] uppercase font-bold block mb-1">
                                                            Phase {i + 1}
                                                        </span>
                                                        {phase}
                                                    </div>
                                                ))}
                                            </div>
                                        </div>
                                    )}
                                </div>

                                {/* Items Selection Grid */}
                                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                                    {/* 1. Daily Pacts */}
                                    <div className="bg-zinc-900/60 border border-white/10 rounded-2xl p-5 space-y-3">
                                        <div className="flex items-center justify-between pb-2 border-b border-white/10">
                                            <h3 className="text-xs font-bold uppercase tracking-wider text-white flex items-center gap-2">
                                                <Dumbbell className="w-4 h-4 text-indigo-400" />
                                                Daily Pacts ({parsedData.pacts.length})
                                            </h3>
                                        </div>

                                        <label className="flex items-center gap-2 text-xs text-indigo-300 bg-indigo-500/10 border border-indigo-500/20 p-2.5 rounded-xl cursor-pointer">
                                            <input
                                                type="checkbox"
                                                checked={makePactsRecurring}
                                                onChange={(e) => setMakePactsRecurring(e.target.checked)}
                                                className="accent-indigo-500"
                                            />
                                            <span className="font-medium flex items-center gap-1">
                                                <Repeat className="w-3.5 h-3.5" /> Recurring on all future days
                                            </span>
                                        </label>

                                        <div className="space-y-2 max-h-60 overflow-y-auto">
                                            {parsedData.pacts.map((pact, idx) => (
                                                <label key={idx} className="flex items-start gap-2 text-xs text-zinc-300 bg-black/30 p-2.5 rounded-xl border border-white/5 cursor-pointer hover:border-white/20 transition-colors">
                                                    <input
                                                        type="checkbox"
                                                        checked={selectedPacts[idx]}
                                                        onChange={(e) => {
                                                            const copy = [...selectedPacts];
                                                            copy[idx] = e.target.checked;
                                                            setSelectedPacts(copy);
                                                        }}
                                                        className="mt-0.5 accent-indigo-500"
                                                    />
                                                    <span>{pact}</span>
                                                </label>
                                            ))}
                                        </div>
                                    </div>

                                    {/* 2. Habit Tasks */}
                                    <div className="bg-zinc-900/60 border border-white/10 rounded-2xl p-5 space-y-3">
                                        <div className="flex items-center justify-between pb-2 border-b border-white/10">
                                            <h3 className="text-xs font-bold uppercase tracking-wider text-white flex items-center gap-2">
                                                <Zap className="w-4 h-4 text-emerald-400" />
                                                Habit Trackers ({parsedData.tasks.length})
                                            </h3>
                                        </div>

                                        <div className="space-y-2 max-h-60 overflow-y-auto pt-2">
                                            {parsedData.tasks.map((task, idx) => (
                                                <label key={idx} className="flex items-start gap-2 text-xs text-zinc-300 bg-black/30 p-2.5 rounded-xl border border-white/5 cursor-pointer hover:border-white/20 transition-colors">
                                                    <input
                                                        type="checkbox"
                                                        checked={selectedTasks[idx]}
                                                        onChange={(e) => {
                                                            const copy = [...selectedTasks];
                                                            copy[idx] = e.target.checked;
                                                            setSelectedTasks(copy);
                                                        }}
                                                        className="mt-0.5 accent-emerald-500"
                                                    />
                                                    <span>{task}</span>
                                                </label>
                                            ))}
                                        </div>
                                    </div>

                                    {/* 3. Goals & Milestones */}
                                    <div className="bg-zinc-900/60 border border-white/10 rounded-2xl p-5 space-y-3">
                                        <div className="flex items-center justify-between pb-2 border-b border-white/10">
                                            <h3 className="text-xs font-bold uppercase tracking-wider text-white flex items-center gap-2">
                                                <Target className="w-4 h-4 text-amber-400" />
                                                Goals ({parsedData.goals.length})
                                            </h3>
                                        </div>

                                        <div className="space-y-2 max-h-60 overflow-y-auto pt-2">
                                            {parsedData.goals.map((goal, idx) => (
                                                <label key={idx} className="flex items-start gap-2 text-xs text-zinc-300 bg-black/30 p-2.5 rounded-xl border border-white/5 cursor-pointer hover:border-white/20 transition-colors">
                                                    <input
                                                        type="checkbox"
                                                        checked={selectedGoals[idx]}
                                                        onChange={(e) => {
                                                            const copy = [...selectedGoals];
                                                            copy[idx] = e.target.checked;
                                                            setSelectedGoals(copy);
                                                        }}
                                                        className="mt-0.5 accent-amber-500"
                                                    />
                                                    <span>{goal}</span>
                                                </label>
                                            ))}
                                        </div>
                                    </div>
                                </div>

                                {/* Reference Note Preview */}
                                <div className="bg-zinc-900/60 border border-white/10 rounded-2xl p-5 space-y-3">
                                    <div className="flex items-center justify-between">
                                        <label className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-white cursor-pointer">
                                            <input
                                                type="checkbox"
                                                checked={includeNote}
                                                onChange={(e) => setIncludeNote(e.target.checked)}
                                                className="accent-indigo-500"
                                            />
                                            <span>Save Full Markdown Reference Note in Notes Tab</span>
                                        </label>
                                    </div>

                                    {includeNote && (
                                        <div className="bg-black/50 rounded-xl p-4 border border-white/5 max-h-48 overflow-y-auto">
                                            <pre className="text-xs text-zinc-300 whitespace-pre-wrap font-mono leading-relaxed">
                                                {parsedData.fullTimetableNote}
                                            </pre>
                                        </div>
                                    )}
                                </div>

                                {/* Action Bar */}
                                <div className="flex items-center justify-between pt-4">
                                    <button
                                        onClick={() => setStep('INPUT')}
                                        className="px-5 py-2.5 rounded-full bg-white/5 hover:bg-white/10 text-zinc-400 hover:text-white text-xs font-medium transition-colors"
                                    >
                                        Back to Input
                                    </button>

                                    <button
                                        onClick={handleImport}
                                        disabled={isLoading}
                                        className="px-8 py-3.5 rounded-full bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-sm shadow-xl shadow-emerald-600/30 flex items-center gap-2 transition-all"
                                    >
                                        {isLoading ? (
                                            <>
                                                <Loader2 className="w-4 h-4 animate-spin" />
                                                <span>Importing items...</span>
                                            </>
                                        ) : (
                                            <>
                                                <CheckCircle2 className="w-4 h-4" />
                                                <span>Confirm & Seal Routine into Gyral</span>
                                            </>
                                        )}
                                    </button>
                                </div>
                            </div>
                        )}

                        {/* STEP SUCCESS */}
                        {step === 'SUCCESS' && (
                            <div className="bg-zinc-900/80 border border-emerald-500/30 rounded-3xl p-8 text-center space-y-6 max-w-lg mx-auto backdrop-blur-2xl">
                                <div className="w-16 h-16 rounded-full bg-emerald-500/20 text-emerald-400 flex items-center justify-center mx-auto border border-emerald-500/40">
                                    <CheckCircle2 className="w-8 h-8" />
                                </div>
                                <div className="space-y-2">
                                    <h2 className="text-2xl font-bold text-white">Routine Successfully Sealed!</h2>
                                    <p className="text-xs text-zinc-400 leading-relaxed">
                                        Your AI routine, pacts, habit trackers, and reference notes are now active in Gyral.
                                    </p>
                                </div>

                                <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-2">
                                    <button
                                        onClick={() => {
                                            setParsedData(null);
                                            setRawText("");
                                            setImageBase64(null);
                                            setStep('INPUT');
                                        }}
                                        className="w-full sm:w-auto px-5 py-2.5 rounded-full bg-white/5 hover:bg-white/10 text-zinc-300 hover:text-white text-xs font-medium transition-colors"
                                    >
                                        Import Another Routine
                                    </button>
                                    <Link
                                        href="/dashboard"
                                        className="w-full sm:w-auto px-6 py-2.5 rounded-full bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold shadow-lg shadow-indigo-600/30 transition-colors"
                                    >
                                        View Dashboard
                                    </Link>
                                </div>
                            </div>
                        )}
                    </div>
                )}

                {/* TAB 2: IMPORT HISTORY & PURGE MANAGER */}
                {activeTab === 'HISTORY' && (
                    <div className="space-y-6">
                        <div className="bg-zinc-900/60 border border-white/10 rounded-2xl p-5 space-y-4">
                            <div className="flex items-center justify-between">
                                <h3 className="text-sm font-bold text-white flex items-center gap-2">
                                    <History className="w-4 h-4 text-indigo-400" />
                                    Imported AI Routines Log History
                                </h3>
                                <span className="text-xs text-zinc-500 font-mono">
                                    Total Logs: {importLogs.length}
                                </span>
                            </div>

                            {importLogs.length === 0 ? (
                                <div className="text-center py-12 space-y-3 border border-dashed border-white/10 rounded-xl">
                                    <History className="w-8 h-8 text-zinc-600 mx-auto" />
                                    <p className="text-xs text-zinc-400">No AI routines imported yet.</p>
                                    <button
                                        onClick={() => setActiveTab('SYNTHESIZER')}
                                        className="px-4 py-2 rounded-full bg-indigo-600 text-white text-xs font-semibold"
                                    >
                                        Synthesize New Routine
                                    </button>
                                </div>
                            ) : (
                                <div className="space-y-3">
                                    {importLogs.map((log) => (
                                        <div key={log.id} className="p-4 rounded-xl bg-black/40 border border-white/5 flex flex-col sm:flex-row sm:items-center justify-between gap-4 hover:border-white/20 transition-all">
                                            <div className="space-y-1">
                                                <div className="flex items-center gap-2">
                                                    <h4 className="text-sm font-bold text-white">{log.title}</h4>
                                                    {log.duration && (
                                                        <span className="px-2 py-0.5 rounded-full bg-indigo-500/10 border border-indigo-500/20 text-[10px] font-mono text-indigo-300">
                                                            {log.duration}
                                                        </span>
                                                    )}
                                                </div>
                                                <div className="flex items-center gap-3 text-[11px] text-zinc-400">
                                                    <span>Imported: {new Date(log.importedAt).toLocaleDateString()}</span>
                                                    <span>• Pacts: {log.pactTexts?.length || 0}</span>
                                                    <span>• Tasks: {log.taskNames?.length || 0}</span>
                                                    <span>• Goals: {log.goalTitles?.length || 0}</span>
                                                </div>
                                            </div>

                                            <button
                                                onClick={() => handleDeleteImportLog(log)}
                                                disabled={deletingLogId === log.id}
                                                className="px-3 py-2 rounded-xl bg-red-500/10 hover:bg-red-500/20 border border-red-500/20 text-red-400 text-xs font-semibold flex items-center gap-1.5 transition-colors shrink-0 self-start sm:self-auto"
                                            >
                                                {deletingLogId === log.id ? (
                                                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                                                ) : (
                                                    <Trash2 className="w-3.5 h-3.5" />
                                                )}
                                                <span>Purge Import Log</span>
                                            </button>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    </div>
                )}
            </main>
        </div>
    );
}
