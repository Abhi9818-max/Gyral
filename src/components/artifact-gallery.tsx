
"use client";

import { useUserData } from "@/context/user-data-context";
import { ARTIFACTS } from "@/lib/artifacts";
import { Lock, CheckCircle, Flame, Triangle, Hexagon, Compass, Skull, Box } from "lucide-react";
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
    'Box': Box
};

export function ArtifactGallery({ isOpen, onClose }: ArtifactGalleryProps) {
    const { unlockedArtifacts, displayedArtifactId, equipArtifact } = useUserData();

    if (!isOpen) return null;

    if (typeof window === 'undefined') return null;

    return createPortal(
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-in fade-in duration-300">
            <div className="w-full max-w-2xl bg-zinc-950 border border-zinc-800 rounded-2xl shadow-2xl relative overflow-hidden flex flex-col max-h-[85vh]">

                {/* Header */}
                <div className="p-6 border-b border-zinc-900 flex justify-between items-center bg-black/50">
                    <div>
                        <h2 className="text-xl font-bold text-white tracking-widest uppercase">The Vault</h2>
                        <p className="text-xs text-zinc-500">Legacy Artifacts unlocked through discipline.</p>
                    </div>
                    <button onClick={onClose} className="text-zinc-500 hover:text-white transition-colors">
                        ✕
                    </button>
                </div>

                {/* Gallery Grid */}
                <div className="flex-1 overflow-y-auto p-6 grid grid-cols-2 md:grid-cols-3 gap-4">
                    {ARTIFACTS.map((artifact) => {
                        const isUnlocked = unlockedArtifacts.includes(artifact.id);
                        const isEquipped = displayedArtifactId === artifact.id;
                        const Icon = ICON_MAP[artifact.icon as keyof typeof ICON_MAP] || Box;

                        return (
                            <div
                                key={artifact.id}
                                className={`relative aspect-[4/5] rounded-xl border p-4 flex flex-col items-center justify-between group transition-all duration-300 ${isUnlocked
                                        ? "bg-zinc-900/50 border-zinc-800 hover:border-zinc-700 hover:bg-zinc-900"
                                        : "bg-zinc-950/50 border-zinc-900 opacity-60 grayscale"
                                    }`}
                            >
                                {/* Status Badge */}
                                <div className="w-full flex justify-end">
                                    {isEquipped && <span className="text-green-500 text-[10px] uppercase font-bold tracking-wider flex items-center gap-1"><CheckCircle className="w-3 h-3" /> Equipped</span>}
                                    {!isUnlocked && <Lock className="w-3 h-3 text-zinc-600" />}
                                </div>

                                {/* Icon Display */}
                                <div className={`relative w-16 h-16 flex items-center justify-center rounded-full transition-transform duration-500 ${isUnlocked ? "group-hover:scale-110" : "opacity-20"
                                    }`}
                                    style={{
                                        boxShadow: isUnlocked ? `0 0 30px ${artifact.color}20` : 'none'
                                    }}
                                >
                                    <Icon
                                        className={`w-8 h-8 ${isUnlocked ? "text-white" : "text-zinc-700"}`}
                                        style={{ color: isUnlocked ? artifact.color : undefined }}
                                    />
                                    {/* Glow Effect */}
                                    {isUnlocked && (
                                        <div className="absolute inset-0 rounded-full blur-xl opacity-20" style={{ backgroundColor: artifact.color }} />
                                    )}
                                </div>

                                {/* Info */}
                                <div className="text-center w-full">
                                    <h3 className={`font-bold text-sm ${isUnlocked ? "text-white" : "text-zinc-600"}`}>{artifact.name}</h3>
                                    <p className="text-[10px] text-zinc-500 mt-1 line-clamp-2">{artifact.description}</p>

                                    {!isUnlocked && (
                                        <div className="mt-3 px-2 py-1 bg-zinc-900 rounded text-[10px] text-zinc-500 font-mono">
                                            {artifact.condition}
                                        </div>
                                    )}

                                    {isUnlocked && !isEquipped && (
                                        <button
                                            onClick={() => equipArtifact(artifact.id)}
                                            className="mt-3 w-full py-1.5 rounded bg-zinc-800 hover:bg-zinc-700 text-xs text-white font-medium transition-colors opacity-0 group-hover:opacity-100"
                                        >
                                            Equip
                                        </button>
                                    )}
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
