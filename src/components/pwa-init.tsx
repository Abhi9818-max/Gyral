"use client";
import { useEffect } from 'react';

export function PWAInit() {
    useEffect(() => {
        if (typeof window !== 'undefined') {
            const handlePrompt = (e: any) => {
                e.preventDefault();
                (window as any).deferredPrompt = e;
                window.dispatchEvent(new Event('deferred-prompt-available'));
            };

            window.addEventListener('beforeinstallprompt', handlePrompt);

            if ('serviceWorker' in navigator) {
                navigator.serviceWorker.register('/sw.js').catch(err => console.error('SW Error:', err));
            }
        }
    }, []);
    return null;
}
