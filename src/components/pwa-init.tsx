"use client";
import { useEffect } from 'react';

export function PWAInit() {
    useEffect(() => {
        if (typeof window !== 'undefined') {
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            const handlePrompt = (e: any) => {
                e.preventDefault();
                // eslint-disable-next-line @typescript-eslint/no-explicit-any
                (window as any).deferredPrompt = e;
                window.dispatchEvent(new Event('deferred-prompt-available'));
            };

            window.addEventListener('beforeinstallprompt', handlePrompt);

            if ('serviceWorker' in navigator) {
                window.addEventListener('load', () => {
                    navigator.serviceWorker.register('/sw.js').then(reg => {
                        console.log('SW registered:', reg.scope);
                    }).catch(err => {
                        console.error('SW Error:', err);
                    });
                });
            }
        }
    }, []);
    return null;
}
