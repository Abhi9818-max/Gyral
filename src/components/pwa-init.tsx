"use client";
import { useEffect } from 'react';

export function PWAInit() {
    useEffect(() => {
        if (typeof window !== 'undefined') {
            // Prevent context menus on images/videos to suppress copy/download/share popup on long press
            const handleContextMenu = (e: MouseEvent) => {
                const target = e.target as HTMLElement;
                if (target && (target.tagName === 'IMG' || target.tagName === 'VIDEO' || target.closest('img') || target.closest('video'))) {
                    e.preventDefault();
                }
            };
            window.addEventListener('contextmenu', handleContextMenu);

            if ('serviceWorker' in navigator) {
                const registerSW = () => {
                    navigator.serviceWorker.register('/sw.js').then(reg => {
                        console.log('SW registered:', reg.scope);
                    }).catch(err => {
                        console.error('SW Error:', err);
                    });
                };

                if (document.readyState === 'complete' || document.readyState === 'interactive') {
                    registerSW();
                } else {
                    window.addEventListener('load', registerSW);
                }
            }

            return () => {
                window.removeEventListener('contextmenu', handleContextMenu);
            };
        }
    }, []);
    return null;
}
