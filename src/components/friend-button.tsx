"use client";

import { useState, useEffect } from 'react';
import { createClient } from '@/utils/supabase/client';
import { UserPlus, UserCheck, UserMinus, MessageCircle, Clock } from 'lucide-react';

interface FriendButtonProps {
    userId: string;
    currentUserId: string;
}

type FriendshipStatus = 'none' | 'pending_sent' | 'pending_received' | 'friends';

export function FriendButton({ userId, currentUserId }: FriendButtonProps) {
    const [status, setStatus] = useState<FriendshipStatus>('none');
    const [isLoading, setIsLoading] = useState(false);
    const supabase = createClient();

    useEffect(() => {
        checkFriendshipStatus();
    }, [userId, currentUserId]);

    const checkFriendshipStatus = async () => {
        if (userId === currentUserId) return; // Don't show button on own profile

        const { data, error } = await supabase
            .from('friendships')
            .select('*')
            .or(`and(user_id.eq.${currentUserId},friend_id.eq.${userId}),and(user_id.eq.${userId},friend_id.eq.${currentUserId})`)
            .maybeSingle();

        if (error) {
            console.error('Error checking friendship:', error);
            return;
        }

        if (!data) {
            setStatus('none');
        } else if (data.status === 'accepted') {
            setStatus('friends');
        } else if (data.user_id === currentUserId) {
            setStatus('pending_sent');
        } else {
            setStatus('pending_received');
        }
    };

    const sendFriendRequest = async () => {
        setIsLoading(true);
        const { error } = await supabase
            .from('friendships')
            .insert({
                user_id: currentUserId,
                friend_id: userId,
                status: 'pending'
            });

        if (error) {
            console.error('Error sending friend request:', error);
            alert('Failed to send friend request');
        } else {
            setStatus('pending_sent');
        }
        setIsLoading(false);
    };

    const acceptFriendRequest = async () => {
        setIsLoading(true);
        const { error } = await supabase
            .from('friendships')
            .update({ status: 'accepted', updated_at: new Date().toISOString() })
            .eq('user_id', userId)
            .eq('friend_id', currentUserId);

        if (error) {
            console.error('Error accepting friend request:', error);
            alert('Failed to accept friend request');
        } else {
            setStatus('friends');
        }
        setIsLoading(false);
    };

    const declineFriendRequest = async () => {
        setIsLoading(true);
        const { error } = await supabase
            .from('friendships')
            .delete()
            .eq('user_id', userId)
            .eq('friend_id', currentUserId);

        if (error) {
            console.error('Error declining friend request:', error);
            alert('Failed to decline friend request');
        } else {
            setStatus('none');
        }
        setIsLoading(false);
    };

    const removeFriend = async () => {
        if (!confirm('Remove this friend?')) return;

        setIsLoading(true);
        const { error } = await supabase
            .from('friendships')
            .delete()
            .or(`and(user_id.eq.${currentUserId},friend_id.eq.${userId}),and(user_id.eq.${userId},friend_id.eq.${currentUserId})`);

        if (error) {
            console.error('Error removing friend:', error);
            alert('Failed to remove friend');
        } else {
            setStatus('none');
        }
        setIsLoading(false);
    };

    // Don't show button on own profile
    if (userId === currentUserId) return null;

    return (
        <div className="flex gap-2">
            {status === 'none' && (
                <button
                    onClick={sendFriendRequest}
                    disabled={isLoading}
                    className="px-4 py-2 bg-blue-500 hover:bg-blue-600 text-white rounded-lg font-semibold transition-colors flex items-center gap-2 disabled:opacity-50"
                >
                    <UserPlus className="w-4 h-4" />
                    Add Friend
                </button>
            )}

            {status === 'pending_sent' && (
                <button
                    disabled
                    className="px-4 py-2 bg-zinc-700 text-zinc-400 rounded-lg font-semibold flex items-center gap-2 cursor-not-allowed"
                >
                    <Clock className="w-4 h-4" />
                    Request Sent
                </button>
            )}

            {status === 'pending_received' && (
                <>
                    <button
                        onClick={acceptFriendRequest}
                        disabled={isLoading}
                        className="px-4 py-2 bg-green-500 hover:bg-green-600 text-white rounded-lg font-semibold transition-colors flex items-center gap-2 disabled:opacity-50"
                    >
                        <UserCheck className="w-4 h-4" />
                        Accept
                    </button>
                    <button
                        onClick={declineFriendRequest}
                        disabled={isLoading}
                        className="px-4 py-2 bg-red-500 hover:bg-red-600 text-white rounded-lg font-semibold transition-colors flex items-center gap-2 disabled:opacity-50"
                    >
                        <UserMinus className="w-4 h-4" />
                        Decline
                    </button>
                </>
            )}

            {status === 'friends' && (
                <>
                    <button
                        onClick={() => window.location.href = `/messages?user=${userId}`}
                        className="px-4 py-2 bg-blue-500 hover:bg-blue-600 text-white rounded-lg font-semibold transition-colors flex items-center gap-2"
                    >
                        <MessageCircle className="w-4 h-4" />
                        Message
                    </button>
                    <button
                        onClick={removeFriend}
                        disabled={isLoading}
                        className="px-4 py-2 bg-zinc-700 hover:bg-zinc-600 text-white rounded-lg font-semibold transition-colors flex items-center gap-2 disabled:opacity-50"
                    >
                        <UserCheck className="w-4 h-4" />
                        Friends
                    </button>
                </>
            )}
        </div>
    );
}
