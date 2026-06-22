"use client";

import React, { useMemo } from 'react';
import { useUserData } from '@/context/user-data-context';
import { Flag, Target, Trophy, Sparkles, Infinity, CalendarClock, ArrowLeft, Download, CheckCircle2, Circle } from 'lucide-react';
import { motion } from 'framer-motion';
import { format, parseISO } from 'date-fns';
import Link from 'next/link';
import { downloadAestheticCard } from '@/utils/download-card';

type BucketTab = 'BUCKET_LIFE' | 'BUCKET_YEAR';

export default function GoalsPage() {
    const { lifeEvents, theme } = useUserData();
    const [isDownloading, setIsDownloading] = React.useState(false);

    // Filter bucket list items
    const bucketItems = useMemo(() => {
        return lifeEvents.filter(e => e.type === 'BUCKET_LIFE' || e.type === 'BUCKET_YEAR');
    }, [lifeEvents]);

    const lifeItems = useMemo(() => {
        return bucketItems.filter(e => e.type === 'BUCKET_LIFE');
    }, [bucketItems]);

    const yearItems = useMemo(() => {
        return bucketItems.filter(e => e.type === 'BUCKET_YEAR');
    }, [bucketItems]);

    const parseItem = (item: any) => {
        const desc = item.description || '';
        const isCompleted = desc.includes('[DONE]');
        const notes = desc.replace('[DONE]', '').trim();
        return { isCompleted, notes };
    };

    const completedLife = lifeItems.filter(item => parseItem(item).isCompleted);
    const completedYear = yearItems.filter(item => parseItem(item).isCompleted);
    const completedAll = bucketItems.filter(item => parseItem(item).isCompleted);

    const lifeProgress = lifeItems.length === 0 ? 0 : Math.round((completedLife.length / lifeItems.length) * 100);
    const yearProgress = yearItems.length === 0 ? 0 : Math.round((completedYear.length / yearItems.length) * 100);
    const overallProgress = bucketItems.length === 0 ? 0 : Math.round((completedAll.length / bucketItems.length) * 100);

    const pendingAll = useMemo(() => {
        return bucketItems.filter(item => !parseItem(item).isCompleted);
    }, [bucketItems]);

    const isLight = theme === 'light';

    return (
        <div className={`min-h-screen pt-24 pb-20 px-4 md:px-8 max-w-7xl mx-auto transition-colors duration-500 ${isLight ? 'text-zinc-900 bg-zinc-50' : 'text-white bg-black'}`}>
            
            {/* Header Section */}
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-12 gap-6 relative z-10">
                <div className="relative">
                    <div className="absolute -inset-1 bg-gradient-to-r from-blue-600 to-indigo-600 rounded-lg blur opacity-20" />
                    <h1 className="text-4xl md:text-5xl font-black tracking-tight flex items-center gap-4 relative">
                        <Link href="/bucket-list" className="text-zinc-500 hover:text-white transition-colors p-1 rounded-lg">
                            <ArrowLeft className="w-8 h-8" />
                        </Link>
                        <Target className="w-10 h-10 text-blue-500" />
                        Aspiration Analytics
                    </h1>
                    <p className={`mt-2 ${isLight ? 'text-zinc-500' : 'text-zinc-400'} font-medium`}>
                        Read-only detailed analysis and review of your Lifetime and Yearly bucket lists.
                    </p>
                </div>

                {pendingAll.length > 0 && (
                    <button
                        onClick={async () => {
                            setIsDownloading(true);
                            await downloadAestheticCard(pendingAll, 'goals', 'gyral-active-aspirations');
                            setIsDownloading(false);
                        }}
                        disabled={isDownloading}
                        className={`flex items-center gap-2 px-6 py-3 rounded-full font-bold transition-all border ${isLight ? 'bg-white border-zinc-200 hover:bg-zinc-50 text-black shadow-lg' : 'bg-zinc-900/50 border-white/10 hover:bg-white/5 text-white'} ${isDownloading ? 'opacity-50 cursor-wait' : ''}`}
                    >
                        <Download className={`w-4 h-4 ${isDownloading ? 'animate-bounce text-blue-500' : ''}`} />
                        {isDownloading ? 'Forging card...' : 'Download Aspirations'}
                    </button>
                )}
            </div>

            {/* Dashboard Stats */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
                
                {/* Overall Stats Card */}
                <div className={`p-6 rounded-3xl ${isLight ? 'bg-white shadow-xl shadow-zinc-200' : 'bg-zinc-900/50 border border-white/5'} flex items-center gap-4 relative overflow-hidden group`}>
                    <div className="absolute -right-4 -top-4 w-24 h-24 bg-blue-500/10 rounded-full blur-xl group-hover:bg-blue-500/20 transition-colors" />
                    <div className="w-14 h-14 rounded-2xl bg-blue-500/10 flex items-center justify-center border border-blue-500/20 text-blue-500">
                        <Flag className="w-7 h-7" />
                    </div>
                    <div>
                        <p className={`text-sm font-bold ${isLight ? 'text-zinc-500' : 'text-zinc-400'} uppercase tracking-wider`}>Total Intentions</p>
                        <p className="text-3xl font-black">{bucketItems.length}</p>
                        <p className="text-[10px] font-mono text-zinc-500 uppercase mt-0.5">
                            {lifeItems.length} Life • {yearItems.length} Year
                        </p>
                    </div>
                </div>
                
                {/* Conquered Link Card */}
                <Link href="/achievements" className={`p-6 rounded-3xl ${isLight ? 'bg-white shadow-xl shadow-zinc-200 hover:shadow-emerald-200' : 'bg-zinc-900/50 border border-white/5 hover:border-emerald-500/30 hover:bg-zinc-900/80'} flex items-center justify-between relative overflow-hidden group transition-all duration-300`}>
                    <div className="absolute -right-4 -top-4 w-24 h-24 bg-emerald-500/10 rounded-full blur-xl group-hover:bg-emerald-500/20 transition-colors" />
                    <div className="flex items-center gap-4 relative z-10">
                        <div className="w-14 h-14 rounded-2xl bg-emerald-500/10 flex items-center justify-center border border-emerald-500/20 text-emerald-500 group-hover:scale-110 transition-transform">
                            <Trophy className="w-7 h-7" />
                        </div>
                        <div>
                            <p className={`text-sm font-bold ${isLight ? 'text-zinc-500' : 'text-zinc-400'} uppercase tracking-wider`}>Conquered</p>
                            <p className="text-3xl font-black">{completedAll.length}</p>
                            <p className="text-[10px] font-mono text-zinc-500 uppercase mt-0.5">
                                View Legends Gallery
                            </p>
                        </div>
                    </div>
                    <ArrowLeft className="w-6 h-6 text-emerald-500 rotate-180 opacity-50 group-hover:opacity-100 group-hover:translate-x-1 transition-all relative z-10" />
                </Link>

                {/* Overall Progress Rate */}
                <div className={`p-6 rounded-3xl ${isLight ? 'bg-white shadow-xl shadow-zinc-200' : 'bg-zinc-900/50 border border-white/5'} flex flex-col justify-center relative overflow-hidden group`}>
                    <div className="absolute -right-4 -top-4 w-24 h-24 bg-indigo-500/10 rounded-full blur-xl group-hover:bg-indigo-500/20 transition-colors" />
                    <div className="flex justify-between items-end mb-2">
                        <p className={`text-sm font-bold ${isLight ? 'text-zinc-500' : 'text-zinc-400'} uppercase tracking-wider`}>Overall Progress</p>
                        <p className="text-2xl font-black text-indigo-500">{overallProgress}%</p>
                    </div>
                    <div className="w-full h-3 bg-zinc-800/50 rounded-full overflow-hidden border border-white/5">
                        <motion.div 
                            initial={{ width: 0 }}
                            animate={{ width: `${overallProgress}%` }}
                            transition={{ duration: 1, ease: "easeOut" }}
                            className="h-full bg-gradient-to-r from-blue-500 to-indigo-500"
                        />
                    </div>
                </div>
            </div>

            {/* Split Horizons Detail Analysis */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 relative z-10">
                
                {/* 1. LIFETIME HORIZONS */}
                <div className="space-y-6">
                    <div className={`p-6 rounded-3xl ${isLight ? 'bg-white shadow-lg' : 'bg-zinc-900/40 border border-white/5'} relative overflow-hidden`}>
                        <div className="flex justify-between items-center mb-4">
                            <h2 className="text-xl font-bold flex items-center gap-2">
                                <Infinity className="w-5 h-5 text-indigo-400" />
                                Lifetime Horizons
                            </h2>
                            <span className="text-xs font-mono font-bold px-2.5 py-1 rounded-md bg-indigo-500/10 text-indigo-400">
                                {completedLife.length}/{lifeItems.length} Conquered ({lifeProgress}%)
                            </span>
                        </div>
                        <div className="w-full h-2 bg-zinc-800/50 rounded-full overflow-hidden">
                            <div className="h-full bg-indigo-500" style={{ width: `${lifeProgress}%` }} />
                        </div>
                    </div>

                    <div className="space-y-3.5">
                        {lifeItems.length === 0 ? (
                            <div className={`p-8 text-center rounded-3xl border border-dashed ${isLight ? 'border-zinc-300 text-zinc-500' : 'border-zinc-800 text-zinc-500'}`}>
                                <Infinity className="w-10 h-10 mx-auto mb-3 opacity-30" />
                                <p className="text-xs font-mono uppercase tracking-wider">No lifetime aspirations logged</p>
                            </div>
                        ) : (
                            lifeItems.map(item => (
                                <ReadOnlyEventCard key={item.id} item={item} parseItem={parseItem} isLight={isLight} isLife={true} />
                            ))
                        )}
                    </div>
                </div>

                {/* 2. YEARLY HORIZONS */}
                <div className="space-y-6">
                    <div className={`p-6 rounded-3xl ${isLight ? 'bg-white shadow-lg' : 'bg-zinc-900/40 border border-white/5'} relative overflow-hidden`}>
                        <div className="flex justify-between items-center mb-4">
                            <h2 className="text-xl font-bold flex items-center gap-2">
                                <CalendarClock className="w-5 h-5 text-emerald-400" />
                                Yearly Horizons
                            </h2>
                            <span className="text-xs font-mono font-bold px-2.5 py-1 rounded-md bg-emerald-500/10 text-emerald-400">
                                {completedYear.length}/{yearItems.length} Conquered ({yearProgress}%)
                            </span>
                        </div>
                        <div className="w-full h-2 bg-zinc-800/50 rounded-full overflow-hidden">
                            <div className="h-full bg-emerald-500" style={{ width: `${yearProgress}%` }} />
                        </div>
                    </div>

                    <div className="space-y-3.5">
                        {yearItems.length === 0 ? (
                            <div className={`p-8 text-center rounded-3xl border border-dashed ${isLight ? 'border-zinc-300 text-zinc-500' : 'border-zinc-800 text-zinc-500'}`}>
                                <CalendarClock className="w-10 h-10 mx-auto mb-3 opacity-30" />
                                <p className="text-xs font-mono uppercase tracking-wider">No yearly aspirations logged</p>
                            </div>
                        ) : (
                            yearItems.map(item => (
                                <ReadOnlyEventCard key={item.id} item={item} parseItem={parseItem} isLight={isLight} isLife={false} />
                            ))
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}

function ReadOnlyEventCard({ item, parseItem, isLight, isLife }: { item: any, parseItem: any, isLight: boolean, isLife: boolean }) {
    const { isCompleted, notes } = parseItem(item);

    return (
        <div 
            className={`p-5 rounded-2xl border transition-all duration-300 relative group overflow-hidden ${
                isCompleted 
                    ? isLight ? 'bg-emerald-50/50 border-emerald-100' : 'bg-emerald-950/5 border-emerald-500/10' 
                    : isLight ? 'bg-white border-zinc-200 shadow-sm' : 'bg-zinc-900/30 border-white/5'
            }`}
        >
            <div className="flex items-start gap-4">
                <div className="mt-0.5 flex-shrink-0">
                    {isCompleted ? (
                        <CheckCircle2 className={`w-5 h-5 ${isLight ? 'text-emerald-600' : 'text-emerald-500'}`} />
                    ) : (
                        <Circle className={`w-5 h-5 ${isLight ? 'text-zinc-300' : 'text-zinc-700'}`} />
                    )}
                </div>
                
                <div className="flex-1 min-w-0">
                    <h3 className={`text-base font-bold transition-all ${isCompleted ? 'text-zinc-500 line-through opacity-75' : ''}`}>
                        {item.title}
                    </h3>
                    
                    {notes && (
                        <p className={`text-xs mt-1.5 font-serif italic ${isLight ? 'text-zinc-600' : 'text-zinc-400'} ${isCompleted ? 'opacity-50' : ''}`}>
                            {notes}
                        </p>
                    )}
                    
                    <div className="flex items-center gap-2 mt-3 select-none">
                        <span className={`inline-flex items-center gap-1 text-[9px] font-mono font-bold px-2 py-0.5 rounded ${
                            isLife 
                                ? 'bg-indigo-500/10 text-indigo-400'
                                : 'bg-emerald-500/10 text-emerald-400'
                        }`}>
                            {isLife ? 'Lifetime' : 'Yearly'}
                        </span>
                        
                        <span className={`inline-flex items-center gap-1 text-[9px] font-mono px-2 py-0.5 rounded bg-white/5 text-zinc-500`}>
                            {isCompleted ? 'Conquered' : 'Active Pursuit'}
                        </span>
                    </div>
                </div>
            </div>
        </div>
    );
}
