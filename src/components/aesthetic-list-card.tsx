import React from 'react';
import { Trophy, Target, Star, Sparkles, Calendar, MapPin, CheckCircle2, Circle } from 'lucide-react';
import { format, parseISO } from 'date-fns';
import { LifeEvent } from '@/context/user-data-context';

interface AestheticListCardProps {
    id: string;
    title: string;
    items: LifeEvent[];
    isCompleted: boolean;
}

// Render this component absolutely positioned off-screen so the user doesn't see it,
// but it is still in the DOM for html2canvas to capture.
export const AestheticListCard = ({ id, title, items, isCompleted }: AestheticListCardProps) => {
    // Dynamic height based on content
    return (
        <div 
            id={`aesthetic-card-${id}`}
            className="fixed top-[200vh] left-[-200vw] bg-[#09090b] text-white flex flex-col items-center overflow-hidden"
            style={{ width: '800px', minHeight: '1200px', zIndex: -9999, fontFamily: 'sans-serif' }}
        >
            {/* Background elements */}
            <div className="absolute inset-0 bg-gradient-to-br from-black via-zinc-900 to-black z-0" />
            
            {/* Glowing Orbs */}
            <div 
                className="absolute top-[-200px] left-[-200px] w-[800px] h-[800px] rounded-full blur-[120px] z-0"
                style={{ backgroundColor: isCompleted ? 'rgba(245, 158, 11, 0.1)' : 'rgba(59, 130, 246, 0.1)' }}
            />
            <div 
                className="absolute bottom-[-200px] right-[-200px] w-[800px] h-[800px] rounded-full blur-[120px] z-0"
                style={{ backgroundColor: isCompleted ? 'rgba(16, 185, 129, 0.1)' : 'rgba(99, 102, 241, 0.1)' }}
            />

            {/* Grid Pattern */}
            <div className="absolute inset-0 opacity-20 z-0" style={{ backgroundImage: 'radial-gradient(circle at center, #ffffff 1px, transparent 1px)', backgroundSize: '32px 32px' }} />

            {/* Top Section */}
            <div className="w-full flex justify-between items-center p-16 relative z-10">
                <div className="text-2xl font-bold tracking-widest uppercase text-white/50">
                    Gyral
                </div>
                <div className={`px-6 py-3 rounded-full border flex items-center gap-3 font-bold text-lg ${isCompleted ? 'border-amber-500/30 text-amber-500 bg-amber-500/10' : 'border-blue-500/30 text-blue-500 bg-blue-500/10'}`}>
                    {isCompleted ? <Trophy className="w-5 h-5" /> : <Target className="w-5 h-5" />}
                    {isCompleted ? 'LEGENDARY TRIUMPHS' : 'ACTIVE PURSUITS'}
                </div>
            </div>

            {/* Center Content / Header */}
            <div className="w-full px-16 flex flex-col items-center text-center relative z-10 mt-8 mb-16">
                <div className="mb-10 relative">
                    <div className="absolute inset-0 blur-3xl opacity-50" style={{ backgroundColor: isCompleted ? '#f59e0b' : '#3b82f6' }} />
                    <div className={`w-40 h-40 rounded-full flex items-center justify-center relative z-10 ${isCompleted ? 'bg-gradient-to-br from-amber-400 to-amber-600' : 'bg-gradient-to-br from-blue-400 to-blue-600'} shadow-2xl`}>
                        {isCompleted ? <Star className="w-20 h-20 text-white" /> : <MapPin className="w-20 h-20 text-white" />}
                        {isCompleted && <Sparkles className="absolute -top-4 -right-4 w-12 h-12 text-amber-200" />}
                    </div>
                </div>

                <h1 className="text-6xl font-black mb-6 leading-tight tracking-tight text-white drop-shadow-2xl">
                    {title}
                </h1>
                <p className="text-2xl text-zinc-400 font-medium max-w-2xl">
                    {isCompleted ? 'A chronicle of your greatest victories.' : 'The path to your future legacy.'}
                </p>
            </div>

            {/* List of Items */}
            <div className="w-full px-16 flex flex-col gap-6 relative z-10 flex-1 mb-16">
                {items.length === 0 ? (
                    <div className="text-center text-zinc-500 text-xl italic py-12">No pursuits documented yet.</div>
                ) : (
                    items.map((item, index) => (
                        <div key={item.id} className="flex items-start gap-6 bg-zinc-900/60 p-8 rounded-3xl border border-white/5 backdrop-blur-sm relative overflow-hidden">
                            <div className="absolute left-0 top-0 bottom-0 w-2" style={{ backgroundColor: isCompleted ? '#f59e0b' : '#3b82f6', opacity: 0.8 }} />
                            <div className="mt-1">
                                {isCompleted ? (
                                    <CheckCircle2 className="w-8 h-8 text-amber-500" />
                                ) : (
                                    <Circle className="w-8 h-8 text-blue-500" />
                                )}
                            </div>
                            <div className="flex-1">
                                <h3 className="text-3xl font-bold text-white mb-3" style={{ wordBreak: 'break-word' }}>
                                    {item.title}
                                </h3>
                                <div className="flex items-center gap-2 text-zinc-400 font-medium text-lg">
                                    <Calendar className="w-5 h-5" />
                                    {format(parseISO(item.event_date), 'MMMM do, yyyy')}
                                </div>
                            </div>
                        </div>
                    ))
                )}
            </div>

            {/* Bottom Section */}
            <div className="w-full p-16 relative z-10 text-center mt-auto">
                <div className="w-full h-px bg-gradient-to-r from-transparent via-white/20 to-transparent mb-8" />
                <p className="text-zinc-500 font-medium text-lg tracking-widest uppercase">
                    Forged in the Hall of Legends
                </p>
            </div>
            
            {/* Border glow */}
            <div className={`absolute inset-0 border-[6px] pointer-events-none z-20 ${isCompleted ? 'border-amber-500/20' : 'border-blue-500/20'}`} />
        </div>
    );
};
