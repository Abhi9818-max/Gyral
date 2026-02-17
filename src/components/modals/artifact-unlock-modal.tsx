"use client";

import { useEffect, useState } from 'react';
import { useUserData } from '@/context/user-data-context';
import { ARTIFACTS } from '@/lib/artifacts';
import { motion, AnimatePresence } from 'framer-motion';
import { Shield, Book, Zap, Activity, BookOpen, Clock, Flame, Triangle, Hexagon, Compass, Skull, Box } from 'lucide-react';
import confetti from 'canvas-confetti';

const ICON_MAP: any = {
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

export function ArtifactUnlockModal() {
    const { newlyUnlockedArtifacts, clearNewlyUnlocked } = useUserData();
    const [currentIndex, setCurrentIndex] = useState(0);
    const [isOpen, setIsOpen] = useState(false);

    useEffect(() => {
        if (newlyUnlockedArtifacts.length > 0) {
            setIsOpen(true);
            setCurrentIndex(0);
            confetti({
                particleCount: 100,
                spread: 70,
                origin: { y: 0.6 }
            });
        }
    }, [newlyUnlockedArtifacts]);

    const handleNext = () => {
        if (currentIndex < newlyUnlockedArtifacts.length - 1) {
            setCurrentIndex(prev => prev + 1);
            confetti({
                particleCount: 100,
                spread: 70,
                origin: { y: 0.6 }
            });
        } else {
            setIsOpen(false);
            clearNewlyUnlocked();
        }
    };

    if (!isOpen || newlyUnlockedArtifacts.length === 0) return null;

    const artifactId = newlyUnlockedArtifacts[currentIndex];
    const artifact = ARTIFACTS.find(a => a.id === artifactId);

    if (!artifact) {
        handleNext();
        return null;
    }

    const Icon = ICON_MAP[artifact.icon] || Box;

    return (
        <AnimatePresence>
            {isOpen && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
                    {/* Backdrop */}
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="absolute inset-0 bg-black/80 backdrop-blur-md"
                    />

                    {/* Modal Content */}
                    <motion.div
                        key={artifactId}
                        initial={{ scale: 0.8, opacity: 0, y: 20 }}
                        animate={{ scale: 1, opacity: 1, y: 0 }}
                        exit={{ scale: 0.8, opacity: 0, y: -20 }}
                        transition={{ type: "spring", duration: 0.5 }}
                        className="relative w-full max-w-md bg-[#0a0a0a] border border-[#333] rounded-2xl p-8 flex flex-col items-center text-center shadow-[0_0_50px_rgba(0,0,0,0.8)] overflow-hidden"
                    >
                        {/* Glow Background */}
                        <div
                            className="absolute inset-0 opacity-20 blur-3xl"
                            style={{ background: `radial-gradient(circle at center, ${artifact.color}, transparent 70%)` }}
                        />

                        <motion.div
                            initial={{ scale: 0, rotate: -180 }}
                            animate={{ scale: 1, rotate: 0 }}
                            transition={{ type: "spring", duration: 0.8, delay: 0.2 }}
                            className="relative z-10 w-24 h-24 rounded-full flex items-center justify-center mb-6 shadow-[0_0_30px_rgba(0,0,0,0.5)] bg-[#111] border border-[#333]"
                            style={{ boxShadow: `0 0 30px ${artifact.color}40`, borderColor: artifact.color }}
                        >
                            <Icon className="w-12 h-12" style={{ color: artifact.color }} />
                        </motion.div>

                        <motion.h2
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: 0.4 }}
                            className="text-white text-3xl font-bold mb-2 tracking-wide font-serif relative z-10"
                        >
                            Artifact Acquired
                        </motion.h2>

                        <motion.p
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            transition={{ delay: 0.5 }}
                            className="text-lg font-medium mb-4 relative z-10"
                            style={{ color: artifact.color }}
                        >
                            {artifact.name}
                        </motion.p>

                        <motion.p
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            transition={{ delay: 0.6 }}
                            className="text-muted-foreground text-sm italic mb-8 relative z-10 max-w-[80%]"
                        >
                            "{artifact.description}"
                        </motion.p>

                        <motion.button
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: 0.8 }}
                            onClick={handleNext}
                            className="relative z-10 px-8 py-3 rounded-xl font-bold text-black transition-transform active:scale-95 hover:scale-105 shadow-[0_0_20px_rgba(0,0,0,0.3)]"
                            style={{
                                backgroundColor: artifact.color,
                                boxShadow: `0 0 20px ${artifact.color}60`
                            }}
                        >
                            {currentIndex < newlyUnlockedArtifacts.length - 1 ? "Next Reward" : "Claim Artifact"}
                        </motion.button>

                    </motion.div>
                </div>
            )}
        </AnimatePresence>
    );
}
