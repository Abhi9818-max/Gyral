import React from 'react';
import { Trophy, Target, Star, Sparkles, Calendar, MapPin } from 'lucide-react';
import { format, parseISO } from 'date-fns';

interface AestheticCardProps {
    id: string;
    title: string;
    date: string;
    isCompleted: boolean;
}

// Render this component absolutely positioned off-screen so the user doesn't see it,
// but it is still in the DOM for html2canvas to capture.
export const AestheticCard = ({ id, title, date, isCompleted }: AestheticCardProps) => {
    // 9:16 aspect ratio (e.g. 540x960)
    return (
        <div 
            id={`aesthetic-card-${id}`}
            className="fixed top-[200vh] left-[-200vw] bg-[#09090b] text-white flex flex-col items-center justify-between overflow-hidden"
            style={{ width: '540px', height: '960px', zIndex: -9999, fontFamily: 'sans-serif' }}
        >
            {/* Background elements */}
            <div className="absolute inset-0 bg-gradient-to-br from-black via-zinc-900 to-black z-0" />
            
            {/* Glowing Orbs */}
            <div 
                className="absolute top-[-100px] left-[-100px] w-[400px] h-[400px] rounded-full blur-[100px] z-0"
                style={{ backgroundColor: isCompleted ? 'rgba(245, 158, 11, 0.15)' : 'rgba(59, 130, 246, 0.15)' }}
            />
            <div 
                className="absolute bottom-[-100px] right-[-100px] w-[400px] h-[400px] rounded-full blur-[100px] z-0"
                style={{ backgroundColor: isCompleted ? 'rgba(16, 185, 129, 0.15)' : 'rgba(99, 102, 241, 0.15)' }}
            />

            {/* Grid Pattern */}
            <div className="absolute inset-0 opacity-20 z-0" style={{ backgroundImage: 'radial-gradient(circle at center, #ffffff 1px, transparent 1px)', backgroundSize: '24px 24px' }} />

            {/* Top Section */}
            <div className="w-full flex justify-between items-center p-12 relative z-10">
                <div className="text-xl font-bold tracking-widest uppercase text-white/50">
                    Gyral
                </div>
                <div className={`px-4 py-2 rounded-full border flex items-center gap-2 font-bold text-sm ${isCompleted ? 'border-amber-500/30 text-amber-500 bg-amber-500/10' : 'border-blue-500/30 text-blue-500 bg-blue-500/10'}`}>
                    {isCompleted ? <Trophy className="w-4 h-4" /> : <Target className="w-4 h-4" />}
                    {isCompleted ? 'TRIUMPH' : 'PURSUIT'}
                </div>
            </div>

            {/* Center Content */}
            <div className="w-full px-12 flex flex-col items-center text-center relative z-10 flex-1 justify-center">
                
                <div className="mb-8 relative">
                    <div className="absolute inset-0 blur-2xl opacity-50" style={{ backgroundColor: isCompleted ? '#f59e0b' : '#3b82f6' }} />
                    <div className={`w-32 h-32 rounded-3xl flex items-center justify-center relative z-10 ${isCompleted ? 'bg-gradient-to-br from-amber-400 to-amber-600' : 'bg-gradient-to-br from-blue-400 to-blue-600'} shadow-2xl`}>
                        {isCompleted ? <Star className="w-16 h-16 text-white" /> : <MapPin className="w-16 h-16 text-white" />}
                        {isCompleted && <Sparkles className="absolute -top-4 -right-4 w-10 h-10 text-amber-200" />}
                    </div>
                </div>

                <h1 className="text-4xl font-black mb-6 leading-tight tracking-tight text-white drop-shadow-lg" style={{ wordBreak: 'break-word' }}>
                    {title}
                </h1>
                
                <div className="flex items-center gap-2 text-zinc-400 font-medium text-lg bg-zinc-900/50 px-6 py-3 rounded-full border border-white/5">
                    <Calendar className="w-5 h-5" />
                    {format(parseISO(date), 'MMMM do, yyyy')}
                </div>
            </div>

            {/* Bottom Section */}
            <div className="w-full p-12 relative z-10 text-center">
                <div className="w-full h-px bg-gradient-to-r from-transparent via-white/20 to-transparent mb-8" />
                <p className="text-zinc-500 font-medium text-sm tracking-widest uppercase">
                    Forged in the Hall of Legends
                </p>
            </div>
            
            {/* Border glow */}
            <div className={`absolute inset-0 border-4 pointer-events-none z-20 ${isCompleted ? 'border-amber-500/20' : 'border-blue-500/20'}`} />
        </div>
    );
};
