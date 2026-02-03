"use client";

import { X } from 'lucide-react';
import { SettingsView } from '../settings-view';

interface SettingsModalProps {
    isOpen: boolean;
    onClose: () => void;
}

export function SettingsModal({ isOpen, onClose }: SettingsModalProps) {
    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
            <div
                className="absolute inset-0 bg-black/80 backdrop-blur-md animate-[fadeIn_0.3s_ease-out]"
                onClick={onClose}
            />

            <div className="relative w-full max-w-xl bg-[#0a0a0a] rounded-3xl overflow-hidden shadow-2xl animate-[scaleIn_0.3s_ease-out] max-h-[85vh] overflow-y-auto custom-scrollbar border border-white/10">
                {/* Header */}
                <div className="sticky top-0 z-20 bg-[#0a0a0a]/80 backdrop-blur-xl border-b border-white/5 p-4 flex items-center justify-between">
                    <h2 className="text-lg font-bold text-white pl-2 tracking-tight">System Settings</h2>
                    <button
                        onClick={onClose}
                        className="p-2 rounded-full hover:bg-white/10 text-zinc-400 hover:text-white transition-colors"
                    >
                        <X className="w-5 h-5" />
                    </button>
                </div>

                <div className="p-6">
                    <SettingsView isModal={true} />
                </div>
            </div>
        </div>
    );
}
