"use client";

import React, { useState, useMemo } from 'react';
import { useUserData } from '@/context/user-data-context';
import { 
    Plus, Check, Trash2, ArrowLeft, Edit3, X, Infinity, CalendarClock, Sparkles
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { format, parseISO } from 'date-fns';
import Link from 'next/link';

type BucketTab = 'BUCKET_LIFE' | 'BUCKET_YEAR';

export default function BucketListPage() {
    const { lifeEvents, addLifeEvent, updateLifeEvent, deleteLifeEvent } = useUserData();

    const [activeTab, setActiveTab] = useState<BucketTab>('BUCKET_LIFE');
    const [isAdding, setIsAdding] = useState(false);
    const [newTitle, setNewTitle] = useState('');
    const [newNotes, setNewNotes] = useState('');
    const [newDate, setNewDate] = useState(format(new Date(), 'yyyy-MM-dd'));
    const [showCompleted, setShowCompleted] = useState(false);
    
    // Expanded card tracking
    const [expandedId, setExpandedId] = useState<string | null>(null);
    const [editTitle, setEditTitle] = useState('');
    const [editNotes, setEditNotes] = useState('');
    const [editDate, setEditDate] = useState('');

    // Error & Submitting state
    const [errorMsg, setErrorMsg] = useState<string | null>(null);
    const [isSubmitting, setIsSubmitting] = useState(false);

    // Parse description to extract completion and actual notes text
    const parseItem = (item: any) => {
        const desc = item.description || '';
        const isCompleted = desc.includes('[DONE]');
        const notes = desc.replace('[DONE]', '').trim();
        return { isCompleted, notes };
    };

    // Filter and sort items safely by tab
    const allItems = useMemo(() => {
        return lifeEvents
            .filter(e => e.type === activeTab)
            .sort((a, b) => {
                const dateA = new Date(a.created_at || a.event_date || 0).getTime();
                const dateB = new Date(b.created_at || b.event_date || 0).getTime();
                return dateB - dateA;
            });
    }, [lifeEvents, activeTab]);

    const pendingItems = useMemo(() => {
        return allItems.filter(item => !parseItem(item).isCompleted);
    }, [allItems]);

    const completedItems = useMemo(() => {
        return allItems.filter(item => parseItem(item).isCompleted);
    }, [allItems]);

    const handleAdd = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!newTitle.trim() || isSubmitting) return;

        setIsSubmitting(true);
        setErrorMsg(null);

        try {
            await addLifeEvent({
                title: newTitle.trim(),
                description: newNotes.trim(),
                event_date: newDate,
                type: activeTab,
            });

            setNewTitle('');
            setNewNotes('');
            setNewDate(format(new Date(), 'yyyy-MM-dd'));
            setIsAdding(false);
        } catch (err: any) {
            console.error("Failed to add bucket list item:", err);
            setErrorMsg(err.message || "Failed to forge aspiration.");
        } finally {
            setIsSubmitting(false);
        }
    };

    const toggleDone = async (id: string, currentDesc: string = '') => {
        const isCompleted = currentDesc.includes('[DONE]');
        const cleanNotes = currentDesc.replace('[DONE]', '').trim();
        const newDesc = isCompleted
            ? cleanNotes
            : `${cleanNotes} [DONE]`.trim();
        await updateLifeEvent(id, { description: newDesc });
    };

    const handleUpdateItem = async (id: string, title: string, notes: string, date: string, isCompleted: boolean) => {
        const newDesc = isCompleted ? `${notes.trim()} [DONE]`.trim() : notes.trim();
        await updateLifeEvent(id, {
            title: title.trim(),
            description: newDesc,
            event_date: date
        });
    };

    const handleDelete = async (id: string) => {
        if (confirm('Remove this from your bucket list?')) {
            await deleteLifeEvent(id);
            if (expandedId === id) {
                setExpandedId(null);
            }
        }
    };

    const startEditing = (item: any) => {
        const { notes } = parseItem(item);
        setEditTitle(item.title);
        setEditNotes(notes);
        setEditDate(item.event_date ? item.event_date.split('T')[0] : format(new Date(), 'yyyy-MM-dd'));
        setExpandedId(item.id === expandedId ? null : item.id);
    };

    const formatDateStr = (dateStr: string) => {
        try {
            return format(parseISO(dateStr), 'MMM d, yyyy');
        } catch (e) {
            return dateStr;
        }
    };

    const currentYear = new Date().getFullYear();

    const listVariants = {
        hidden: { opacity: 0 },
        show: {
            opacity: 1,
            transition: {
                staggerChildren: 0.03
            }
        }
    };

    const itemVariants = {
        hidden: { opacity: 0, y: 10 },
        show: { opacity: 1, y: 0, transition: { type: 'spring' as const, stiffness: 400, damping: 30 } }
    };

    return (
        <div className="min-h-screen bg-black text-white py-12 px-4 md:px-8 flex items-start justify-center">
            
            {/* Checklist Container Card */}
            <div className="bg-black/60 backdrop-blur-xl text-zinc-200 p-5 md:p-8 rounded-2xl border border-white/5 shadow-[0_20px_50px_rgba(0,0,0,0.5)] max-w-2xl w-full">
                
                {/* Header Control Bar */}
                <div className="flex items-center justify-between pb-4 border-b border-white/10 mb-6 select-none">
                    <div className="flex items-center gap-3">
                        <Link href="/" className="text-zinc-500 hover:text-white transition-colors p-1 rounded-lg">
                            <ArrowLeft className="w-4 h-4" />
                        </Link>
                        <h2 className="text-xl font-serif italic text-white/95 tracking-tight">
                            Bucket List
                        </h2>
                    </div>

                    {/* Controls: Switcher Toggle Icon & Add Button + Icon */}
                    <div className="flex items-center gap-2">
                        
                        {/* Toggle switch: Infinity (Life) vs CalendarClock (Year) */}
                        <button
                            onClick={() => {
                                setActiveTab(activeTab === 'BUCKET_LIFE' ? 'BUCKET_YEAR' : 'BUCKET_LIFE');
                                setExpandedId(null);
                            }}
                            className="p-1.5 rounded-lg bg-white/[0.03] border border-white/5 text-zinc-400 hover:text-white hover:bg-white/[0.06] transition-all cursor-pointer flex items-center justify-center"
                            title={activeTab === 'BUCKET_LIFE' ? "Switch to Yearly list" : "Switch to Lifetime list"}
                        >
                            {activeTab === 'BUCKET_LIFE' ? (
                                <Infinity className="w-4 h-4" />
                            ) : (
                                <CalendarClock className="w-4 h-4" />
                            )}
                        </button>

                        {/* Add Button */}
                        <button
                            onClick={() => {
                                setIsAdding(true);
                                setErrorMsg(null);
                            }}
                            className="p-1.5 rounded-lg bg-white/[0.03] border border-white/5 text-zinc-400 hover:text-white hover:bg-white/[0.06] transition-all cursor-pointer flex items-center justify-center"
                            title="Add aspiration"
                        >
                            <Plus className="w-4 h-4" />
                        </button>
                    </div>
                </div>

                {/* Empty State */}
                {allItems.length === 0 && !isAdding && (
                    <div className="py-16 text-center select-none">
                        <p className="text-zinc-400 font-serif italic text-sm mb-1">
                            {activeTab === 'BUCKET_LIFE'
                                ? 'What do you wish to see before the end?'
                                : `What milestones will define your ${currentYear}?`}
                        </p>
                        <p className="text-zinc-600 text-[9px] font-mono uppercase tracking-widest mt-1">
                            Tap + to write down your intentions
                        </p>
                    </div>
                )}

                {/* Floating Modal Window for Adding Item */}
                <AnimatePresence>
                    {isAdding && (
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            className="fixed inset-0 bg-black/70 backdrop-blur-md flex items-center justify-center z-50 p-4"
                        >
                            <motion.div
                                initial={{ scale: 0.95, y: 10, opacity: 0 }}
                                animate={{ scale: 1, y: 0, opacity: 1 }}
                                exit={{ scale: 0.95, y: 10, opacity: 0 }}
                                transition={{ type: "spring", stiffness: 350, damping: 28 }}
                                className="bg-[#0c0c0c] border border-white/10 rounded-2xl p-6 shadow-[0_20px_50px_rgba(0,0,0,0.8)] max-w-md w-full relative overflow-hidden"
                            >
                                {/* Glowing top line */}
                                <div className="absolute top-0 left-0 w-full h-[1.5px] bg-gradient-to-r from-white/0 via-white/20 to-white/0" />

                                <div className="flex justify-between items-center mb-5 select-none">
                                    <h3 className="text-xs font-mono uppercase tracking-[0.2em] text-white/50 flex items-center gap-2">
                                        <Sparkles className="w-3.5 h-3.5 text-zinc-400" />
                                        Forge Aspiration
                                    </h3>
                                    <button
                                        type="button"
                                        onClick={() => { setIsAdding(false); setNewTitle(''); setNewNotes(''); setErrorMsg(null); }}
                                        className="text-white/20 hover:text-white/60 transition-colors p-1"
                                    >
                                        <X className="w-4 h-4" />
                                    </button>
                                </div>

                                <form onSubmit={handleAdd} className="space-y-4">
                                    <div className="space-y-3.5">
                                        <div>
                                            <label className="text-[9px] font-mono uppercase tracking-[0.2em] text-white/30 block mb-1">Title</label>
                                            <input
                                                type="text"
                                                value={newTitle}
                                                onChange={(e) => setNewTitle(e.target.value)}
                                                placeholder={
                                                    activeTab === 'BUCKET_LIFE'
                                                        ? 'e.g. Kyoto in Autumn, Learn skydiving...'
                                                        : `e.g. Complete a marathon, Publish a web app...`
                                                }
                                                className="w-full bg-white/[0.02] border border-white/5 rounded-xl px-3.5 py-2.5 text-xs md:text-sm text-white placeholder:text-white/25 focus:outline-none focus:border-white/40 transition-colors"
                                                autoFocus
                                                required
                                            />
                                        </div>

                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                                            <div>
                                                <label className="text-[9px] font-mono uppercase tracking-[0.2em] text-white/30 block mb-1">Target Date</label>
                                                <input
                                                    type="date"
                                                    value={newDate}
                                                    onChange={(e) => setNewDate(e.target.value)}
                                                    className="w-full bg-white/[0.02] border border-white/5 rounded-xl px-3.5 py-2.5 text-xs text-white focus:outline-none focus:border-white/40 transition-colors"
                                                    required
                                                />
                                            </div>
                                            <div className="flex flex-col justify-end">
                                                <label className="text-[9px] font-mono uppercase tracking-[0.2em] text-white/30 block mb-1">Horizon</label>
                                                <div className="flex gap-2 items-center text-xs text-white/40 h-[40px] px-1 font-mono text-[9px] tracking-wider uppercase select-none">
                                                    {activeTab === 'BUCKET_LIFE' ? (
                                                        <>
                                                            <Infinity className="w-3.5 h-3.5 text-white/20" />
                                                            <span>Lifetime</span>
                                                        </>
                                                    ) : (
                                                        <>
                                                            <CalendarClock className="w-3.5 h-3.5 text-white/20" />
                                                            <span>{currentYear} Year</span>
                                                        </>
                                                    )}
                                                </div>
                                            </div>
                                        </div>

                                        <div>
                                            <label className="text-[9px] font-mono uppercase tracking-[0.2em] text-white/30 block mb-1">Motivation Notes</label>
                                            <textarea
                                                value={newNotes}
                                                onChange={(e) => setNewNotes(e.target.value)}
                                                placeholder="Detail what this achievement will look like..."
                                                rows={3}
                                                className="w-full bg-white/[0.02] border border-white/5 rounded-xl px-3.5 py-2.5 text-xs text-white placeholder:text-white/25 focus:outline-none focus:border-white/40 transition-colors resize-none"
                                            />
                                        </div>
                                    </div>

                                    {errorMsg && (
                                        <div className="text-[10px] text-red-400 font-mono bg-red-950/15 border border-red-500/10 px-3 py-2 rounded-lg">
                                            {errorMsg}
                                        </div>
                                    )}

                                    <div className="flex justify-end gap-3 pt-2 select-none">
                                        <button
                                            type="button"
                                            onClick={() => { setIsAdding(false); setNewTitle(''); setNewNotes(''); setErrorMsg(null); }}
                                            className="px-4 py-2 rounded-xl text-[10px] uppercase font-mono tracking-wider text-white/40 hover:text-white/60 hover:bg-white/5 transition-colors"
                                        >
                                            Cancel
                                        </button>
                                        <button
                                            type="submit"
                                            disabled={!newTitle.trim() || isSubmitting}
                                            className="px-4 py-2 rounded-xl text-[10px] uppercase font-mono tracking-wider bg-white text-black font-bold hover:bg-zinc-200 disabled:opacity-20 transition-all shadow-[0_0_10px_rgba(255,255,255,0.2)]"
                                        >
                                            {isSubmitting ? 'Forging...' : 'Forge'}
                                        </button>
                                    </div>
                                </form>
                            </motion.div>
                        </motion.div>
                    )}
                </AnimatePresence>

                {/* Flat Checklist List (Pending & Completed combined) */}
                <motion.div 
                    variants={listVariants}
                    initial="hidden"
                    animate="show"
                    className="flex flex-col gap-2"
                >
                    {/* 1. Pending Items */}
                    {pendingItems.map((item, index) => {
                        const { isCompleted, notes } = parseItem(item);
                        const isExpanded = expandedId === item.id;

                        return (
                            <motion.div
                                key={item.id}
                                layout
                                variants={itemVariants}
                                className="flex flex-col py-1.5 px-2 bg-white/[0.02] rounded-md hover:bg-white/[0.04] transition-colors border border-white/5 group"
                            >
                                <div className="flex items-center justify-between">
                                    {/* Title Click to Edit */}
                                    <div 
                                        onClick={() => startEditing(item)}
                                        className="flex-1 font-normal text-zinc-300 pr-4 cursor-pointer"
                                    >
                                        <div className="line-clamp-2 text-[11px] md:text-[14px] tracking-wide leading-snug">
                                            {item.title}
                                        </div>
                                    </div>

                                    {/* Action items and check button */}
                                    <div className="flex items-center gap-3 flex-shrink-0 select-none">
                                        {item.event_date && !isExpanded && (
                                            <span className="text-[9px] font-mono text-zinc-500 uppercase">
                                                {formatDateStr(item.event_date)}
                                            </span>
                                        )}
                                        
                                        <div className="flex items-center gap-1.5 opacity-0 group-hover:opacity-100 transition-opacity">
                                            <button
                                                type="button"
                                                onClick={() => startEditing(item)}
                                                className="text-white/20 hover:text-white/50 transition-colors p-1"
                                                title="Edit details"
                                            >
                                                <Edit3 className="w-3.5 h-3.5" />
                                            </button>
                                            <button
                                                type="button"
                                                onClick={() => handleDelete(item.id)}
                                                className="text-white/20 hover:text-red-400 transition-colors p-1"
                                                title="Delete item"
                                            >
                                                <Trash2 className="w-3.5 h-3.5" />
                                            </button>
                                        </div>

                                        <button
                                            onClick={() => toggleDone(item.id, item.description)}
                                            style={{ width: 64, paddingTop: 3, paddingBottom: 3 }}
                                            className="text-[8px] md:text-[10px] rounded-[4px] flex items-center justify-center gap-1 transition-all duration-300 active:scale-95 border-[1px] bg-transparent text-zinc-400 border-white/30 hover:border-white/60 cursor-pointer"
                                        >
                                            MARK
                                        </button>
                                    </div>
                                </div>

                                {/* Notes snippet */}
                                {!isExpanded && notes && (
                                    <div className="text-[10px] text-zinc-500 font-serif italic mt-0.5 pl-2 select-none">
                                        {notes}
                                    </div>
                                )}

                                {/* Editor fields */}
                                <AnimatePresence>
                                    {isExpanded && (
                                        <motion.div
                                            initial={{ height: 0, opacity: 0 }}
                                            animate={{ height: 'auto', opacity: 1 }}
                                            exit={{ height: 0, opacity: 0 }}
                                            transition={{ duration: 0.18, ease: 'easeOut' }}
                                            className="overflow-hidden pr-1 mt-3 border-t border-white/5 pt-3 space-y-3.5"
                                        >
                                            <div>
                                                <label className="text-[8px] font-mono uppercase tracking-wider text-white/30 block mb-0.5">Aspiration Title</label>
                                                <input 
                                                    type="text"
                                                    value={editTitle}
                                                    onChange={(e) => setEditTitle(e.target.value)}
                                                    className="w-full bg-transparent border-b border-white/10 py-1 text-xs text-white focus:outline-none focus:border-white/40 transition-colors"
                                                />
                                            </div>
                                            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                                                <div>
                                                    <label className="text-[8px] font-mono uppercase tracking-wider text-white/30 block mb-0.5">Target Date</label>
                                                    <input 
                                                        type="date"
                                                        value={editDate}
                                                        onChange={(e) => setEditDate(e.target.value)}
                                                        className="w-full bg-transparent border-b border-white/10 py-1 text-xs text-white focus:outline-none focus:border-white/40 transition-colors"
                                                    />
                                                </div>
                                                <div className="flex flex-col justify-end">
                                                    <label className="text-[8px] font-mono uppercase tracking-wider text-white/30 block mb-0.5">Horizon</label>
                                                    <span className="text-[9px] font-mono text-white/40 py-1 tracking-wide uppercase select-none">
                                                        {activeTab === 'BUCKET_LIFE' ? 'Lifetime' : `${currentYear}`}
                                                    </span>
                                                </div>
                                            </div>
                                            <div>
                                                <label className="text-[8px] font-mono uppercase tracking-wider text-white/30 block mb-0.5">Motivation Notes</label>
                                                <textarea 
                                                    value={editNotes}
                                                    onChange={(e) => setEditNotes(e.target.value)}
                                                    placeholder="Motivation notes..."
                                                    rows={2}
                                                    className="w-full bg-transparent border-b border-white/10 py-1 text-xs text-white placeholder:text-white/20 focus:outline-none focus:border-white/40 transition-colors resize-none"
                                                />
                                            </div>
                                            <div className="flex justify-end gap-3 pt-1 select-none">
                                                <button
                                                    type="button"
                                                    onClick={() => setExpandedId(null)}
                                                    className="text-[9px] uppercase font-mono tracking-wider text-white/30 hover:text-white/50 transition-colors py-1"
                                                >
                                                    Cancel
                                                </button>
                                                <button
                                                    type="button"
                                                    onClick={() => {
                                                        handleUpdateItem(item.id, editTitle, editNotes, editDate, isCompleted);
                                                        setExpandedId(null);
                                                    }}
                                                    className="text-[9px] uppercase font-mono tracking-wider text-white font-semibold hover:text-zinc-300 transition-colors py-1"
                                                >
                                                    Save
                                                </button>
                                            </div>
                                        </motion.div>
                                    )}
                                </AnimatePresence>
                            </motion.div>
                        );
                    })}

                    {/* Divider if we have both pending and completed items */}
                    {completedItems.length > 0 && pendingItems.length > 0 && (
                        <div className="my-2 border-t border-white/5" />
                    )}

                    {/* 2. Completed Items */}
                    {completedItems.map((item) => {
                        const { isCompleted, notes } = parseItem(item);
                        return (
                            <motion.div
                                key={item.id}
                                layout
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                exit={{ opacity: 0 }}
                                className="flex items-center py-1.5 px-2 bg-white/[0.01] rounded-md hover:bg-white/[0.02] transition-colors border border-white/5 group"
                            >
                                {/* Title strikethrough */}
                                <div className="flex-1 font-normal text-zinc-500 pr-4">
                                    <div className="line-clamp-2 text-[11px] md:text-[14px] tracking-wide leading-snug line-through">
                                        {item.title}
                                    </div>
                                    {notes && (
                                        <div className="text-[10px] text-zinc-600 font-serif italic mt-0.5 pl-2 line-through">
                                            {notes}
                                        </div>
                                    )}
                                </div>

                                {/* Checked Status and Actions */}
                                <div className="flex items-center gap-3 flex-shrink-0 select-none">
                                    {item.event_date && (
                                        <span className="text-[9px] font-mono text-zinc-600 uppercase">
                                            {formatDateStr(item.event_date)}
                                        </span>
                                    )}
                                    
                                    <div className="flex items-center gap-1.5 opacity-0 group-hover:opacity-100 transition-opacity">
                                        <button
                                            onClick={() => handleDelete(item.id)}
                                            className="text-white/25 hover:text-red-400 transition-colors p-1"
                                            title="Delete item"
                                        >
                                            <Trash2 className="w-3.5 h-3.5" />
                                        </button>
                                    </div>

                                    <button
                                        onClick={() => toggleDone(item.id, item.description)}
                                        style={{ width: 64, paddingTop: 3, paddingBottom: 3 }}
                                        className="text-[8px] md:text-[10px] rounded-[4px] flex items-center justify-center gap-1 transition-all duration-300 active:scale-95 border-[1px] bg-white text-black border-white shadow-[0_0_10px_rgba(255,255,255,0.3)] font-semibold cursor-pointer"
                                    >
                                        <Check className="w-2.5 h-2.5" strokeWidth={3} />
                                        DONE
                                    </button>
                                </div>
                            </motion.div>
                        );
                    })}
                </motion.div>

                {/* Footer Quote */}
                <div className="mt-8 md:mt-12 text-center select-none">
                    <p className="font-serif italic text-xs text-zinc-500 tracking-wide">
                        {activeTab === 'BUCKET_LIFE'
                            ? '"remember, the purpose of life is to live it."'
                            : `"make ${currentYear} the year you didn't just exist — you lived."`}
                    </p>
                </div>
            </div>
        </div>
    );
}
