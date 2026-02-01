"use client";

import { useState, useEffect } from 'react';
import { X, ArrowRight, Skull, Quote, ScrollText, Check, ChevronRight } from 'lucide-react';
import { useUserData } from '@/context/user-data-context';
import { PactWidget } from '../pacts-widget';
import { quotes } from '@/data/quotes';

interface RitualModalProps {
    isOpen: boolean;
    onClose: () => void;
}

export function RitualModal({ isOpen, onClose }: RitualModalProps) {
    const { birthDate } = useUserData();
    const [step, setStep] = useState(0); // 0: Intro, 1: Memento, 2: Quote, 3: Pacts
    const [dayQuote, setDayQuote] = useState(quotes[0]);

    useEffect(() => {
        if (isOpen) {
            setStep(0);
            // Pick a random quote for this session
            const randomIndex = Math.floor(Math.random() * quotes.length);
            setDayQuote(quotes[randomIndex]);
        }
    }, [isOpen]);

    if (!isOpen) return null;

    // Helper for Life Percent
    const getLifePercent = () => {
        if (!birthDate) return 0;
        const birth = new Date(birthDate);
        const today = new Date();
        const diffTime = Math.abs(today.getTime() - birth.getTime());
        const weeksLived = Math.floor(diffTime / (1000 * 60 * 60 * 24 * 7));
        const totalWeeks = 90 * 52;
        return ((weeksLived / totalWeeks) * 100).toFixed(1);
    };

    const nextStep = () => setStep(prev => prev + 1);

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
            {/* Cinematic Backdrop */}
            <div className="absolute inset-0 bg-black/95 backdrop-blur-xl animate-[fadeIn_1s_ease-out]" />

            <div className="relative z-10 w-full max-w-2xl h-[600px] flex flex-col items-center justify-center text-center animate-in zoom-in-95 duration-700">
                <button
                    onClick={onClose}
                    className="absolute top-0 right-0 p-4 text-zinc-600 hover:text-white transition-colors"
                >
                    <X className="w-6 h-6" />
                </button>

                {/* STEP 0: INTRO */}
                {step === 0 && (
                    <div className="space-y-8 animate-in slide-in-from-bottom-8 fade-in duration-700">
                        <h1 className="text-5xl md:text-7xl font-black text-transparent bg-clip-text bg-gradient-to-tr from-orange-100 to-orange-500 tracking-tighter">
                            THE RITUAL
                        </h1>
                        <p className="text-xl text-zinc-400 font-serif italic max-w-md mx-auto">
                            "Begin each day by telling yourself: Today I shall be meeting with interference, ingratitude, insolence, disloyalty, ill-will, and selfishness..."
                        </p>
                        <button
                            onClick={nextStep}
                            className="group relative px-8 py-4 bg-white text-black font-bold tracking-widest text-sm uppercase rounded-full overflow-hidden hover:scale-105 transition-transform"
                        >
                            <span className="relative z-10 flex items-center gap-2">
                                Begin the Day <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                            </span>
                        </button>
                    </div>
                )}

                {/* STEP 1: MEMENTO */}
                {step === 1 && (
                    <div className="space-y-8 max-w-lg w-full animate-in slide-in-from-bottom-8 fade-in duration-700">
                        <div className="inline-flex p-4 rounded-full bg-zinc-900 border border-white/10 mb-4">
                            <Skull className="w-8 h-8 text-white" />
                        </div>
                        <h2 className="text-3xl font-bold tracking-tight text-white">Memento Mori</h2>
                        <div className="bg-zinc-900/50 p-8 rounded-2xl border border-white/5">
                            <div className="text-6xl font-black text-white mb-2">{getLifePercent()}%</div>
                            <div className="text-sm text-zinc-500 uppercase tracking-widest mb-6">Of Your Life Is Complete</div>
                            <div className="h-2 w-full bg-zinc-800 rounded-full overflow-hidden">
                                <div
                                    className="h-full bg-white shadow-[0_0_15px_white]"
                                    style={{ width: `${getLifePercent()}%` }}
                                />
                            </div>
                        </div>
                        <p className="text-zinc-500 text-sm">Do not waste the remaining % on things that do not matter.</p>
                        <button
                            onClick={nextStep}
                            className="w-full py-4 bg-white/5 hover:bg-white/10 border border-white/10 rounded-xl text-white font-bold transition-all flex items-center justify-center gap-2"
                        >
                            I Accept <ChevronRight className="w-4 h-4" />
                        </button>
                    </div>
                )}

                {/* STEP 2: QUOTE */}
                {step === 2 && (
                    <div className="space-y-8 max-w-xl w-full animate-in slide-in-from-bottom-8 fade-in duration-700">
                        <div className="inline-flex p-4 rounded-full bg-zinc-900 border border-white/10 mb-4">
                            <Quote className="w-8 h-8 text-white" />
                        </div>
                        <blockquote className="text-2xl md:text-3xl font-serif text-white/90 leading-relaxed">
                            "{dayQuote.text}"
                        </blockquote>
                        <div className="text-zinc-500 font-bold tracking-widest uppercase text-sm">
                            — {dayQuote.author}
                        </div>
                        <button
                            onClick={nextStep}
                            className="w-full py-4 bg-white/5 hover:bg-white/10 border border-white/10 rounded-xl text-white font-bold transition-all flex items-center justify-center gap-2 mt-8"
                        >
                            Reflect & Proceed <ChevronRight className="w-4 h-4" />
                        </button>
                    </div>
                )}

                {/* STEP 3: PACTS */}
                {step === 3 && (
                    <div className="space-y-6 max-w-xl w-full animate-in slide-in-from-bottom-8 fade-in duration-700">
                        <div className="inline-flex p-4 rounded-full bg-zinc-900 border border-white/10">
                            <ScrollText className="w-8 h-8 text-white" />
                        </div>
                        <h2 className="text-3xl font-bold tracking-tight text-white mb-4">Set Your Intentions</h2>

                        {/* Reuse Widget - We wrap it to style it for the modal */}
                        <div className="bg-black/50 p-6 rounded-2xl border border-white/10 text-left">
                            <PactWidget />
                        </div>

                        <button
                            onClick={onClose}
                            className="w-full py-4 bg-white text-black font-bold rounded-xl hover:scale-[1.02] transition-transform shadow-[0_0_20px_rgba(255,255,255,0.2)] flex items-center justify-center gap-2"
                        >
                            <Check className="w-4 h-4" /> Begin the Day
                        </button>
                    </div>
                )}

                {/* Progress Indicators */}
                <div className="absolute bottom-8 flex gap-2">
                    {[0, 1, 2, 3].map(i => (
                        <div
                            key={i}
                            className={`h-1 rounded-full transition-all duration-300 ${i === step ? 'w-8 bg-white' : 'w-2 bg-zinc-800'}`}
                        />
                    ))}
                </div>
            </div>
        </div>
    );
}
