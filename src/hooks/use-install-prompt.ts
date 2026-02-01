"use client";
import { useState, useEffect } from 'react';

export function useInstallPrompt() {
    const [isInstallable, setIsInstallable] = useState(false);

    useEffect(() => {
        const check = () => {
            if ((window as any).deferredPrompt) {
                setIsInstallable(true);
            }
        };
        check();
        window.addEventListener('deferred-prompt-available', check);
        return () => window.removeEventListener('deferred-prompt-available', check);
    }, []);

    const promptInstall = async () => {
        const prompt = (window as any).deferredPrompt;
        if (prompt) {
            prompt.prompt();
            const { outcome } = await prompt.userChoice;
            if (outcome === 'accepted') {
                setIsInstallable(false);
                (window as any).deferredPrompt = null;
            }
        }
    };

    return { isInstallable, promptInstall };
}
