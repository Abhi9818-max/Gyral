"use client";

import { useState, useEffect } from 'react';
import { Droplet, Plus, Minus, Waves, CupSoda, Milk, Wine } from 'lucide-react';
import { useUserData } from '@/context/user-data-context';

export function HydrationWidget() {
    const { tasks, records, addTask, addRecord } = useUserData();
    const [waterTask, setWaterTask] = useState<any>(null);
    const [amount, setAmount] = useState(500);
    const [todaysTotal, setTodaysTotal] = useState(0);
    const [isAnimating, setIsAnimating] = useState(false);

    // Find the water task
    useEffect(() => {
        const task = tasks.find(t =>
            t.name.toLowerCase().includes('water') ||
            t.name.toLowerCase().includes('hydration') ||
            t.name.toLowerCase().includes('drink')
        );
        setWaterTask(task);
    }, [tasks]);

    // Calculate today's total
    useEffect(() => {
        if (!waterTask) return;

        const today = new Date().toISOString().split('T')[0];
        const todaysRecords = records[today] || [];
        const taskRecords = todaysRecords.filter(r => r.taskId === waterTask.id);

        const total = taskRecords.reduce((sum, r) => sum + (r.value || 0), 0);
        setTodaysTotal(total);
    }, [waterTask, records]);

    const handleCreateTask = () => {
        addTask("Hydration", "#3b82f6", {
            unit: "ml",
            phases: [
                { name: "Dehydrated", threshold: 1000, intensity: 1 },
                { name: "Refreshing", threshold: 2000, intensity: 2 },
                { name: "Hydrated", threshold: 3000, intensity: 3 },
                { name: "Peak Performance", threshold: 4000, intensity: 4 }
            ]
        });
    };

    const handleDrink = (value: number) => {
        if (!waterTask) return;

        setIsAnimating(true);
        const today = new Date().toISOString().split('T')[0];
        addRecord(today, waterTask.id, null, value);
        setTimeout(() => setIsAnimating(false), 1000);
    };

    if (!waterTask) {
        return (
            <div className="bg-blue-900/10 border border-blue-500/20 rounded-xl p-6 flex flex-col items-center justify-center text-center space-y-4">
                <div className="p-3 bg-blue-500/20 rounded-full">
                    <Droplet className="w-6 h-6 text-blue-400" />
                </div>
                <div>
                    <h3 className="text-lg font-bold text-white">Track Hydration?</h3>
                    <p className="text-sm text-blue-200/60">Create a dedicated task to track your water intake.</p>
                </div>
                <button
                    onClick={handleCreateTask}
                    className="px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-lg font-bold transition-all"
                >
                    Initialize Water Protocol
                </button>
            </div>
        );
    }

    // Visuals
    const target = 3000;
    const percentage = Math.min((todaysTotal / target) * 100, 100);

    return (
        <div className="relative overflow-hidden bg-gradient-to-br from-blue-950/40 to-black border border-blue-500/20 rounded-2xl p-6 shadow-xl group">
            {/* Background Liquid Effect */}
            <div
                className="absolute bottom-0 left-0 right-0 bg-blue-500/10 transition-all duration-1000 ease-in-out"
                style={{ height: `${percentage}%` }}
            >
                <div className="absolute top-0 left-0 right-0 h-1 bg-blue-400/30 blur-md" />
            </div>

            <div className="relative z-10 flex flex-col md:flex-row items-center justify-between gap-6">

                {/* Status Section */}
                <div className="flex-1 flex items-center gap-4">
                    <div className="relative w-16 h-16 flex-shrink-0">
                        {/* Circular Progress */}
                        <svg className="w-full h-full -rotate-90">
                            <circle cx="32" cy="32" r="28" className="stroke-blue-900/30 fill-none" strokeWidth="6" />
                            <circle
                                cx="32" cy="32" r="28"
                                className="stroke-blue-500 fill-none transition-all duration-1000"
                                strokeWidth="6"
                                strokeDasharray="175.9"
                                strokeDashoffset={175.9 - (175.9 * percentage) / 100}
                                strokeLinecap="round"
                            />
                        </svg>
                        <div className="absolute inset-0 flex items-center justify-center">
                            <Droplet className={`w-6 h-6 text-blue-400 ${isAnimating ? 'animate-bounce' : ''}`} />
                        </div>
                    </div>

                    <div>
                        <div className="flex items-baseline gap-2">
                            <h3 className="text-2xl font-bold text-white tracking-tight">{todaysTotal}</h3>
                            <span className="text-sm text-blue-300 font-medium">/ {target}ml</span>
                        </div>
                        <p className="text-xs text-blue-400/60 uppercase tracking-widest font-semibold flex items-center gap-1">
                            <Waves className="w-3 h-3" />
                            Hydration Level
                        </p>
                    </div>
                </div>

                {/* Controls - Revised UX */}
                <div className="flex flex-col gap-3 items-end">

                    {/* Quick Presets */}
                    <div className="flex gap-2">
                        <button
                            onClick={() => handleDrink(500)}
                            className="bg-blue-900/20 hover:bg-blue-600/20 border border-blue-500/20 rounded-lg px-3 py-2 flex flex-col items-center gap-1 transition-all active:scale-95 group/btn"
                            title="Bottle (500ml)"
                        >
                            <CupSoda className="w-4 h-4 text-blue-400 group-hover/btn:text-blue-300" />
                            <span className="text-[10px] font-bold text-blue-200">500ml</span>
                        </button>
                        <button
                            onClick={() => handleDrink(1000)}
                            className="bg-blue-900/20 hover:bg-blue-600/20 border border-blue-500/20 rounded-lg px-3 py-2 flex flex-col items-center gap-1 transition-all active:scale-95 group/btn"
                            title="Jug (1L)"
                        >
                            <Milk className="w-4 h-4 text-blue-400 group-hover/btn:text-blue-300" />
                            <span className="text-[10px] font-bold text-blue-200">1L</span>
                        </button>
                        <button
                            onClick={() => handleDrink(2000)}
                            className="bg-blue-900/20 hover:bg-blue-600/20 border border-blue-500/20 rounded-lg px-3 py-2 flex flex-col items-center gap-1 transition-all active:scale-95 group/btn"
                            title="Daily Goal (2L)"
                        >
                            <Wine className="w-4 h-4 text-blue-400 group-hover/btn:text-blue-300" />
                            <span className="text-[10px] font-bold text-blue-200">2L</span>
                        </button>
                    </div>

                    {/* Manual Custom Amount */}
                    <div className="flex items-center gap-2 bg-black/40 p-1 rounded-lg border border-blue-500/10 backdrop-blur-sm">
                        <button
                            onClick={() => setAmount(Math.max(50, amount - 50))}
                            className="w-8 h-8 rounded-lg bg-blue-900/20 hover:bg-blue-900/40 text-blue-400 flex items-center justify-center transition-colors"
                        >
                            <Minus className="w-3 h-3" />
                        </button>
                        <input
                            type="number"
                            value={amount}
                            onChange={(e) => setAmount(parseInt(e.target.value) || 0)}
                            className="w-16 bg-transparent text-center font-mono font-bold text-white text-sm focus:outline-none"
                        />
                        <span className="text-xs text-blue-500/50 -ml-2 mr-2">ml</span>
                        <button
                            onClick={() => setAmount(Math.min(5000, amount + 50))}
                            className="w-8 h-8 rounded-lg bg-blue-900/20 hover:bg-blue-900/40 text-blue-400 flex items-center justify-center transition-colors"
                        >
                            <Plus className="w-3 h-3" />
                        </button>

                        <div className="h-6 w-px bg-white/10 mx-1" />

                        <button
                            onClick={() => handleDrink(amount)}
                            className="h-8 px-4 bg-blue-600 hover:bg-blue-500 text-white font-bold rounded-lg shadow-lg shadow-blue-600/20 transition-all active:scale-95 flex items-center gap-2 text-xs"
                        >
                            Add
                        </button>
                    </div>
                </div>
            </div>

            {/* Bubbles Animation Effect when drinking */}
            {isAnimating && (
                <div className="absolute inset-0 pointer-events-none overflow-hidden">
                    {Array.from({ length: 5 }).map((_, i) => (
                        <div
                            key={i}
                            className="absolute bottom-0 bg-blue-400/30 rounded-full animate-[bubble_1s_ease-out_forwards]"
                            style={{
                                left: `${20 + Math.random() * 60}%`,
                                width: `${4 + Math.random() * 8}px`,
                                height: `${4 + Math.random() * 8}px`,
                                animationDelay: `${Math.random() * 0.5}s`
                            }}
                        />
                    ))}
                </div>
            )}

            <style jsx>{`
                @keyframes bubble {
                    0% { transform: translateY(0) scale(1); opacity: 0; }
                    50% { opacity: 1; }
                    100% { transform: translateY(-100px) scale(1.5); opacity: 0; }
                }
            `}</style>
        </div>
    );
}
