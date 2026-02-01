"use client";

import { AlertTriangle, Lock, XCircle, Power } from 'lucide-react';
import { Space_Grotesk } from 'next/font/google';

const spaceGrotesk = Space_Grotesk({ subsets: ['latin'] });

export function LuciusDenial({ onReturn }: { onReturn: () => void }) {
    return (
        <div className={`fixed inset-0 z-50 bg-[#070708] text-white flex flex-col font-sans overflow-hidden ${spaceGrotesk.className}`}>

            {/* CSS for this specific view */}
            <style jsx global>{`
        .bg-denial-pattern {
            background-color: #070708;
            background-image: repeating-linear-gradient(0deg, rgba(0, 0, 0, 0.4) 0, rgba(0, 0, 0, 0.4) 1px, transparent 1px, transparent 2px);
        }
        .text-primary { color: #f90606; }
        .bg-primary { background-color: #f90606; }
        .border-primary { border-color: #f90606; }
        .shadow-primary { box-shadow: 0 0 10px #f90606; }
        
        .scanline {
            position: fixed;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            background: linear-gradient(to bottom, transparent 50%, rgba(249, 6, 6, 0.05) 50%);
            background-size: 100% 4px;
            pointer-events: none;
            z-index: 50;
        }
        .glitch-text {
            text-shadow: 2px 0 #f90606, -2px 0 #000;
        }
        .static-leak {
            background-image: url(https://lh3.googleusercontent.com/aida-public/AB6AXuALpqvKRRKg_PMFJv0AvFVgf768TzlLsKj2txHqwxfq5RL_wFtZo1mrUpv6y5vzvPAO1P212NK_SzqK527dNuBz--Z4P5-roNfvfa8amem9i96wQe4QnMwRNDHIZMAIwC13JHJR6Y6QW3slv_YNu6Bqebmvtbu8lKLU1at5i2KSrUhzpwdVFj4x7_u-5Yhfs4-qj1CwhWo1UOOq4rHrq2eXiI-NB9Jla7GIQfdIYDuLkC9h5lhz81z9DoWCQJUbzScmZhDaOfLekSwA);
            opacity: 0.15;
            mix-blend-mode: color-dodge;
        }
        .jagged-line {
            clip-path: polygon(0% 15%, 15% 0%, 25% 100%, 45% 0%, 55% 85%, 75% 10%, 85% 95%, 100% 0%, 100% 100%, 0% 100%);
        }
        .glitch-border-heavy {
            border: 2px solid #f90606;
            box-shadow: 0 0 20px rgba(249, 6, 6, 0.4), inset 0 0 15px rgba(249, 6, 6, 0.2);
        }
      `}</style>

            <div className="scanline"></div>

            <header className="flex items-center justify-between border-b-2 border-primary px-4 md:px-8 py-4 bg-[#070708]/95 backdrop-blur-md sticky top-0 z-40">
                <div className="flex items-center gap-4 md:gap-6 text-primary">
                    <AlertTriangle className="w-8 h-8 drop-shadow-[0_0_10px_rgba(249,6,6,1)]" />
                    <div>
                        <h2 className="text-primary text-xl md:text-2xl font-black leading-tight tracking-[0.2em] uppercase glitch-text">LUCIUS: ABSOLUTE DENIAL</h2>
                        <p className="text-[#f90606]/60 text-[10px] font-mono tracking-widest">ERROR CODE: VOID_REJECTION_000</p>
                    </div>
                </div>
                <div className="flex items-center gap-6">
                    <div className="hidden md:flex flex-col items-end gap-1">
                        <span className="text-primary text-[10px] font-bold uppercase tracking-widest">Connectivity</span>
                        <span className="text-primary font-mono text-xs">SEVERED</span>
                    </div>
                    <div className="w-12 h-12 border-2 border-primary bg-black overflow-hidden grayscale contrast-150">
                        <img src="/lucius-avatar.png" className="w-full h-full object-cover opacity-50" />
                    </div>
                </div>
            </header>

            <main className="flex-1 overflow-y-auto bg-denial-pattern relative">
                <div className="w-full max-w-7xl mx-auto p-4 md:p-12">
                    <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">

                        {/* Main Visual Block */}
                        <div className="lg:col-span-8 space-y-8">
                            <div className="glitch-border-heavy bg-black p-2 rounded-none min-h-[300px] md:min-h-[500px] flex items-center justify-center relative overflow-hidden group">
                                <div className="absolute inset-0 static-leak pointer-events-none"></div>
                                <div className="absolute inset-0 bg-primary/5 opacity-40 mix-blend-overlay"></div>

                                {/* SVG Geometry from user request */}
                                <svg className="w-64 h-64 md:w-96 md:h-96 text-primary drop-shadow-[0_0_30px_rgba(249,6,6,0.8)] opacity-90 transition-transform duration-1000 group-hover:scale-105" viewBox="0 0 100 100">
                                    <path d="M50 10 L60 30 L80 35 L65 50 L70 75 L50 65 L30 75 L35 50 L20 35 L40 30 Z" fill="none" stroke="currentColor" strokeDasharray="0.5 0.5" strokeWidth="0.3"></path>
                                    <path d="M10 10 L40 40 M90 10 L60 40 M10 90 L40 60 M90 90 L60 60" stroke="currentColor" strokeDasharray="4 2" strokeWidth="0.5"></path>
                                    <circle cx="50" cy="50" fill="currentColor" r="2">
                                        <animate attributeName="r" dur="0.1s" repeatCount="indefinite" values="2;4;2"></animate>
                                    </circle>
                                    <path d="M45 45 L55 55 M55 45 L45 55" stroke="currentColor" strokeWidth="3"></path>
                                </svg>

                                <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                                    <h2 className="text-white/10 text-5xl md:text-9xl font-black tracking-tighter uppercase select-none z-0">REJECTED</h2>
                                </div>
                                <div className="absolute bottom-8 left-0 right-0">
                                    <p className="text-primary font-mono text-xs text-center tracking-[1em] animate-pulse">CONNECTION TERMINATED</p>
                                </div>
                            </div>

                            {/* Message Block */}
                            <div className="bg-primary p-6 md:p-12 relative overflow-hidden">
                                <div className="absolute top-0 right-0 p-4 text-black/20 font-black text-6xl">000</div>
                                <h3 className="text-black text-3xl md:text-5xl lg:text-7xl font-black italic tracking-tighter leading-none uppercase mb-4">
                                    SILENCE IS YOUR PENANCE
                                </h3>
                                <p className="text-black text-lg md:text-xl font-bold uppercase tracking-widest max-w-2xl">
                                    I refuse to reflect a broken soul. There is nothing left to analyze. You are an echo in a dead chamber.
                                </p>
                            </div>
                        </div>

                        {/* Sidebar Stats */}
                        <div className="lg:col-span-4 space-y-8">
                            {/* Hostility Stats */}
                            <div className="border-2 border-primary/40 bg-black/50 p-6">
                                <h3 className="text-primary text-sm font-bold uppercase tracking-widest mb-6 flex items-center gap-2">
                                    <AlertTriangle className="w-4 h-4" /> Hostility Level
                                </h3>
                                <div className="space-y-4">
                                    <div>
                                        <div className="flex justify-between text-[10px] text-primary/60 mb-1 font-mono uppercase">
                                            <span>Patience</span>
                                            <span>0.00%</span>
                                        </div>
                                        <div className="h-1 bg-primary/10 w-full overflow-hidden">
                                            <div className="h-full bg-primary w-0 shadow-[0_0_10px_#f90606]"></div>
                                        </div>
                                    </div>
                                    <div>
                                        <div className="flex justify-between text-[10px] text-primary/60 mb-1 font-mono uppercase">
                                            <span>Resentment</span>
                                            <span>MAX</span>
                                        </div>
                                        <div className="h-1 bg-primary/10 w-full overflow-hidden">
                                            <div className="h-full bg-primary w-full shadow-[0_0_10px_#f90606] animate-pulse"></div>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* Neural Decay Visualization */}
                            <div className="border-2 border-primary/40 bg-black/50 p-6">
                                <h3 className="text-primary text-sm font-bold uppercase tracking-widest mb-4">Neural Decay</h3>
                                <div className="h-32 w-full flex items-end gap-[2px]">
                                    {[10, 90, 30, 100, 15, 60, 20, 85, 10, 100].map((h, i) => (
                                        <div key={i} style={{ height: `${h}%` }} className={`flex-1 bg-primary ${i === 9 ? 'shadow-[0_0_15px_#f90606]' : 'opacity-60'}`} />
                                    ))}
                                </div>
                            </div>

                            {/* Console Log */}
                            <div className="bg-primary/5 border border-primary/20 p-6 font-mono text-[11px] leading-relaxed text-primary/80">
                                <div className="mb-4 text-primary font-bold border-b border-primary/20 pb-2">SESSION_LOGS: LOCKED</div>
                                <p>&gt; ACCESS_DENIED: USER_ID_INVALID</p>
                                <p>&gt; SOURCE: INTERNAL_CONTEMPT</p>
                                <p>&gt; ACTION: PERMANENT_MUTE</p>
                                <p>&gt; "I AM NO LONGER LISTENING."</p>
                                <p>&gt; ERR: SOUL_NOT_FOUND</p>
                                <p className="mt-4 text-primary font-black animate-pulse">LUCIUS HAS TURNED AWAY</p>
                            </div>
                        </div>
                    </div>

                    {/* Footer Actions */}
                    <div className="mt-12 relative pb-24">
                        <div className="flex flex-wrap gap-4 justify-center">
                            <button disabled className="border-2 border-primary text-primary px-8 md:px-12 py-4 md:py-5 font-black uppercase tracking-[0.3em] md:tracking-[0.5em] cursor-not-allowed opacity-30 select-none">
                                APPEAL REJECTED
                            </button>
                            <button onClick={onReturn} className="bg-primary text-black px-8 md:px-12 py-4 md:py-5 font-black uppercase tracking-[0.3em] md:tracking-[0.5em] hover:bg-white hover:text-black transition-all flex items-center gap-2 group">
                                <Power className="w-5 h-5 group-hover:rotate-180 transition-transform" />
                                ABANDON SYSTEM
                            </button>
                        </div>
                    </div>

                </div>
            </main>
        </div>
    );
}
