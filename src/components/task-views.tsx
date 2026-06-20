"use client";

import { useState, useEffect } from "react";
import { Heatmap } from "./heatmap";
import { ChecklistWidget } from "./checklist-widget";
import { LayoutGrid, ListChecks } from "lucide-react";

export function TaskViews() {
    const [viewMode, setViewMode] = useState<'standard' | 'checklist'>('standard');
    const [isMounted, setIsMounted] = useState(false);

    useEffect(() => {
        setIsMounted(true);
        const saved = localStorage.getItem('gyral_home_view_mode');
        if (saved === 'checklist') {
            setViewMode('checklist');
        }
    }, []);

    const toggleView = (mode: 'standard' | 'checklist') => {
        setViewMode(mode);
        localStorage.setItem('gyral_home_view_mode', mode);
    };

    if (!isMounted) return null;

    return (
        <div className="space-y-4">
            <div className="flex justify-end mb-2">
                <div className="bg-white/5 backdrop-blur-md border border-white/10 rounded-full p-1 flex gap-1 shadow-lg">
                    <button
                        onClick={() => toggleView('standard')}
                        className={`px-3 py-1.5 rounded-full flex items-center gap-2 text-xs font-semibold transition-all ${viewMode === 'standard' ? 'bg-white/20 text-white shadow-md' : 'text-zinc-400 hover:text-white hover:bg-white/10'}`}
                    >
                        <LayoutGrid className="w-4 h-4" />
                        <span className="hidden sm:inline">Overview</span>
                    </button>
                    <button
                        onClick={() => toggleView('checklist')}
                        className={`px-3 py-1.5 rounded-full flex items-center gap-2 text-xs font-semibold transition-all ${viewMode === 'checklist' ? 'bg-accent/20 text-accent shadow-[0_0_10px_rgba(52,211,153,0.2)] border border-accent/30' : 'text-zinc-400 hover:text-white hover:bg-white/10'}`}
                    >
                        <ListChecks className="w-4 h-4" />
                        <span className="hidden sm:inline">Checklist</span>
                    </button>
                </div>
            </div>

            <div className="transition-all duration-500">
                {viewMode === 'standard' ? (
                    <Heatmap />
                ) : (
                    <ChecklistWidget />
                )}
            </div>
        </div>
    );
}
