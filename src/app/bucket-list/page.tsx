"use client";

import React, { useState, useMemo } from 'react';
import { useUserData } from '@/context/user-data-context';
import { 
    Plus, Check, Trash2, Infinity, CalendarClock, ChevronDown, Sparkles, 
    ArrowLeft, Calendar, Save, X, Trophy, Compass, Edit3
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

    const progress = useMemo(() => {
        if (allItems.length === 0) return 0;
        return Math.round((completedItems.length / allItems.length) * 100);
    }, [allItems.length, completedItems.length]);

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
        <div className="min-h-screen bg-black text-white py-10 px-4 md:px-8 flex items-center justify-center">
            
            {/* Checklist-styled Card Container */}
            <div className="bg-black/60 backdrop-blur-xl text-zinc-200 p-6 md:p-10 rounded-2xl border border-white/5 shadow-[0_20px_50px_rgba(0,0,0,0.5)] max-w-3xl w-full">
                
                {/* Header */}
                <div className="text-center mb-8 relative select-none">
                    <Link href="/" className="absolute left-0 top-1/2 -translate-y-1/2 text-white/30 hover:text-white transition-colors p-1 rounded-lg">
                        <ArrowLeft className="w-5 h-5" />
                    </Link>
                    <h2 className="text-3xl md:text-5xl font-serif italic mb-2 tracking-tight text-white/90">
                        Bucket List
                    </h2>
                    <p className="text-[10px] md:text-sm font-sans tracking-[0.2em] uppercase opacity-50">
                        {activeTab === 'BUCKET_LIFE' ? 'Before time runs out' : `Yearly Ascent — ${currentYear}`}
                    </p>
                </div>

                {/* Tab Switcher */}
                <div className="relative flex p-1 bg-white/[0.03] border border-white/5 rounded-xl backdrop-blur-md max-w-xs mx-auto mb-8 select-none">
                    <button
                        onClick={() => {
                            setActiveTab('BUCKET_LIFE');
                            setExpandedId(null);
                        }}
                        className={`relative flex-1 flex items-center justify-center gap-2 py-2 rounded-lg text-xs font-semibold tracking-wide transition-all z-10 ${
                            activeTab === 'BUCKET_LIFE' ? 'text-black' : 'text-white/40 hover:text-white/60'
                        }`}
                    >
                        {activeTab === 'BUCKET_LIFE' && (
                            <motion.div
                                layoutId="activeTabGlow"
                                className="absolute inset-0 bg-white rounded-lg shadow-[0_0_10px_rgba(255,255,255,0.3)]"
                                transition={{ type: "spring", stiffness: 350, damping: 30 }}
                            />
                        )}
                        <span className="relative z-20">Lifetime</span>
                    </button>
                    <button
                        onClick={() => {
                            setActiveTab('BUCKET_YEAR');
                            setExpandedId(null);
                        }}
                        className={`relative flex-1 flex items-center justify-center gap-2 py-2 rounded-lg text-xs font-semibold tracking-wide transition-all z-10 ${
                            activeTab === 'BUCKET_YEAR' ? 'text-black' : 'text-white/40 hover:text-white/60'
                        }`}
                    >
                        {activeTab === 'BUCKET_YEAR' && (
                            <motion.div
                                layoutId="activeTabGlow"
                                className="absolute inset-0 bg-white rounded-lg shadow-[0_0_10px_rgba(255,255,255,0.3)]"
                                transition={{ type: "spring", stiffness: 350, damping: 30 }}
                            />
                        )}
                        <span className="relative z-20">{currentYear}</span>
                    </button>
                </div>

                {/* Progress bar */}
                {allItems.length > 0 && (
                    <div className="mb-8 space-y-1.5 select-none">
                        <div className="flex justify-between items-center text-[9px] font-mono tracking-[0.25em] text-white/20 uppercase">
                            <span>Achieved</span>
                            <span>{completedItems.length} of {allItems.length} ({progress}%)</span>
                        </div>
                        <div className="h-[2px] bg-white/[0.04] w-full rounded-full overflow-hidden">
                            <motion.div
                                className="h-full bg-white"
                                initial={{ width: 0 }}
                                animate={{ width: `${progress}%` }}
                                transition={{ duration: 0.6, ease: 'easeOut' }}
                                style={{ boxShadow: '0 0 8px rgba(255,255,255,0.5)' }}
                            />
                        </div>
                    </div>
                )}

                {/* Main Content List */}
                <div className="w-full flex flex-col font-sans gap-2">
                    
                    {/* Header Columns */}
                    <div className="flex items-center px-2 pb-2 border-b border-white/10 select-none">
                        <div className="flex-1 font-medium tracking-[0.2em] text-[10px] uppercase text-zinc-500">Aspiration</div>
                        <div className="font-medium tracking-[0.2em] text-[10px] uppercase text-zinc-500 text-right pr-4">Status</div>
                    </div>

                    {/* Empty State */}
                    {allItems.length === 0 && !isAdding && (
                        <div className="py-16 text-center select-none">
                            <p className="text-white/40 font-serif italic text-base mb-1">
                                {activeTab === 'BUCKET_LIFE'
                                    ? 'What do you wish to see before the end?'
                                    : `What milestones will define your ${currentYear}?`}
                            </p>
                            <p className="text-white/15 text-[9px] font-mono uppercase tracking-widest mt-2">
                                Write down your intentions below
                            </p>
                        </div>
                    )}

                    {/* Add Form / Trigger */}
                    <div className="mb-2">
                        <AnimatePresence mode="popLayout">
                            {isAdding ? (
                                <motion.form
                                    initial={{ opacity: 0, y: -8 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    exit={{ opacity: 0, y: -8 }}
                                    transition={{ duration: 0.18 }}
                                    onSubmit={handleAdd}
                                    className="p-4 rounded-md bg-white/[0.01] border border-white/5 space-y-4"
                                >
                                    <div className="space-y-3">
                                        <input
                                            type="text"
                                            value={newTitle}
                                            onChange={(e) => setNewTitle(e.target.value)}
                                            placeholder={
                                                activeTab === 'BUCKET_LIFE'
                                                    ? 'Title of Aspiration (e.g. Kyoto in Autumn)'
                                                    : `Aspiration for ${currentYear}`
                                            }
                                            className="w-full bg-transparent border-b border-white/10 py-1 text-sm text-white placeholder:text-white/20 focus:outline-none focus:border-white/40 transition-colors"
                                            autoFocus
                                            required
                                        />

                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 pt-1">
                                            <div>
                                                <label className="text-[8px] font-mono uppercase tracking-wider text-white/30 block mb-0.5">Target Date</label>
                                                <input
                                                    type="date"
                                                    value={newDate}
                                                    onChange={(e) => setNewDate(e.target.value)}
                                                    className="w-full bg-transparent border-b border-white/10 py-1 text-xs text-white focus:outline-none focus:border-white/40 transition-colors"
                                                    required
                                                />
                                            </div>
                                            <div className="flex flex-col justify-end">
                                                <label className="text-[8px] font-mono uppercase tracking-wider text-white/30 block mb-0.5">Category</label>
                                                <span className="text-[10px] font-mono text-white/40 py-1 tracking-wide uppercase select-none">
                                                    {activeTab === 'BUCKET_LIFE' ? 'Lifetime Horizon' : `${currentYear} Ascent`}
                                                </span>
                                            </div>
                                        </div>

                                        <div>
                                            <textarea
                                                value={newNotes}
                                                onChange={(e) => setNewNotes(e.target.value)}
                                                placeholder="Add brief details or motivation notes..."
                                                rows={2}
                                                className="w-full bg-transparent border-b border-white/10 py-1 text-xs text-white placeholder:text-white/20 focus:outline-none focus:border-white/40 transition-colors resize-none"
                                            />
                                        </div>
                                    </div>

                                    {errorMsg && (
                                        <div className="text-[10px] text-red-400 font-mono bg-red-950/15 border border-red-500/10 px-3 py-2 rounded-lg">
                                            {errorMsg}
                                        </div>
                                    )}

                                    <div className="flex justify-end gap-3 pt-1 select-none">
                                        <button
                                            type="button"
                                            onClick={() => { setIsAdding(false); setNewTitle(''); setNewNotes(''); setErrorMsg(null); }}
                                            className="text-[9px] uppercase font-mono tracking-wider text-white/30 hover:text-white/50 transition-colors py-1"
                                        >
                                            Cancel
                                        </button>
                                        <button
                                            type="submit"
                                            disabled={!newTitle.trim() || isSubmitting}
                                            className="text-[9px] uppercase font-mono tracking-wider text-white font-semibold hover:text-zinc-300 disabled:opacity-20 transition-colors py-1"
                                        >
                                            {isSubmitting ? 'Forging...' : 'Forge'}
                                        </button>
                                    </div>
                                </motion.form>
                            ) : (
                                <motion.button
                                    initial={{ opacity: 0 }}
                                    animate={{ opacity: 1 }}
                                    onClick={() => setIsAdding(true)}
                                    className="w-full flex items-center justify-center gap-2 py-2.5 rounded-md border border-dashed border-white/10 hover:border-white/20 hover:bg-white/[0.01] transition-all text-zinc-400 hover:text-white text-xs font-mono uppercase tracking-wider cursor-pointer select-none"
                                >
                                    <Plus className="w-3.5 h-3.5" />
                                    Add New Aspiration
                                </motion.button>
                            )}
                        </AnimatePresence>
                    </div>

                    {/* Pending list */}
                    <motion.div 
                        variants={listVariants}
                        initial="hidden"
                        animate="show"
                        className="flex flex-col gap-2"
                    >
                        <AnimatePresence mode="popLayout">
                            {pendingItems.map((item, index) => {
                                const { isCompleted, notes } = parseItem(item);
                                const isExpanded = expandedId === item.id;

                                return (
                                    <motion.div
                                        key={item.id}
                                        layout
                                        variants={itemVariants}
                                        exit={{ opacity: 0, y: -10 }}
                                        className="flex flex-col py-1.5 px-2 bg-white/[0.02] rounded-md hover:bg-white/[0.04] transition-colors border border-white/5 group"
                                    >
                                        <div className="flex items-center">
                                            {/* Title & Index */}
                                            <div 
                                                onClick={() => startEditing(item)}
                                                className="flex-1 font-normal text-zinc-300 pr-4 cursor-pointer"
                                            >
                                                <div className="line-clamp-2 text-[11px] md:text-[14px] tracking-wide leading-snug">
                                                    {index + 1}. {item.title}
                                                </div>
                                            </div>

                                            {/* Status Button (MARK/DONE) */}
                                            <div className="flex items-center gap-3 flex-shrink-0 select-none">
                                                {item.event_date && !isExpanded && (
                                                    <span className="text-[9px] font-mono text-zinc-500 uppercase">
                                                        {formatDateStr(item.event_date)}
                                                    </span>
                                                )}
                                                
                                                <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                                    <button
                                                        type="button"
                                                        onClick={() => startEditing(item)}
                                                        className="text-white/20 hover:text-white/50 transition-colors p-1"
                                                    >
                                                        <Edit3 className="w-3 h-3" />
                                                    </button>
                                                    <button
                                                        type="button"
                                                        onClick={() => handleDelete(item.id)}
                                                        className="text-white/20 hover:text-red-400 transition-colors p-1"
                                                    >
                                                        <Trash2 className="w-3 h-3" />
                                                    </button>
                                                </div>

                                                <button
                                                    onClick={() => toggleDone(item.id, item.description)}
                                                    style={{ width: 64, paddingTop: 3, paddingBottom: 3 }}
                                                    className={`text-[8px] md:text-[10px] rounded-[4px] flex items-center justify-center gap-1 transition-all duration-300 active:scale-95 border-[1px] ${
                                                        isCompleted 
                                                            ? 'bg-white text-black border-white shadow-[0_0_10px_rgba(255,255,255,0.3)]' 
                                                            : 'bg-transparent text-zinc-400 border-white/30 hover:border-white/60'
                                                    }`}
                                                >
                                                    {isCompleted && <Check className="w-2.5 h-2.5" strokeWidth={3} />}
                                                    {isCompleted ? 'DONE' : 'MARK'}
                                                </button>
                                            </div>
                                        </div>

                                        {/* Notes snippet below title */}
                                        {!isExpanded && notes && (
                                            <div className="text-[10px] text-zinc-500 font-serif italic mt-0.5 pl-4 select-none">
                                                {notes}
                                            </div>
                                        )}

                                        {/* Expandable Editor form */}
                                        <AnimatePresence>
                                            {isExpanded && (
                                                <motion.div
                                                    initial={{ height: 0, opacity: 0 }}
                                                    animate={{ height: 'auto', opacity: 1 }}
                                                    exit={{ height: 0, opacity: 0 }}
                                                    transition={{ duration: 0.18, ease: 'easeOut' }}
                                                    className="overflow-hidden pl-4 pr-1 mt-3 space-y-3.5 border-t border-white/5 pt-3"
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
                        </AnimatePresence>
                    </motion.div>

                    {/* Completed Section */}
                    {completedItems.length > 0 && (
                        <div className="pt-6 border-t border-white/10">
                            <button
                                onClick={() => setShowCompleted(!showCompleted)}
                                className="flex items-center gap-2 text-white/20 hover:text-white/40 transition-colors mb-4 group cursor-pointer select-none"
                            >
                                <ChevronDown className={`w-3.5 h-3.5 transition-transform duration-300 ${showCompleted ? 'rotate-0' : '-rotate-90'}`} />
                                <span className="text-[9px] font-mono tracking-[0.2em] uppercase">
                                    Conquered ({completedItems.length})
                                </span>
                            </button>

                            <AnimatePresence>
                                {showCompleted && (
                                    <motion.div
                                        initial={{ opacity: 0, height: 0 }}
                                        animate={{ opacity: 1, height: 'auto' }}
                                        exit={{ opacity: 0, height: 0 }}
                                        transition={{ duration: 0.2, ease: 'easeInOut' }}
                                        className="flex flex-col gap-2 overflow-hidden"
                                    >
                                        {completedItems.map((item) => {
                                            const { notes } = parseItem(item);
                                            return (
                                                <motion.div
                                                    key={item.id}
                                                    layout
                                                    initial={{ opacity: 0 }}
                                                    animate={{ opacity: 1 }}
                                                    className="flex items-center py-1.5 px-2 bg-white/[0.01] rounded-md hover:bg-white/[0.02] transition-colors border border-white/5 group"
                                                >
                                                    {/* Content */}
                                                    <div className="flex-1 font-normal text-zinc-500 pr-4">
                                                        <div className="line-clamp-2 text-[11px] md:text-[14px] tracking-wide leading-snug line-through">
                                                            {item.title}
                                                        </div>
                                                        {notes && (
                                                            <div className="text-[10px] text-zinc-600 font-serif italic mt-0.5 pl-4 line-through">
                                                                {notes}
                                                            </div>
                                                        )}
                                                    </div>

                                                    {/* Checked Status */}
                                                    <div className="flex items-center gap-3 flex-shrink-0 select-none">
                                                        {item.event_date && (
                                                            <span className="text-[9px] font-mono text-emerald-500/30 uppercase">
                                                                {formatDateStr(item.event_date)}
                                                            </span>
                                                        )}
                                                        <button
                                                            onClick={() => handleDelete(item.id)}
                                                            className="text-white/25 hover:text-red-400 transition-colors p-1"
                                                            title="Delete Aspiration"
                                                        >
                                                            <Trash2 className="w-3.5 h-3.5" />
                                                        </button>
                                                        <button
                                                            onClick={() => toggleDone(item.id, item.description)}
                                                            style={{ width: 64, paddingTop: 3, paddingBottom: 3 }}
                                                            className="text-[8px] md:text-[10px] rounded-[4px] flex items-center justify-center gap-1 transition-all duration-300 active:scale-95 border-[1px] bg-white text-black border-white shadow-[0_0_10px_rgba(255,255,255,0.3)]"
                                                        >
                                                            <Check className="w-2.5 h-2.5" strokeWidth={3} />
                                                            DONE
                                                        </button>
                                                    </div>
                                                </motion.div>
                                            );
                                        })}
                                    </motion.div>
                                )}
                            </AnimatePresence>
                        </div>
                    )}
                </div>

                {/* Footer Quote */}
                <div className="mt-8 md:mt-16 text-center select-none">
                    <p className="font-serif italic text-sm md:text-xl text-zinc-400 tracking-wide">
                        {activeTab === 'BUCKET_LIFE'
                            ? 'remember, the purpose of life is to live it.'
                            : `make ${currentYear} the year you didn't just exist — you lived.`}
                    </p>
                </div>
            </div>
        </div>
    );
}
