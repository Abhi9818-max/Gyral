"use client";

import { useState, useEffect } from 'react';
import { useInstallPrompt } from '@/hooks/use-install-prompt';
import { Download, X, Smartphone, Apple } from 'lucide-react';

export function PWAInstallBanner() {
    const { isInstallable, promptInstall } = useInstallPrompt();
    const [isVisible, setIsVisible] = useState(false);
    const [isStandalone, setIsStandalone] = useState(false);
    const [showModal, setShowModal] = useState(false);

    useEffect(() => {
        if (typeof window !== 'undefined') {
            const checkStandalone = window.matchMedia('(display-mode: standalone)').matches || 
                (window.navigator as any).standalone === true;
            setIsStandalone(checkStandalone);

            const isDismissed = localStorage.getItem('diogenes-install-banner-dismissed');
            
            // Show banner if not standalone and not dismissed
            if (!checkStandalone && !isDismissed) {
                // Delay showing it slightly for a smoother UX
                const timer = setTimeout(() => {
                    setIsVisible(true);
                }, 3000);
                return () => clearTimeout(timer);
            }
        }
    }, []);

    const handleDismiss = () => {
        setIsVisible(false);
        localStorage.setItem('diogenes-install-banner-dismissed', 'true');
    };

    const handleInstall = async () => {
        if (isInstallable) {
            await promptInstall();
            setIsVisible(false);
        } else {
            setShowModal(true);
        }
    };

    if (isStandalone || !isVisible) return null;

    return (
        <>
            {/* Floating Banner */}
            <div className="fixed bottom-24 left-4 right-4 md:left-auto md:right-6 md:w-96 z-50 animate-slide-up">
                <div className="bg-zinc-950/90 border border-white/10 rounded-2xl p-4 shadow-2xl backdrop-blur-md flex items-center justify-between gap-4">
                    <div className="flex items-center gap-3">
                        {/* App Logo Icon */}
                        <div className="w-12 h-12 rounded-xl bg-zinc-900 border border-white/10 flex items-center justify-center shrink-0 overflow-hidden">
                            {/* eslint-disable-next-line @next/next/no-img-element */}
                            <img src="/icons/icon-192.png" alt="Gyral Logo" className="w-10 h-10 object-contain" />
                        </div>
                        <div>
                            <h4 className="text-sm font-bold text-white">Install Gyral App</h4>
                            <p className="text-xs text-zinc-400 mt-0.5">Get fullscreen & offline support</p>
                        </div>
                    </div>

                    <div className="flex items-center gap-2">
                        <button 
                            onClick={handleInstall}
                            className="px-4 py-2 bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-500 hover:to-violet-500 active:scale-95 transition-all text-white text-xs font-bold rounded-xl shadow-lg shadow-indigo-900/40 shrink-0"
                        >
                            Install
                        </button>
                        <button 
                            onClick={handleDismiss}
                            className="p-2 text-zinc-500 hover:text-zinc-300 hover:bg-white/5 rounded-xl transition-all"
                        >
                            <X className="w-4 h-4" />
                        </button>
                    </div>
                </div>
            </div>

            {/* Instruction Modal */}
            {showModal && (
                <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center">
                    <div className="absolute inset-0 bg-black/80 backdrop-blur-sm" onClick={() => setShowModal(false)} />
                    <div className="relative w-full sm:max-w-md bg-zinc-950 border border-white/10 rounded-t-3xl sm:rounded-3xl p-6 pb-10 sm:pb-6 shadow-2xl z-50 animate-slide-up">
                        <div className="flex items-center justify-between mb-6">
                            <div>
                                <h2 className="text-lg font-bold text-white">Install Gyral</h2>
                                <p className="text-xs text-zinc-400 mt-0.5">Add to your device home screen</p>
                            </div>
                            <button onClick={() => setShowModal(false)} className="p-2 rounded-xl bg-zinc-900 text-zinc-400 hover:text-white transition-colors">
                                <X className="w-4 h-4" />
                            </button>
                        </div>

                        {/* Android */}
                        <div className="mb-5">
                            <div className="flex items-center gap-2 mb-3">
                                <div className="p-1.5 rounded-lg bg-green-500/20 text-green-400"><Smartphone className="w-4 h-4" /></div>
                                <span className="text-sm font-bold text-zinc-200">Android — Chrome</span>
                            </div>
                            <div className="space-y-2 pl-1">
                                {[
                                    'Open this website in Chrome',
                                    'Tap the ⋮ menu (3 dots) in top-right corner',
                                    'Tap "Install app" or "Add to Home screen"',
                                    'Tap "Install" to confirm',
                                ].map((text, i) => (
                                    <div key={i} className="flex items-start gap-3">
                                        <span className="w-5 h-5 rounded-full bg-indigo-600/30 text-indigo-400 text-[10px] font-bold flex items-center justify-center shrink-0 mt-0.5">{i + 1}</span>
                                        <p className="text-xs text-zinc-400 leading-relaxed">{text}</p>
                                    </div>
                                ))}
                            </div>
                        </div>

                        <div className="border-t border-white/5 my-4" />

                        {/* iOS */}
                        <div className="mb-5">
                            <div className="flex items-center gap-2 mb-3">
                                <div className="p-1.5 rounded-lg bg-zinc-800 text-zinc-300"><Apple className="w-4 h-4" /></div>
                                <span className="text-sm font-bold text-zinc-200">iPhone / iPad — Safari</span>
                            </div>
                            <div className="space-y-2 pl-1">
                                {[
                                    'Open this website in Safari (not Chrome)',
                                    'Tap the Share button (□↑) at the bottom',
                                    'Scroll down and tap "Add to Home Screen"',
                                    'Tap "Add" in the top-right corner',
                                ].map((text, i) => (
                                    <div key={i} className="flex items-start gap-3">
                                        <span className="w-5 h-5 rounded-full bg-indigo-600/30 text-indigo-400 text-[10px] font-bold flex items-center justify-center shrink-0 mt-0.5">{i + 1}</span>
                                        <p className="text-xs text-zinc-400 leading-relaxed">{text}</p>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </>
    );
}
