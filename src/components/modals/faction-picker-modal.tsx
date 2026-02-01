"use client";

import { useUserData } from "@/context/user-data-context";
import { Shield, Check, X, Flame, Snowflake, Leaf, Waves, Cloud, Sun, Zap, Fish, PawPrint } from "lucide-react";
import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";

function FactionCardEffect({ factionName }: { factionName: string }) {
    if (factionName === 'House Stark') {
        return (
            <div className="absolute inset-0 pointer-events-none overflow-hidden pb-10">
                {[...Array(20)].map((_, i) => {
                    const size = 1 + Math.random() * 3;
                    const blur = Math.random() > 0.7 ? 'blur(1px)' : 'none';
                    return (
                        <motion.div
                            key={i}
                            className="absolute bg-white rounded-full opacity-40 shadow-[0_0_5px_rgba(255,255,255,0.3)]"
                            initial={{ top: -20, left: `${Math.random() * 120 - 10}%` }}
                            animate={{
                                top: '120%',
                                left: [`${Math.random() * 100}%`, `${Math.random() * 100}%`],
                                opacity: [0, 0.6, 0]
                            }}
                            style={{ width: size, height: size, filter: blur }}
                            transition={{
                                duration: 4 + Math.random() * 4,
                                repeat: Infinity,
                                ease: "linear",
                                delay: Math.random() * 10
                            }}
                        />
                    );
                })}
            </div>
        );
    }

    if (factionName === 'House Targaryen') {
        return (
            <div className="absolute inset-0 pointer-events-none overflow-hidden">
                {/* Heat Haze / Core Glow */}
                <motion.div
                    className="absolute -bottom-20 -left-10 w-[150%] h-[150%] rounded-full opacity-20 blur-[100px]"
                    style={{ background: 'radial-gradient(circle, #ef4444 0%, transparent 70%)' }}
                    animate={{
                        scale: [1, 1.2, 1],
                        opacity: [0.1, 0.3, 0.1]
                    }}
                    transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
                />

                {/* Embers */}
                {[...Array(15)].map((_, i) => (
                    <motion.div
                        key={i}
                        className="absolute rounded-full"
                        style={{
                            width: 1 + Math.random() * 3,
                            height: 1 + Math.random() * 3,
                            background: Math.random() > 0.5 ? '#f97316' : '#ef4444',
                            boxShadow: '0 0 10px #f97316'
                        }}
                        initial={{ bottom: -20, left: `${Math.random() * 100}%` }}
                        animate={{
                            bottom: '120%',
                            left: [`${Math.random() * 100}%`, `${Math.random() * 100}%`, `${Math.random() * 100}%`],
                            opacity: [0, 1, 0],
                            scale: [0.5, 1.5, 0.5],
                            rotate: [0, 360]
                        }}
                        transition={{
                            duration: 3 + Math.random() * 3,
                            repeat: Infinity,
                            ease: "easeOut",
                            delay: Math.random() * 5
                        }}
                    />
                ))}

                {/* Dragons */}
                {[...Array(2)].map((_, i) => (
                    <motion.div
                        key={`dragon-${i}`}
                        className="absolute text-red-950/20 pointer-events-none"
                        initial={{
                            left: i === 0 ? '-20%' : '110%',
                            top: `${20 + Math.random() * 40}%`,
                            scale: 0.4 + Math.random() * 0.4,
                            rotate: i === 0 ? 0 : 180
                        }}
                        animate={{
                            left: i === 0 ? '120%' : '-30%',
                            y: [0, -20, 20, 0],
                        }}
                        transition={{
                            duration: 10 + Math.random() * 5,
                            repeat: Infinity,
                            ease: "linear",
                            delay: i * 4
                        }}
                    >
                        <svg width="100" height="60" viewBox="0 0 100 60" fill="currentColor">
                            <path d="M10,30 Q30,10 50,30 T90,30 M50,30 L45,20 M50,30 L45,40 M30,20 Q40,5 50,20 M70,20 Q60,5 50,20" stroke="currentColor" strokeWidth="2" fill="none" />
                            <path d="M50,30 C60,20 80,20 90,30 C80,40 60,40 50,30" />
                            <path d="M20,30 C30,20 40,20 50,30 C40,40 30,40 20,30" />
                        </svg>
                    </motion.div>
                ))}
            </div>
        );
    }

    if (factionName === 'House Greyjoy') {
        return (
            <div className="absolute inset-0 pointer-events-none overflow-hidden bg-slate-950/20">
                {/* Falling Rain */}
                {[...Array(25)].map((_, i) => (
                    <motion.div
                        key={i}
                        className="absolute bg-blue-400/20"
                        style={{ width: '1px', height: 10 + Math.random() * 20 }}
                        initial={{ top: -50, left: `${Math.random() * 100}%` }}
                        animate={{ top: '110%' }}
                        transition={{
                            duration: 0.5 + Math.random() * 0.3,
                            repeat: Infinity,
                            ease: "linear",
                            delay: Math.random() * 2
                        }}
                    />
                ))}
                {/* Splashes */}
                {[...Array(8)].map((_, i) => (
                    <motion.div
                        key={`s-${i}`}
                        className="absolute border border-blue-400/10 rounded-full"
                        style={{ bottom: 0, left: `${Math.random() * 100}%` }}
                        initial={{ width: 0, height: 0, opacity: 0.5 }}
                        animate={{ width: 40, height: 10, opacity: 0, x: -20 }}
                        transition={{
                            duration: 1 + Math.random(),
                            repeat: Infinity,
                            delay: Math.random() * 3
                        }}
                    />
                ))}
            </div>
        );
    }

    if (factionName === 'House Lannister') {
        return (
            <div className="absolute inset-0 pointer-events-none overflow-hidden">
                <motion.div
                    className="absolute inset-x-0 top-0 h-1/2 bg-gradient-to-b from-yellow-500/10 to-transparent"
                    animate={{ opacity: [0.2, 0.4, 0.2] }}
                    transition={{ duration: 4, repeat: Infinity }}
                />
                {[...Array(12)].map((_, i) => (
                    <motion.div
                        key={i}
                        className="absolute w-2 h-2"
                        initial={{ top: '100%', left: `${Math.random() * 100}%`, scale: 0, rotate: 0 }}
                        animate={{
                            top: '-10%',
                            left: [`${Math.random() * 100}%`, `${Math.random() * 100}%`],
                            scale: [0, 1, 0],
                            rotate: [0, 360]
                        }}
                        transition={{
                            duration: 5 + Math.random() * 5,
                            repeat: Infinity,
                            ease: "easeOut",
                            delay: Math.random() * 10
                        }}
                    >
                        <div className="w-full h-full bg-yellow-400 rounded-sm shadow-[0_0_10px_#eab308] rotate-45" />
                    </motion.div>
                ))}
            </div>
        );
    }

    if (factionName === 'House Tyrell') {
        return (
            <div className="absolute inset-0 pointer-events-none overflow-hidden">
                {[...Array(10)].map((_, i) => (
                    <motion.div
                        key={i}
                        className="absolute text-green-600/30"
                        initial={{
                            top: -30,
                            left: `${Math.random() * 100}%`,
                            rotate: Math.random() * 360,
                            scale: 0.5 + Math.random() * 0.5
                        }}
                        animate={{
                            top: '110%',
                            left: [`${Math.random() * 100}%`, `${Math.random() * 100}%`, `${Math.random() * 100}%`],
                            rotate: [0, 360 * (Math.random() > 0.5 ? 1 : -1)],
                            opacity: [0, 1, 1, 0]
                        }}
                        transition={{
                            duration: 6 + Math.random() * 6,
                            repeat: Infinity,
                            ease: "easeInOut",
                            delay: Math.random() * 10
                        }}
                    >
                        <Leaf size={16 + Math.random() * 10} />
                    </motion.div>
                ))}
            </div>
        );
    }

    if (factionName === 'House Martell') {
        return (
            <div className="absolute inset-0 pointer-events-none overflow-hidden">
                {/* Heat Distortion / Sun Glow */}
                <motion.div
                    className="absolute inset-0 bg-orange-500/5 blur-[40px]"
                    animate={{
                        opacity: [0.1, 0.4, 0.1],
                        scale: [1, 1.1, 1]
                    }}
                    transition={{ duration: 5, repeat: Infinity }}
                />
                <div className="absolute top-0 right-0 p-6 opacity-10">
                    <motion.div
                        animate={{ rotate: 360 }}
                        transition={{ duration: 40, repeat: Infinity, ease: "linear" }}
                    >
                        <Sun size={120} strokeWidth={0.5} />
                    </motion.div>
                </div>
                {/* Sand Dust Particles */}
                {[...Array(15)].map((_, i) => (
                    <motion.div
                        key={i}
                        className="absolute bg-orange-300/20 rounded-full"
                        style={{ width: 1 + Math.random() * 2, height: 1 + Math.random() * 2 }}
                        initial={{ left: '-10%', top: `${Math.random() * 100}%` }}
                        animate={{
                            left: '110%',
                            top: `${Math.random() * 100}%`,
                            opacity: [0, 0.5, 0]
                        }}
                        transition={{
                            duration: 3 + Math.random() * 4,
                            repeat: Infinity,
                            ease: "linear",
                            delay: Math.random() * 5
                        }}
                    />
                ))}
            </div>
        );
    }

    if (factionName === 'House Baratheon') {
        return (
            <div className="absolute inset-0 pointer-events-none overflow-hidden">
                {/* Lightning */}
                <motion.div
                    className="absolute inset-0 bg-blue-100 opacity-0"
                    animate={{
                        opacity: [0, 0, 0.8, 0, 0.5, 0, 0, 0]
                    }}
                    transition={{
                        duration: 8,
                        repeat: Infinity,
                        times: [0, 0.7, 0.72, 0.74, 0.76, 0.78, 0.8, 1]
                    }}
                />
                {/* Distant Clouds */}
                {[...Array(3)].map((_, i) => (
                    <motion.div
                        key={i}
                        className="absolute text-slate-800/40"
                        initial={{ left: '-20%', top: `${10 + i * 30}%` }}
                        animate={{ left: '120%' }}
                        transition={{
                            duration: 20 + Math.random() * 20,
                            repeat: Infinity,
                            ease: "linear"
                        }}
                    >
                        <Cloud size={100} strokeWidth={0.5} />
                    </motion.div>
                ))}
            </div>
        );
    }

    if (factionName === 'House Arryn') {
        return (
            <div className="absolute inset-0 pointer-events-none overflow-hidden">
                {[...Array(6)].map((_, i) => (
                    <motion.div
                        key={i}
                        className="absolute text-blue-100/30"
                        initial={{ left: '-30%', top: `${Math.random() * 80}%`, scale: 0.5 + Math.random() }}
                        animate={{
                            left: '130%',
                            y: [0, 20, 0]
                        }}
                        transition={{
                            duration: 15 + Math.random() * 15,
                            repeat: Infinity,
                            ease: "linear",
                            delay: Math.random() * 10
                        }}
                    >
                        <Cloud size={60} strokeWidth={1} />
                    </motion.div>
                ))}
            </div>
        );
    }

    if (factionName === 'House Mormont') {
        return (
            <div className="absolute inset-0 pointer-events-none overflow-hidden opacity-10">
                {[...Array(4)].map((_, i) => (
                    <motion.div
                        key={i}
                        className="absolute text-emerald-900/40"
                        initial={{ scale: 0.8, opacity: 0, rotate: Math.random() * 30 }}
                        animate={{ scale: [0.8, 1.2, 0.8], opacity: [0.2, 0.5, 0.2] }}
                        transition={{ duration: 4, repeat: Infinity, delay: i * 1.5 }}
                        style={{ left: `${15 + i * 25}%`, top: `${20 + i * 20}%` }}
                    >
                        <PawPrint size={40} />
                    </motion.div>
                ))}
            </div>
        );
    }

    if (factionName === 'House Tully') {
        return (
            <div className="absolute inset-0 pointer-events-none overflow-hidden opacity-20">
                {[...Array(6)].map((_, i) => (
                    <motion.div
                        key={i}
                        className="absolute text-blue-400/30"
                        initial={{ left: '-20%', top: `${20 + i * 15}%` }}
                        animate={{
                            left: '120%',
                            y: [0, 10, -10, 0]
                        }}
                        transition={{
                            duration: 5 + Math.random() * 3,
                            repeat: Infinity,
                            ease: "easeInOut",
                            delay: Math.random() * 5
                        }}
                    >
                        <Fish size={24} />
                    </motion.div>
                ))}
            </div>
        );
    }

    return null;
}

interface FactionPickerModalProps {
    isOpen: boolean;
    onClose: () => void;
}

export function FactionPickerModal({ isOpen, onClose }: FactionPickerModalProps) {
    const { factions, currentFaction, setFaction } = useUserData();
    const [selectedId, setSelectedId] = useState<string | null>(currentFaction?.id || null);

    if (!isOpen) return null;

    const handleConfirm = async () => {
        if (selectedId) {
            await setFaction(selectedId);
            onClose();
        }
    };

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
            <div className="absolute inset-0 bg-black/90 backdrop-blur-xl" onClick={onClose} />

            <div className="relative max-w-4xl w-full bg-zinc-950 border border-white/10 rounded-[2.5rem] overflow-hidden shadow-2xl flex flex-col max-h-[90vh]">
                {/* Header */}
                <div className="p-8 md:p-12 text-center space-y-2 border-b border-white/5">
                    <h2 className="text-3xl font-bold tracking-tighter text-white">Choose Your House</h2>
                    <p className="text-zinc-500 text-sm">Align your spirit with a legacy. This choice will define your Sigil.</p>
                </div>

                {/* Content */}
                <div className="flex-1 overflow-y-auto p-8 grid grid-cols-1 md:grid-cols-2 gap-6">
                    {factions.map((f) => {
                        const isSelected = selectedId === f.id;
                        return (
                            <motion.button
                                key={f.id}
                                whileHover={{ scale: 1.02, y: -2 }}
                                whileTap={{ scale: 0.98 }}
                                onClick={() => setSelectedId(f.id)}
                                className={`relative group text-left p-8 rounded-[2rem] border transition-all duration-500 min-h-[140px] flex items-center overflow-hidden ${isSelected
                                    ? 'bg-white/5 border-white/20 ring-1 ring-white/10'
                                    : 'bg-transparent border-white/5 hover:border-white/10 hover:bg-white/[0.02]'
                                    }`}
                            >
                                <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none">
                                    <FactionCardEffect factionName={f.name} />
                                </div>
                                {/* Faction Glow */}
                                <div
                                    className="absolute -top-12 -right-12 w-48 h-48 rounded-full blur-[100px] opacity-20 transition-opacity group-hover:opacity-40 pointer-events-none"
                                    style={{ backgroundColor: f.primaryColor }}
                                />

                                <div className="relative flex items-center gap-6 w-full">
                                    <div className="shrink-0 relative">
                                        <div className="w-16 h-16 rounded-2xl bg-zinc-900 border border-white/10 flex items-center justify-center overflow-hidden shadow-2xl group-hover:border-white/20 transition-all p-1">
                                            <img src={f.sigilUrl} alt={f.name} className="w-full h-full object-cover rounded-xl group-hover:scale-110 transition-transform duration-500" />
                                        </div>
                                        {isSelected && (
                                            <motion.div
                                                initial={{ scale: 0 }}
                                                animate={{ scale: 1 }}
                                                className="absolute -top-2 -right-2 w-7 h-7 rounded-full bg-white text-black flex items-center justify-center shadow-xl z-20"
                                            >
                                                <Check className="w-4 h-4" />
                                            </motion.div>
                                        )}
                                    </div>

                                    <div className="flex-1 min-w-0">
                                        <h3 className="text-xl font-bold text-white group-hover:translate-x-1 transition-transform truncate">{f.name}</h3>
                                        <p className="text-sm font-serif italic text-zinc-500 mt-1 line-clamp-1 group-hover:text-zinc-400 transition-colors">"{f.quote}"</p>
                                    </div>
                                </div>
                            </motion.button>
                        );
                    })}
                </div>

                {/* Footer */}
                <div className="p-8 flex gap-4 border-t border-white/5 bg-zinc-950/50">
                    <button
                        onClick={onClose}
                        className="flex-1 py-4 text-zinc-500 font-medium hover:text-white transition-colors"
                    >
                        Dismiss
                    </button>
                    <button
                        onClick={handleConfirm}
                        disabled={!selectedId}
                        className="flex-[2] py-4 bg-white text-black font-bold rounded-2xl hover:scale-[1.02] active:scale-95 transition-all disabled:opacity-50 disabled:scale-100"
                    >
                        Pledge Loyalty
                    </button>
                </div>

                <button
                    onClick={onClose}
                    className="absolute top-6 right-6 w-10 h-10 rounded-full bg-white/5 flex items-center justify-center text-zinc-400 hover:text-white transition-all hover:rotate-90"
                >
                    <X className="w-5 h-5" />
                </button>
            </div>
        </div>
    );
}
