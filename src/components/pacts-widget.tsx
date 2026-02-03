"use client";

import { useUserData } from '@/context/user-data-context';
import { Dumbbell, BookOpen, Droplet, Carrot, Circle, Check, Zap, Brain, Moon, Plus, Calendar as CalendarIcon, ChevronLeft, ChevronRight } from 'lucide-react';
import { useState, useRef } from 'react';

export function PactWidget() {
    const { pacts, addPact, togglePact, deletePact } = useUserData();
    const [newPactText, setNewPactText] = useState('');
    const [isAdding, setIsAdding] = useState(false);
    const [deleteCandidateId, setDeleteCandidateId] = useState<string | null>(null);

    // Date State
    const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
    const dateInputRef = useRef<HTMLInputElement>(null);

    const todayStr = new Date().toISOString().split('T')[0];
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

    const handleAddPact = (e: React.FormEvent) => {
        e.preventDefault();
        if (newPactText.trim()) {
            addPact(newPactText.trim(), selectedDate);
            setNewPactText('');
            // If we have pacts, close the adding mode
            if (currentPacts.length >= 0) {
                setIsAdding(false);
            }
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

                        {/* Add Button (Only if not already adding and list exists) */}
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

                {/* Input Form */}
                {showInput && (
                    <form onSubmit={handleAddPact} className="mb-6 relative animate-[fadeIn_0.3s_ease-out]">
                        <input
                            type="text"
                            value={newPactText}
                            onChange={(e) => setNewPactText(e.target.value)}
                            placeholder={`Add a pact for ${displayDate}...`}
                            autoFocus={isAdding}
                            className="w-full bg-black/20 border border-white/10 rounded-xl px-4 py-3 text-white placeholder:text-zinc-600 focus:outline-none focus:border-white/30 transition-all"
                        />
                        <button
                            type="submit"
                            disabled={!newPactText.trim()}
                            className="absolute right-2 top-2 p-1.5 bg-white text-black rounded-lg disabled:opacity-50 disabled:bg-zinc-800 disabled:text-zinc-600 transition-all hover:scale-105 flex items-center justify-center"
                        >
                            <Plus className="w-4 h-4" />
                        </button>
                    </form>
                )}

                {/* List */}
                <div className="flex flex-col gap-3">
                    {currentPacts.map(pact => {
                        const isDeleting = deleteCandidateId === pact.id;

                        if (isDeleting) {
                            return (
                                <div key={pact.id} className="relative flex items-center justify-between p-4 rounded-2xl bg-red-900/20 border border-red-500/30 animate-[pulse_2s_infinite]">
                                    <span className="text-red-200 font-bold ml-2">Delete this pact?</span>
                                    <div className="flex gap-2">
                                        <button
                                            onClick={() => setDeleteCandidateId(null)}
                                            className="px-3 py-1.5 rounded-lg bg-white/5 hover:bg-white/10 text-xs font-bold text-zinc-400 hover:text-white transition-colors"
                                        >
                                            CANCEL
                                        </button>
                                        <button
                                            onClick={() => {
                                                deletePact(pact.id, selectedDate);
                                                setDeleteCandidateId(null);
                                            }}
                                            className="px-3 py-1.5 rounded-lg bg-red-600 hover:bg-red-500 text-xs font-bold text-white transition-colors shadow-lg shadow-red-900/50"
                                        >
                                            DELETE
                                        </button>
                                    </div>
                                </div>
                            );
                        }

                        return (
                            <button
                                key={pact.id}
                                onClick={() => togglePact(pact.id, selectedDate)}
                                onDoubleClick={() => setDeleteCandidateId(pact.id)}
                                className={`
                                    relative flex items-center justify-between p-4 rounded-2xl transition-all duration-500 group/item text-left select-none
                                    ${pact.isCompleted
                                        ? 'bg-white text-black shadow-[0_0_20px_rgba(255,255,255,0.3)] scale-[1.02]'
                                        : 'bg-zinc-800/40 text-zinc-400 hover:bg-zinc-800/60 hover:text-zinc-200 border border-transparent hover:border-white/5'}
                                `}
                            >
                                <div className="flex items-center gap-3">
                                    <div className={`p-2 rounded-full ${pact.isCompleted ? 'bg-black text-white' : 'bg-white/5 text-current'}`}>
                                        {getIcon(pact.text)}
                                    </div>
                                    <span className={`font-bold text-sm ${pact.isCompleted ? 'line-through decoration-black/20' : ''}`}>
                                        {pact.text}
                                    </span>
                                </div>

                                <div className={`
                                    w-6 h-6 rounded-full border-2 flex items-center justify-center transition-all duration-300
                                    ${pact.isCompleted
                                        ? 'border-black bg-black text-white'
                                        : 'border-zinc-600 group-hover/item:border-zinc-400'}
                                `}>
                                    {pact.isCompleted && <Check className="w-3.5 h-3.5 stroke-[3]" />}
                                </div>
                            </button>
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
