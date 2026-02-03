"use client";

import { useState, useEffect } from 'react';
import { Filter, ChevronDown, Check } from 'lucide-react';
import { useUserData } from '@/context/user-data-context';

export function FilterBar() {
    const { tasks, activeFilterTaskId, setActiveFilterTaskId } = useUserData();
    const [isOpen, setIsOpen] = useState(false);
    const [clickCount, setClickCount] = useState(0);

    const activeTask = activeFilterTaskId ? tasks.find(t => t.id === activeFilterTaskId) : null;

    // Easter Egg: Triple Click Handler
    useEffect(() => {
        if (clickCount === 0) return;

        if (clickCount >= 3) {
            window.dispatchEvent(new CustomEvent('openDailyReview'));
            setClickCount(0);
            return;
        }

        const timer = setTimeout(() => setClickCount(0), 500);
        return () => clearTimeout(timer);
    }, [clickCount]);

    const handleSelect = (taskId: string | null) => {
        setActiveFilterTaskId(taskId);
        setIsOpen(false);
    };

    return (
        <div className="relative z-50">
            {/* Backdrop for closing */}
            {isOpen && (
                <div className="fixed inset-0 z-10" onClick={() => setIsOpen(false)} />
            )}

            <div
                onClick={() => {
                    setIsOpen(!isOpen);
                    setClickCount(prev => prev + 1);
                }}
                className={`w-full bg-white/5 border border-white/20 rounded-xl px-4 md:px-4 py-4 md:py-3 flex justify-between items-center cursor-pointer transition-all duration-200 shadow-[0_0_10px_rgba(0,0,0,0.5)] hover:shadow-[0_0_20px_rgba(16,185,129,0.2)] active:scale-[0.98] group backdrop-blur-xl relative z-50 ${isOpen ? 'bg-white/10 ring-1 ring-accent/50' : 'hover:bg-white/10'}`}
            >
                <div className="flex items-center gap-2 text-base md:text-sm text-white font-bold tracking-wide group-hover:drop-shadow-[0_0_10px_rgba(255,255,255,0.5)] transition-all duration-200">
                    <Filter className="w-5 h-5 md:w-4 md:h-4 group-hover:text-accent transition-colors duration-200 drop-shadow-[0_0_5px_currentColor]" />
                    <span className={activeTask ? 'text-accent' : ''}>
                        {activeTask ? `Filter: ${activeTask.name}` : 'Filter by Task'}
                    </span>
                </div>
                <ChevronDown className={`w-5 h-5 md:w-4 md:h-4 text-muted-foreground group-hover:text-white transition-all duration-200 ${isOpen ? 'rotate-180 text-white' : ''}`} />
            </div>

            {/* Dropdown Menu */}
            {isOpen && (
                <div className="absolute top-full left-0 right-0 mt-2 bg-[#0a0a0a] border border-white/10 rounded-xl shadow-[0_10px_40px_rgba(0,0,0,0.8)] overflow-hidden z-30 animate-[fadeIn_0.2s_ease-out]">
                    <button
                        onClick={() => handleSelect(null)}
                        className="w-full text-left px-4 py-4 md:py-3 text-base md:text-sm font-medium hover:bg-white/5 active:bg-white/10 transition-colors flex items-center justify-between group"
                    >
                        <span className={!activeTask ? 'text-white' : 'text-muted-foreground group-hover:text-white'}>All Tasks</span>
                        {!activeTask && <Check className="w-5 h-5 md:w-4 md:h-4 text-accent" />}
                    </button>

                    <div className="h-px bg-white/5" />

                    {tasks.map(task => (
                        <button
                            key={task.id}
                            onClick={() => handleSelect(task.id)}
                            className="w-full text-left px-4 py-4 md:py-3 text-base md:text-sm font-medium hover:bg-white/5 active:bg-white/10 transition-colors flex items-center justify-between group"
                        >
                            <div className="flex items-center gap-2">
                                <div
                                    className="w-2.5 h-2.5 md:w-2 md:h-2 rounded-full shadow-[0_0_5px_currentColor]"
                                    style={{ backgroundColor: task.color, color: task.color }}
                                />
                                <span className={activeFilterTaskId === task.id ? 'text-white' : 'text-muted-foreground group-hover:text-white'}>
                                    {task.name}
                                </span>
                            </div>
                            {activeFilterTaskId === task.id && <Check className="w-5 h-5 md:w-4 md:h-4" style={{ color: task.color }} />}
                        </button>
                    ))}

                    {tasks.length === 0 && (
                        <div className="px-4 py-4 md:py-3 text-xs text-muted-foreground italic text-center">
                            No habits defined yet
                        </div>
                    )}
                </div>
            )}
        </div>
    );
}
