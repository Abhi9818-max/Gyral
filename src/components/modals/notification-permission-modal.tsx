"use client";

import { Bell, X, Check } from 'lucide-react';
import { useState, useEffect } from 'react';
import { subscribeUserToPush } from '@/lib/push-notifications';

interface NotificationPermissionModalProps {
    isOpen: boolean;
    onClose: () => void;
}

export function NotificationPermissionModal({ isOpen, onClose }: NotificationPermissionModalProps) {
    const [status, setStatus] = useState<'idle' | 'loading' | 'success' | 'denied'>('idle');

    if (!isOpen) return null;

    const handleEnable = async () => {
        setStatus('loading');
        try {
            const success = await subscribeUserToPush();
            if (success) {
                setStatus('success');
                setTimeout(() => {
                    onClose();
                }, 1500);
            } else {
                // If it returns false, it might be denied or failed.
                if (Notification.permission === 'denied') {
                    setStatus('denied');
                } else {
                    // Just failed (maybe no network or dismissed)
                    onClose();
                }
            }
        } catch (e) {
            console.error(e);
            onClose();
        }
    };

    const handleDismiss = () => {
        localStorage.setItem('diogenes-notification-choice', 'dismissed');
        onClose();
    };

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
            <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={handleDismiss} />

            <div className="relative bg-[#0a0a0a] border border-white/10 rounded-2xl p-6 w-full max-w-sm shadow-2xl animate-[scaleIn_0.3s_ease-out]">
                <button
                    onClick={handleDismiss}
                    className="absolute top-4 right-4 text-zinc-500 hover:text-white transition-colors"
                >
                    <X className="w-5 h-5" />
                </button>

                <div className="flex flex-col items-center text-center space-y-4">
                    <div className="w-16 h-16 rounded-full bg-blue-500/10 flex items-center justify-center mb-2">
                        {status === 'success' ? (
                            <Check className="w-8 h-8 text-blue-500 animate-[scaleIn_0.3s_ease-out]" />
                        ) : (
                            <Bell className="w-8 h-8 text-blue-500" />
                        )}
                    </div>

                    <h2 className="text-xl font-bold text-white">Enable Notifications?</h2>

                    <p className="text-sm text-zinc-400">
                        Stay connected with your pacts and receive important updates from the Citadel. We promise not to spam properly.
                    </p>

                    {status === 'denied' && (
                        <div className="p-3 bg-red-500/10 border border-red-500/20 rounded-lg text-xs text-red-400">
                            Notifications are blocked by your browser. Please enable them in your browser settings.
                        </div>
                    )}

                    <div className="flex gap-3 w-full pt-2">
                        <button
                            onClick={handleDismiss}
                            className="flex-1 px-4 py-2.5 rounded-xl bg-zinc-900 border border-white/5 text-zinc-400 hover:bg-zinc-800 hover:text-white transition-colors font-medium text-sm"
                        >
                            Not Now
                        </button>
                        <button
                            onClick={handleEnable}
                            disabled={status === 'loading' || status === 'success'}
                            className="flex-1 px-4 py-2.5 rounded-xl bg-blue-600 text-white hover:bg-blue-500 transition-colors font-bold text-sm shadow-[0_0_15px_rgba(37,99,235,0.3)] disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            {status === 'loading' ? 'Enabling...' : status === 'success' ? 'Enabled!' : 'Yes, Enable'}
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}
