"use client";

import { createContext, useContext, useEffect, useState } from 'react';
import { createClient } from '@/utils/supabase/client';
import { MessageCircle, X } from 'lucide-react';

interface MessageNotification {
    id: string;
    sender_name: string;
    content: string;
    sender_id: string;
}

interface MessageNotificationContextType {
    unreadCount: number;
    friendRequestCount: number;
    setActiveChatPartner: (id: string | null) => void;
}

const MessageNotificationContext = createContext<MessageNotificationContextType>({
    unreadCount: 0,
    friendRequestCount: 0,
    setActiveChatPartner: () => { }
});

export function useMessageNotifications() {
    return useContext(MessageNotificationContext);
}

export function MessageNotificationProvider({ children }: { children: React.ReactNode }) {
    const [currentUser, setCurrentUser] = useState<string | null>(null);
    const [unreadCount, setUnreadCount] = useState(0);
    const [friendRequestCount, setFriendRequestCount] = useState(0);
    const [notification, setNotification] = useState<MessageNotification | null>(null);
    const [activeChatPartnerId, setActiveChatPartnerId] = useState<string | null>(null);

    const supabase = createClient();

    useEffect(() => {
        const init = async () => {
            const { data: { user } } = await supabase.auth.getUser();
            if (user) {
                setCurrentUser(user.id);
                loadUnreadCount(user.id);
                loadFriendRequestCount(user.id);
            }
        };
        init();
    }, []);

    const loadUnreadCount = async (userId: string) => {
        const { count } = await supabase
            .from('messages')
            .select('*', { count: 'exact', head: true })
            .eq('receiver_id', userId)
            .eq('read', false);

        setUnreadCount(count || 0);
    };


    // Subscribe to new messages
    useEffect(() => {
        if (!currentUser) return;

        const channel = supabase
            .channel('new_messages')
            .on(
                'postgres_changes',
                {
                    event: 'INSERT',
                    schema: 'public',
                    table: 'messages',
                    filter: `receiver_id=eq.${currentUser}`
                },
                async (payload) => {
                    const newMessage = payload.new;

                    // Don't show toast if we are currently chatting with this person
                    if (newMessage.sender_id === activeChatPartnerId) {
                        return;
                    }

                    // Get sender info
                    const { data: sender } = await supabase
                        .from('profiles')
                        .select('full_name, username')
                        .eq('id', newMessage.sender_id)
                        .single();

                    // Play notification sound
                    try {
                        const audio = new Audio('data:audio/wav;base64,UklGRnoGAABXQVZFZm10IBAAAAABAAEAQB8AAEAfAAABAAgAZGF0YQoGAACBhYqFbF1fdJivrJBhNjVgodDbq2EcBj+a2/LDciUFLIHO8tiJNwgZaLvt555NEAxQp+PwtmMcBjiR1/LMeSwFJHfH8N2QQAoUXrTp66hVFApGn+DyvmwhBSuBzvLZiTYIGGa57OacTBALUKXi8LdjHAU2j9Xxyn0pBSV1xe/glUELElyx6OyrWBQKQ5zd8sFuIgUrfs7y24o3CBdlu+znm00QC0+f4fC3Yx0FNY7U8Ml9KgUkdMPv4ZVBC');
                        audio.volume = 0.3;
                        audio.play().catch(() => { }); // Ignore if sound fails
                    } catch (e) {
                        // Ignore sound errors
                    }

                    // Show notification
                    setNotification({
                        id: newMessage.id,
                        sender_name: sender?.full_name || sender?.username || 'Someone',
                        content: newMessage.content,
                        sender_id: newMessage.sender_id
                    });

                    // Update unread count
                    setUnreadCount(prev => prev + 1);

                    // Auto-hide after 7 seconds (longer for better visibility)
                    setTimeout(() => {
                        setNotification(null);
                    }, 7000);
                }
            )
            .subscribe();

        return () => {
            supabase.removeChannel(channel);
        };
    }, [currentUser]);

    const loadFriendRequestCount = async (userId: string) => {
        const { count } = await supabase
            .from('friendships')
            .select('*', { count: 'exact', head: true })
            .eq('friend_id', userId)
            .eq('status', 'pending');

        setFriendRequestCount(count || 0);
    };


    // Subscribe to friend requests
    useEffect(() => {
        if (!currentUser) return;

        const channel = supabase
            .channel('friend_requests')
            .on(
                'postgres_changes',
                {
                    event: 'INSERT',
                    schema: 'public',
                    table: 'friendships',
                    filter: `friend_id=eq.${currentUser}`
                },
                () => {
                    // Reload count when new request arrives
                    loadFriendRequestCount(currentUser);
                }
            )
            .on(
                'postgres_changes',
                {
                    event: 'UPDATE',
                    schema: 'public',
                    table: 'friendships',
                    filter: `friend_id=eq.${currentUser}`
                },
                () => {
                    // Reload count when request is accepted/declined
                    loadFriendRequestCount(currentUser);
                }
            )
            .on(
                'postgres_changes',
                {
                    event: 'DELETE',
                    schema: 'public',
                    table: 'friendships',
                    filter: `friend_id=eq.${currentUser}`
                },
                () => {
                    // Reload count when request is cancelled
                    loadFriendRequestCount(currentUser);
                }
            )
            .subscribe();

        return () => {
            supabase.removeChannel(channel);
        };
    }, [currentUser]);

    const handleNotificationClick = () => {
        if (notification) {
            window.location.href = `/messages?user=${notification.sender_id}`;
        }
    };

    return (
        <MessageNotificationContext.Provider value={{ unreadCount, friendRequestCount, setActiveChatPartner: setActiveChatPartnerId }}>
            {children}

            {/* Global Notification Toast - WhatsApp/Instagram Style */}
            {notification && (
                <div className="fixed bottom-4 right-4 z-[200] animate-[slideInRight_0.3s_ease-out]">
                    <div
                        onClick={handleNotificationClick}
                        className="bg-gradient-to-br from-zinc-900 to-black border-2 border-blue-500 rounded-2xl shadow-[0_0_40px_rgba(59,130,246,0.5)] p-4 min-w-[340px] max-w-md cursor-pointer hover:scale-105 transition-transform"
                    >
                        <div className="flex items-start gap-3">
                            {/* Icon with pulse animation */}
                            <div className="relative flex-shrink-0">
                                <div className="absolute inset-0 bg-blue-500 rounded-full animate-ping opacity-75"></div>
                                <div className="relative w-12 h-12 rounded-full bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center">
                                    <MessageCircle className="w-6 h-6 text-white" />
                                </div>
                            </div>

                            <div className="flex-1 min-w-0 pt-1">
                                <div className="font-bold text-white mb-1 flex items-center gap-2">
                                    <span className="text-blue-400">New Message</span>
                                    <span className="w-2 h-2 bg-blue-500 rounded-full animate-pulse"></span>
                                </div>
                                <div className="font-semibold text-white mb-1">
                                    {notification.sender_name}
                                </div>
                                <div className="text-sm text-zinc-300 line-clamp-2 mb-2">
                                    {notification.content}
                                </div>
                                <div className="flex items-center gap-2">
                                    <div className="px-3 py-1 bg-blue-500 hover:bg-blue-600 text-white text-xs font-bold rounded-full transition-colors">
                                        Reply →
                                    </div>
                                    <div className="text-xs text-zinc-500">Click to view</div>
                                </div>
                            </div>

                            <button
                                onClick={(e) => {
                                    e.stopPropagation();
                                    setNotification(null);
                                }}
                                className="text-zinc-400 hover:text-white transition-colors p-1"
                            >
                                <X className="w-5 h-5" />
                            </button>
                        </div>
                    </div>
                </div>
            )}

        </MessageNotificationContext.Provider>
    );
}
