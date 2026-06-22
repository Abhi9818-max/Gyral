"use client";

import React, { useState, useMemo } from 'react';
import { useUserData } from '@/context/user-data-context';
import { Plus, Check, Trash2, Infinity, CalendarClock, ChevronDown, Sparkles, ArrowLeft } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { format } from 'date-fns';
import Link from 'next/link';

type BucketTab = 'BUCKET_LIFE' | 'BUCKET_YEAR';

export default function BucketListPage() {
    const { lifeEvents, addLifeEvent, updateLifeEvent, deleteLifeEvent } = useUserData();

    const [activeTab, setActiveTab] = useState<BucketTab>('BUCKET_LIFE');
    const [isAdding, setIsAdding] = useState(false);
    const [newTitle, setNewTitle] = useState('');
    const [showCompleted, setShowCompleted] = useState(false);

    // Filter items by tab
    const allItems = useMemo(() => {
        return lifeEvents
            .filter(e => e.type === activeTab)
            .sort((a, b) => new Date(b.created_at || b.event_date).getTime() - new Date(a.created_at || a.event_date).getTime());
    }, [lifeEvents, activeTab]);

    const isDone = (item: typeof allItems[0]) => item.description?.includes('[DONE]');
    const pendingItems = allItems.filter(item => !isDone(item));
    const completedItems = allItems.filter(item => isDone(item));

    const progress = allItems.length === 0 ? 0 : Math.round((completedItems.length / allItems.length) * 100);

    const handleAdd = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!newTitle.trim()) return;

        await addLifeEvent({
            title: newTitle.trim(),
            description: '',
            event_date: format(new Date(), 'yyyy-MM-dd'),
            type: activeTab,
        });

        setNewTitle('');
        setIsAdding(false);
    };

    const toggleDone = async (id: string, currentDesc: string = '') => {
        const done = currentDesc.includes('[DONE]');
        const newDesc = done
            ? currentDesc.replace('[DONE]', '').trim()
            : `${currentDesc} [DONE]`.trim();
        await updateLifeEvent(id, { description: newDesc });
    };

    const handleDelete = async (id: string) => {
        if (confirm('Remove this from your bucket list?')) {
            await deleteLifeEvent(id);
        }
    };

    const currentYear = new Date().getFullYear();

    return (
        <div className="min-h-screen bg-black text-white pb-24">
            {/* Header */}
            <div className="sticky top-0 z-30 bg-black/90 backdrop-blur-xl border-b border-white/5">
                <div className="max-w-2xl mx-auto px-4 py-4">
                    <div className="flex items-center gap-3 mb-4">
                        <Link href="/" className="text-white/50 hover:text-white transition-colors">
                            <ArrowLeft className="w-5 h-5" />
                        </Link>
                        <div>
                            <h1 className="text-xl font-serif italic tracking-tight text-white/90">Bucket List</h1>
                            <p className="text-[10px] tracking-[0.2em] uppercase text-white/30 font-sans">before time runs out</p>
                        </div>
                    </div>

                    {/* Tabs */}
                    <div className="flex gap-1 bg-white/5 rounded-lg p-1">
                        <button
                            onClick={() => setActiveTab('BUCKET_LIFE')}
                            className={`flex-1 flex items-center justify-center gap-2 py-2 rounded-md text-xs font-semibold tracking-wide transition-all ${
                                activeTab === 'BUCKET_LIFE'
                                    ? 'bg-white/10 text-white shadow-lg'
                                    : 'text-white/40 hover:text-white/60'
                            }`}
                        >
                            <Infinity className="w-3.5 h-3.5" />
                            Lifetime
                        </button>
                        <button
                            onClick={() => setActiveTab('BUCKET_YEAR')}
                            className={`flex-1 flex items-center justify-center gap-2 py-2 rounded-md text-xs font-semibold tracking-wide transition-all ${
                                activeTab === 'BUCKET_YEAR'
                                    ? 'bg-white/10 text-white shadow-lg'
                                    : 'text-white/40 hover:text-white/60'
                            }`}
                        >
                            <CalendarClock className="w-3.5 h-3.5" />
                            {currentYear}
                        </button>
                    </div>
                </div>
            </div>

            <div className="max-w-2xl mx-auto px-4 pt-6 space-y-6">

                {/* Progress Bar */}
                {allItems.length > 0 && (
                    <div className="space-y-2">
                        <div className="flex justify-between items-end">
                            <span className="text-[10px] tracking-[0.15em] uppercase text-white/30 font-sans">
                                {completedItems.length} of {allItems.length} achieved
                            </span>
                            <span className="text-lg font-bold text-white/80 font-mono">{progress}%</span>
                        </div>
                        <div className="h-1 bg-white/5 rounded-full overflow-hidden">
                            <motion.div
                                className="h-full rounded-full bg-gradient-to-r from-emerald-500 to-emerald-300"
                                initial={{ width: 0 }}
                                animate={{ width: `${progress}%` }}
                                transition={{ duration: 0.8, ease: 'easeOut' }}
                            />
                        </div>
                    </div>
                )}

                {/* Empty State */}
                {allItems.length === 0 && !isAdding && (
                    <div className="flex flex-col items-center justify-center py-20 text-center">
                        <div className="w-16 h-16 rounded-full bg-white/5 flex items-center justify-center mb-4">
                            {activeTab === 'BUCKET_LIFE' ? (
                                <Infinity className="w-7 h-7 text-white/20" />
                            ) : (
                                <CalendarClock className="w-7 h-7 text-white/20" />
                            )}
                        </div>
                        <p className="text-white/40 font-serif italic text-lg mb-1">
                            {activeTab === 'BUCKET_LIFE'
                                ? 'What do you want from this life?'
                                : `What will ${currentYear} mean to you?`}
                        </p>
                        <p className="text-white/20 text-xs font-sans tracking-wide">
                            Tap + to start writing your story
                        </p>
                    </div>
                )}

                {/* Pending Items */}
                <div className="space-y-2">
                    <AnimatePresence mode="popLayout">
                        {pendingItems.map((item) => (
                            <motion.div
                                key={item.id}
                                layout
                                initial={{ opacity: 0, y: 10 }}
                                animate={{ opacity: 1, y: 0 }}
                                exit={{ opacity: 0, x: -50, scale: 0.95 }}
                                transition={{ duration: 0.3 }}
                                className="group flex items-start gap-3 py-3 px-3 rounded-xl bg-white/[0.02] border border-white/5 hover:bg-white/[0.04] transition-colors"
                            >
                                {/* Check Circle */}
                                <button
                                    onClick={() => toggleDone(item.id, item.description)}
                                    className="mt-0.5 flex-shrink-0 w-5 h-5 rounded-full border-[1.5px] border-white/20 hover:border-emerald-400 hover:bg-emerald-400/10 transition-all flex items-center justify-center"
                                >
                                </button>

                                {/* Content */}
                                <div className="flex-1 min-w-0">
                                    <p className="text-[13px] md:text-[15px] text-white/80 leading-relaxed">
                                        {item.title}
                                    </p>
                                </div>

                                {/* Delete */}
                                <button
                                    onClick={() => handleDelete(item.id)}
                                    className="flex-shrink-0 opacity-0 group-hover:opacity-100 transition-opacity text-white/20 hover:text-red-400"
                                >
                                    <Trash2 className="w-3.5 h-3.5" />
                                </button>
                            </motion.div>
                        ))}
                    </AnimatePresence>
                </div>

                {/* Add Form */}
                <AnimatePresence>
                    {isAdding && (
                        <motion.form
                            initial={{ opacity: 0, height: 0 }}
                            animate={{ opacity: 1, height: 'auto' }}
                            exit={{ opacity: 0, height: 0 }}
                            onSubmit={handleAdd}
                            className="overflow-hidden"
                        >
                            <div className="flex gap-2 items-center py-2 px-3 rounded-xl bg-white/[0.04] border border-white/10">
                                <div className="w-5 h-5 rounded-full border-[1.5px] border-white/10 flex-shrink-0" />
                                <input
                                    type="text"
                                    value={newTitle}
                                    onChange={(e) => setNewTitle(e.target.value)}
                                    placeholder={
                                        activeTab === 'BUCKET_LIFE'
                                            ? 'e.g. Visit Japan, Learn to fly...'
                                            : `e.g. Run a marathon in ${currentYear}...`
                                    }
                                    className="flex-1 bg-transparent text-[13px] md:text-[15px] text-white/80 placeholder:text-white/20 outline-none"
                                    autoFocus
                                />
                                <button
                                    type="submit"
                                    disabled={!newTitle.trim()}
                                    className="text-emerald-400 disabled:text-white/10 transition-colors"
                                >
                                    <Check className="w-5 h-5" />
                                </button>
                            </div>
                            <button
                                type="button"
                                onClick={() => { setIsAdding(false); setNewTitle(''); }}
                                className="mt-2 text-[10px] tracking-wider uppercase text-white/30 hover:text-white/50 transition-colors"
                            >
                                Cancel
                            </button>
                        </motion.form>
                    )}
                </AnimatePresence>

                {/* Add Button */}
                {!isAdding && (
                    <button
                        onClick={() => setIsAdding(true)}
                        className="w-full flex items-center justify-center gap-2 py-3 rounded-xl border border-dashed border-white/10 hover:border-white/20 hover:bg-white/[0.02] transition-all text-white/30 hover:text-white/50"
                    >
                        <Plus className="w-4 h-4" />
                        <span className="text-xs font-sans tracking-wider uppercase">
                            Add to {activeTab === 'BUCKET_LIFE' ? 'Lifetime' : currentYear} list
                        </span>
                    </button>
                )}

                {/* Completed Section */}
                {completedItems.length > 0 && (
                    <div className="pt-4">
                        <button
                            onClick={() => setShowCompleted(!showCompleted)}
                            className="flex items-center gap-2 text-white/30 hover:text-white/50 transition-colors mb-3"
                        >
                            <ChevronDown className={`w-3.5 h-3.5 transition-transform ${showCompleted ? 'rotate-0' : '-rotate-90'}`} />
                            <span className="text-[10px] tracking-[0.15em] uppercase font-sans">
                                Achieved ({completedItems.length})
                            </span>
                            <Sparkles className="w-3 h-3 text-emerald-400/50" />
                        </button>

                        <AnimatePresence>
                            {showCompleted && (
                                <motion.div
                                    initial={{ opacity: 0, height: 0 }}
                                    animate={{ opacity: 1, height: 'auto' }}
                                    exit={{ opacity: 0, height: 0 }}
                                    className="space-y-2 overflow-hidden"
                                >
                                    {completedItems.map((item) => (
                                        <motion.div
                                            key={item.id}
                                            layout
                                            initial={{ opacity: 0 }}
                                            animate={{ opacity: 1 }}
                                            className="group flex items-start gap-3 py-3 px-3 rounded-xl bg-emerald-500/[0.03] border border-emerald-500/10"
                                        >
                                            {/* Filled Check */}
                                            <button
                                                onClick={() => toggleDone(item.id, item.description)}
                                                className="mt-0.5 flex-shrink-0 w-5 h-5 rounded-full bg-emerald-500/20 border-[1.5px] border-emerald-500/40 flex items-center justify-center transition-all"
                                            >
                                                <Check className="w-3 h-3 text-emerald-400" strokeWidth={3} />
                                            </button>

                                            {/* Content */}
                                            <div className="flex-1 min-w-0">
                                                <p className="text-[13px] md:text-[15px] text-white/40 line-through leading-relaxed">
                                                    {item.title}
                                                </p>
                                            </div>

                                            {/* Delete */}
                                            <button
                                                onClick={() => handleDelete(item.id)}
                                                className="flex-shrink-0 opacity-0 group-hover:opacity-100 transition-opacity text-white/20 hover:text-red-400"
                                            >
                                                <Trash2 className="w-3.5 h-3.5" />
                                            </button>
                                        </motion.div>
                                    ))}
                                </motion.div>
                            )}
                        </AnimatePresence>
                    </div>
                )}

                {/* Footer Quote */}
                <div className="pt-8 pb-4 text-center">
                    <p className="font-serif italic text-sm text-white/15 tracking-wide">
                        {activeTab === 'BUCKET_LIFE'
                            ? '"The purpose of life is to live it, to taste experience to the utmost."'
                            : `"Make ${currentYear} the year you didn't just exist — you lived."`}
                    </p>
                </div>
            </div>
        </div>
    );
}
