import { useEffect, useState } from 'react';
import { createClient } from '@/utils/supabase/client';
import { X, Check, UserPlus, Shield } from 'lucide-react';
import { getUserAvatar } from '@/utils/avatar-helpers';

interface FriendRequest {
    id: string;
    created_at: string;
    user: {
        id: string;
        username: string | null;
        full_name: string | null;
        avatar_url: string | null;
        gender: string | null;
    };
}

interface FriendRequestsModalProps {
    isOpen: boolean;
    onClose: () => void;
    currentUserId: string;
}

export function FriendRequestsModal({ isOpen, onClose, currentUserId }: FriendRequestsModalProps) {
    const [requests, setRequests] = useState<FriendRequest[]>([]);
    const [loading, setLoading] = useState(false);
    const supabase = createClient();

    useEffect(() => {
        if (isOpen && currentUserId) {
            loadRequests();
        }
    }, [isOpen, currentUserId]);

    const loadRequests = async () => {
        setLoading(true);
        // Safety timeout to prevent infinite spinner
        const safetyTimer = setTimeout(() => {
            console.warn('Friend request loading timed out');
            setLoading(false);
        }, 8000);

        try {
            // 1. Fetch pending requests
            const { data: friendships, error: friendError } = await supabase
                .from('friendships')
                .select('id, created_at, user_id')
                .eq('friend_id', currentUserId)
                .eq('status', 'pending');

            if (friendError) {
                console.error('Error fetching requests:', friendError);
                return;
            }

            if (!friendships || friendships.length === 0) {
                setRequests([]);
                return;
            }

            // 2. Fetch sender profiles
            const senderIds = friendships.map(f => f.user_id);
            const { data: profiles, error: profileError } = await supabase
                .from('profiles')
                .select('id, username, full_name, avatar_url, gender')
                .in('id', senderIds);

            if (profileError) {
                console.error('Error fetching profiles:', profileError);
                return;
            }

            // 3. Combine data
            const formattedRequests = friendships.map(friendship => {
                const profile = profiles?.find(p => p.id === friendship.user_id);
                return {
                    id: friendship.id,
                    created_at: friendship.created_at,
                    user: profile || {
                        id: friendship.user_id,
                        username: 'Unknown User',
                        full_name: 'Unknown User',
                        avatar_url: null,
                        gender: null
                    }
                };
            });

            setRequests(formattedRequests);
        } catch (e) {
            console.error('Unexpected error loading requests:', e);
        } finally {
            clearTimeout(safetyTimer);
            setLoading(false);
        }
    };

    const handleAccept = async (requestId: string) => {
        const { error } = await supabase
            .from('friendships')
            .update({ status: 'accepted' })
            .eq('id', requestId);

        if (!error) {
            setRequests(prev => prev.filter(r => r.id !== requestId));
            // Ideally trigger a refresh of friends list in parent, but Realtime might handle it
        }
    };

    const handleDecline = async (requestId: string) => {
        const { error } = await supabase
            .from('friendships')
            .delete()
            .eq('id', requestId);

        if (!error) {
            setRequests(prev => prev.filter(r => r.id !== requestId));
        }
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-200">
            <div className="w-full max-w-md bg-zinc-900 border border-zinc-800 rounded-2xl shadow-xl overflow-hidden animate-in zoom-in-95 duration-200">
                {/* Header */}
                <div className="p-4 border-b border-zinc-800 flex items-center justify-between bg-zinc-900/50">
                    <h2 className="text-lg font-semibold text-white flex items-center gap-2">
                        <UserPlus className="w-5 h-5 text-blue-500" />
                        Friend Requests
                        {requests.length > 0 && (
                            <span className="bg-blue-500 text-white text-xs px-2 py-0.5 rounded-full">
                                {requests.length}
                            </span>
                        )}
                    </h2>
                    <button
                        onClick={onClose}
                        className="p-1 text-zinc-400 hover:text-white rounded-full hover:bg-zinc-800 transition-colors"
                    >
                        <X className="w-5 h-5" />
                    </button>
                </div>

                {/* Content */}
                <div className="max-h-[60vh] overflow-y-auto p-2">
                    {loading ? (
                        <div className="flex justify-center py-8">
                            <div className="w-6 h-6 border-2 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
                        </div>
                    ) : requests.length === 0 ? (
                        <div className="text-center py-12 px-4">
                            <div className="w-12 h-12 bg-zinc-800 rounded-full flex items-center justify-center mx-auto mb-3">
                                <Shield className="w-6 h-6 text-zinc-500" />
                            </div>
                            <h3 className="text-zinc-300 font-medium mb-1">No pending requests</h3>
                            <p className="text-sm text-zinc-500">
                                Call to the void, and perhaps it shall answer.
                            </p>
                        </div>
                    ) : (
                        <div className="space-y-1">
                            {requests.map((request) => (
                                <div
                                    key={request.id}
                                    className="p-3 rounded-xl bg-zinc-800/30 hover:bg-zinc-800/50 border border-transparent hover:border-zinc-700 transition-all group"
                                >
                                    <div className="flex items-center gap-3">
                                        <div className="relative">
                                            <img
                                                src={getUserAvatar(request.user.avatar_url, request.user.gender, request.user.id)}
                                                alt={request.user.username || 'User'}
                                                className="w-10 h-10 rounded-full object-cover border border-zinc-700"
                                            />
                                        </div>

                                        <div className="flex-1 min-w-0">
                                            <h3 className="text-sm font-medium text-white truncate">
                                                {request.user.full_name || request.user.username}
                                            </h3>
                                            <p className="text-xs text-zinc-400 truncate">
                                                @{request.user.username}
                                            </p>
                                        </div>

                                        <div className="flex items-center gap-2">
                                            <button
                                                onClick={() => handleAccept(request.id)}
                                                className="p-2 bg-blue-500/10 text-blue-400 hover:bg-blue-500 hover:text-white rounded-lg transition-colors"
                                                title="Accept"
                                            >
                                                <Check className="w-4 h-4" />
                                            </button>
                                            <button
                                                onClick={() => handleDecline(request.id)}
                                                className="p-2 bg-red-500/10 text-red-400 hover:bg-red-500 hover:text-white rounded-lg transition-colors"
                                                title="Decline"
                                            >
                                                <X className="w-4 h-4" />
                                            </button>
                                        </div>
                                    </div>
                                    <div className="mt-2 text-[10px] text-zinc-600 pl-14">
                                        Sent {new Date(request.created_at).toLocaleDateString()}
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
