"use client";

import { useState } from "react";
import { useUserData, LifeEvent } from "@/context/user-data-context";
import { X, Calendar, Flag, BookOpen } from "lucide-react";

interface AddLifeEventModalProps {
    isOpen: boolean;
    onClose: () => void;
    weekIndex: number;
    birthDate: string;
}

export function AddLifeEventModal({ isOpen, onClose, weekIndex, birthDate }: AddLifeEventModalProps) {
    const { addLifeEvent } = useUserData();
    const [title, setTitle] = useState("");
    const [description, setDescription] = useState("");
    const [type, setType] = useState<'MEMORY' | 'GOAL'>('MEMORY');
    const [isSubmitting, setIsSubmitting] = useState(false);

    if (!isOpen) return null;

    // Calculate approximate date from weekIndex
    const getEventDate = () => {
        const birth = new Date(birthDate);
        birth.setDate(birth.getDate() + (weekIndex * 7));
        return birth.toISOString().split('T')[0];
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsSubmitting(true);

        await addLifeEvent({
            event_date: getEventDate(),
            title,
            description,
            type
        });

        setIsSubmitting(false);
        setTitle("");
        setDescription("");
        onClose();
    };

    const isPast = new Date(getEventDate()) < new Date();

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
            <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />

            <div className="relative w-full max-w-md bg-[#0a0a0a] border border-white/10 rounded-3xl p-6 shadow-2xl animate-in fade-in zoom-in-95 duration-300">
                <button
                    onClick={onClose}
                    className="absolute top-4 right-4 text-zinc-500 hover:text-white transition-colors"
                >
                    <X className="w-5 h-5" />
                </button>

                <div className="mb-6">
                    <h2 className="text-xl font-bold text-white flex items-center gap-2">
                        {type === 'MEMORY' ? <BookOpen className="w-5 h-5 text-yellow-500" /> : <Flag className="w-5 h-5 text-blue-500" />}
                        {type === 'MEMORY' ? 'Capture Memory' : 'Set Life Goal'}
                    </h2>
                    <p className="text-zinc-500 text-xs font-mono mt-1">
                        Week {weekIndex} • {getEventDate()}
                    </p>
                </div>

                <form onSubmit={handleSubmit} className="space-y-4">
                    {/* Type Toggle */}
                    <div className="flex bg-white/5 p-1 rounded-xl">
                        <button
                            type="button"
                            onClick={() => setType('MEMORY')}
                            className={`flex-1 py-2 text-sm font-bold rounded-lg transition-all ${type === 'MEMORY' ? 'bg-yellow-500/20 text-yellow-500' : 'text-zinc-500 hover:text-zinc-300'}`}
                        >
                            Memory
                        </button>
                        <button
                            type="button"
                            onClick={() => setType('GOAL')}
                            className={`flex-1 py-2 text-sm font-bold rounded-lg transition-all ${type === 'GOAL' ? 'bg-blue-500/20 text-blue-500' : 'text-zinc-500 hover:text-zinc-300'}`}
                        >
                            Goal
                        </button>
                    </div>

                    <div className="space-y-2">
                        <label className="text-xs uppercase tracking-wider text-zinc-500 font-bold">Title</label>
                        <input
                            type="text"
                            value={title}
                            onChange={(e) => setTitle(e.target.value)}
                            placeholder={type === 'MEMORY' ? "Graduated College" : "Retire Early"}
                            className="w-full bg-zinc-900 border border-white/10 rounded-xl px-4 py-3 text-white placeholder:text-zinc-700 focus:outline-none focus:border-white/20 transition-colors"
                            required
                        />
                    </div>

                    <div className="space-y-2">
                        <label className="text-xs uppercase tracking-wider text-zinc-500 font-bold">Details</label>
                        <textarea
                            value={description}
                            onChange={(e) => setDescription(e.target.value)}
                            placeholder="Add context..."
                            className="w-full bg-zinc-900 border border-white/10 rounded-xl px-4 py-3 text-white placeholder:text-zinc-700 focus:outline-none focus:border-white/20 transition-colors min-h-[100px] resize-none"
                        />
                    </div>

                    <button
                        type="submit"
                        disabled={isSubmitting}
                        className={`
                            w-full py-3 rounded-xl font-bold text-black transition-all hover:scale-[1.02] active:scale-95
                            ${type === 'MEMORY' ? 'bg-white hover:bg-yellow-50' : 'bg-white hover:bg-blue-50'}
                            ${isSubmitting ? 'opacity-50 cursor-not-allowed' : ''}
                        `}
                    >
                        {isSubmitting ? "Scribing..." : "Etch into Life Map"}
                    </button>
                </form>
            </div>
        </div>
    );
}
