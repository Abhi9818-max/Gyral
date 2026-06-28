
"use client";

import { useUserData } from "@/context/user-data-context";
import { ARTIFACTS } from "@/lib/artifacts";
import { Lock, CheckCircle, Flame, Triangle, Hexagon, Compass, Skull, Box, Shield, Book, Zap, Activity, BookOpen, Clock } from "lucide-react";
import { createPortal } from "react-dom";

interface ArtifactGalleryProps {
    isOpen: boolean;
    onClose: () => void;
}

const ICON_MAP = {
    'Flame': Flame,
    'Triangle': Triangle,
    'Hexagon': Hexagon,
    'Compass': Compass,
    'Skull': Skull,
    'Box': Box,
    'Shield': Shield,
    'Book': Book,
    'Zap': Zap,
    'Activity': Activity,
    'BookOpen': BookOpen,
    'Clock': Clock
};

export function ArtifactGallery({ isOpen, onClose }: ArtifactGalleryProps) {
    const { unlockedArtifacts, displayedArtifactId, equipArtifact } = useUserData();

    if (!isOpen) return null;

    if (typeof window === 'undefined') return null;

    return createPortal(
        <div className="fixed inset-0 z-[60] flex items-end md:items-center justify-center p-0 md:p-4 bg-black/85 backdrop-blur-md animate-in fade-in duration-300">
            <div className="w-full h-[88vh] md:h-auto md:max-h-[85vh] md:max-w-2xl bg-zinc-950 border-t border-zinc-900 md:border md:border-zinc-800 rounded-t-2xl md:rounded-2xl shadow-2xl relative overflow-hidden flex flex-col">

                {/* Header */}
                <div className="p-5 md:p-6 border-b border-zinc-900 flex justify-between items-center bg-black/50 flex-shrink-0">
                    <div>
                        <h2 className="text-lg md:text-xl font-bold text-white tracking-widest uppercase">The Vault</h2>
                        <p className="text-[10px] md:text-xs text-zinc-500">Legacy Artifacts unlocked through discipline.</p>
                    </div>
                    <button onClick={onClose} className="p-2 -mr-2 text-zinc-500 hover:text-white transition-colors text-lg focus:outline-none">
                        ✕
                    </button>
                </div>

                {/* Gallery Grid */}
                <div className="flex-1 overflow-y-auto p-5 md:p-6 grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4 pb-12 md:pb-6">
                    {ARTIFACTS.map((artifact) => {
                        const isUnlocked = unlockedArtifacts.includes(artifact.id);
                        const isEquipped = displayedArtifactId === artifact.id;
                        const Icon = ICON_MAP[artifact.icon as keyof typeof ICON_MAP] || Box;

                        return (
                            <div
                                key={artifact.id}
                                className={`relative rounded-xl border p-4 flex flex-col items-center justify-between gap-3 group transition-all duration-300 min-h-[190px] md:min-h-[220px] ${isUnlocked
                                    ? "bg-zinc-900/40 border-zinc-800 hover:border-zinc-700 hover:bg-zinc-900/70"
                                    : "bg-zinc-950/50 border-zinc-900 opacity-60 grayscale"
                                    }`}
                                style={{
                                    boxShadow: isUnlocked && isEquipped ? `0 0 20px ${artifact.color}15` : 'none'
                                }}
                            >
                                {/* Status Badge */}
                                <div className="w-full flex justify-between items-center text-[10px] tracking-wider font-bold">
                                    <div>
                                        {isEquipped && (
                                            <span className="text-green-500 uppercase flex items-center gap-1">
                                                <CheckCircle className="w-3 h-3" /> Equipped
                                            </span>
                                        )}
                                    </div>
                                    <div>
                                        {!isUnlocked ? (
                                            <Lock className="w-3 h-3 text-zinc-600" />
                                        ) : (
                                            !isEquipped && <span className="text-zinc-500 uppercase">Unlocked</span>
                                        )}
                                    </div>
                                </div>

                                {/* Icon Display */}
                                <div className={`relative w-14 h-14 md:w-16 md:h-16 flex items-center justify-center rounded-full transition-transform duration-500 ${isUnlocked ? "group-hover:scale-110" : "opacity-20"
                                    }`}
                                    style={{
                                        boxShadow: isUnlocked ? `0 0 30px ${artifact.color}25` : 'none'
                                    }}
                                >
                                    <Icon
                                        className={`w-7 h-7 md:w-8 md:h-8 ${isUnlocked ? "text-white" : "text-zinc-700"}`}
                                        style={{ color: isUnlocked ? artifact.color : undefined }}
                                    />
                                    {/* Glow Effect */}
                                    {isUnlocked && (
                                        <div className="absolute inset-0 rounded-full blur-xl opacity-20" style={{ backgroundColor: artifact.color }} />
                                    )}
                                </div>

                                {/* Info */}
                                <div className="text-center w-full flex-1 flex flex-col justify-between">
                                    <div>
                                        <h3 className={`font-bold text-sm ${isUnlocked ? "text-white" : "text-zinc-600"}`}>{artifact.name}</h3>
                                        <p className="text-[10px] text-zinc-500 mt-1 line-clamp-2 md:line-clamp-3">{artifact.description}</p>
                                    </div>

                                    <div>
                                        {!isUnlocked && (
                                            <div className="mt-3 px-2 py-1 bg-zinc-900/80 rounded text-[9px] text-zinc-500 font-mono border border-zinc-800/50">
                                                {artifact.condition}
                                            </div>
                                        )}

                                        {isUnlocked && !isEquipped && (
                                            <button
                                                onClick={() => equipArtifact(artifact.id)}
                                                className="mt-3 w-full py-1.5 rounded-lg bg-zinc-900 border border-zinc-800 hover:border-zinc-700 hover:bg-zinc-800 text-xs text-white font-medium transition-all opacity-100 md:opacity-0 md:group-hover:opacity-100"
                                            >
                                                Equip
                                            </button>
                                        )}
                                    </div>
                                </div>
                            </div>
                        );
                    })}
                </div>
            </div>
        </div>,
        document.body
    );
}
