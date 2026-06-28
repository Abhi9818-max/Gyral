"use client";
import { useEffect } from 'react';

export function PWAInit() {
    useEffect(() => {
        if (typeof window !== 'undefined') {
            // Suppress context menus on images/videos (long-press on mobile)
            const handleContextMenu = (e: MouseEvent) => {
                const target = e.target as HTMLElement;
                if (target && (target.tagName === 'IMG' || target.tagName === 'VIDEO' || target.closest('img') || target.closest('video'))) {
                    e.preventDefault();
                }
            };
            window.addEventListener('contextmenu', handleContextMenu);
            return () => {
                window.removeEventListener('contextmenu', handleContextMenu);
            };
        }
    }, []);
    return null;
}
