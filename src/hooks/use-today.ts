import { useState, useEffect } from 'react';

function getLocalDateStr() {
    const now = new Date();
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, '0');
    const day = String(now.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
}

export function useToday() {
    const [todayStr, setTodayStr] = useState(() => getLocalDateStr());

    useEffect(() => {
        const checkDate = () => {
            const current = getLocalDateStr();
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
