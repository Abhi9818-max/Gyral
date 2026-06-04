"use client";

import React, { useMemo } from 'react';
import { useUserData } from '@/context/user-data-context';
import { Trophy, Star, Sparkles, Medal, Calendar, Award } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { format, parseISO } from 'date-fns';

export default function AchievementsPage() {
    const { lifeEvents, theme } = useUserData();
    const isLight = theme === 'light';

    // Filter goals that are marked as [DONE]
    const achievements = useMemo(() => {
        return lifeEvents
            .filter(e => e.type === 'GOAL' && e.description?.includes('[DONE]'))
            .sort((a, b) => new Date(b.event_date).getTime() - new Date(a.event_date).getTime());
    }, [lifeEvents]);

    const containerVariants = {
        hidden: { opacity: 0 },
        show: {
            opacity: 1,
            transition: { staggerChildren: 0.1 }
        }
    };

    const itemVariants = {
        hidden: { opacity: 0, y: 30, scale: 0.9 },
        show: { 
            opacity: 1, 
            y: 0, 
            scale: 1,
            transition: { type: "spring", stiffness: 300, damping: 20 }
        }
    };

    return (
        <div className={`min-h-screen pt-24 pb-20 px-4 md:px-8 max-w-7xl mx-auto transition-colors duration-500 overflow-hidden relative ${isLight ? 'text-zinc-900 bg-zinc-50' : 'text-white bg-black'}`}>
            
            {/* Background glowing orbs */}
            <div className="absolute top-0 left-1/4 w-96 h-96 bg-emerald-500/10 rounded-full blur-[120px] pointer-events-none" />
            <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-amber-500/10 rounded-full blur-[120px] pointer-events-none" />

            <div className="relative z-10 text-center mb-16">
                <motion.div 
                    initial={{ scale: 0, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    transition={{ type: "spring", bounce: 0.5, duration: 0.8 }}
                    className="inline-flex items-center justify-center w-24 h-24 rounded-full bg-gradient-to-br from-amber-400 to-amber-600 shadow-[0_0_40px_rgba(251,191,36,0.4)] mb-6"
                >
                    <Trophy className="w-12 h-12 text-white" />
                </motion.div>
                
                <motion.h1 
                    initial={{ y: 20, opacity: 0 }}
                    animate={{ y: 0, opacity: 1 }}
                    transition={{ delay: 0.2 }}
                    className="text-5xl md:text-7xl font-black tracking-tight mb-4"
                >
                    Hall of <span className="text-transparent bg-clip-text bg-gradient-to-r from-amber-400 to-amber-600">Legends</span>
                </motion.h1>
                
                <motion.p 
                    initial={{ y: 20, opacity: 0 }}
                    animate={{ y: 0, opacity: 1 }}
                    transition={{ delay: 0.3 }}
                    className={`text-lg md:text-xl font-medium max-w-2xl mx-auto ${isLight ? 'text-zinc-500' : 'text-zinc-400'}`}
                >
                    Your triumphs carved in digital stone. Every card here represents a promise kept to yourself.
                </motion.p>
            </div>

            <div className="flex justify-center gap-8 mb-16 relative z-10">
                <motion.div 
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.4 }}
                    className={`px-8 py-4 rounded-3xl ${isLight ? 'bg-white shadow-xl shadow-amber-100 border border-amber-100' : 'bg-zinc-900/40 border border-amber-500/20 shadow-[0_0_30px_rgba(251,191,36,0.1)]'} flex flex-col items-center backdrop-blur-md`}
                >
                    <span className={`text-sm font-bold uppercase tracking-widest ${isLight ? 'text-zinc-400' : 'text-zinc-500'}`}>Total Conquered</span>
                    <span className="text-4xl font-black text-amber-500">{achievements.length}</span>
                </motion.div>
            </div>

            {achievements.length === 0 ? (
                <motion.div 
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.5 }}
                    className={`max-w-2xl mx-auto p-12 text-center rounded-[3rem] border border-dashed ${isLight ? 'border-zinc-300 text-zinc-500 bg-white/50' : 'border-zinc-800 text-zinc-500 bg-zinc-900/20'} backdrop-blur-sm`}
                >
                    <Medal className="w-16 h-16 mx-auto mb-6 opacity-30" />
                    <h3 className="text-2xl font-bold mb-2">The Hall is Empty</h3>
                    <p className="text-lg">Your legacy is yet to be written. Complete a goal to forge your first legend.</p>
                </motion.div>
            ) : (
                <motion.div 
                    variants={containerVariants}
                    initial="hidden"
                    animate="show"
                    className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 relative z-10"
                >
                    <AnimatePresence>
                        {achievements.map((achievement, idx) => {
                            const cleanDescription = achievement.description?.replace('[DONE]', '').trim();
                            const isElite = idx < 3; // First 3 are highlighted
                            
                            return (
                                <motion.div
                                    key={achievement.id}
                                    variants={itemVariants}
                                    whileHover={{ y: -8, scale: 1.02, transition: { duration: 0.2 } }}
                                    className={`relative p-8 rounded-[2.5rem] overflow-hidden group ${
                                        isLight 
                                            ? 'bg-white shadow-xl shadow-zinc-200/50 hover:shadow-amber-200/50 border border-zinc-100' 
                                            : 'bg-zinc-900/60 hover:bg-zinc-800/80 border border-white/5 hover:border-amber-500/30'
                                    } backdrop-blur-xl transition-all duration-300`}
                                >
                                    {/* Shimmer effect */}
                                    <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/5 to-transparent -translate-x-full group-hover:animate-[shimmer_1.5s_infinite] pointer-events-none" />
                                    
                                    {isElite && (
                                        <div className="absolute -right-6 -top-6 w-24 h-24 bg-amber-500/20 rounded-full blur-2xl group-hover:bg-amber-500/30 transition-colors pointer-events-none" />
                                    )}

                                    <div className="flex justify-between items-start mb-6">
                                        <div className={`p-3 rounded-2xl ${isLight ? 'bg-amber-100 text-amber-600' : 'bg-amber-500/10 text-amber-400'}`}>
                                            {isElite ? <Star className="w-6 h-6 fill-amber-500" /> : <Award className="w-6 h-6" />}
                                        </div>
                                        <div className={`text-xs font-bold px-3 py-1.5 rounded-full flex items-center gap-1.5 ${isLight ? 'bg-zinc-100 text-zinc-500' : 'bg-white/5 text-zinc-400'}`}>
                                            <Calendar className="w-3.5 h-3.5" />
                                            {format(parseISO(achievement.event_date), 'MMM d, yyyy')}
                                        </div>
                                    </div>

                                    <h3 className={`text-2xl font-black mb-3 leading-tight ${isLight ? 'text-zinc-800' : 'text-white'}`}>
                                        {achievement.title}
                                    </h3>

                                    {cleanDescription && (
                                        <p className={`text-sm leading-relaxed ${isLight ? 'text-zinc-600' : 'text-zinc-400'}`}>
                                            {cleanDescription}
                                        </p>
                                    )}

                                    <div className="absolute bottom-0 right-0 p-6 opacity-0 group-hover:opacity-100 transition-opacity duration-300 translate-y-4 group-hover:translate-y-0">
                                        <Sparkles className="w-6 h-6 text-amber-500" />
                                    </div>
                                </motion.div>
                            );
                        })}
                    </AnimatePresence>
                </motion.div>
            )}
        </div>
    );
}
