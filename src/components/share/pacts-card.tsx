"use client";

import { Check, Dumbbell, BookOpen, Droplet, Carrot, Brain, Moon, Zap, Circle } from 'lucide-react';
import { PactsMap } from '@/context/user-data-context';

interface PactsCardProps {
    pacts: PactsMap;
    date: string;
}

export function PactsCard({ pacts, date }: PactsCardProps) {
    const dailyPacts = pacts[date] || [];
    const completed = dailyPacts.filter(p => p.isCompleted).length;
    const total = dailyPacts.length;
    const progress = total > 0 ? (completed / total) * 100 : 0;

    // Helper: Icon Mapper (Same as Widget)
    const getIcon = (name: string) => {
        const lower = name.toLowerCase();
        if (lower.includes('workout') || lower.includes('gym') || lower.includes('exercise')) return <Dumbbell className="w-4 h-4" />;
        if (lower.includes('read') || lower.includes('book') || lower.includes('study')) return <BookOpen className="w-4 h-4" />;
        if (lower.includes('water') || lower.includes('drink')) return <Droplet className="w-4 h-4" />;
        if (lower.includes('diet') || lower.includes('eat') || lower.includes('food')) return <Carrot className="w-4 h-4" />;
        if (lower.includes('meditat') || lower.includes('mind')) return <Brain className="w-4 h-4" />;
        if (lower.includes('sleep')) return <Moon className="w-4 h-4" />;
        return <Zap className="w-4 h-4" />;
    };

    return (
        <div className="w-full h-full bg-[#0a0a0a] flex flex-col p-8 relative overflow-hidden font-sans">
            {/* Background - keeping it simple/native */}
            {/* We mimic the widget container style: border border-white/10 rounded-3xl p-6 */}

            <div className="flex justify-between items-start mb-6 z-10">
                <div>
                    <h2 className="text-2xl font-bold text-white tracking-tight flex items-center gap-2">
                        {date}'s Pacts
                    </h2>
                    <p className="text-zinc-500 font-medium text-sm mt-1">
                        {completed === total && total > 0
                            ? "All pacts sealed."
                            : completed > 0
                                ? "Momentum building..."
                                : "What will you conquer?"}
                    </p>
                </div>

                {/* Circular Progress (Widget Style) */}
                <div className="relative w-12 h-12 flex items-center justify-center">
                    <svg className="w-full h-full -rotate-90">
                        <circle cx="24" cy="24" r="20" className="stroke-white/10 fill-none" strokeWidth="4" />
                        <circle
                            cx="24" cy="24" r="20"
                            className={`fill-none ${completed === total ? 'stroke-current text-purple-500' : 'stroke-white'}`}
                            strokeWidth="4"
                            strokeDasharray="125.6"
                            strokeDashoffset={125.6 - (125.6 * progress) / 100}
                            strokeLinecap="round"
                        />
                    </svg>
                    <span className="absolute text-xs font-bold text-white">{completed}/{total}</span>
                </div>
            </div>

            {/* List - Exact replica of Widget Item Style */}
            <div className="flex-1 space-y-3 z-10">
                {dailyPacts.length === 0 ? (
                    <div className="text-center text-zinc-600 italic mt-10">No pacts signed for this day.</div>
                ) : (
                    dailyPacts.map(pact => (
                        <div
                            key={pact.id}
                            className={`
                                relative flex items-center justify-between p-4 rounded-2xl transition-all duration-500
                                ${pact.isCompleted
                                    ? 'bg-white text-black shadow-[0_0_20px_rgba(255,255,255,0.3)] scale-[1.02]'
                                    : 'bg-zinc-800/40 text-zinc-400 border border-transparent'}
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
                                w-6 h-6 rounded-full border-2 flex items-center justify-center
                                ${pact.isCompleted
                                    ? 'border-black bg-black text-white'
                                    : 'border-zinc-600'}
                            `}>
                                {pact.isCompleted ? <Check className="w-3.5 h-3.5 stroke-[3]" /> : <div className="w-full h-full" />}
                            </div>
                        </div>
                    ))
                )}
            </div>

            {/* Simple Footer */}
            <div className="mt-auto pt-6 text-center">
                <div className="text-[10px] text-zinc-600 font-mono tracking-widest uppercase opacity-50">Diogenes Protocol</div>
            </div>
        </div>
    );
}
