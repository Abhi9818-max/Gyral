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

    const getMotivationalMessage = (prog: number) => {
        if (prog === 0) return "A clean slate of ambitions.";
        if (prog < 25) return "First steps taken toward a grand design.";
        if (prog < 50) return "Gathering momentum. Keep pushing.";
        if (prog < 75) return "More than halfway. Your legend grows.";
        if (prog < 100) return "Almost complete. The peak is in sight.";
        return "All aspirations conquered. You lived fully.";
    };

    const formatDateStr = (dateStr: string) => {
        try {
            return format(parseISO(dateStr), 'MMM d, yyyy');
        } catch (e) {
            return dateStr;
        }
    };

    const currentYear = new Date().getFullYear();

    // Stats configuration for SVG circle
    const size = 64;
    const strokeWidth = 4;
    const radius = (size - strokeWidth) / 2;
    const circumference = radius * 2 * Math.PI;
    const offset = circumference - (progress / 100) * circumference;

    // Framer motion list variants
    const listVariants = {
        hidden: { opacity: 0 },
        show: {
            opacity: 1,
            transition: {
                staggerChildren: 0.05
            }
        }
    };

    const itemVariants = {
        hidden: { opacity: 0, y: 15 },
        show: { opacity: 1, y: 0, transition: { type: 'spring' as const, stiffness: 300, damping: 24 } }
    };

    return (
        <div className="min-h-screen bg-black text-white pb-24 relative overflow-hidden">
            {/* Ambient Background Glow */}
            <div className="fixed inset-0 pointer-events-none z-0 overflow-hidden">
                <div className="absolute top-[-10%] left-[20%] w-[600px] h-[600px] rounded-full bg-emerald-500/[0.03] blur-[120px] mix-blend-screen" />
                <div className="absolute bottom-[-10%] right-[10%] w-[500px] h-[500px] rounded-full bg-emerald-600/[0.02] blur-[100px] mix-blend-screen" />
            </div>

            {/* Header */}
            <div className="sticky top-0 z-30 bg-black/80 backdrop-blur-xl border-b border-white/5 relative z-10">
                <div className="max-w-2xl mx-auto px-4 py-5">
                    <div className="flex items-center justify-between mb-5">
                        <div className="flex items-center gap-3.5">
                            <Link href="/" className="text-white/40 hover:text-white transition-colors p-1 hover:bg-white/5 rounded-lg">
                                <ArrowLeft className="w-5 h-5" />
                            </Link>
                            <div>
                                <h1 className="text-2xl font-serif italic tracking-tight text-white/95">Grand Aspirations</h1>
                                <p className="text-[9px] tracking-[0.25em] uppercase text-white/30 font-mono mt-0.5">
                                    {activeTab === 'BUCKET_LIFE' ? '[ LIFETIME HORIZON ]' : `[ ${currentYear} ASCENT ]`}
                                </p>
                            </div>
                        </div>
                        <div className="text-white/20 text-xs font-mono select-none">GYRAL</div>
                    </div>

                    {/* Sliding Tab Switcher */}
                    <div className="relative flex p-1 bg-white/[0.03] border border-white/5 rounded-xl backdrop-blur-md">
                        <button
                            onClick={() => {
                                setActiveTab('BUCKET_LIFE');
                                setExpandedId(null);
                            }}
                            className={`relative flex-1 flex items-center justify-center gap-2 py-3 rounded-xl text-xs font-semibold tracking-wide transition-all z-10 ${
                                activeTab === 'BUCKET_LIFE' ? 'text-white' : 'text-white/40 hover:text-white/60'
                            }`}
                        >
                            {activeTab === 'BUCKET_LIFE' && (
                                <motion.div
                                    layoutId="activeTabGlow"
                                    className="absolute inset-0 bg-white/[0.04] border border-white/10 rounded-xl shadow-[0_0_15px_rgba(255,255,255,0.02)]"
                                    transition={{ type: "spring", stiffness: 350, damping: 30 }}
                                />
                            )}
                            <Infinity className="w-3.5 h-3.5 relative z-20" />
                            <span className="relative z-20">Lifetime Horizon</span>
                        </button>
                        <button
                            onClick={() => {
                                setActiveTab('BUCKET_YEAR');
                                setExpandedId(null);
                            }}
                            className={`relative flex-1 flex items-center justify-center gap-2 py-3 rounded-xl text-xs font-semibold tracking-wide transition-all z-10 ${
                                activeTab === 'BUCKET_YEAR' ? 'text-white' : 'text-white/40 hover:text-white/60'
                            }`}
                        >
                            {activeTab === 'BUCKET_YEAR' && (
                                <motion.div
                                    layoutId="activeTabGlow"
                                    className="absolute inset-0 bg-white/[0.04] border border-white/10 rounded-xl shadow-[0_0_15px_rgba(255,255,255,0.02)]"
                                    transition={{ type: "spring", stiffness: 350, damping: 30 }}
                                />
                            )}
                            <CalendarClock className="w-3.5 h-3.5 relative z-20" />
                            <span className="relative z-20">{currentYear} Ascent</span>
                        </button>
                    </div>
                </div>
            </div>

            <div className="max-w-2xl mx-auto px-4 pt-6 space-y-6 relative z-10">

                {/* Progress Circle & Dashboard metrics */}
                {allItems.length > 0 && (
                    <div className="flex items-center gap-5 p-5 rounded-2xl bg-white/[0.02] border border-white/5 backdrop-blur-md relative overflow-hidden group">
                        <div className="absolute inset-0 bg-gradient-to-r from-emerald-500/0 via-emerald-500/[0.01] to-emerald-500/0 opacity-0 group-hover:opacity-100 transition-opacity duration-700 pointer-events-none" />
                        
                        <div className="relative w-16 h-16 flex-shrink-0 flex items-center justify-center">
                            <svg className="w-full h-full transform -rotate-90">
                                <circle
                                    cx={size / 2}
                                    cy={size / 2}
                                    r={radius}
                                    className="stroke-white/[0.03]"
                                    strokeWidth={strokeWidth}
                                    fill="transparent"
                                />
                                <motion.circle
                                    cx={size / 2}
                                    cy={size / 2}
                                    r={radius}
                                    className="stroke-emerald-400"
                                    strokeWidth={strokeWidth}
                                    fill="transparent"
                                    strokeDasharray={circumference}
                                    initial={{ strokeDashoffset: circumference }}
                                    animate={{ strokeDashoffset: offset }}
                                    transition={{ duration: 1, ease: 'easeOut' }}
                                    strokeLinecap="round"
                                    style={{
                                        filter: 'drop-shadow(0 0 4px rgba(52, 211, 153, 0.4))'
                                    }}
                                />
                            </svg>
                            <span className="absolute text-xs font-mono font-bold text-white/80">{progress}%</span>
                        </div>

                        <div className="flex-1 min-w-0">
                            <p className="text-[9px] font-mono tracking-[0.2em] uppercase text-white/30">Completion Ratio</p>
                            <h2 className="text-sm font-semibold text-white/80 mt-0.5">
                                {completedItems.length} of {allItems.length} Aspirations Conquered
                            </h2>
                            <p className="text-xs text-white/40 font-serif italic mt-1 leading-relaxed">
                                "{getMotivationalMessage(progress)}"
                            </p>
                        </div>
                    </div>
                )}

                {/* Empty State */}
                {allItems.length === 0 && !isAdding && (
                    <div className="flex flex-col items-center justify-center py-24 text-center rounded-2xl border border-dashed border-white/5 bg-white/[0.01] px-6">
                        <div className="w-14 h-14 rounded-full bg-white/[0.02] border border-white/5 flex items-center justify-center mb-5 text-white/20">
                            {activeTab === 'BUCKET_LIFE' ? (
                                <Infinity className="w-6 h-6 text-white/30" />
                            ) : (
                                <CalendarClock className="w-6 h-6 text-white/30" />
                            )}
                        </div>
                        <p className="text-white/60 font-serif italic text-lg mb-2">
                            {activeTab === 'BUCKET_LIFE'
                                ? 'What dreams whisper to you in quiet moments?'
                                : `What triumphs will define your ${currentYear}?`}
                        </p>
                        <p className="text-white/20 text-xs font-mono uppercase tracking-widest max-w-sm leading-relaxed">
                            No aspirations forged yet. Initiate below.
                        </p>
                    </div>
                )}

                {/* Add Form / Trigger */}
                <div className="space-y-4">
                    <AnimatePresence mode="popLayout">
                        {isAdding ? (
                            <motion.form
                                initial={{ opacity: 0, y: -15, scale: 0.98 }}
                                animate={{ opacity: 1, y: 0, scale: 1 }}
                                exit={{ opacity: 0, y: -15, scale: 0.98 }}
                                transition={{ duration: 0.25, ease: 'easeOut' }}
                                onSubmit={handleAdd}
                                className="p-5 rounded-2xl bg-white/[0.02] border border-white/10 backdrop-blur-xl shadow-2xl space-y-4 relative overflow-hidden"
                            >
                                <div className="absolute top-0 left-0 w-full h-[1.5px] bg-gradient-to-r from-emerald-500/0 via-emerald-500/40 to-emerald-500/0" />
                                
                                <div className="flex justify-between items-center">
                                    <h3 className="text-[10px] font-mono uppercase tracking-[0.2em] text-white/50 flex items-center gap-2">
                                        <Sparkles className="w-3.5 h-3.5 text-emerald-400" />
                                        Forge New Aspiration
                                    </h3>
                                    <button
                                        type="button"
                                        onClick={() => { setIsAdding(false); setNewTitle(''); setNewNotes(''); }}
                                        className="text-white/20 hover:text-white/65 transition-colors p-1"
                                    >
                                        <X className="w-4 h-4" />
                                    </button>
                                </div>

                                <div className="space-y-3.5">
                                    <div>
                                        <label className="text-[9px] font-mono uppercase tracking-[0.2em] text-white/30 block mb-1">Aspiration Title</label>
                                        <input
                                            type="text"
                                            value={newTitle}
                                            onChange={(e) => setNewTitle(e.target.value)}
                                            placeholder={
                                                activeTab === 'BUCKET_LIFE'
                                                    ? 'e.g. Visit Kyoto in Autumn, Learn skydiving...'
                                                    : `e.g. Complete a marathon, Publish a web app...`
                                            }
                                            className="w-full bg-white/[0.02] border border-white/5 rounded-xl px-3.5 py-2.5 text-xs md:text-sm text-white placeholder:text-white/25 focus:outline-none focus:border-emerald-500/40 transition-colors"
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
                                                className="w-full bg-white/[0.02] border border-white/5 rounded-xl px-3.5 py-2.5 text-xs text-white focus:outline-none focus:border-emerald-500/40 transition-colors"
                                                required
                                            />
                                        </div>
                                        <div>
                                            <label className="text-[9px] font-mono uppercase tracking-[0.2em] text-white/30 block mb-1">Horizon Type</label>
                                            <div className="flex gap-2 items-center text-xs text-white/40 h-[40px] px-1 font-mono text-[10px] tracking-wider uppercase">
                                                <Compass className="w-3.5 h-3.5 text-white/25" />
                                                {activeTab === 'BUCKET_LIFE' ? 'Lifetime Pursuit' : `${currentYear} Ascent`}
                                            </div>
                                        </div>
                                    </div>

                                    <div>
                                        <label className="text-[9px] font-mono uppercase tracking-[0.2em] text-white/30 block mb-1">Motivation & Notes (Optional)</label>
                                        <textarea
                                            value={newNotes}
                                            onChange={(e) => setNewNotes(e.target.value)}
                                            placeholder="Detail what achievements will look like..."
                                            rows={3}
                                            className="w-full bg-white/[0.02] border border-white/5 rounded-xl px-3.5 py-2.5 text-xs text-white placeholder:text-white/25 focus:outline-none focus:border-emerald-500/40 transition-colors resize-none"
                                        />
                                    </div>
                                </div>

                                {errorMsg && (
                                     <div className="text-xs text-red-400 font-mono bg-red-950/25 border border-red-500/10 px-3.5 py-2.5 rounded-xl shadow-[0_0_15px_rgba(239,68,68,0.05)]">
                                         {errorMsg}
                                     </div>
                                 )}

                                <div className="flex justify-end gap-2 pt-1">
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
                                        className="px-4 py-2 rounded-xl text-[10px] uppercase font-mono tracking-wider bg-emerald-500 text-black font-bold hover:bg-emerald-400 disabled:opacity-20 disabled:hover:bg-emerald-500 disabled:cursor-not-allowed transition-all shadow-[0_0_15px_rgba(52,211,153,0.2)] hover:shadow-[0_0_20px_rgba(52,211,153,0.4)]"
                                    >
                                        {isSubmitting ? 'Forging...' : 'Forge Aspiration'}
                                    </button>
                                </div>
                            </motion.form>
                        ) : (
                            <motion.button
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                onClick={() => setIsAdding(true)}
                                className="w-full flex items-center justify-center gap-2.5 py-3.5 rounded-2xl border border-dashed border-white/10 hover:border-emerald-500/30 hover:bg-emerald-500/[0.01] transition-all group duration-300 cursor-pointer"
                            >
                                <Plus className="w-4 h-4 text-white/30 group-hover:text-emerald-400 transition-colors group-hover:rotate-90 duration-300" />
                                <span className="text-xs font-mono tracking-widest uppercase text-white/30 group-hover:text-emerald-400/80 transition-colors">
                                    Add New {activeTab === 'BUCKET_LIFE' ? 'Lifetime Horizon' : `${currentYear} Ascent`}
                                </span>
                            </motion.button>
                        )}
                    </AnimatePresence>
                </div>

                {/* Pending Items List */}
                <motion.div 
                    variants={listVariants}
                    initial="hidden"
                    animate="show"
                    className="space-y-3"
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
                                    exit={{ opacity: 0, scale: 0.95, y: -10 }}
                                    className={`rounded-2xl border backdrop-blur-md transition-all duration-300 ${
                                        isExpanded
                                            ? 'bg-white/[0.03] border-white/15 shadow-[0_4px_25px_rgba(0,0,0,0.6)]'
                                            : 'bg-white/[0.01] hover:bg-white/[0.025] border-white/5 hover:border-white/15'
                                    }`}
                                >
                                    {/* Card Header clickable area */}
                                    <div 
                                        onClick={() => startEditing(item)}
                                        className="flex items-start gap-4 p-4 cursor-pointer"
                                    >
                                        {/* Tactile Checkbox */}
                                        <div className="mt-1 flex-shrink-0 flex items-center justify-center">
                                            <div
                                                role="button"
                                                onClick={(e) => {
                                                    e.stopPropagation();
                                                    toggleDone(item.id, item.description);
                                                }}
                                                className={`rounded-[3px] border transition-all flex items-center justify-center cursor-pointer ${
                                                    isCompleted 
                                                        ? 'bg-emerald-400 border-emerald-300 shadow-[0_0_8px_rgba(52,211,153,0.3)] text-black' 
                                                        : 'border-white/20 hover:border-emerald-400/50 hover:bg-emerald-400/5'
                                                }`}
                                                style={{
                                                    width: '14px',
                                                    height: '14px',
                                                    minWidth: '14px',
                                                    minHeight: '14px',
                                                    maxWidth: '14px',
                                                    maxHeight: '14px',
                                                }}
                                            >
                                                {isCompleted && <Check className="w-2.5 h-2.5 stroke-[3.5] text-black" />}
                                            </div>
                                        </div>

                                        {/* Title & Date preview */}
                                        <div className="flex-1 min-w-0">
                                            <h3 className={`text-sm font-medium tracking-wide transition-all ${
                                                isCompleted ? 'text-white/40 line-through' : 'text-white/90'
                                            }`}>
                                                {item.title}
                                            </h3>
                                            
                                            {/* Notes preview snippet */}
                                            {!isExpanded && notes && (
                                                <p className="text-xs text-white/35 mt-1 line-clamp-1 italic font-light">
                                                    {notes}
                                                </p>
                                            )}

                                            {/* Badges */}
                                            <div className="flex items-center gap-2 mt-2 select-none">
                                                <span className="inline-flex items-center gap-1 text-[9px] font-mono text-white/25 uppercase tracking-wider">
                                                    <Calendar className="w-3 h-3 text-white/20" />
                                                    {item.event_date ? formatDateStr(item.event_date) : 'No Target Date'}
                                                </span>
                                                {notes && (
                                                    <span className="w-0.5 h-0.5 rounded-full bg-white/10" />
                                                )}
                                                {notes && (
                                                    <span className="text-[9px] font-mono text-white/25 uppercase tracking-wider">
                                                        Notes
                                                    </span>
                                                )}
                                            </div>
                                        </div>

                                        {/* Row Quick Action Buttons */}
                                        <div className="flex items-center gap-1 flex-shrink-0">
                                            <button
                                                type="button"
                                                onClick={(e) => {
                                                    e.stopPropagation();
                                                    startEditing(item);
                                                }}
                                                className="text-white/20 hover:text-white/50 transition-colors p-1"
                                                title="Edit notes & target date"
                                            >
                                                <Edit3 className="w-3.5 h-3.5" />
                                            </button>
                                            <button
                                                type="button"
                                                onClick={(e) => {
                                                    e.stopPropagation();
                                                    handleDelete(item.id);
                                                }}
                                                className="text-white/15 hover:text-red-400/80 transition-colors p-1"
                                                title="Abandon aspiration"
                                            >
                                                <Trash2 className="w-3.5 h-3.5" />
                                            </button>
                                        </div>
                                    </div>

                                    {/* Detail Panel */}
                                    <AnimatePresence>
                                        {isExpanded && (
                                            <motion.div
                                                initial={{ height: 0, opacity: 0 }}
                                                animate={{ height: 'auto', opacity: 1 }}
                                                exit={{ height: 0, opacity: 0 }}
                                                transition={{ duration: 0.22, ease: 'easeOut' }}
                                                className="overflow-hidden border-t border-white/5 px-4 pb-4 mt-1 space-y-4"
                                            >
                                                <div className="space-y-3.5 pt-3.5">
                                                    <div>
                                                        <label className="text-[9px] font-mono uppercase tracking-[0.2em] text-white/30 block mb-1">Aspiration Title</label>
                                                        <input 
                                                            type="text"
                                                            value={editTitle}
                                                            onChange={(e) => setEditTitle(e.target.value)}
                                                            className="w-full bg-white/[0.02] border border-white/5 rounded-lg px-3 py-2 text-xs md:text-sm text-white focus:outline-none focus:border-emerald-500/40 transition-colors"
                                                        />
                                                    </div>
                                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                                                        <div>
                                                            <label className="text-[9px] font-mono uppercase tracking-[0.2em] text-white/30 block mb-1">Target Date</label>
                                                            <input 
                                                                type="date"
                                                                value={editDate}
                                                                onChange={(e) => setEditDate(e.target.value)}
                                                                className="w-full bg-white/[0.02] border border-white/5 rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-emerald-500/40 transition-colors"
                                                            />
                                                        </div>
                                                        <div>
                                                            <label className="text-[9px] font-mono uppercase tracking-[0.2em] text-white/30 block mb-1">Horizon Range</label>
                                                            <div className="flex gap-2 items-center text-xs text-white/40 h-[34px] px-1 font-mono text-[9px] tracking-wider uppercase">
                                                                <Compass className="w-3.5 h-3.5 text-emerald-400/50" />
                                                                <span>{activeTab === 'BUCKET_LIFE' ? 'Lifetime Horizon' : `${currentYear} Horizon`}</span>
                                                            </div>
                                                        </div>
                                                    </div>
                                                    <div>
                                                        <label className="text-[9px] font-mono uppercase tracking-[0.2em] text-white/30 block mb-1">Motivation Notes</label>
                                                        <textarea 
                                                            value={editNotes}
                                                            onChange={(e) => setEditNotes(e.target.value)}
                                                            placeholder="Detail the steps, locations, or feelings attached to this aspiration..."
                                                            rows={3}
                                                            className="w-full bg-white/[0.02] border border-white/5 rounded-lg px-3 py-2 text-xs text-white placeholder:text-white/20 focus:outline-none focus:border-emerald-500/40 transition-colors resize-none"
                                                        />
                                                    </div>
                                                    <div className="flex justify-end gap-2 pt-1">
                                                        <button
                                                            type="button"
                                                            onClick={() => setExpandedId(null)}
                                                            className="px-3 py-1.5 rounded-lg text-[10px] uppercase font-mono tracking-wider text-white/40 hover:text-white/65 hover:bg-white/5 transition-colors"
                                                        >
                                                            Cancel
                                                        </button>
                                                        <button
                                                            type="button"
                                                            onClick={() => {
                                                                handleUpdateItem(item.id, editTitle, editNotes, editDate, isCompleted);
                                                                setExpandedId(null);
                                                            }}
                                                            className="px-3 py-1.5 rounded-lg text-[10px] uppercase font-mono tracking-wider bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 hover:bg-emerald-500/25 transition-colors flex items-center gap-1.5 shadow-[0_0_10px_rgba(16,185,129,0.03)]"
                                                        >
                                                            <Save className="w-3 h-3" />
                                                            Save Changes
                                                        </button>
                                                    </div>
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
                    <div className="pt-6 border-t border-white/5">
                        <button
                            onClick={() => setShowCompleted(!showCompleted)}
                            className="flex items-center gap-2 text-white/30 hover:text-white/55 transition-colors mb-4 group cursor-pointer"
                        >
                            <ChevronDown className={`w-3.5 h-3.5 transition-transform duration-300 ${showCompleted ? 'rotate-0' : '-rotate-90'}`} />
                            <span className="text-[10px] font-mono tracking-[0.2em] uppercase">
                                Conquered Aspirations ({completedItems.length})
                            </span>
                            <Trophy className="w-3.5 h-3.5 text-emerald-400/40 group-hover:text-emerald-400 transition-colors" />
                        </button>

                        <AnimatePresence>
                            {showCompleted && (
                                <motion.div
                                    initial={{ opacity: 0, height: 0 }}
                                    animate={{ opacity: 1, height: 'auto' }}
                                    exit={{ opacity: 0, height: 0 }}
                                    transition={{ duration: 0.25, ease: 'easeInOut' }}
                                    className="space-y-3 overflow-hidden"
                                >
                                    {completedItems.map((item) => {
                                        const { notes } = parseItem(item);
                                        return (
                                            <motion.div
                                                key={item.id}
                                                layout
                                                initial={{ opacity: 0 }}
                                                animate={{ opacity: 1 }}
                                                className="group flex items-start gap-4 py-3.5 px-4 rounded-xl bg-emerald-500/[0.01] border border-emerald-500/10 hover:border-emerald-500/20 hover:bg-emerald-500/[0.02] transition-all"
                                            >
                                                {/* Checkbox completed */}
                                                <div className="mt-1 flex-shrink-0 flex items-center justify-center">
                                                    <div
                                                        role="button"
                                                        onClick={() => toggleDone(item.id, item.description)}
                                                        className="rounded-[3px] bg-emerald-500/10 border border-emerald-500/40 flex items-center justify-center cursor-pointer transition-all hover:bg-emerald-500/20"
                                                        style={{
                                                            width: '14px',
                                                            height: '14px',
                                                            minWidth: '14px',
                                                            minHeight: '14px',
                                                            maxWidth: '14px',
                                                            maxHeight: '14px',
                                                        }}
                                                    >
                                                        <Check className="w-2.5 h-2.5 text-emerald-400 stroke-[3.5]" />
                                                    </div>
                                                </div>

                                                {/* Content */}
                                                <div className="flex-1 min-w-0">
                                                    <h4 className="text-sm font-medium text-white/40 line-through leading-relaxed">
                                                        {item.title}
                                                    </h4>
                                                    {notes && (
                                                        <p className="text-xs text-white/20 italic mt-0.5 font-light line-through">
                                                            {notes}
                                                        </p>
                                                    )}
                                                    <div className="flex items-center gap-1.5 mt-1 text-[9px] font-mono text-emerald-500/30 uppercase tracking-wider select-none">
                                                        <Sparkles className="w-3 h-3" />
                                                        <span>Conquered</span>
                                                        {item.event_date && (
                                                            <>
                                                                <span className="w-0.5 h-0.5 rounded-full bg-emerald-500/10" />
                                                                <span>{formatDateStr(item.event_date)}</span>
                                                            </>
                                        )}
                                    </div>
                                </div>

                                                {/* Delete */}
                                                <button
                                                    onClick={() => handleDelete(item.id)}
                                                    className="flex-shrink-0 opacity-0 group-hover:opacity-100 transition-opacity text-white/20 hover:text-red-400 p-1"
                                                >
                                                    <Trash2 className="w-3.5 h-3.5" />
                                                </button>
                                            </motion.div>
                                        );
                                    })}
                                </motion.div>
                            )}
                        </AnimatePresence>
                    </div>
                )}

                {/* Footer Quote */}
                <div className="pt-12 pb-4 text-center">
                    <p className="font-serif italic text-[13px] text-white/15 tracking-wide leading-relaxed max-w-sm mx-auto">
                        {activeTab === 'BUCKET_LIFE'
                            ? '"The purpose of life is to live it, to taste experience to the utmost, to reach out eagerly and without fear for newer and richer experience."'
                            : `"Make ${currentYear} the year you didn't just exist — you lived."`}
                    </p>
                </div>
            </div>
        </div>
    );
}
