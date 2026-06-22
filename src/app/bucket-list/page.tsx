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
        <div className="min-h-screen bg-black text-white pb-24">
            {/* Header */}
            <div className="max-w-xl mx-auto px-4 pt-10 pb-6">
                <div className="flex items-center justify-between mb-8 select-none">
                    <div className="flex items-center gap-3">
                        <Link href="/" className="text-white/30 hover:text-white transition-colors p-1 rounded-lg">
                            <ArrowLeft className="w-4 h-4" />
                        </Link>
                        <h1 className="text-lg font-serif italic text-white/90">Aspirations</h1>
                    </div>
                    
                    {/* Minimalist Tab Toggle */}
                    <div className="flex gap-4 text-[10px] font-mono uppercase tracking-widest">
                        <button
                            onClick={() => {
                                setActiveTab('BUCKET_LIFE');
                                setExpandedId(null);
                            }}
                            className={`relative py-1 transition-colors ${
                                activeTab === 'BUCKET_LIFE' ? 'text-emerald-400 font-semibold' : 'text-white/20 hover:text-white/40'
                            }`}
                        >
                            Horizon
                            {activeTab === 'BUCKET_LIFE' && (
                                <motion.div
                                    layoutId="tabLine"
                                    className="absolute bottom-0 left-0 right-0 h-[1.5px] bg-emerald-400"
                                    transition={{ type: "spring", stiffness: 400, damping: 30 }}
                                />
                            )}
                        </button>
                        <button
                            onClick={() => {
                                setActiveTab('BUCKET_YEAR');
                                setExpandedId(null);
                            }}
                            className={`relative py-1 transition-colors ${
                                activeTab === 'BUCKET_YEAR' ? 'text-emerald-400 font-semibold' : 'text-white/20 hover:text-white/40'
                            }`}
                        >
                            {currentYear}
                            {activeTab === 'BUCKET_YEAR' && (
                                <motion.div
                                    layoutId="tabLine"
                                    className="absolute bottom-0 left-0 right-0 h-[1.5px] bg-emerald-400"
                                    transition={{ type: "spring", stiffness: 400, damping: 30 }}
                                />
                            )}
                        </button>
                    </div>
                </div>

                {/* Minimalist Linear Progress */}
                {allItems.length > 0 && (
                    <div className="mb-10 space-y-1.5 select-none">
                        <div className="flex justify-between items-center text-[9px] font-mono tracking-[0.25em] text-white/25 uppercase">
                            <span>Conquered</span>
                            <span>{completedItems.length} of {allItems.length} ({progress}%)</span>
                        </div>
                        <div className="h-[1.5px] bg-white/[0.04] w-full rounded-full overflow-hidden">
                            <motion.div
                                className="h-full bg-emerald-400"
                                initial={{ width: 0 }}
                                animate={{ width: `${progress}%` }}
                                transition={{ duration: 0.6, ease: 'easeOut' }}
                            />
                        </div>
                    </div>
                )}

                {/* Main Content Area */}
                <div className="space-y-6">

                    {/* Empty State */}
                    {allItems.length === 0 && !isAdding && (
                        <div className="py-20 text-center select-none">
                            <p className="text-white/50 font-serif italic text-base mb-1">
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
                    <div>
                        <AnimatePresence mode="popLayout">
                            {isAdding ? (
                                <motion.form
                                    initial={{ opacity: 0, y: -8 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    exit={{ opacity: 0, y: -8 }}
                                    transition={{ duration: 0.18 }}
                                    onSubmit={handleAdd}
                                    className="space-y-4 py-2 border-b border-white/5"
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
                                            className="w-full bg-transparent border-b border-white/10 py-1 text-sm text-white placeholder:text-white/20 focus:outline-none focus:border-emerald-500/50 transition-colors"
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
                                                    className="w-full bg-transparent border-b border-white/10 py-1 text-xs text-white focus:outline-none focus:border-emerald-500/50 transition-colors"
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
                                                className="w-full bg-transparent border-b border-white/10 py-1 text-xs text-white placeholder:text-white/20 focus:outline-none focus:border-emerald-500/50 transition-colors resize-none"
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
                                            className="text-[9px] uppercase font-mono tracking-wider text-emerald-400 font-semibold hover:text-emerald-300 disabled:opacity-20 transition-colors py-1"
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
                                    className="w-full flex items-center justify-between py-3 border-b border-dashed border-white/5 text-white/30 hover:text-emerald-400/80 transition-colors group cursor-pointer select-none"
                                >
                                    <span className="text-xs font-mono uppercase tracking-wider">Forge new aspiration...</span>
                                    <Plus className="w-3.5 h-3.5 group-hover:rotate-90 transition-transform duration-300" />
                                </motion.button>
                            )}
                        </AnimatePresence>
                    </div>

                    {/* Pending Items List */}
                    <motion.div 
                        variants={listVariants}
                        initial="hidden"
                        animate="show"
                        className="divide-y divide-white/[0.03]"
                    >
                        <AnimatePresence mode="popLayout">
                            {pendingItems.map((item) => {
                                const { isCompleted, notes } = parseItem(item);
                                const isExpanded = expandedId === item.id;
                                
                                return (
                                    <motion.div
                                        key={item.id}
                                        layout
                                        variants={itemVariants}
                                        exit={{ opacity: 0, y: -10 }}
                                        className="py-3.5 transition-all duration-300"
                                    >
                                        <div className="flex items-center justify-between">
                                            <div className="flex items-center gap-3.5 min-w-0">
                                                {/* Mini Square Checkbox */}
                                                <div
                                                    role="button"
                                                    onClick={(e) => {
                                                        e.stopPropagation();
                                                        toggleDone(item.id, item.description);
                                                    }}
                                                    className={`rounded-[3px] border flex-shrink-0 flex items-center justify-center cursor-pointer transition-all ${
                                                        isCompleted 
                                                            ? 'bg-emerald-400 border-emerald-400 text-black shadow-[0_0_8px_rgba(52,211,153,0.25)]' 
                                                            : 'border-white/20 hover:border-emerald-400/50'
                                                    }`}
                                                    style={{
                                                        width: '13px',
                                                        height: '13px',
                                                        minWidth: '13px',
                                                        minHeight: '13px',
                                                        maxWidth: '13px',
                                                        maxHeight: '13px',
                                                    }}
                                                >
                                                    {isCompleted && <Check className="w-2.5 h-2.5 stroke-[4.0] text-black" />}
                                                </div>

                                                <span 
                                                    onClick={() => startEditing(item)}
                                                    className={`text-sm cursor-pointer transition-colors leading-relaxed select-none ${
                                                        isCompleted ? 'text-white/30 line-through' : 'text-white/80 hover:text-white'
                                                    }`}
                                                >
                                                    {item.title}
                                                </span>
                                            </div>

                                            {/* Date, edit and delete buttons */}
                                            <div className="flex items-center gap-4 flex-shrink-0 ml-4 select-none">
                                                {item.event_date && !isExpanded && (
                                                    <span className="text-[9px] font-mono text-white/20 uppercase tracking-wider">
                                                        {formatDateStr(item.event_date)}
                                                    </span>
                                                )}
                                                <div className="flex items-center gap-1.5 opacity-0 hover:opacity-100 group-hover:opacity-100 transition-opacity">
                                                    <button
                                                        type="button"
                                                        onClick={() => startEditing(item)}
                                                        className="text-white/10 hover:text-white/40 transition-colors p-1"
                                                        title="Edit details"
                                                    >
                                                        <Edit3 className="w-3 h-3" />
                                                    </button>
                                                    <button
                                                        type="button"
                                                        onClick={() => handleDelete(item.id)}
                                                        className="text-white/10 hover:text-red-400 transition-colors p-1"
                                                        title="Delete Aspiration"
                                                    >
                                                        <Trash2 className="w-3 h-3" />
                                                    </button>
                                                </div>
                                            </div>
                                        </div>

                                        {/* Notes preview (if not expanded and exists) */}
                                        {!isExpanded && notes && (
                                            <p className="text-xs text-white/35 pl-[27px] mt-1 select-none font-serif italic">
                                                {notes}
                                            </p>
                                        )}

                                        {/* Expandable Form details */}
                                        <AnimatePresence>
                                            {isExpanded && (
                                                <motion.div
                                                    initial={{ height: 0, opacity: 0 }}
                                                    animate={{ height: 'auto', opacity: 1 }}
                                                    exit={{ height: 0, opacity: 0 }}
                                                    transition={{ duration: 0.18, ease: 'easeOut' }}
                                                    className="overflow-hidden pl-[27px] pr-2 mt-3 space-y-3.5"
                                                >
                                                    <div>
                                                        <label className="text-[8px] font-mono uppercase tracking-wider text-white/30 block mb-0.5">Aspiration Title</label>
                                                        <input 
                                                            type="text"
                                                            value={editTitle}
                                                            onChange={(e) => setEditTitle(e.target.value)}
                                                            className="w-full bg-transparent border-b border-white/10 py-1 text-xs text-white focus:outline-none focus:border-emerald-500/40 transition-colors"
                                                        />
                                                    </div>
                                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                                                        <div>
                                                            <label className="text-[8px] font-mono uppercase tracking-wider text-white/30 block mb-0.5">Target Date</label>
                                                            <input 
                                                                type="date"
                                                                value={editDate}
                                                                onChange={(e) => setEditDate(e.target.value)}
                                                                className="w-full bg-transparent border-b border-white/10 py-1 text-xs text-white focus:outline-none focus:border-emerald-500/40 transition-colors"
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
                                                            className="w-full bg-transparent border-b border-white/10 py-1 text-xs text-white placeholder:text-white/20 focus:outline-none focus:border-emerald-500/40 transition-colors resize-none"
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
                                                            className="text-[9px] uppercase font-mono tracking-wider text-emerald-400 font-semibold hover:text-emerald-300 transition-colors py-1"
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

                    {/* Completed / Conquered Section */}
                    {completedItems.length > 0 && (
                        <div className="pt-6 border-t border-white/[0.04]">
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
                                        className="divide-y divide-white/[0.02] overflow-hidden"
                                    >
                                        {completedItems.map((item) => {
                                            const { notes } = parseItem(item);
                                            return (
                                                <motion.div
                                                    key={item.id}
                                                    layout
                                                    initial={{ opacity: 0 }}
                                                    animate={{ opacity: 1 }}
                                                    className="py-3 flex items-center justify-between"
                                                >
                                                    <div className="flex items-center gap-3.5 min-w-0">
                                                        {/* Mini Square Checked */}
                                                        <div
                                                            role="button"
                                                            onClick={() => toggleDone(item.id, item.description)}
                                                            className="rounded-[3px] bg-emerald-500/10 border border-emerald-500/40 flex items-center justify-center cursor-pointer transition-all hover:bg-emerald-500/20"
                                                            style={{
                                                                width: '13px',
                                                                height: '13px',
                                                                minWidth: '13px',
                                                                minHeight: '13px',
                                                                maxWidth: '13px',
                                                                maxHeight: '13px',
                                                            }}
                                                        >
                                                            <Check className="w-2 h-2 text-emerald-400 stroke-[4.0]" />
                                                        </div>

                                                        <div className="min-w-0">
                                                            <h4 className="text-sm font-light text-white/30 line-through leading-relaxed truncate">
                                                                {item.title}
                                                            </h4>
                                                            {notes && (
                                                                <p className="text-xs text-white/20 italic pl-0 line-through font-serif truncate">
                                                                    {notes}
                                                                </p>
                                                            )}
                                                        </div>
                                                    </div>

                                                    <div className="flex items-center gap-4 flex-shrink-0 ml-4 select-none">
                                                        {item.event_date && (
                                                            <span className="text-[9px] font-mono text-emerald-500/30 uppercase tracking-wider">
                                                                {formatDateStr(item.event_date)}
                                                            </span>
                                                        )}
                                                        <button
                                                            onClick={() => handleDelete(item.id)}
                                                            className="text-white/10 hover:text-red-400 transition-colors p-1"
                                                            title="Delete Aspiration"
                                                        >
                                                            <Trash2 className="w-3 h-3" />
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
            </div>
        </div>
    );
}
