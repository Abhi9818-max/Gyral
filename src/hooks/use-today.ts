import { useState, useEffect } from 'react';

export function useToday() {
    const [todayStr, setTodayStr] = useState(() => new Date().toISOString().split('T')[0]);

    useEffect(() => {
        const checkDate = () => {
            const current = new Date().toISOString().split('T')[0];
            setTodayStr(prev => {
                if (current !== prev) {
                    return current;
                }
                return prev;
            });
        };

        const interval = setInterval(checkDate, 60000); // Check every minute
        window.addEventListener('focus', checkDate);
        document.addEventListener('visibilitychange', () => {
            if (document.visibilityState === 'visible') {
                checkDate();
            }
        });

        return () => {
            clearInterval(interval);
            window.removeEventListener('focus', checkDate);
        };
    }, []);

    return todayStr;
}
