"use client";

import { useState, useRef, useEffect } from "react";
import { useRouter } from "next/navigation";
import {
    X,
    Paperclip,
    Check,
    Upload,
    Sparkles,
    Loader2,
    FileText,
    Image as ImageIcon,
    Copy,
    ArrowRight,
    AlertTriangle
} from "lucide-react";

const UNIVERSAL_AI_PROMPT = `Great! Now please organize and format the entire routine and advice we just discussed into a structured, progressive timetable for my Gyral discipline system.

Requirements:
1. Target Timeframe & Duration: Specify a realistic total duration (e.g. 3 Months, 12 Weeks, 30 Days) to see drastic results and noticeable transformation.
2. Progressive Phased Variation: Break the plan down into progressive phases so intensity scales over time.
3. Daily Habits & Pacts: Actionable daily items with time blocks.
4. Core Habit Trackers: Key habits and metrics to track daily.
5. Target Goals & Milestones: Realistic transformation achievements.
6. Full Timetable: Clean daily & weekly schedule formatted with bullet points.`;

export function AiImportBottomSheet() {
    const router = useRouter();
    const [isOpen, setIsOpen] = useState(false);
    const [step, setStep] = useState<'INPUT' | 'EXTRACTING' | 'SUCCESS'>('INPUT');

    // Input state
    const [rawText, setRawText] = useState("");
    const [imageBase64, setImageBase64] = useState<string | null>(null);
    const [imageFileName, setImageFileName] = useState<string | null>(null);
    const [copiedPrompt, setCopiedPrompt] = useState(false);
    const [error, setError] = useState<string | null>(null);

    // Extraction Animation State (Image 2 style)
    const [progress, setProgress] = useState(0);

    const fileInputRef = useRef<HTMLInputElement>(null);

    // Global Event Listener to open bottom sheet from anywhere
    useEffect(() => {
        const handleOpen = () => {
            setIsOpen(true);
            setStep('INPUT');
            setProgress(0);
            setError(null);
        };
        window.addEventListener('openAiImportBottomSheet', handleOpen);
        return () => window.removeEventListener('openAiImportBottomSheet', handleOpen);
    }, []);

    if (!isOpen) return null;

    const handleCopyPrompt = () => {
        navigator.clipboard.writeText(UNIVERSAL_AI_PROMPT);
        setCopiedPrompt(true);
        setTimeout(() => setCopiedPrompt(false), 2000);
    };

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;
        if (!file.type.startsWith("image/")) {
            setError("Please select an image file (PNG, JPG, WEBP)");
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

    const handleStartExtraction = async () => {
        if (!rawText.trim() && !imageBase64) {
            setError("Please paste routine text or select a screenshot.");
            return;
        }

        setError(null);
        setStep('EXTRACTING');
        setProgress(15);

        // Progress simulation animation for glossy loader
        const interval = setInterval(() => {
            setProgress((prev) => {
                if (prev >= 90) {
                    clearInterval(interval);
                    return 90;
                }
                return prev + Math.floor(Math.random() * 15) + 5;
            });
        }, 300);

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
            clearInterval(interval);

            if (!res.ok || json.error) {
                throw new Error(json.error || "Extraction failed");
            }

            setProgress(100);
            // Store parsed result in sessionStorage so /import-timetable page loads it seamlessly
            if (typeof window !== "undefined") {
                sessionStorage.setItem('gyral_ai_temp_parsed', JSON.stringify(json.data));
            }

            setTimeout(() => {
                setStep('SUCCESS');
            }, 500);

        } catch (err: any) {
            clearInterval(interval);
            console.error("[Extraction error]:", err);
            setError(err.message || "Failed to extract routine data.");
            setStep('INPUT');
        }
    };

    const handleViewData = () => {
        setIsOpen(false);
        router.push('/import-timetable');
    };

    return (
        <div className="fixed inset-0 z-[100] flex items-end justify-center">
            {/* Backdrop Overlay with dynamic atmospheric blur */}
            <div
                onClick={() => setIsOpen(false)}
                className="fixed inset-0 bg-black/50 backdrop-blur-xl animate-in fade-in duration-300"
            />

            {/* Ultra-Glassy Ethereal Floating Bottom Sheet */}
            <div className="relative z-[101] w-full max-w-lg bg-zinc-950/45 border-t border-x border-white/35 rounded-t-[40px] p-6 pb-8 shadow-[0_-25px_90px_rgba(0,0,0,0.9),inset_0_2px_3px_rgba(255,255,255,0.5)] backdrop-blur-3xl animate-in slide-in-from-bottom duration-500 ease-[cubic-bezier(0.16,1,0.3,1)] overflow-hidden">
                {/* Uniform Deep Purple Ambient Aura across all 4 edges (Matching Bottom-Right Corner Glow) */}
                <div className="absolute -top-24 -left-24 w-72 h-72 rounded-full bg-gradient-to-br from-purple-600/35 via-indigo-600/30 to-violet-500/25 blur-3xl pointer-events-none" />
                <div className="absolute -top-24 -right-24 w-72 h-72 rounded-full bg-gradient-to-br from-purple-600/35 via-indigo-600/30 to-violet-500/25 blur-3xl pointer-events-none" />
                <div className="absolute -bottom-24 -left-24 w-72 h-72 rounded-full bg-gradient-to-br from-purple-600/35 via-indigo-600/30 to-violet-500/25 blur-3xl pointer-events-none" />
                <div className="absolute -bottom-24 -right-24 w-72 h-72 rounded-full bg-gradient-to-br from-purple-600/35 via-indigo-600/30 to-violet-500/25 blur-3xl pointer-events-none" />

                {/* Specular Diagonal Glass Reflection Sheen */}
                <div className="absolute inset-0 bg-gradient-to-br from-white/30 via-white/[0.04] to-transparent pointer-events-none rounded-t-[40px]" />

                {/* Drag handle pill */}
                <div className="w-12 h-1.5 rounded-full bg-white/40 mx-auto mb-5 relative z-10 shadow-[0_1px_3px_rgba(255,255,255,0.5)]" />

                {/* PHASE 1: INPUT & UPLOAD SHEET (IMAGE 1 STYLING) */}
                {step === 'INPUT' && (
                    <div className="space-y-5 relative z-10">
                        <div className="flex items-center justify-between">
                            <div>
                                <div className="inline-flex items-center gap-1.5 px-3 py-0.5 rounded-full bg-white/10 border border-white/25 text-[10px] font-mono text-zinc-200 uppercase font-semibold backdrop-blur-md mb-1">
                                    <Sparkles className="w-3 h-3 text-purple-300" />
                                    <span>AI Importer • Multimodal</span>
                                </div>
                                <h2 className="text-2xl font-bold tracking-tight text-white font-sans drop-shadow">
                                    Upload a file to start
                                </h2>
                            </div>
                            <button
                                onClick={() => setIsOpen(false)}
                                className="w-9 h-9 rounded-full bg-white/10 hover:bg-white/25 border border-white/25 flex items-center justify-center text-zinc-200 hover:text-white transition-all backdrop-blur-md shadow-md"
                            >
                                <X className="w-4 h-4" />
                            </button>
                        </div>

                        {/* Central Liquid Frosted White Card (Reference Image 2 Glass Styling) */}
                        <div className="relative rounded-[32px] border border-white/35 bg-white/[0.07] backdrop-blur-3xl p-7 text-center shadow-[0_15px_50px_rgba(0,0,0,0.5),inset_0_1.5px_3px_rgba(255,255,255,0.6)] space-y-3.5 overflow-hidden group">
                            {/* Inner Specular Gloss Overlay */}
                            <div className="absolute inset-0 bg-gradient-to-br from-white/35 via-white/10 to-transparent pointer-events-none rounded-[32px]" />

                            <input
                                type="file"
                                ref={fileInputRef}
                                onChange={handleFileChange}
                                accept="image/*"
                                className="hidden"
                            />

                            <div className="w-12 h-12 rounded-full bg-white/15 border border-white/40 text-white flex items-center justify-center mx-auto shadow-[inset_0_1px_3px_rgba(255,255,255,0.6)] backdrop-blur-xl relative z-10 group-hover:scale-105 transition-transform">
                                <Paperclip className="w-5 h-5 text-purple-200" />
                            </div>

                            <div className="space-y-0.5 relative z-10">
                                <h3 className="text-sm font-bold text-white tracking-wide drop-shadow">Add files to upload</h3>
                                <p className="text-xs text-zinc-300">or browse screenshots, 4 MB max</p>
                            </div>

                            <button
                                onClick={() => fileInputRef.current?.click()}
                                className="px-6 py-2.5 rounded-full bg-white/20 hover:bg-white/30 border border-white/40 text-white text-xs font-semibold shadow-xl backdrop-blur-xl transition-all relative z-10 hover:shadow-[0_0_25px_rgba(255,255,255,0.3)]"
                            >
                                Select files
                            </button>
                        </div>

                        {/* Text Input Area */}
                        <div className="space-y-1.5">
                            <label className="text-[11px] font-bold uppercase tracking-wider text-zinc-300 flex items-center gap-1.5">
                                <FileText className="w-3.5 h-3.5 text-purple-300" />
                                Or Paste Routine Text
                            </label>
                            <textarea
                                value={rawText}
                                onChange={(e) => setRawText(e.target.value)}
                                placeholder="Paste routine text from ChatGPT, Claude, or DeepSeek..."
                                className="w-full h-20 bg-white/[0.05] backdrop-blur-2xl border border-white/25 rounded-2xl p-3 text-xs text-white placeholder-zinc-400 focus:outline-none focus:border-white/50 focus:bg-white/[0.09] transition-all resize-none shadow-[inset_0_1px_3px_rgba(0,0,0,0.4)]"
                            />
                        </div>

                        {/* Attached Files & Prompt Items (Image 1 Item List) */}
                        <div className="space-y-2">
                            {imageFileName && (
                                <div className="p-3.5 rounded-2xl bg-white/[0.06] backdrop-blur-2xl border border-white/25 flex items-center justify-between text-xs text-zinc-200 shadow-md">
                                    <div className="flex items-center gap-2.5">
                                        <Paperclip className="w-4 h-4 text-purple-300" />
                                        <span className="font-mono text-zinc-200 truncate max-w-[200px]">{imageFileName}</span>
                                    </div>
                                    <div className="w-5 h-5 rounded-full bg-emerald-500/25 text-emerald-400 border border-emerald-400/50 flex items-center justify-center">
                                        <Check className="w-3 h-3 stroke-[3]" />
                                    </div>
                                </div>
                            )}

                            <div className="p-3.5 rounded-2xl bg-white/[0.06] backdrop-blur-2xl border border-white/25 flex items-center justify-between text-xs text-zinc-200 shadow-md">
                                <div className="flex items-center gap-2.5 min-w-0">
                                    <Sparkles className="w-4 h-4 text-purple-300 shrink-0" />
                                    <span className="font-semibold text-white tracking-wide truncate">Universal Copy Prompt</span>
                                </div>
                                <button
                                    onClick={handleCopyPrompt}
                                    className="px-3.5 py-1.5 rounded-full bg-white/15 hover:bg-white/25 text-white border border-white/35 text-xs font-semibold transition-all flex items-center gap-1.5 shrink-0 backdrop-blur-xl shadow-sm"
                                >
                                    {copiedPrompt ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                                    <span>{copiedPrompt ? "Copied!" : "Copy"}</span>
                                </button>
                            </div>
                        </div>

                        {error && (
                            <div className="p-3 rounded-xl bg-red-500/25 border border-red-400/40 text-red-200 text-xs flex items-center gap-2 backdrop-blur-md">
                                <AlertTriangle className="w-4 h-4 shrink-0" />
                                <span>{error}</span>
                            </div>
                        )}

                        {/* Bottom Buttons */}
                        <div className="flex items-center gap-3 pt-2">
                            <button
                                onClick={() => setIsOpen(false)}
                                className="w-1/3 py-3.5 rounded-2xl bg-white/10 backdrop-blur-2xl border border-white/25 text-zinc-200 font-semibold text-xs hover:bg-white/20 hover:text-white transition-all shadow-md"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={handleStartExtraction}
                                className="w-2/3 py-3.5 rounded-2xl bg-white text-black font-bold text-xs shadow-[0_0_35px_rgba(255,255,255,0.45)] hover:bg-zinc-100 transition-all flex items-center justify-center gap-2"
                            >
                                <span>Continue</span>
                                <ArrowRight className="w-4 h-4" />
                            </button>
                        </div>
                    </div>
                )}

                {/* PHASE 2: ANIMATED EXTRACTION FLOATING CARD WITH NEON AURA (IMAGE 2 STYLING) */}
                {step === 'EXTRACTING' && (
                    <div className="relative py-4 space-y-6">
                        {/* Glowing Indigo/Purple Neon Aura Arc (Exact Image 2 Effect) */}
                        <div className="absolute -bottom-12 left-1/2 -translate-x-1/2 w-80 h-32 rounded-full bg-gradient-to-t from-indigo-600 via-indigo-500 to-purple-600 opacity-60 blur-3xl pointer-events-none animate-pulse" />

                        <div className="flex items-start justify-between relative z-10">
                            <div className="flex items-center gap-4">
                                {/* Translucent File Icon with [TEXT] / [IMAGE] Badge (Image 2) */}
                                <div className="relative w-16 h-20 rounded-2xl bg-gradient-to-br from-indigo-950/80 via-zinc-900 to-purple-950/60 border border-indigo-400/30 flex items-center justify-center shadow-xl">
                                    <FileText className="w-8 h-8 text-indigo-300" />
                                    <div className="absolute -left-2 bottom-4 px-1.5 py-0.5 rounded-md bg-zinc-900 border border-white/20 text-[9px] font-mono font-bold text-white shadow">
                                        {imageBase64 ? "IMAGE" : "TEXT"}
                                    </div>
                                </div>

                                <div>
                                    <h3 className="text-base font-bold text-white font-sans tracking-wide">
                                        {imageFileName || "Routine_Extract.txt"}
                                    </h3>
                                    <p className="text-xs font-mono text-zinc-400 mt-1">
                                        {rawText ? `${rawText.length} chars` : "Multimodal Image OCR"}
                                    </p>
                                </div>
                            </div>

                            <button
                                onClick={() => setIsOpen(false)}
                                className="w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center text-zinc-400 hover:text-white transition-colors relative z-20"
                            >
                                <X className="w-4 h-4" />
                            </button>
                        </div>

                        {/* Glowing Animated Progress Bar (Exact Image 2 Bar) */}
                        <div className="relative z-10 space-y-2">
                            <div className="h-12 rounded-2xl bg-zinc-900/90 border border-white/10 px-4 flex items-center justify-between relative overflow-hidden backdrop-blur-xl">
                                <div className="flex items-center gap-2.5 relative z-10 text-xs font-medium text-white">
                                    <Loader2 className="w-4 h-4 animate-spin text-indigo-400" />
                                    <span>Extracting Routine...</span>
                                </div>
                                <span className="text-xs font-mono font-bold text-white relative z-10">
                                    {progress}%
                                </span>

                                {/* Glowing White Lead Edge Progress Line */}
                                <div
                                    className="absolute bottom-0 left-0 h-1 bg-gradient-to-r from-indigo-500 via-indigo-300 to-white rounded-full transition-all duration-300 shadow-[0_0_15px_rgba(255,255,255,1)]"
                                    style={{ width: `${progress}%` }}
                                />
                            </div>
                        </div>
                    </div>
                )}

                {/* PHASE 3: COMPLETION & VIEW DATA ACTION */}
                {step === 'SUCCESS' && (
                    <div className="py-4 text-center space-y-5 relative z-10">
                        <div className="w-14 h-14 rounded-full bg-emerald-500/20 text-emerald-400 border border-emerald-500/40 flex items-center justify-center mx-auto shadow-[0_0_30px_rgba(16,185,129,0.3)]">
                            <Check className="w-7 h-7 stroke-[3]" />
                        </div>

                        <div className="space-y-1">
                            <h3 className="text-xl font-bold text-white">Routine Extracted Successfully!</h3>
                            <p className="text-xs text-zinc-400">
                                Structured data is ready to seal into your Gyral discipline system.
                            </p>
                        </div>

                        <button
                            onClick={handleViewData}
                            className="w-full py-3.5 rounded-2xl bg-gradient-to-r from-indigo-600 via-indigo-500 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white font-bold text-xs shadow-xl shadow-indigo-600/30 flex items-center justify-center gap-2 transition-all"
                        >
                            <Sparkles className="w-4 h-4" />
                            <span>View & Seal Routine Data</span>
                            <ArrowRight className="w-4 h-4" />
                        </button>
                    </div>
                )}
            </div>
        </div>
    );
}
