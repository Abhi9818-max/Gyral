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

            // Prevent context menus on images/videos to suppress copy/download/share popup on long press
            const handleContextMenu = (e: MouseEvent) => {
                const target = e.target as HTMLElement;
                if (target && (target.tagName === 'IMG' || target.tagName === 'VIDEO' || target.closest('img') || target.closest('video'))) {
                    e.preventDefault();
                }
            };
            window.addEventListener('contextmenu', handleContextMenu);

            if ('serviceWorker' in navigator) {
                window.addEventListener('load', () => {
                    navigator.serviceWorker.register('/sw.js').then(reg => {
                        console.log('SW registered:', reg.scope);
                    }).catch(err => {
                        console.error('SW Error:', err);
                    });
                });
            }

            return () => {
                window.removeEventListener('beforeinstallprompt', handlePrompt);
                window.removeEventListener('contextmenu', handleContextMenu);
            };
        }
    }, []);
    return null;
}
