"use client";

import { useEffect, useState } from 'react';
import { createClient } from '@/utils/supabase/client';

export function usePresence() {
    const [isOnline, setIsOnline] = useState(true);
    const supabase = createClient();

    useEffect(() => {
        let presenceChannel: any;
        let heartbeatInterval: NodeJS.Timeout;

        const initPresence = async () => {
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) return;

            // Mark user as online
            await updatePresence(user.id, 'online');

            // Set up heartbeat to keep presence alive
            heartbeatInterval = setInterval(async () => {
                if (isOnline) {
                    await updatePresence(user.id, 'online');
                }
            }, 30000); // Update every 30 seconds

            // Handle page visibility changes
            const handleVisibilityChange = async () => {
                if (document.hidden) {
                    setIsOnline(false);
                    await updatePresence(user.id, 'away');
                } else {
                    setIsOnline(true);
                    await updatePresence(user.id, 'online');
                }
            };

            document.addEventListener('visibilitychange', handleVisibilityChange);

            // Mark offline on unmount
            return () => {
                clearInterval(heartbeatInterval);
                document.removeEventListener('visibilitychange', handleVisibilityChange);
                updatePresence(user.id, 'offline');
            };
        };

        initPresence();

        // Cleanup on unmount
        return () => {
            if (heartbeatInterval) clearInterval(heartbeatInterval);
        };
    }, [isOnline]);

    const updatePresence = async (userId: string, status: 'online' | 'offline' | 'away') => {
        await supabase
            .from('user_presence')
            .upsert({
                user_id: userId,
                status,
                last_seen: new Date().toISOString(),
                updated_at: new Date().toISOString()
            }, { onConflict: 'user_id' });
    };

    return { isOnline };
}

// Hook to get presence for specific users
export function useUserPresence(userIds: string[]) {
    const [presenceMap, setPresenceMap] = useState<Record<string, {
        status: string;
        last_seen: string;
    }>>({});
    const supabase = createClient();

    useEffect(() => {
        if (!userIds || userIds.length === 0) return;

        const loadPresence = async () => {
            const { data } = await supabase
                .from('user_presence')
                .select('user_id, status, last_seen')
                .in('user_id', userIds);

            if (data) {
                const map: Record<string, { status: string; last_seen: string }> = {};
                data.forEach((p) => {
                    map[p.user_id] = {
                        status: p.status,
                        last_seen: p.last_seen
                    };
                });
                setPresenceMap(map);
            }
        };

        loadPresence();

        // Subscribe to presence changes
        const channel = supabase
            .channel('presence_changes')
            .on(
                'postgres_changes',
                {
                    event: '*',
                    schema: 'public',
                    table: 'user_presence',
                    filter: `user_id=in.(${userIds.join(',')})`
                },
                () => {
                    loadPresence();
                }
            )
            .subscribe();

        return () => {
            supabase.removeChannel(channel);
        };
    }, [userIds.join(',')]);

    return presenceMap;
}
