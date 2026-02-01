"use client";

import { Eye } from 'lucide-react';
import { useState } from 'react';
import { LedgerEntry } from '@/data/mock-ledger';

interface LedgerEntryItemProps {
    entry: LedgerEntry;
}

export function LedgerEntryItem({ entry }: LedgerEntryItemProps) {
    const [witnessed, setWitnessed] = useState(false);
    const [count, setCount] = useState(entry.witnessCount);

    const handleWitness = () => {
        if (witnessed) return;
        setWitnessed(true);
        setCount(prev => prev + 1);
    };

    return (
        <div className="group relative border-l-2 border-white/10 pl-6 py-4 hover:border-white/30 transition-colors duration-500">
            {/* Timestamp Marker */}
            <div className="absolute -left-[5px] top-6 w-2 h-2 rounded-full bg-zinc-800 ring-4 ring-black group-hover:bg-white transition-colors duration-500" />

            <div className="flex flex-col sm:flex-row sm:items-baseline justify-between gap-2 sm:gap-8">

                {/* Main Content */}
                <div className="flex-1 space-y-1">
                    <div className="flex items-center gap-2 text-xs font-mono text-zinc-500 uppercase tracking-widest">
                        <span className="text-zinc-400 font-bold group-hover:text-white transition-colors">{entry.user}</span>
                        <span>•</span>
                        <span>{entry.timestamp}</span>
                    </div>

                    <div className="text-zinc-300 font-serif leading-relaxed text-lg group-hover:text-white transition-colors">
                        <span className="font-bold text-zinc-400 group-hover:text-zinc-200 transition-colors">{entry.action}</span>
                        <span className="mx-2 text-zinc-600">/</span>
                        {entry.detail}
                    </div>
                </div>

                {/* Witness Button */}
                <button
                    onClick={handleWitness}
                    disabled={witnessed}
                    className={`flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-mono tracking-wider transition-all duration-500 ${witnessed
                            ? 'text-white bg-white/10 cursor-default'
                            : 'text-zinc-600 hover:text-white hover:bg-white/5 active:scale-95'
                        }`}
                >
                    <Eye className={`w-3 h-3 ${witnessed ? 'text-white' : 'text-zinc-600 group-hover/btn:text-white'}`} />
                    <span>
                        {witnessed ? 'WITNESSED' : 'WITNESS'}
                        <span className="ml-1 opacity-50">{count}</span>
                    </span>
                </button>
            </div>
        </div>
    );
}
