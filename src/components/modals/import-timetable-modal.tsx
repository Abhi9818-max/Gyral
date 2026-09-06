"use client";

import { useState, useRef } from "react";
import { useUserData } from "@/context/user-data-context";
import { useToday } from "@/hooks/use-today";
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
    TrendingUp
} from "lucide-react";

interface ImportTimetableModalProps {
    isOpen: boolean;
    onClose: () => void;
}

interface ParsedTimetableData {
    title: string;
    duration?: string;
    phases?: string[];
    pacts: string[];
    tasks: string[];
    goals: string[];
    fullTimetableNote: string;
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
    const { addPact, addDailyPact, addTask, addLifeEvent, addNote } = useUserData();
    const todayStr = useToday();

    // Step state: 'INPUT' | 'PREVIEW' | 'SUCCESS'
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
    const [makePactsRecurring, setMakePactsRecurring] = useState(true); // Auto-present across all days!
    const [selectedTasks, setSelectedTasks] = useState<boolean[]>([]);
    const [selectedGoals, setSelectedGoals] = useState<boolean[]>([]);
    const [includeNote, setIncludeNote] = useState(true);

    const fileInputRef = useRef<HTMLInputElement>(null);

    if (!isOpen) return null;

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
            // 1. Add selected Pacts (Vows)
            parsedData.pacts.forEach((pactText, idx) => {
                if (selectedPacts[idx] && pactText.trim()) {
                    const cleanPact = pactText.trim();
                    // If recurring is enabled, save to dailyPacts template so it appears on ALL days automatically!
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
                    const color = taskColors[idx % taskColors.length];
                    addTask(taskName.trim(), color);
                }
            });

            // 3. Add selected Goals
            parsedData.goals.forEach((goalText, idx) => {
                if (selectedGoals[idx] && goalText.trim()) {
                    addLifeEvent({
                        event_date: todayStr,
                        title: goalText.trim(),
                        description: `Extracted from AI Routine: ${parsedData.title} (${parsedData.duration || 'Progressive'})`,
                        type: 'GOAL'
                    });
                }
            });

            // 4. Save formatted Markdown timetable note
            if (includeNote && parsedData.fullTimetableNote) {
                await addNote(
                    parsedData.title || "AI Timetable & Routine",
                    parsedData.fullTimetableNote
                );
            }

            setStep('SUCCESS');
        } catch (err: any) {
            console.error("[Import error]:", err);
            setError("Failed to import items into Gyral.");
        } finally {
            setIsLoading(false);
        }
    };

    const handleReset = () => {
        setStep('INPUT');
        setRawText("");
        setImageBase64(null);
        setImageFileName(null);
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
                <div className="flex items-center justify-between pb-4 border-b border-white/10 mb-6">
                    <div className="flex items-center gap-3">
                        <div className="p-2.5 bg-accent/10 border border-accent/20 rounded-2xl text-accent">
                            <Sparkles className="w-5 h-5 animate-pulse" />
                        </div>
                        <div>
                            <h2 className="text-xl font-bold tracking-wide text-white flex items-center gap-2">
                                AI Timetable & Routine Importer
                            </h2>
                            <p className="text-xs text-zinc-400">
                                Import gym schedules, habits & timetables from ChatGPT / Claude
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

                        {/* Image Upload Input */}
                        <div className="space-y-2">
                            <label className="text-xs uppercase tracking-widest text-zinc-400 font-mono flex items-center gap-2">
                                <ImageIcon className="w-4 h-4 text-purple-400" />
                                Or Upload Screenshot of AI Timetable
                            </label>
                            <div className="relative border border-dashed border-white/15 hover:border-accent/40 rounded-2xl p-5 text-center transition-all bg-white/[0.02] hover:bg-white/[0.04] group">
                                <input
                                    type="file"
                                    ref={fileInputRef}
                                    onChange={handleFileChange}
                                    accept="image/*"
                                    className="absolute inset-0 opacity-0 cursor-pointer w-full h-full z-10"
                                />
                                {imageBase64 ? (
                                    <div className="flex items-center justify-between p-3 bg-white/5 border border-white/10 rounded-xl">
                                        <div className="flex items-center gap-3 overflow-hidden">
                                            <img src={imageBase64} alt="Screenshot preview" className="w-10 h-10 object-cover rounded-lg border border-white/10" />
                                            <span className="text-sm font-mono text-zinc-300 truncate max-w-[200px]">{imageFileName}</span>
                                        </div>
                                        <button
                                            type="button"
                                            onClick={(e) => { e.stopPropagation(); handleClearImage(); }}
                                            className="p-1 text-zinc-400 hover:text-red-400 z-20"
                                        >
                                            <X className="w-4 h-4" />
                                        </button>
                                    </div>
                                ) : (
                                    <div className="flex flex-col items-center gap-2">
                                        <Upload className="w-7 h-7 text-zinc-500 group-hover:text-accent transition-colors" />
                                        <p className="text-sm text-zinc-300 font-medium">Click or drag screenshot to upload</p>
                                        <p className="text-xs text-zinc-500">Supports PNG, JPG, WEBP</p>
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
                            <div className="flex items-center justify-between">
                                <span className="text-[10px] uppercase tracking-widest text-zinc-400 font-mono">Detected Routine Title</span>
                                {parsedData.duration && (
                                    <span className="text-xs font-mono font-bold text-accent px-2.5 py-1 bg-accent/10 border border-accent/20 rounded-full flex items-center gap-1.5">
                                        <Clock className="w-3.5 h-3.5" />
                                        {parsedData.duration}
                                    </span>
                                )}
                            </div>
                            <h3 className="text-lg font-bold text-white">{parsedData.title}</h3>

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

                        {/* Category 1: Pacts with Multi-Day / Recurring Toggle */}
                        {parsedData.pacts.length > 0 && (
                            <div className="space-y-3">
                                <div className="flex items-center justify-between">
                                    <h4 className="text-xs uppercase tracking-widest text-zinc-400 font-mono flex items-center gap-2">
                                        <Dumbbell className="w-4 h-4 text-accent" />
                                        Daily Pacts / Habits ({parsedData.pacts.length})
                                    </h4>
                                    <button
                                        onClick={() => {
                                            const allChecked = selectedPacts.every(Boolean);
                                            setSelectedPacts(new Array(parsedData.pacts.length).fill(!allChecked));
                                        }}
                                        className="text-[11px] text-accent hover:underline"
                                    >
                                        Toggle All
                                    </button>
                                </div>

                                {/* Recurring / Multi-Day Option Card */}
                                <label className="flex items-center justify-between p-3.5 bg-accent/5 border border-accent/20 rounded-xl cursor-pointer hover:bg-accent/10 transition-all">
                                    <div className="flex items-center gap-2.5">
                                        <Repeat className="w-4 h-4 text-accent" />
                                        <div>
                                            <span className="text-xs font-bold text-white block">Make Pacts Recurring Daily (Appears across all days)</span>
                                            <span className="text-[11px] text-zinc-400">Pacts will automatically populate on every day for your timeframe</span>
                                        </div>
                                    </div>
                                    <input
                                        type="checkbox"
                                        checked={makePactsRecurring}
                                        onChange={(e) => setMakePactsRecurring(e.target.checked)}
                                        className="w-4 h-4 rounded border-white/20 bg-black text-accent focus:ring-accent"
                                    />
                                </label>

                                <div className="space-y-2">
                                    {parsedData.pacts.map((pact, idx) => (
                                        <label
                                            key={idx}
                                            className={`flex items-start gap-3 p-3 rounded-xl border transition-all cursor-pointer ${
                                                selectedPacts[idx]
                                                    ? 'bg-accent/10 border-accent/30 text-white'
                                                    : 'bg-white/5 border-white/5 text-zinc-500'
                                            }`}
                                        >
                                            <input
                                                type="checkbox"
                                                checked={selectedPacts[idx] || false}
                                                onChange={(e) => {
                                                    const updated = [...selectedPacts];
                                                    updated[idx] = e.target.checked;
                                                    setSelectedPacts(updated);
                                                }}
                                                className="mt-0.5 rounded border-white/20 bg-black text-accent focus:ring-accent"
                                            />
                                            <span className="text-sm font-medium leading-relaxed">{pact}</span>
                                        </label>
                                    ))}
                                </div>
                            </div>
                        )}

                        {/* Category 2: Tasks */}
                        {parsedData.tasks.length > 0 && (
                            <div className="space-y-3">
                                <div className="flex items-center justify-between">
                                    <h4 className="text-xs uppercase tracking-widest text-zinc-400 font-mono flex items-center gap-2">
                                        <Zap className="w-4 h-4 text-blue-400" />
                                        Habit Trackers ({parsedData.tasks.length})
                                    </h4>
                                    <button
                                        onClick={() => {
                                            const allChecked = selectedTasks.every(Boolean);
                                            setSelectedTasks(new Array(parsedData.tasks.length).fill(!allChecked));
                                        }}
                                        className="text-[11px] text-accent hover:underline"
                                    >
                                        Toggle All
                                    </button>
                                </div>
                                <div className="space-y-2">
                                    {parsedData.tasks.map((task, idx) => (
                                        <label
                                            key={idx}
                                            className={`flex items-center gap-3 p-3 rounded-xl border transition-all cursor-pointer ${
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
                                                className="rounded border-white/20 bg-black text-blue-500 focus:ring-blue-500"
                                            />
                                            <span className="text-sm font-medium">{task}</span>
                                        </label>
                                    ))}
                                </div>
                            </div>
                        )}

                        {/* Category 3: Goals */}
                        {parsedData.goals.length > 0 && (
                            <div className="space-y-3">
                                <div className="flex items-center justify-between">
                                    <h4 className="text-xs uppercase tracking-widest text-zinc-400 font-mono flex items-center gap-2">
                                        <Target className="w-4 h-4 text-purple-400" />
                                        Long-Term Goals ({parsedData.goals.length})
                                    </h4>
                                    <button
                                        onClick={() => {
                                            const allChecked = selectedGoals.every(Boolean);
                                            setSelectedGoals(new Array(parsedData.goals.length).fill(!allChecked));
                                        }}
                                        className="text-[11px] text-accent hover:underline"
                                    >
                                        Toggle All
                                    </button>
                                </div>
                                <div className="space-y-2">
                                    {parsedData.goals.map((goal, idx) => (
                                        <label
                                            key={idx}
                                            className={`flex items-center gap-3 p-3 rounded-xl border transition-all cursor-pointer ${
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
                                                className="rounded border-white/20 bg-black text-purple-500 focus:ring-purple-500"
                                            />
                                            <span className="text-sm font-medium">{goal}</span>
                                        </label>
                                    ))}
                                </div>
                            </div>
                        )}

                        {/* Category 4: Timetable Note */}
                        {parsedData.fullTimetableNote && (
                            <div className="space-y-3">
                                <label className="flex items-center justify-between p-4 bg-white/5 border border-white/10 rounded-2xl cursor-pointer hover:bg-white/[0.07] transition-all">
                                    <div className="flex items-center gap-3">
                                        <FileText className="w-5 h-5 text-emerald-400" />
                                        <div>
                                            <h5 className="text-sm font-bold text-white">Save Complete Reference Note</h5>
                                            <p className="text-xs text-zinc-400">Creates a structured Markdown note in Notes / Memento</p>
                                        </div>
                                    </div>
                                    <input
                                        type="checkbox"
                                        checked={includeNote}
                                        onChange={(e) => setIncludeNote(e.target.checked)}
                                        className="w-4 h-4 rounded border-white/20 bg-black text-emerald-500"
                                    />
                                </label>
                            </div>
                        )}

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
                        <div className="pt-6">
                            <button
                                onClick={onClose}
                                className="px-8 py-3.5 bg-accent hover:bg-accent/90 text-black font-bold rounded-2xl transition-all shadow-lg"
                            >
                                Return to Dashboard
                            </button>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}
