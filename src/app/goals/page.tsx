"use client";

import React, { useState, useMemo } from 'react';
import { useUserData } from '@/context/user-data-context';
import { Flag, Plus, CheckCircle2, Circle, Target, Trophy, Sparkles, Calendar, Trash2, ArrowRight } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { format, parseISO } from 'date-fns';
import Link from 'next/link';

export default function GoalsPage() {
    const { lifeEvents, addLifeEvent, updateLifeEvent, deleteLifeEvent, theme } = useUserData();

    const [isAddingGoal, setIsAddingGoal] = useState(false);
    const [newTitle, setNewTitle] = useState('');
    const [newDescription, setNewDescription] = useState('');
    const [newDate, setNewDate] = useState(format(new Date(), 'yyyy-MM-dd'));

    const goals = useMemo(() => {
        return lifeEvents.filter(e => e.type === 'GOAL').sort((a, b) => new Date(b.event_date).getTime() - new Date(a.event_date).getTime());
    }, [lifeEvents]);

    const completedGoals = goals.filter(g => g.description?.includes('[DONE]'));
    const pendingGoals = goals.filter(g => !g.description?.includes('[DONE]'));

    const progress = goals.length === 0 ? 0 : Math.round((completedGoals.length / goals.length) * 100);

    const handleAddGoal = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!newTitle.trim()) return;

        await addLifeEvent({
            title: newTitle,
            description: newDescription,
            event_date: newDate,
            type: 'GOAL'
        });

        setNewTitle('');
        setNewDescription('');
        setIsAddingGoal(false);
    };

    const toggleGoalStatus = async (id: string, currentDescription: string = '') => {
        const isDone = currentDescription.includes('[DONE]');
        const newDesc = isDone 
            ? currentDescription.replace('[DONE]', '').trim() 
            : `${currentDescription} [DONE]`.trim();
        
        await updateLifeEvent(id, { description: newDesc });
    };

    const handleDeleteGoal = async (id: string) => {
        if (confirm("Are you sure you want to abandon this goal?")) {
            await deleteLifeEvent(id);
        }
    };

    const isLight = theme === 'light';

    return (
        <div className={`min-h-screen pt-24 pb-20 px-4 md:px-8 max-w-7xl mx-auto transition-colors duration-500 ${isLight ? 'text-zinc-900' : 'text-white'}`}>
            
            {/* Header Section */}
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-12 gap-6 relative z-10">
                <div className="relative">
                    <div className="absolute -inset-1 bg-gradient-to-r from-blue-600 to-indigo-600 rounded-lg blur opacity-20" />
                    <h1 className="text-4xl md:text-5xl font-black tracking-tight flex items-center gap-4 relative">
                        <Target className="w-10 h-10 text-blue-500" />
                        Grand Ambitions
                    </h1>
                    <p className={`mt-2 ${isLight ? 'text-zinc-500' : 'text-zinc-400'} font-medium`}>
                        Define your targets. Execute. Conquer.
                    </p>
                </div>

                <button
                    onClick={() => setIsAddingGoal(true)}
                    className="group relative flex items-center gap-2 px-6 py-3 bg-blue-600 hover:bg-blue-500 text-white rounded-full font-bold transition-all shadow-[0_0_20px_rgba(37,99,235,0.3)] hover:shadow-[0_0_30px_rgba(37,99,235,0.5)] overflow-hidden"
                >
                    <div className="absolute inset-0 bg-white/20 translate-y-full group-hover:translate-y-0 transition-transform duration-300" />
                    <Plus className="w-5 h-5 relative z-10" />
                    <span className="relative z-10">Forge New Goal</span>
                </button>
            </div>

            {/* Dashboard Stats */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
                <div className={`p-6 rounded-3xl ${isLight ? 'bg-white shadow-xl shadow-zinc-200' : 'bg-zinc-900/50 border border-white/5'} flex items-center gap-4 relative overflow-hidden group`}>
                    <div className="absolute -right-4 -top-4 w-24 h-24 bg-blue-500/10 rounded-full blur-xl group-hover:bg-blue-500/20 transition-colors" />
                    <div className="w-14 h-14 rounded-2xl bg-blue-500/10 flex items-center justify-center border border-blue-500/20 text-blue-500">
                        <Flag className="w-7 h-7" />
                    </div>
                    <div>
                        <p className={`text-sm font-bold ${isLight ? 'text-zinc-500' : 'text-zinc-400'} uppercase tracking-wider`}>Total Goals</p>
                        <p className="text-3xl font-black">{goals.length}</p>
                    </div>
                </div>
                
                <Link href="/achievements" className={`p-6 rounded-3xl ${isLight ? 'bg-white shadow-xl shadow-zinc-200 hover:shadow-emerald-200' : 'bg-zinc-900/50 border border-white/5 hover:border-emerald-500/30 hover:bg-zinc-900/80'} flex items-center justify-between relative overflow-hidden group transition-all duration-300`}>
                    <div className="absolute -right-4 -top-4 w-24 h-24 bg-emerald-500/10 rounded-full blur-xl group-hover:bg-emerald-500/20 transition-colors" />
                    <div className="flex items-center gap-4 relative z-10">
                        <div className="w-14 h-14 rounded-2xl bg-emerald-500/10 flex items-center justify-center border border-emerald-500/20 text-emerald-500 group-hover:scale-110 transition-transform">
                            <Trophy className="w-7 h-7" />
                        </div>
                        <div>
                            <p className={`text-sm font-bold ${isLight ? 'text-zinc-500' : 'text-zinc-400'} uppercase tracking-wider`}>Conquered</p>
                            <p className="text-3xl font-black">{completedGoals.length}</p>
                        </div>
                    </div>
                    <ArrowRight className="w-6 h-6 text-emerald-500 opacity-50 group-hover:opacity-100 group-hover:translate-x-1 transition-all relative z-10" />
                </Link>

                <div className={`p-6 rounded-3xl ${isLight ? 'bg-white shadow-xl shadow-zinc-200' : 'bg-zinc-900/50 border border-white/5'} flex flex-col justify-center relative overflow-hidden group`}>
                    <div className="absolute -right-4 -top-4 w-24 h-24 bg-indigo-500/10 rounded-full blur-xl group-hover:bg-indigo-500/20 transition-colors" />
                    <div className="flex justify-between items-end mb-2">
                        <p className={`text-sm font-bold ${isLight ? 'text-zinc-500' : 'text-zinc-400'} uppercase tracking-wider`}>Completion Rate</p>
                        <p className="text-2xl font-black text-indigo-500">{progress}%</p>
                    </div>
                    <div className="w-full h-3 bg-zinc-800/50 rounded-full overflow-hidden border border-white/5">
                        <motion.div 
                            initial={{ width: 0 }}
                            animate={{ width: `${progress}%` }}
                            transition={{ duration: 1, ease: "easeOut" }}
                            className="h-full bg-gradient-to-r from-blue-500 to-indigo-500"
                        />
                    </div>
                </div>
            </div>

            {/* Goals Grid */}
            <div className="max-w-3xl mx-auto relative z-10">
                {/* Active Goals */}
                <div className="space-y-6">
                    <div className="flex items-center justify-between border-b border-white/10 pb-4">
                        <div className="flex items-center gap-3">
                            <div className="w-2 h-8 bg-blue-500 rounded-full" />
                            <h2 className="text-2xl font-bold">Active Pursuits</h2>
                            <span className="px-3 py-1 bg-blue-500/10 text-blue-400 text-sm font-bold rounded-full">{pendingGoals.length}</span>
                        </div>
                    </div>
                    
                    <AnimatePresence>
                        {pendingGoals.length === 0 ? (
                            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className={`p-8 text-center rounded-3xl border border-dashed ${isLight ? 'border-zinc-300 text-zinc-500' : 'border-zinc-800 text-zinc-500'}`}>
                                <Target className="w-12 h-12 mx-auto mb-4 opacity-50" />
                                <p className="font-medium">No active goals. Time to aim higher.</p>
                            </motion.div>
                        ) : (
                            pendingGoals.map(goal => (
                                <GoalCard 
                                    key={goal.id} 
                                    goal={goal} 
                                    onToggle={() => toggleGoalStatus(goal.id, goal.description)} 
                                    onDelete={() => handleDeleteGoal(goal.id)}
                                    isLight={isLight}
                                />
                            ))
                        )}
                    </AnimatePresence>
                </div>
            </div>

            {/* Add Goal Modal */}
            <AnimatePresence>
                {isAddingGoal && (
                    <motion.div 
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-md p-4"
                    >
                        <motion.div 
                            initial={{ scale: 0.9, opacity: 0, y: 20 }}
                            animate={{ scale: 1, opacity: 1, y: 0 }}
                            exit={{ scale: 0.9, opacity: 0, y: 20 }}
                            className={`w-full max-w-lg ${isLight ? 'bg-white' : 'bg-zinc-950 border border-white/10'} rounded-[2rem] p-8 shadow-2xl relative overflow-hidden`}
                        >
                            <div className="absolute top-0 left-0 w-full h-2 bg-gradient-to-r from-blue-500 to-indigo-500" />
                            
                            <h2 className="text-3xl font-black mb-6 flex items-center gap-3">
                                <Sparkles className="text-indigo-500" /> 
                                New Goal
                            </h2>

                            <form onSubmit={handleAddGoal} className="space-y-5">
                                <div>
                                    <label className={`block text-sm font-bold mb-2 ${isLight ? 'text-zinc-600' : 'text-zinc-400'}`}>Target Objective</label>
                                    <input 
                                        type="text" 
                                        value={newTitle}
                                        onChange={e => setNewTitle(e.target.value)}
                                        className={`w-full px-4 py-3 rounded-xl border ${isLight ? 'bg-zinc-50 border-zinc-200 text-black' : 'bg-zinc-900 border-white/10 text-white'} focus:outline-none focus:ring-2 focus:ring-blue-500 font-medium transition-all`}
                                        placeholder="e.g., Read 50 Books, Run a Marathon"
                                        required
                                        autoFocus
                                    />
                                </div>
                                
                                <div>
                                    <label className={`block text-sm font-bold mb-2 ${isLight ? 'text-zinc-600' : 'text-zinc-400'}`}>Description & Motivation (Optional)</label>
                                    <textarea 
                                        value={newDescription}
                                        onChange={e => setNewDescription(e.target.value)}
                                        className={`w-full px-4 py-3 rounded-xl border ${isLight ? 'bg-zinc-50 border-zinc-200 text-black' : 'bg-zinc-900 border-white/10 text-white'} focus:outline-none focus:ring-2 focus:ring-blue-500 font-medium transition-all min-h-[100px] resize-none`}
                                        placeholder="Why does this matter?"
                                    />
                                </div>

                                <div>
                                    <label className={`block text-sm font-bold mb-2 ${isLight ? 'text-zinc-600' : 'text-zinc-400'}`}>Target Date</label>
                                    <input 
                                        type="date" 
                                        value={newDate}
                                        onChange={e => setNewDate(e.target.value)}
                                        className={`w-full px-4 py-3 rounded-xl border ${isLight ? 'bg-zinc-50 border-zinc-200 text-black' : 'bg-zinc-900 border-white/10 text-white'} focus:outline-none focus:ring-2 focus:ring-blue-500 font-medium transition-all`}
                                        required
                                    />
                                </div>

                                <div className="flex gap-4 pt-4">
                                    <button 
                                        type="button"
                                        onClick={() => setIsAddingGoal(false)}
                                        className={`flex-1 py-3 rounded-xl font-bold transition-colors ${isLight ? 'bg-zinc-200 text-zinc-700 hover:bg-zinc-300' : 'bg-white/5 text-white hover:bg-white/10'}`}
                                    >
                                        Cancel
                                    </button>
                                    <button 
                                        type="submit"
                                        className="flex-1 py-3 bg-blue-600 hover:bg-blue-500 text-white rounded-xl font-bold transition-colors shadow-lg shadow-blue-500/25"
                                    >
                                        Forge Goal
                                    </button>
                                </div>
                            </form>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
}

function GoalCard({ goal, onToggle, onDelete, isLight }: { goal: any, onToggle: () => void, onDelete: () => void, isLight: boolean }) {
    const isCompleted = goal.description?.includes('[DONE]');
    const cleanDescription = goal.description?.replace('[DONE]', '').trim();

    return (
        <motion.div 
            layout
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.8, x: 200, transition: { duration: 0.4 } }}
            className={`p-6 rounded-3xl border transition-all duration-300 group ${
                isCompleted 
                    ? isLight ? 'bg-emerald-50 border-emerald-200' : 'bg-emerald-950/20 border-emerald-500/20' 
                    : isLight ? 'bg-white border-zinc-200 hover:shadow-lg' : 'bg-zinc-900/40 border-white/5 hover:bg-zinc-900/80 hover:border-white/10'
            }`}
        >
            <div className="flex items-start gap-4">
                <button 
                    onClick={onToggle}
                    className="mt-1 flex-shrink-0 transition-transform active:scale-90"
                >
                    {isCompleted ? (
                        <CheckCircle2 className={`w-7 h-7 ${isLight ? 'text-emerald-600' : 'text-emerald-500'}`} />
                    ) : (
                        <Circle className={`w-7 h-7 ${isLight ? 'text-zinc-300 hover:text-blue-500' : 'text-zinc-600 hover:text-blue-400'} transition-colors`} />
                    )}
                </button>
                
                <div className="flex-1 min-w-0">
                    <h3 className={`text-xl font-bold mb-1 transition-all ${isCompleted ? (isLight ? 'text-emerald-800 line-through opacity-70' : 'text-emerald-400 line-through opacity-70') : ''}`}>
                        {goal.title}
                    </h3>
                    
                    {cleanDescription && (
                        <p className={`text-sm mb-3 line-clamp-2 ${isLight ? 'text-zinc-600' : 'text-zinc-400'} ${isCompleted ? 'opacity-50' : ''}`}>
                            {cleanDescription}
                        </p>
                    )}
                    
                    <div className="flex items-center gap-4 mt-2">
                        <span className={`inline-flex items-center gap-1.5 text-xs font-bold px-2.5 py-1 rounded-md ${
                            isCompleted 
                                ? isLight ? 'bg-emerald-100 text-emerald-700' : 'bg-emerald-500/10 text-emerald-400'
                                : isLight ? 'bg-zinc-100 text-zinc-600' : 'bg-white/5 text-zinc-400'
                        }`}>
                            <Calendar className="w-3.5 h-3.5" />
                            {format(parseISO(goal.event_date), 'MMM d, yyyy')}
                        </span>
                    </div>
                </div>

                <button 
                    onClick={onDelete}
                    className="opacity-0 group-hover:opacity-100 transition-opacity p-2 text-zinc-400 hover:text-red-500 rounded-lg hover:bg-red-500/10"
                    title="Delete Goal"
                >
                    <Trash2 className="w-5 h-5" />
                </button>
            </div>
        </motion.div>
    );
}
