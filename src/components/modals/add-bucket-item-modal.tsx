"use client";

import { useState } from "react";
import { useUserData } from "@/context/user-data-context";
import { X, Infinity, CalendarClock, Sparkles } from "lucide-react";
import { format } from "date-fns";

interface AddBucketItemModalProps {
    isOpen: boolean;
    onClose: () => void;
}

export function AddBucketItemModal({ isOpen, onClose }: AddBucketItemModalProps) {
    const { addLifeEvent } = useUserData();
    const [title, setTitle] = useState("");
    const [notes, setNotes] = useState("");
    const [type, setType] = useState<'BUCKET_LIFE' | 'BUCKET_YEAR'>('BUCKET_LIFE');
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [errorMsg, setErrorMsg] = useState<string | null>(null);

    if (!isOpen) return null;

    const currentYear = new Date().getFullYear();

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!title.trim() || isSubmitting) return;

        setIsSubmitting(true);
        setErrorMsg(null);

        try {
            await addLifeEvent({
                title: title.trim(),
                description: notes.trim(),
                event_date: format(new Date(), 'yyyy-MM-dd'),
                type: type,
            });

            setTitle("");
            setNotes("");
            onClose();
        } catch (err: any) {
            console.error("Failed to add bucket list item:", err);
            setErrorMsg(err.message || "Failed to forge aspiration.");
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
            <div className="absolute inset-0 bg-black/70 backdrop-blur-md" onClick={onClose} />

            <div className="relative w-full max-w-md bg-[#0c0c0c] border border-white/10 rounded-2xl p-6 shadow-[0_20px_50px_rgba(0,0,0,0.8)] overflow-hidden animate-in fade-in zoom-in-95 duration-300">
                {/* Glowing top line */}
                <div className="absolute top-0 left-0 w-full h-[1.5px] bg-gradient-to-r from-white/0 via-white/20 to-white/0" />

                <div className="flex justify-between items-center mb-5 select-none">
                    <h3 className="text-xs font-mono uppercase tracking-[0.2em] text-white/50 flex items-center gap-2">
                        <Sparkles className="w-3.5 h-3.5 text-zinc-400" />
                        Forge Aspiration
                    </h3>
                    <button
                        type="button"
                        onClick={onClose}
                        className="text-white/20 hover:text-white/60 transition-colors p-1"
                    >
                        <X className="w-4 h-4" />
                    </button>
                </div>

                <form onSubmit={handleSubmit} className="space-y-4">
                    <div className="space-y-3.5">
                        <div>
                            <label className="text-[9px] font-mono uppercase tracking-[0.2em] text-white/30 block mb-1">Title</label>
                            <input
                                type="text"
                                value={title}
                                onChange={(e) => setTitle(e.target.value)}
                                placeholder={
                                    type === 'BUCKET_LIFE'
                                        ? 'e.g. Kyoto in Autumn, Learn skydiving...'
                                        : `e.g. Complete a marathon, Publish a web app...`
                                }
                                className="w-full bg-white/[0.02] border border-white/5 rounded-xl px-3.5 py-2.5 text-xs md:text-sm text-white placeholder:text-white/25 focus:outline-none focus:border-white/40 transition-colors"
                                autoFocus
                                required
                            />
                        </div>

                        <div>
                            <label className="text-[9px] font-mono uppercase tracking-[0.2em] text-white/30 block mb-1.5">Horizon</label>
                            <div className="grid grid-cols-2 gap-2 bg-white/[0.02] border border-white/5 p-1 rounded-xl">
                                <button
                                    type="button"
                                    onClick={() => setType('BUCKET_LIFE')}
                                    className={`py-2.5 rounded-lg text-[10px] font-mono uppercase tracking-wider transition-all flex items-center justify-center gap-1.5 ${
                                        type === 'BUCKET_LIFE'
                                            ? 'bg-white text-black font-semibold shadow-[0_4px_12px_rgba(255,255,255,0.15)]'
                                            : 'text-white/40 hover:text-white/70 hover:bg-white/[0.01]'
                                    }`}
                                >
                                    <Infinity className="w-3.5 h-3.5" />
                                    Lifetime
                                </button>
                                <button
                                    type="button"
                                    onClick={() => setType('BUCKET_YEAR')}
                                    className={`py-2.5 rounded-lg text-[10px] font-mono uppercase tracking-wider transition-all flex items-center justify-center gap-1.5 ${
                                        type === 'BUCKET_YEAR'
                                            ? 'bg-white text-black font-semibold shadow-[0_4px_12px_rgba(255,255,255,0.15)]'
                                            : 'text-white/40 hover:text-white/70 hover:bg-white/[0.01]'
                                    }`}
                                >
                                    <CalendarClock className="w-3.5 h-3.5" />
                                    {currentYear} Year
                                </button>
                            </div>
                        </div>

                        <div>
                            <label className="text-[9px] font-mono uppercase tracking-[0.2em] text-white/30 block mb-1">Motivation Notes</label>
                            <textarea
                                value={notes}
                                onChange={(e) => setNotes(e.target.value)}
                                placeholder="Detail what this achievement will look like..."
                                rows={3}
                                className="w-full bg-white/[0.02] border border-white/5 rounded-xl px-3.5 py-2.5 text-xs text-white placeholder:text-white/25 focus:outline-none focus:border-white/40 transition-colors resize-none"
                            />
                        </div>
                    </div>

                    {errorMsg && (
                        <div className="text-[10px] text-red-400 font-mono bg-red-950/15 border border-red-500/10 px-3 py-2 rounded-lg">
                            {errorMsg}
                        </div>
                    )}

                    <div className="flex justify-end gap-3 pt-2 select-none">
                        <button
                            type="button"
                            onClick={onClose}
                            className="px-4 py-2 rounded-xl text-[10px] uppercase font-mono tracking-wider text-white/40 hover:text-white/60 hover:bg-white/5 transition-colors"
                        >
                            Cancel
                        </button>
                        <button
                            type="submit"
                            disabled={!title.trim() || isSubmitting}
                            className="px-4 py-2 rounded-xl text-[10px] uppercase font-mono tracking-wider bg-white text-black font-bold hover:bg-zinc-200 disabled:opacity-20 transition-all shadow-[0_0_10px_rgba(255,255,255,0.2)]"
                        >
                            {isSubmitting ? 'Forging...' : 'Forge'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}
