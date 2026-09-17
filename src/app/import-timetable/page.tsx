"use client";

import { useState, useRef, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useUserData } from "@/context/user-data-context";
import { useToday } from "@/hooks/use-today";
import { createClient } from "@/utils/supabase/client";
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
    ArrowRight,
    X,
    LogOut,
    Plus,
    Edit3,
    Calendar
} from "lucide-react";

function formatCompactDuration(rawDuration?: string): string {
    if (!rawDuration) return "Progressive";
    const str = rawDuration.trim();
    if (!str) return "Progressive";

    // 1. Primary: If months are mentioned anywhere (e.g. "12 Weeks ( 3 Month )", "3 Months", "3 mths") -> M Only
    const monthNumMatch = str.match(/(\d+)\s*(?:month|mth|mo)s?/i);
    if (monthNumMatch) {
        const num = monthNumMatch[1];
        return `${num} M`;
    }

    // 2. Secondary: If weeks are mentioned (e.g. "12 weeks") -> Weeks Only
    const weekNumMatch = str.match(/(\d+)\s*(?:week|wk)s?/i);
    if (weekNumMatch) {
        const num = weekNumMatch[1];
        return `${num} Weeks`;
    }

    // 3. Tertiary: If days are mentioned (e.g. "30 days") -> Days Only
    const dayNumMatch = str.match(/(\d+)\s*(?:day|d)s?/i);
    if (dayNumMatch) {
        const num = dayNumMatch[1];
        return `${num} Days`;
    }

    // 4. Fallback clean up
    const cleanFirstPart = str.split(/[(,]/)[0].trim();
    if (cleanFirstPart.length <= 15) return cleanFirstPart;
    return cleanFirstPart.substring(0, 15);
}

export interface ParsedPactItem {
    text: string;
    subTasks?: string[];
    phase?: string;
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
2. Progressive Phased Variation: Break the plan down into accurate progressive phases (e.g. Phase 1: Light Foundation, Phase 2: Moderate Overload, Phase 3: Advanced Peak) so workload scales over time.
3. Daily Habits & Pacts: Actionable daily items (each entry should ideally be 4-5 words; keep them concise so daily items do not look tricky or complex to read).
4. Core Habit Trackers: Key habits and metrics to track daily. Avoid repeating identical entries between pacts and habit trackers unless strictly necessary.
5. Target Goals & Milestones: Realistic transformation achievements.
6. Full Timetable & Category Notes: A clean, time-blocked daily & weekly schedule formatted with bullet points and detailed category breakdowns so I can open Notes and read every detail.`;

export default function ImportTimetablePage() {
    const router = useRouter();
    const {
        user,
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
    const [previewFilterDate, setPreviewFilterDate] = useState<string | null>(null);

    // History logs state
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

    // Load import logs from localStorage and check temp parsed routine from bottom sheet
    useEffect(() => {
        if (typeof window !== "undefined") {
            try {
                const params = new URLSearchParams(window.location.search);
                if (params.get('tab') === 'history') {
                    setActiveTab('HISTORY');
                }

                const stored = localStorage.getItem('gyral_ai_import_logs');
                if (stored) {
                    setImportLogs(JSON.parse(stored));
                }

                const temp = sessionStorage.getItem('gyral_ai_temp_parsed');
                if (temp) {
                    const data: ParsedTimetableData = JSON.parse(temp);
                    setParsedData(data);
                    setSelectedPacts(new Array(data.pacts.length).fill(true));
                    setSelectedTasks(new Array(data.tasks.length).fill(true));
                    setSelectedGoals(new Array(data.goals.length).fill(true));
                    setIncludeNote(true);
                    setStep('PREVIEW');
                    sessionStorage.removeItem('gyral_ai_temp_parsed');
                }
            } catch (e) {
                console.error("[ImportLogs] Failed to parse logs or temp routine:", e);
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
        const supabase = createClient();

        try {
            // 1. Purge Notes
            if (log.noteId) {
                await deleteNote(log.noteId);
            }
            const taggedNotes = notes.filter(n => n.content?.includes(`GYRAL_AI_IMPORT:${log.id}`));
            for (const n of taggedNotes) {
                if (n.id !== log.noteId) {
                    await deleteNote(n.id);
                }
            }

            // 2. Purge Daily Pacts & Pacts
            if (log.pactTexts && log.pactTexts.length > 0) {
                for (const pactText of log.pactTexts) {
                    const cleanText = pactText.trim();
                    if (!cleanText) continue;

                    // Delete daily pact from context state & DB
                    await deleteDailyPact(cleanText);

                    // Delete dated pacts from context state
                    Object.keys(pacts).forEach(date => {
                        const matchingPacts = pacts[date]?.filter(p => p.text.trim().toLowerCase() === cleanText.toLowerCase()) || [];
                        matchingPacts.forEach(p => {
                            deletePact(p.id, date);
                        });
                    });

                    // Direct DB delete fallback for thorough purge
                    if (user) {
                        await supabase.from('daily_pacts').delete().eq('user_id', user.id).ilike('text', cleanText);
                        await supabase.from('pacts').delete().eq('user_id', user.id).ilike('text', cleanText);
                    }
                }
            }

            // 3. Purge Habit Tasks
            if (log.taskNames && log.taskNames.length > 0) {
                for (const tName of log.taskNames) {
                    const cleanName = tName.trim();
                    if (!cleanName) continue;
                    const matchingTasks = tasks.filter(t => t.name.trim().toLowerCase() === cleanName.toLowerCase());
                    for (const t of matchingTasks) {
                        await deleteTask(t.id);
                    }
                    if (user) {
                        await supabase.from('tasks').delete().eq('user_id', user.id).ilike('name', cleanName);
                    }
                }
            }

            // 4. Purge Goals
            if (log.goalTitles && log.goalTitles.length > 0) {
                for (const gTitle of log.goalTitles) {
                    const cleanTitle = gTitle.trim();
                    if (!cleanTitle) continue;
                    const matchingGoals = lifeEvents.filter(e => e.title.trim().toLowerCase() === cleanTitle.toLowerCase());
                    for (const g of matchingGoals) {
                        await deleteLifeEvent(g.id);
                    }
                    if (user) {
                        await supabase.from('life_events').delete().eq('user_id', user.id).ilike('title', cleanTitle);
                    }
                }
            }

            // 5. Update local state & localStorage log history
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
        <div className="min-h-screen flex flex-col bg-zinc-950 text-white selection:bg-rose-500/30 relative overflow-hidden">
            {/* Ambient Fluid Artwork Layer (Matching Reference Image 1 & 2 Background) */}
            <div className="fixed inset-0 pointer-events-none overflow-hidden z-0">
                <div className="absolute top-[-10%] left-[-10%] w-[500px] h-[500px] rounded-full bg-gradient-to-br from-rose-600/35 via-red-500/20 to-purple-600/25 blur-[120px] animate-pulse" />
                <div className="absolute top-[25%] right-[-10%] w-[550px] h-[550px] rounded-full bg-gradient-to-tr from-indigo-600/30 via-sky-500/20 to-pink-500/25 blur-[140px]" />
                <div className="absolute bottom-[-10%] left-[20%] w-[600px] h-[600px] rounded-full bg-gradient-to-t from-purple-700/25 via-rose-600/20 to-indigo-600/20 blur-[150px]" />
            </div>

            <main className="flex-1 p-4 md:p-8 pt-6 md:pt-10 max-w-5xl mx-auto w-full space-y-7 pb-16 relative z-10">
                {/* Top Pill Bar Navigation & Exit Button */}
                <div className="flex items-center justify-between gap-4">
                    <div className="flex items-center gap-1.5 bg-white/10 border border-white/25 p-1 rounded-full backdrop-blur-2xl shadow-lg">
                        <button
                            onClick={() => setActiveTab('SYNTHESIZER')}
                            className={`flex items-center gap-2 px-4 py-1.5 rounded-full text-xs font-semibold transition-all ${activeTab === 'SYNTHESIZER' ? 'bg-white text-black shadow-lg shadow-white/20 font-bold' : 'text-zinc-300 hover:text-white'}`}
                        >
                            <Sparkles className="w-3.5 h-3.5" />
                            <span>AI Routine Records</span>
                        </button>
                        <button
                            onClick={() => setActiveTab('HISTORY')}
                            className={`flex items-center gap-2 px-4 py-1.5 rounded-full text-xs font-semibold transition-all ${activeTab === 'HISTORY' ? 'bg-white text-black shadow-lg shadow-white/20 font-bold' : 'text-zinc-300 hover:text-white'}`}
                        >
                            <History className="w-3.5 h-3.5" />
                            <span>History ({importLogs.length})</span>
                        </button>
                        <Link
                            href="/dashboard"
                            title="Exit to Dashboard"
                            aria-label="Exit to Dashboard"
                            className="w-7 h-7 rounded-full bg-rose-500/20 hover:bg-rose-500/40 border border-rose-400/40 flex items-center justify-center text-rose-200 hover:text-white transition-all ml-1 shadow-sm group shrink-0"
                        >
                            <X className="w-3.5 h-3.5 group-hover:rotate-90 transition-transform duration-200" />
                        </Link>
                    </div>
                </div>

                {/* Ethereal Hero Banner Card (Reference Image 1 SOMA & Image 2 ReliefMind Aesthetic) */}
                <div className="relative overflow-hidden rounded-[36px] bg-white/[0.07] border border-white/35 p-7 md:p-9 shadow-[0_25px_80px_rgba(0,0,0,0.65),inset_0_1.5px_3.5px_rgba(255,255,255,0.7)] backdrop-blur-3xl space-y-4">
                    {/* Inner Diagonal Specular Glass Sheen */}
                    <div className="absolute inset-0 bg-gradient-to-br from-white/35 via-white/[0.04] to-transparent pointer-events-none rounded-[36px]" />

                    <div className="relative z-10 flex flex-col md:flex-row md:items-end justify-between gap-6">
                        <div className="space-y-2.5 max-w-2xl">
                            <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full bg-white/15 border border-white/30 text-white text-xs font-mono font-semibold backdrop-blur-xl shadow-sm">
                                <Sparkles className="w-3.5 h-3.5 text-rose-300 animate-pulse" />
                                <span>Multi-Modal AI Engine</span>
                            </div>

                            <h1 className="text-3xl md:text-5xl font-serif tracking-tight text-white font-normal drop-shadow-md">
                                {parsedData ? parsedData.title : "Hi, Scholar"}
                            </h1>

                            <p className="text-sm md:text-base text-zinc-200 leading-relaxed font-sans">
                                {parsedData 
                                    ? `Ready to seal your ${parsedData.duration || 'progressive'} discipline routine into Gyral.`
                                    : "Ready for your daily practice? Synthesize AI routines, track phased workloads, and seal habits with extreme precision."
                                }
                            </p>
                        </div>

                        {/* Floating Quick Action Pill (Matching Image 1 Quick Practice Pill) */}
                        <div className="shrink-0">
                            <button
                                onClick={() => {
                                    if (step === 'PREVIEW') handleImport();
                                    else handleCopyPrompt();
                                }}
                                className="px-6 py-3 rounded-full bg-zinc-950/80 hover:bg-black text-white border border-white/30 text-xs font-semibold shadow-2xl backdrop-blur-2xl flex items-center gap-2.5 transition-all hover:scale-105"
                            >
                                <Zap className="w-4 h-4 text-rose-400 fill-rose-400" />
                                <span>{step === 'PREVIEW' ? "▶ Seal Routine Now" : "▶ Copy Universal Prompt"}</span>
                            </button>
                        </div>
                    </div>

                    {/* Stats Bar (Matching Image 1 Practice Days / Total Time) */}
                    <div className="pt-4 border-t border-white/15 flex flex-wrap items-center justify-between gap-4 text-xs text-zinc-200 relative z-10 font-sans">
                        <div className="flex flex-wrap items-center gap-6">
                            <div className="flex items-center gap-2">
                                <span className="text-zinc-400">Target Timeframe:</span>
                                <span className="font-semibold text-white px-2.5 py-0.5 rounded-full bg-white/10 border border-white/20">{formatCompactDuration(parsedData?.duration)}</span>
                            </div>
                            <div className="flex items-center gap-2">
                                <span className="text-zinc-400">Daily Pacts:</span>
                                <span className="font-semibold text-white px-2.5 py-0.5 rounded-full bg-white/10 border border-white/20">{parsedData?.pacts.length || 0} Action Items</span>
                            </div>
                            <div className="flex items-center gap-2">
                                <span className="text-zinc-400">Habit Trackers:</span>
                                <span className="font-semibold text-white px-2.5 py-0.5 rounded-full bg-white/10 border border-white/20">{parsedData?.tasks.length || 0} Trackers</span>
                            </div>
                        </div>

                        <button
                            onClick={() => setActiveTab('HISTORY')}
                            className="px-4 py-1.5 rounded-full bg-white/10 hover:bg-white/25 text-purple-200 border border-purple-400/40 font-semibold flex items-center gap-2 backdrop-blur-xl transition-all shadow-md"
                        >
                            <History className="w-3.5 h-3.5 text-purple-300" />
                            <span>Manage & Purge Past Logs ({importLogs.length})</span>
                        </button>
                    </div>
                </div>

                {/* TAB 1: AI SYNTHESIZER */}
                {activeTab === 'SYNTHESIZER' && (
                    <div className="space-y-6">
                        {step === 'INPUT' && (
                            <>
                                {/* Universal Prompt Card */}
                                <div className="bg-white/[0.06] border border-white/30 rounded-[32px] p-6 md:p-7 backdrop-blur-3xl relative space-y-4 shadow-[0_15px_50px_rgba(0,0,0,0.5),inset_0_1px_2.5px_rgba(255,255,255,0.5)]">
                                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-white/15">
                                        <div className="flex items-center gap-3">
                                            <div className="w-10 h-10 rounded-2xl bg-white/15 border border-white/30 flex items-center justify-center text-rose-300 shadow-md backdrop-blur-xl">
                                                <Copy className="w-4 h-4" />
                                            </div>
                                            <div>
                                                <h3 className="text-base font-bold text-white tracking-wide">
                                                    Universal AI Prompt
                                                </h3>
                                                <p className="text-xs text-zinc-300">
                                                    Copy & paste this prompt into ChatGPT or Claude to format any routine.
                                                </p>
                                            </div>
                                        </div>

                                        <div className="flex items-center gap-2">
                                            <button
                                                onClick={() => setShowPromptHelp(!showPromptHelp)}
                                                className="px-3.5 py-1.5 rounded-full bg-white/10 hover:bg-white/20 text-zinc-200 text-xs font-semibold border border-white/20 backdrop-blur-xl transition-all"
                                            >
                                                {showPromptHelp ? "Hide Details" : "How it works"}
                                            </button>
                                            <button
                                                onClick={handleCopyPrompt}
                                                className={`px-4 py-2 rounded-full text-xs font-bold flex items-center gap-2 transition-all shadow-xl ${copiedPrompt ? "bg-emerald-500 text-white" : "bg-white text-black hover:bg-zinc-100"}`}
                                            >
                                                {copiedPrompt ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                                                <span>{copiedPrompt ? "Copied Prompt!" : "Copy Prompt"}</span>
                                            </button>
                                        </div>
                                    </div>

                                    {showPromptHelp && (
                                        <div className="p-4 rounded-2xl bg-black/40 border border-white/15 text-xs text-zinc-200 space-y-2 backdrop-blur-xl">
                                            <p className="font-semibold text-white">✨ How to get drastic transformation results:</p>
                                            <ul className="list-disc pl-4 space-y-1 text-zinc-300">
                                                <li>Ask ChatGPT/Claude for a complete gym routine, study schedule, or discipline plan.</li>
                                                <li>Copy & paste our **Universal Prompt** into your chat conversation with the AI.</li>
                                                <li>The AI will structure the plan into progressive workload phases.</li>
                                                <li>Copy the output or screenshot it, then paste/upload below!</li>
                                            </ul>
                                        </div>
                                    )}

                                    <div className="bg-black/50 rounded-2xl p-4 border border-white/15 max-h-36 overflow-y-auto backdrop-blur-xl">
                                        <pre className="text-xs text-zinc-200 font-mono whitespace-pre-wrap leading-relaxed">
                                            {UNIVERSAL_AI_PROMPT}
                                        </pre>
                                    </div>
                                </div>

                                {/* Text & Screenshot Input Section */}
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                    {/* Option A: Text Area */}
                                    <div className="bg-white/[0.06] border border-white/30 rounded-[32px] p-6 space-y-3.5 flex flex-col justify-between backdrop-blur-3xl shadow-[0_15px_50px_rgba(0,0,0,0.5),inset_0_1px_2.5px_rgba(255,255,255,0.5)]">
                                        <div className="space-y-2">
                                            <label className="text-xs font-bold uppercase tracking-wider text-zinc-200 flex items-center gap-2">
                                                <FileText className="w-4 h-4 text-rose-400" />
                                                Option A: Paste Routine Text
                                            </label>
                                            <textarea
                                                value={rawText}
                                                onChange={(e) => setRawText(e.target.value)}
                                                placeholder="Paste routine text from ChatGPT, Claude, DeepSeek, or raw workout text..."
                                                className="w-full h-48 bg-black/50 border border-white/20 rounded-2xl p-3.5 text-xs text-white placeholder-zinc-400 focus:outline-none focus:border-white/50 transition-colors resize-none shadow-[inset_0_1px_3px_rgba(0,0,0,0.4)]"
                                            />
                                        </div>
                                        <div className="text-[11px] text-zinc-400 flex justify-between">
                                            <span>Supports markdown & time blocks</span>
                                            <span>{rawText.length} chars</span>
                                        </div>
                                    </div>

                                    {/* Option B: Screenshot Upload */}
                                    <div className="bg-white/[0.06] border border-white/30 rounded-[32px] p-6 space-y-3.5 flex flex-col justify-between backdrop-blur-3xl shadow-[0_15px_50px_rgba(0,0,0,0.5),inset_0_1px_2.5px_rgba(255,255,255,0.5)]">
                                        <div className="space-y-2">
                                            <label className="text-xs font-bold uppercase tracking-wider text-zinc-200 flex items-center gap-2">
                                                <ImageIcon className="w-4 h-4 text-rose-400" />
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
                                                <div className="relative h-48 rounded-2xl overflow-hidden border border-white/30 bg-black/60 group">
                                                    {/* eslint-disable-next-line @next/next/no-img-element */}
                                                    <img
                                                        src={imageBase64}
                                                        alt="Timetable Screenshot"
                                                        className="w-full h-full object-cover opacity-80 group-hover:opacity-100 transition-opacity"
                                                    />
                                                    <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent flex items-end p-3 justify-between">
                                                        <span className="text-xs font-mono text-zinc-200 truncate max-w-[200px]">
                                                            {imageFileName}
                                                        </span>
                                                        <button
                                                            onClick={handleClearImage}
                                                            className="px-3 py-1 rounded-xl bg-red-500/30 hover:bg-red-500/50 text-red-200 border border-red-400/40 text-xs transition-colors backdrop-blur-md"
                                                        >
                                                            Remove
                                                        </button>
                                                    </div>
                                                </div>
                                            ) : (
                                                <div
                                                    onClick={() => fileInputRef.current?.click()}
                                                    className="h-48 border-2 border-dashed border-white/20 hover:border-white/50 rounded-2xl bg-black/30 hover:bg-white/[0.04] flex flex-col items-center justify-center p-6 text-center cursor-pointer transition-all group backdrop-blur-xl"
                                                >
                                                    <Upload className="w-8 h-8 text-zinc-400 group-hover:text-white transition-colors mb-2" />
                                                    <p className="text-xs font-semibold text-zinc-200">
                                                        Click or drop routine screenshot here
                                                    </p>
                                                    <p className="text-[10px] text-zinc-400 mt-1">
                                                        PNG, JPG, WEBP supported
                                                    </p>
                                                </div>
                                            )}
                                        </div>
                                        <div className="text-[11px] text-zinc-400">
                                            Gemini Multi-Modal Vision will OCR & analyze image
                                        </div>
                                    </div>
                                </div>

                                {error && (
                                    <div className="p-4 rounded-2xl bg-red-500/20 border border-red-500/40 text-red-200 text-xs flex items-center gap-2 backdrop-blur-md">
                                        <AlertTriangle className="w-4 h-4 shrink-0" />
                                        <span>{error}</span>
                                    </div>
                                )}

                                {/* Parse Action Button */}
                                <div className="flex justify-end pt-2">
                                    <button
                                        onClick={handleParse}
                                        disabled={isLoading || (!rawText.trim() && !imageBase64)}
                                        className="px-8 py-3.5 rounded-full bg-white text-black hover:bg-zinc-100 font-bold text-xs shadow-[0_0_35px_rgba(255,255,255,0.45)] disabled:opacity-50 disabled:cursor-not-allowed transition-all flex items-center gap-2"
                                    >
                                        {isLoading ? (
                                            <>
                                                <Loader2 className="w-4 h-4 animate-spin text-black" />
                                                <span>Analyzing Timetable with Gemini AI...</span>
                                            </>
                                        ) : (
                                            <>
                                                <Sparkles className="w-4 h-4 text-black" />
                                                <span>Synthesize Routine with Gemini AI</span>
                                            </>
                                        )}
                                    </button>
                                </div>
                            </>
                        )}

                        {/* STEP PREVIEW: Interactive Selection (Reference Image 2 Media/Trackers Cards) */}
                        {step === 'PREVIEW' && parsedData && (
                            <div className="space-y-6">
                                {/* Title & Progressive Workload Phases Card */}
                                <div className="bg-white/[0.07] border border-white/35 rounded-[36px] p-7 backdrop-blur-3xl space-y-4 shadow-[0_20px_70px_rgba(0,0,0,0.6),inset_0_1.5px_3px_rgba(255,255,255,0.6)]">
                                    <div className="flex flex-wrap items-center justify-between gap-3 pb-3 border-b border-white/15">
                                        <div className="flex-1 min-w-[240px]">
                                            <span className="text-xs font-mono uppercase tracking-wider text-rose-300 font-semibold flex items-center gap-1.5">
                                                <Edit3 className="w-3.5 h-3.5" /> Routine Title (Editable)
                                            </span>
                                            <input
                                                type="text"
                                                value={parsedData.title}
                                                onChange={(e) => handleUpdateTitle(e.target.value)}
                                                className="w-full text-xl md:text-2xl font-bold text-white bg-black/40 border border-white/25 rounded-2xl px-3.5 py-1.5 mt-1 focus:outline-none focus:border-rose-400/60 tracking-wide"
                                                placeholder="Routine title..."
                                            />
                                        </div>
                                        {parsedData.duration && (
                                            <div className="flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-white/15 border border-white/30 text-white text-xs font-mono font-semibold backdrop-blur-xl shadow-sm">
                                                <Clock className="w-3.5 h-3.5 text-rose-300" />
                                                <span>Timeframe: {formatCompactDuration(parsedData.duration)}</span>
                                            </div>
                                        )}
                                    </div>

                                    {/* Progressive Workload Phases (Matching Image 2 ReliefMind Cards Layout) */}
                                    {parsedData.phases && parsedData.phases.length > 0 && (
                                        <div className="space-y-3">
                                            <div className="flex items-center justify-between">
                                                <h4 className="text-xs font-bold text-zinc-300 uppercase tracking-wider flex items-center gap-2">
                                                    <TrendingUp className="w-4 h-4 text-rose-400" />
                                                    Progressive Workload Phases
                                                </h4>

                                                {/* Animated Soundwave Visualizer Bars (Reference Image 2 Soundwave Meter) */}
                                                <div className="flex items-center gap-1 h-4">
                                                    <div className="w-1 bg-rose-400 rounded-full h-full animate-bounce" />
                                                    <div className="w-1 bg-rose-300 rounded-full h-3 animate-pulse" />
                                                    <div className="w-1 bg-rose-400 rounded-full h-full animate-bounce delay-100" />
                                                    <div className="w-1 bg-white rounded-full h-2" />
                                                    <div className="w-1 bg-rose-400 rounded-full h-full animate-bounce delay-200" />
                                                </div>
                                            </div>

                                            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                                                {parsedData.phases.map((phase, i) => (
                                                    <div key={i} className="p-4 rounded-2xl bg-white/[0.05] border border-white/25 text-xs text-zinc-200 backdrop-blur-xl shadow-md space-y-1">
                                                        <span className="font-mono text-rose-300 text-[10px] uppercase font-bold block">
                                                            Phase {i + 1} Variation
                                                        </span>
                                                        <p className="leading-relaxed">{phase}</p>
                                                    </div>
                                                ))}
                                            </div>
                                        </div>
                                    )}
                                </div>

                                {/* Items Selection & Editing Grid */}
                                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                                    {/* 1. Daily Pacts */}
                                    <div className="bg-white/[0.06] border border-white/30 rounded-[32px] p-6 space-y-4 backdrop-blur-3xl shadow-[0_15px_50px_rgba(0,0,0,0.5),inset_0_1px_2.5px_rgba(255,255,255,0.5)]">
                                        <div className="flex flex-col gap-2 pb-3 border-b border-white/15">
                                            <div className="flex items-center justify-between">
                                                <h3 className="text-xs font-bold uppercase tracking-wider text-white flex items-center gap-2">
                                                    <Dumbbell className="w-4 h-4 text-rose-400" />
                                                    Daily Pacts ({parsedData.pacts.length})
                                                </h3>
                                                <button
                                                    onClick={handleAddPact}
                                                    className="px-2.5 py-1 rounded-full bg-rose-500/20 hover:bg-rose-500/30 text-rose-300 border border-rose-400/40 text-[11px] font-semibold flex items-center gap-1 transition-all"
                                                >
                                                    <Plus className="w-3 h-3" /> Add Pact
                                                </button>
                                            </div>

                                            {/* Calendar Date Picker Bar */}
                                            <div className="flex items-center justify-between gap-2 bg-white/10 border border-white/20 p-2 rounded-2xl backdrop-blur-xl">
                                                <div className="flex items-center gap-1.5 text-xs text-rose-300 font-semibold">
                                                    <Calendar className="w-4 h-4 text-rose-400 shrink-0" />
                                                    <span>Preview Calendar Date:</span>
                                                </div>
                                                <div className="flex items-center gap-1">
                                                    <input
                                                        type="date"
                                                        value={previewFilterDate || ''}
                                                        onChange={(e) => setPreviewFilterDate(e.target.value || null)}
                                                        className="bg-black/50 border border-white/20 rounded-xl px-2 py-1 text-[11px] text-white font-mono focus:outline-none focus:border-rose-400"
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

                                        <label className="flex items-center gap-2 text-xs text-zinc-200 bg-white/10 border border-white/20 p-3 rounded-2xl cursor-pointer backdrop-blur-xl">
                                            <input
                                                type="checkbox"
                                                checked={makePactsRecurring}
                                                onChange={(e) => setMakePactsRecurring(e.target.checked)}
                                                className="accent-rose-500 w-4 h-4 rounded"
                                            />
                                            <span className="font-semibold flex items-center gap-1">
                                                <Repeat className="w-3.5 h-3.5 text-rose-300" /> Recurring on all days
                                            </span>
                                        </label>

                                        <div className="space-y-3 max-h-96 overflow-y-auto pr-1">
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
                                                    <div key={idx} className="bg-black/40 p-3 rounded-2xl border border-white/15 focus-within:border-rose-400/50 transition-all backdrop-blur-xl space-y-2.5 group">
                                                        {/* Date Range Badge if available */}
                                                        {pactStart && pactEnd && (
                                                            <div className="flex items-center justify-between text-[10px] font-mono text-emerald-300 bg-emerald-500/15 border border-emerald-400/30 px-2.5 py-0.5 rounded-full">
                                                                <span className="flex items-center gap-1 font-bold">
                                                                    <Calendar className="w-3 h-3 text-emerald-400" />
                                                                    Active: {pactStart} → {pactEnd}
                                                                </span>
                                                                <span className="text-emerald-200 font-sans text-[9px] font-semibold">
                                                                    (Expands across all {differenceInCalendarDays(parseISO(pactEnd), parseISO(pactStart)) + 1} days)
                                                                </span>
                                                            </div>
                                                        )}

                                                        {/* Main Pact Row */}
                                                        <div className="flex items-center gap-2.5">
                                                            <input
                                                                type="checkbox"
                                                                checked={selectedPacts[idx]}
                                                                onChange={(e) => {
                                                                    const copy = [...selectedPacts];
                                                                    copy[idx] = e.target.checked;
                                                                    setSelectedPacts(copy);
                                                                }}
                                                                className="accent-rose-500 w-4 h-4 rounded shrink-0 cursor-pointer"
                                                                title="Include in routine"
                                                            />
                                                            <input
                                                                type="text"
                                                                value={pactText}
                                                                onChange={(e) => handleUpdatePact(idx, e.target.value)}
                                                                placeholder="Pact description..."
                                                                className={`flex-1 bg-transparent text-xs font-bold text-white placeholder-zinc-500 focus:outline-none border-b border-transparent focus:border-rose-400/40 py-0.5 ${!selectedPacts[idx] ? 'line-through opacity-40' : ''}`}
                                                            />
                                                            {pactPhase && (
                                                                <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-rose-500/20 text-rose-300 border border-rose-500/30 shrink-0">
                                                                    {pactPhase}
                                                                </span>
                                                            )}
                                                            <button
                                                                onClick={() => handleRemovePact(idx)}
                                                                className="p-1 rounded-lg text-zinc-500 hover:text-rose-400 hover:bg-rose-500/10 transition-colors opacity-60 group-hover:opacity-100"
                                                                title="Delete pact"
                                                            >
                                                                <Trash2 className="w-3.5 h-3.5" />
                                                            </button>
                                                        </div>

                                                        {/* Sub-Tasks Checklist Section */}
                                                        <div className="pl-6 space-y-1.5 border-l-2 border-rose-500/20 ml-2">
                                                            {pactSubTasks.map((sub, sIdx) => (
                                                                <div key={sIdx} className="flex items-center gap-2 text-xs">
                                                                    <span className="w-1.5 h-1.5 rounded-full bg-rose-400/60 shrink-0" />
                                                                    <input
                                                                        type="text"
                                                                        value={sub}
                                                                        onChange={(e) => handleUpdatePactSubTask(idx, sIdx, e.target.value)}
                                                                        placeholder="Sub-task / exercise step..."
                                                                        className="flex-1 bg-black/30 border border-white/10 rounded-lg px-2.5 py-1 text-[11px] text-zinc-200 placeholder-zinc-500 focus:outline-none focus:border-rose-400/50"
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
                                                                className="text-[10px] font-mono text-rose-300/80 hover:text-rose-300 flex items-center gap-1 pt-0.5 transition-colors"
                                                            >
                                                                <Plus className="w-2.5 h-2.5" /> Add Sub-Task / Exercise
                                                            </button>
                                                        </div>
                                                    </div>
                                                );
                                            })}
                                        </div>
                                    </div>

                                    {/* 2. Habit Trackers */}
                                    <div className="bg-white/[0.06] border border-white/30 rounded-[32px] p-6 space-y-4 backdrop-blur-3xl shadow-[0_15px_50px_rgba(0,0,0,0.5),inset_0_1px_2.5px_rgba(255,255,255,0.5)]">
                                        <div className="flex items-center justify-between pb-3 border-b border-white/15">
                                            <h3 className="text-xs font-bold uppercase tracking-wider text-white flex items-center gap-2">
                                                <Zap className="w-4 h-4 text-emerald-400" />
                                                Habit Trackers ({parsedData.tasks.length})
                                            </h3>
                                            <button
                                                onClick={handleAddTask}
                                                className="px-2.5 py-1 rounded-full bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-300 border border-emerald-400/40 text-[11px] font-semibold flex items-center gap-1 transition-all"
                                            >
                                                <Plus className="w-3 h-3" /> Add Habit
                                            </button>
                                        </div>

                                        <div className="space-y-2 max-h-80 overflow-y-auto pr-1">
                                            {parsedData.tasks.map((task, idx) => (
                                                <div key={idx} className="flex items-center gap-2.5 text-xs text-zinc-200 bg-black/40 p-2.5 rounded-2xl border border-white/15 focus-within:border-emerald-400/50 transition-all backdrop-blur-xl group">
                                                    <input
                                                        type="checkbox"
                                                        checked={selectedTasks[idx]}
                                                        onChange={(e) => {
                                                            const copy = [...selectedTasks];
                                                            copy[idx] = e.target.checked;
                                                            setSelectedTasks(copy);
                                                        }}
                                                        className="accent-emerald-500 w-4 h-4 rounded shrink-0 cursor-pointer"
                                                        title="Include in routine"
                                                    />
                                                    <input
                                                        type="text"
                                                        value={task}
                                                        onChange={(e) => handleUpdateTask(idx, e.target.value)}
                                                        placeholder="Habit tracker name..."
                                                        className={`flex-1 bg-transparent text-xs text-white placeholder-zinc-500 focus:outline-none border-b border-transparent focus:border-emerald-400/40 py-0.5 ${!selectedTasks[idx] ? 'line-through opacity-40' : ''}`}
                                                    />
                                                    <button
                                                        onClick={() => handleRemoveTask(idx)}
                                                        className="p-1 rounded-lg text-zinc-500 hover:text-emerald-400 hover:bg-emerald-500/10 transition-colors opacity-60 group-hover:opacity-100"
                                                        title="Delete habit"
                                                    >
                                                        <Trash2 className="w-3.5 h-3.5" />
                                                    </button>
                                                </div>
                                            ))}
                                        </div>
                                    </div>

                                    {/* 3. Target Goals */}
                                    <div className="bg-white/[0.06] border border-white/30 rounded-[32px] p-6 space-y-4 backdrop-blur-3xl shadow-[0_15px_50px_rgba(0,0,0,0.5),inset_0_1px_2.5px_rgba(255,255,255,0.5)]">
                                        <div className="flex items-center justify-between pb-3 border-b border-white/15">
                                            <h3 className="text-xs font-bold uppercase tracking-wider text-white flex items-center gap-2">
                                                <Target className="w-4 h-4 text-amber-400" />
                                                Goals ({parsedData.goals.length})
                                            </h3>
                                            <button
                                                onClick={handleAddGoal}
                                                className="px-2.5 py-1 rounded-full bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 border border-amber-400/40 text-[11px] font-semibold flex items-center gap-1 transition-all"
                                            >
                                                <Plus className="w-3 h-3" /> Add Goal
                                            </button>
                                        </div>

                                        <div className="space-y-2 max-h-80 overflow-y-auto pr-1">
                                            {parsedData.goals.map((goal, idx) => (
                                                <div key={idx} className="flex items-center gap-2.5 text-xs text-zinc-200 bg-black/40 p-2.5 rounded-2xl border border-white/15 focus-within:border-amber-400/50 transition-all backdrop-blur-xl group">
                                                    <input
                                                        type="checkbox"
                                                        checked={selectedGoals[idx]}
                                                        onChange={(e) => {
                                                            const copy = [...selectedGoals];
                                                            copy[idx] = e.target.checked;
                                                            setSelectedGoals(copy);
                                                        }}
                                                        className="accent-amber-500 w-4 h-4 rounded shrink-0 cursor-pointer"
                                                        title="Include in routine"
                                                    />
                                                    <input
                                                        type="text"
                                                        value={goal}
                                                        onChange={(e) => handleUpdateGoal(idx, e.target.value)}
                                                        placeholder="Goal title..."
                                                        className={`flex-1 bg-transparent text-xs text-white placeholder-zinc-500 focus:outline-none border-b border-transparent focus:border-amber-400/40 py-0.5 ${!selectedGoals[idx] ? 'line-through opacity-40' : ''}`}
                                                    />
                                                    <button
                                                        onClick={() => handleRemoveGoal(idx)}
                                                        className="p-1 rounded-lg text-zinc-500 hover:text-amber-400 hover:bg-amber-500/10 transition-colors opacity-60 group-hover:opacity-100"
                                                        title="Delete goal"
                                                    >
                                                        <Trash2 className="w-3.5 h-3.5" />
                                                    </button>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                </div>

                                {/* Reference Note Preview & Editor */}
                                <div className="bg-white/[0.06] border border-white/30 rounded-[32px] p-6 space-y-3.5 backdrop-blur-3xl shadow-[0_15px_50px_rgba(0,0,0,0.5),inset_0_1px_2.5px_rgba(255,255,255,0.5)]">
                                    <div className="flex items-center justify-between">
                                        <label className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-white cursor-pointer">
                                            <input
                                                type="checkbox"
                                                checked={includeNote}
                                                onChange={(e) => setIncludeNote(e.target.checked)}
                                                className="accent-rose-500 w-4 h-4 rounded"
                                            />
                                            <span>Save Full Markdown Reference Note in Notes Tab</span>
                                        </label>
                                        {includeNote && (
                                            <span className="text-[11px] font-mono text-zinc-400">
                                                {parsedData.fullTimetableNote?.length || 0} characters
                                            </span>
                                        )}
                                    </div>

                                    {includeNote && (
                                        <textarea
                                            value={parsedData.fullTimetableNote}
                                            onChange={(e) => handleUpdateNote(e.target.value)}
                                            rows={8}
                                            placeholder="Detailed markdown timetable note..."
                                            className="w-full bg-black/50 border border-white/20 rounded-2xl p-4 text-xs text-zinc-200 font-mono leading-relaxed focus:outline-none focus:border-rose-400/50 resize-y shadow-inner"
                                        />
                                    )}
                                </div>

                                {/* Inline Non-Overlapping Action Bar */}
                                <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pt-6 border-t border-white/20">
                                    <button
                                        onClick={() => router.push('/dashboard')}
                                        className="w-full sm:w-auto px-6 py-3 rounded-full bg-white/10 hover:bg-white/20 border border-white/25 text-zinc-200 hover:text-white text-xs font-semibold backdrop-blur-xl transition-all shadow-md flex items-center justify-center gap-2"
                                    >
                                        <ChevronLeft className="w-4 h-4" />
                                        <span>Back to Main Dashboard</span>
                                    </button>

                                    <button
                                        onClick={handleImport}
                                        disabled={isLoading}
                                        className="w-full sm:w-auto px-8 py-3.5 rounded-full bg-white text-black hover:bg-zinc-100 font-bold text-xs shadow-[0_0_35px_rgba(255,255,255,0.45)] disabled:opacity-50 flex items-center justify-center gap-2.5 transition-all"
                                    >
                                        {isLoading ? (
                                            <>
                                                <Loader2 className="w-4 h-4 animate-spin text-black" />
                                                <span>Importing items...</span>
                                            </>
                                        ) : (
                                            <>
                                                <CheckCircle2 className="w-4 h-4 text-black" />
                                                <span>Confirm & Seal Routine into Gyral</span>
                                            </>
                                        )}
                                    </button>
                                </div>
                            </div>
                        )}

                        {/* STEP SUCCESS */}
                        {step === 'SUCCESS' && (
                            <div className="bg-white/[0.08] border border-emerald-400/40 rounded-[36px] p-8 md:p-10 text-center space-y-6 max-w-lg mx-auto backdrop-blur-3xl shadow-[0_25px_80px_rgba(0,0,0,0.7),inset_0_1.5px_3px_rgba(255,255,255,0.7)]">
                                <div className="w-16 h-16 rounded-full bg-emerald-500/25 text-emerald-300 flex items-center justify-center mx-auto border border-emerald-400/50 shadow-xl backdrop-blur-xl">
                                    <CheckCircle2 className="w-8 h-8" />
                                </div>
                                <div className="space-y-2">
                                    <h2 className="text-2xl font-bold text-white tracking-wide">Routine Successfully Sealed!</h2>
                                    <p className="text-xs text-zinc-300 leading-relaxed">
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
                                        className="w-full sm:w-auto px-6 py-3 rounded-full bg-white/10 hover:bg-white/20 text-white text-xs font-semibold border border-white/25 backdrop-blur-xl transition-all shadow-md"
                                    >
                                        Import Another Routine
                                    </button>
                                    <button
                                        onClick={() => {
                                            if (typeof window !== "undefined") {
                                                sessionStorage.removeItem('gyral_ai_temp_parsed');
                                            }
                                            router.push('/dashboard');
                                        }}
                                        className="w-full sm:w-auto px-7 py-3 rounded-full bg-white text-black text-xs font-bold shadow-[0_0_30px_rgba(255,255,255,0.4)] hover:bg-zinc-100 transition-all cursor-pointer flex items-center justify-center gap-2"
                                    >
                                        View Dashboard
                                    </button>
                                </div>
                            </div>
                        )}
                    </div>
                )}

                {/* TAB 2: IMPORT HISTORY & PURGE MANAGER */}
                {activeTab === 'HISTORY' && (
                    <div className="space-y-6">
                        <div className="bg-white/[0.06] border border-white/30 rounded-[36px] p-7 space-y-5 backdrop-blur-3xl shadow-[0_20px_70px_rgba(0,0,0,0.6),inset_0_1.5px_3px_rgba(255,255,255,0.6)]">
                            <div className="flex items-center justify-between pb-3 border-b border-white/15">
                                <h3 className="text-base font-bold text-white flex items-center gap-2">
                                    <History className="w-4.5 h-4.5 text-rose-400" />
                                    Imported AI Routines Log History
                                </h3>
                                <span className="text-xs text-zinc-300 font-mono font-semibold">
                                    Total Logs: {importLogs.length}
                                </span>
                            </div>

                            {importLogs.length === 0 ? (
                                <div className="text-center py-14 space-y-4 border border-dashed border-white/20 rounded-3xl bg-black/30 backdrop-blur-xl">
                                    <History className="w-10 h-10 text-zinc-500 mx-auto" />
                                    <p className="text-xs text-zinc-300">No AI routines imported yet.</p>
                                    <button
                                        onClick={() => setActiveTab('SYNTHESIZER')}
                                        className="px-5 py-2.5 rounded-full bg-white text-black text-xs font-bold shadow-lg"
                                    >
                                        Synthesize New Routine
                                    </button>
                                </div>
                            ) : (
                                <div className="space-y-3.5">
                                    {importLogs.map((log) => (
                                        <div key={log.id} className="p-5 rounded-2xl bg-black/40 border border-white/20 flex flex-col sm:flex-row sm:items-center justify-between gap-4 hover:border-white/40 transition-all backdrop-blur-2xl shadow-md">
                                            <div className="space-y-1">
                                                <div className="flex items-center gap-2">
                                                    <h4 className="text-sm font-bold text-white tracking-wide">{log.title}</h4>
                                                    {log.duration && (
                                                        <span className="px-2.5 py-0.5 rounded-full bg-white/15 border border-white/25 text-[10px] font-mono text-zinc-200">
                                                            {formatCompactDuration(log.duration)}
                                                        </span>
                                                    )}
                                                </div>
                                                <div className="flex items-center gap-3 text-[11px] text-zinc-300">
                                                    <span>Imported: {new Date(log.importedAt).toLocaleDateString()}</span>
                                                    <span>• Pacts: {log.pactTexts?.length || 0}</span>
                                                    <span>• Tasks: {log.taskNames?.length || 0}</span>
                                                    <span>• Goals: {log.goalTitles?.length || 0}</span>
                                                </div>
                                            </div>

                                            <button
                                                onClick={() => handleDeleteImportLog(log)}
                                                disabled={deletingLogId === log.id}
                                                className="px-3.5 py-2 rounded-xl bg-red-500/20 hover:bg-red-500/35 border border-red-400/40 text-red-200 text-xs font-semibold flex items-center gap-1.5 transition-all shrink-0 self-start sm:self-auto backdrop-blur-md"
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
