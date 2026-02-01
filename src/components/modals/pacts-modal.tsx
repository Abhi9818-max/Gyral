"use client";

import { X } from 'lucide-react';
import { PactWidget } from '../pacts-widget';

interface PactsModalProps {
    isOpen: boolean;
    onClose: () => void;
}

export function PactsModal({ isOpen, onClose }: PactsModalProps) {
    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
            {/* Backdrop */}
            <div
                className="absolute inset-0 bg-black/80 backdrop-blur-md animate-[fadeIn_0.3s_ease-out]"
                onClick={onClose}
            />

            {/* Modal Content */}
            <div className="relative w-full max-w-2xl bg-transparent animate-[scaleIn_0.3s_ease-out]">
                <button
                    onClick={onClose}
                    className="absolute -top-12 right-0 text-white/50 hover:text-white transition-colors"
                >
                    <X className="w-8 h-8" />
                </button>

                <PactWidget />
            </div>
        </div>
    );
}
