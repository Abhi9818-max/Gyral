"use client";

import { useEffect, useState, useRef, useCallback, Suspense } from 'react';
import { Header } from '@/components/header';
import { createClient } from '@/utils/supabase/client';
import { useSearchParams, useRouter } from 'next/navigation';
import { Send, ArrowLeft, Users, Shield, UserPlus, Edit2, Trash2, X as XIcon, CornerUpLeft, Check, Bell } from 'lucide-react';
import { getUserAvatar } from '@/utils/avatar-helpers';
import { useUserPresence } from '@/hooks/usePresence';
import { CreateGroupModal } from '@/components/modals/create-group-modal';
import { BlockReportModal } from '@/components/modals/block-report-modal';
import { FriendRequestsModal } from '@/components/modals/friend-requests-modal';
import { useMessageNotifications } from '@/context/message-notification-context';

interface Friend {
    id: string;
    full_name: string | null;
    username: string | null;
    avatar_url: string | null;
    gender: string | null;
}

interface Message {
    id: string;
    sender_id: string;
    receiver_id: string;
    content: string;
    created_at: string;
    read: boolean;
    deleted?: boolean;
    edited_at?: string | null;
    reply_to?: string | null;
}

function MessagesContent() {
    const searchParams = useSearchParams();
    const router = useRouter();
    const supabase = createClient();
    const messagesEndRef = useRef<HTMLDivElement>(null);

    const [currentUser, setCurrentUser] = useState<string | null>(null);
    const [friends, setFriends] = useState<Friend[]>([]);
    const [selectedFriend, setSelectedFriend] = useState<Friend | null>(null);
    const [messages, setMessages] = useState<Message[]>([]);
    const [newMessage, setNewMessage] = useState('');
    const [editingMessageId, setEditingMessageId] = useState<string | null>(null);
    const [editContent, setEditContent] = useState('');
    const [replyingTo, setReplyingTo] = useState<Message | null>(null);

    // States for gestures and selection
    const [selectedMessages, setSelectedMessages] = useState<string[]>([]);
    const [swipeOffset, setSwipeOffset] = useState<{ id: string; x: number } | null>(null);
    const [touchStart, setTouchStart] = useState<{ x: number; y: number } | null>(null);
    const longPressTimer = useRef<NodeJS.Timeout | null>(null);

    const [isLoading, setIsLoading] = useState(true);
    const [isTyping, setIsTyping] = useState(false);

    // Modal states
    const [isCreateGroupOpen, setIsCreateGroupOpen] = useState(false);
    const [isBlockReportOpen, setIsBlockReportOpen] = useState(false);
    const [isFriendRequestsOpen, setIsFriendRequestsOpen] = useState(false);
    const [typingTimeout, setTypingTimeout] = useState<NodeJS.Timeout | null>(null);

    const { friendRequestCount, setActiveChatPartner } = useMessageNotifications();

    // Get presence for all friends
    const presenceMap = useUserPresence(friends.map(f => f.id));

    // Get current user
    useEffect(() => {
        const getCurrentUser = async () => {
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) {
                router.push('/');
                return;
            }
            setCurrentUser(user.id);
        };
        getCurrentUser();
    }, []);

    // Load friends
    useEffect(() => {
        if (!currentUser) return;
        loadFriends();
    }, [currentUser]);

    // Auto-select friend from URL
    useEffect(() => {
        const userId = searchParams.get('user');
        if (userId && friends.length > 0) {
            const friend = friends.find(f => f.id === userId);
            if (friend) {
                setSelectedFriend(friend);
            }
        }
    }, [searchParams, friends]);

    // Load messages when friend is selected
    useEffect(() => {
        if (selectedFriend && currentUser) {
            setActiveChatPartner(selectedFriend.id);
            loadMessages();
            markMessagesAsRead();
            subscribeToMessages();
        } else {
            setActiveChatPartner(null);
        }
    }, [selectedFriend, currentUser]);

    // Auto-scroll to bottom when messages change
    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [messages]);

    const loadFriends = async () => {
        setIsLoading(true);

        const { data: data1 } = await supabase
            .from('friendships')
            .select('friend_id')
            .eq('user_id', currentUser)
            .eq('status', 'accepted');

        const { data: data2 } = await supabase
            .from('friendships')
            .select('user_id')
            .eq('friend_id', currentUser)
            .eq('status', 'accepted');

        const friendIds: string[] = [];
        if (data1) data1.forEach((f) => friendIds.push(f.friend_id));
        if (data2) data2.forEach((f) => friendIds.push(f.user_id));

        if (friendIds.length === 0) {
            setFriends([]);
            setIsLoading(false);
            return;
        }

        const { data: profilesData } = await supabase
            .from('profiles')
            .select('id, full_name, username, avatar_url, gender')
            .in('id', friendIds);

        setFriends(profilesData || []);
        setIsLoading(false);
    };

    const loadMessages = async () => {
        if (!selectedFriend || !currentUser) return;

        const { data, error } = await supabase
            .from('messages')
            .select('*')
            .or(`and(sender_id.eq.${currentUser},receiver_id.eq.${selectedFriend.id}),and(sender_id.eq.${selectedFriend.id},receiver_id.eq.${currentUser})`)
            .order('created_at', { ascending: true });

        if (error) {
            console.error('Error loading messages:', error);
            return;
        }

        setMessages(data || []);
    };

    const markMessagesAsRead = async () => {
        if (!selectedFriend || !currentUser) return;

        await supabase
            .from('messages')
            .update({ read: true })
            .eq('receiver_id', currentUser)
            .eq('sender_id', selectedFriend.id)
            .eq('read', false);
    };

    const subscribeToMessages = () => {
        if (!selectedFriend || !currentUser) return;

        const channel = supabase
            .channel('messages')
            .on(
                'postgres_changes',
                {
                    event: 'INSERT',
                    schema: 'public',
                    table: 'messages',
                    filter: `receiver_id=eq.${currentUser}`
                },
                (payload) => {
                    const newMsg = payload.new as Message;
                    if (newMsg.sender_id === selectedFriend.id) {
                        setMessages(prev => [...prev, newMsg]);
                        markMessagesAsRead();
                    }
                }
            )
            .subscribe();

        return () => {
            supabase.removeChannel(channel);
        };
    };

    // Subscribe to typing indicators
    useEffect(() => {
        if (!selectedFriend || !currentUser) return;

        const channel = supabase
            .channel(`typing:${selectedFriend.id}`)
            .on('broadcast', { event: 'typing' }, (payload) => {
                if (payload.payload.userId === selectedFriend.id) {
                    setIsTyping(true);
                    setTimeout(() => setIsTyping(false), 3000);
                }
            })
            .subscribe();

        return () => {
            supabase.removeChannel(channel);
        };
    }, [selectedFriend, currentUser]);

    const broadcastTyping = () => {
        if (!selectedFriend || !currentUser) return;
        if (typingTimeout) clearTimeout(typingTimeout);

        supabase.channel(`typing:${currentUser}`).send({
            type: 'broadcast',
            event: 'typing',
            payload: { userId: currentUser }
        });

        const timeout = setTimeout(() => {
            setTypingTimeout(null);
        }, 2000);
        setTypingTimeout(timeout);
    };

    const startEdit = (msg: Message) => {
        setEditingMessageId(msg.id);
        setEditContent(msg.content);
    };

    const cancelEdit = () => {
        setEditingMessageId(null);
        setEditContent('');
    };

    const handleSaveEdit = async (msgId: string) => {
        if (!editContent.trim()) return;
        const { error } = await supabase
            .from('messages')
            .update({ content: editContent, edited_at: new Date().toISOString() })
            .eq('id', msgId);

        if (!error) {
            setEditingMessageId(null);
            setMessages(prev => prev.map(m => m.id === msgId ? { ...m, content: editContent, edited_at: new Date().toISOString() } : m));
        }
    };

    const toggleMessageSelection = (msgId: string) => {
        setSelectedMessages(prev =>
            prev.includes(msgId)
                ? prev.filter(id => id !== msgId)
                : [...prev, msgId]
        );
    };

    const clearSelection = () => {
        setSelectedMessages([]);
    };

    const handleLongPress = (msgId: string) => {
        toggleMessageSelection(msgId);
        if (window.navigator?.vibrate) window.navigator.vibrate(50);
    };

    const startLongPressTimer = (msgId: string) => {
        if (longPressTimer.current) clearTimeout(longPressTimer.current);
        longPressTimer.current = setTimeout(() => {
            handleLongPress(msgId);
        }, 500);
    };

    const clearLongPressTimer = () => {
        if (longPressTimer.current) {
            clearTimeout(longPressTimer.current);
            longPressTimer.current = null;
        }
    };

    const handleTouchStart = (msgId: string, e: React.TouchEvent | React.MouseEvent) => {
        const x = 'touches' in e ? e.touches[0].clientX : (e as React.MouseEvent).clientX;
        const y = 'touches' in e ? e.touches[0].clientY : (e as React.MouseEvent).clientY;
        setTouchStart({ x, y });
        startLongPressTimer(msgId);
    };

    const handleTouchMove = (msgId: string, e: React.TouchEvent | React.MouseEvent) => {
        if (!touchStart) return;
        const x = 'touches' in e ? e.touches[0].clientX : (e as React.MouseEvent).clientX;
        const deltaX = x - touchStart.x;

        if (Math.abs(deltaX) > 10) clearLongPressTimer();

        const message = messages.find(m => m.id === msgId);
        if (!message) return;

        const isMine = message.sender_id === currentUser;
        const canSwipe = (isMine && deltaX < 0) || (!isMine && deltaX > 0);

        if (canSwipe) {
            setSwipeOffset({ id: msgId, x: deltaX });
        }
    };

    const handleTouchEnd = (msgId: string) => {
        clearLongPressTimer();
        if (swipeOffset && swipeOffset.id === msgId) {
            if (Math.abs(swipeOffset.x) > 60) {
                const msg = messages.find(m => m.id === msgId);
                if (msg) setReplyingTo(msg);
            }
        }
        setTouchStart(null);
        setSwipeOffset(null);
    };

    const deleteSelectedMessages = async () => {
        if (selectedMessages.length === 0) return;
        if (!confirm(`Delete ${selectedMessages.length} message(s)?`)) return;

        const { error } = await supabase
            .from('messages')
            .update({ deleted: true })
            .in('id', selectedMessages);

        if (!error) {
            clearSelection();
            loadMessages();
        }
    };

    const sendMessage = async () => {
        if (!newMessage.trim() || !selectedFriend || !currentUser) return;
        setIsTyping(false);
        if (typingTimeout) {
            clearTimeout(typingTimeout);
            setTypingTimeout(null);
        }

        const { error } = await supabase
            .from('messages')
            .insert({
                sender_id: currentUser,
                receiver_id: selectedFriend.id,
                content: newMessage.trim(),
                read: false,
                reply_to: replyingTo?.id || null
            });

        if (!error) {
            setNewMessage('');
            setReplyingTo(null);
            loadMessages();
        }
    };

    const handleKeyPress = (e: React.KeyboardEvent) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            sendMessage();
        }
    };

    return (
        <div className="h-screen flex flex-col bg-black text-white overflow-hidden">
            <Header />

            <div className="flex-1 flex max-w-7xl mx-auto w-full overflow-hidden">
                {/* Friends List Sidebar */}
                <div className={`${selectedFriend ? 'hidden md:flex' : 'flex'} w-full md:w-80 border-r border-white/10 flex-col`}>
                    <div className="p-4 border-b border-white/10 flex justify-between items-center">
                        <h2 className="text-xl font-bold">Messages</h2>
                        <div className="flex items-center gap-1">
                            <button onClick={() => setIsFriendRequestsOpen(true)} className="relative p-2 hover:bg-white/10 rounded-full transition-colors text-zinc-400 hover:text-white">
                                <Bell className="w-5 h-5" />
                                {friendRequestCount > 0 && <span className="absolute top-1 right-1 w-2.5 h-2.5 bg-red-500 rounded-full border border-black"></span>}
                            </button>
                            <button onClick={() => setIsCreateGroupOpen(true)} className="p-2 hover:bg-white/10 rounded-full transition-colors text-zinc-400 hover:text-white">
                                <UserPlus className="w-5 h-5" />
                            </button>
                        </div>
                    </div>

                    <div className="flex-1 overflow-y-auto">
                        {isLoading ? (
                            <div className="p-4 text-center text-zinc-500">Loading...</div>
                        ) : friends.length === 0 ? (
                            <div className="p-4 text-center text-zinc-500">
                                <p className="mb-2">No friends yet</p>
                                <p className="text-sm">Add friends to start chatting!</p>
                            </div>
                        ) : (
                            friends.map(friend => (
                                <button
                                    key={friend.id}
                                    onClick={() => setSelectedFriend(friend)}
                                    className={`w-full p-4 flex items-center gap-3 hover:bg-white/5 transition-colors border-b border-white/5 ${selectedFriend?.id === friend.id ? 'bg-white/10' : ''}`}
                                >
                                    <div className="relative w-12 h-12 rounded-full overflow-hidden flex-shrink-0 border border-white/10">
                                        <img src={getUserAvatar(friend.avatar_url, friend.gender, friend.id)} alt={friend.full_name || 'Friend'} className="w-full h-full object-cover" />
                                        {presenceMap[friend.id]?.status === 'online' && <div className="absolute bottom-0 right-0 w-3.5 h-3.5 bg-green-500 rounded-full border-2 border-black"></div>}
                                    </div>
                                    <div className="flex-1 text-left min-w-0">
                                        <div className="font-semibold truncate">{friend.full_name || friend.username || 'User'}</div>
                                        {friend.username && <div className="text-sm text-zinc-400 truncate">@{friend.username}</div>}
                                    </div>
                                </button>
                            ))
                        )}
                    </div>
                </div>

                {/* Chat Area */}
                <div className={`${selectedFriend ? 'flex' : 'hidden md:flex'} flex-1 flex-col relative overflow-hidden h-full`}>
                    {selectedFriend ? (
                        <>
                            {/* Chat Header (Permanent/Sticky) */}
                            <div className="p-4 border-b border-white/10 flex items-center gap-3 bg-black/80 backdrop-blur-md sticky top-0 z-30 shrink-0">
                                {selectedMessages.length > 0 ? (
                                    <>
                                        <button onClick={clearSelection} className="p-2 hover:bg-white/10 rounded-full transition-colors"><XIcon className="w-5 h-5" /></button>
                                        <div className="flex-1 font-bold text-lg">{selectedMessages.length} selected</div>
                                        <button onClick={deleteSelectedMessages} className="p-2 hover:bg-white/10 rounded-full transition-colors text-red-500"><Trash2 className="w-5 h-5" /></button>
                                    </>
                                ) : (
                                    <>
                                        <button onClick={() => setSelectedFriend(null)} className="md:hidden p-2 hover:bg-white/10 rounded-full transition-colors -ml-2"><ArrowLeft className="w-5 h-5" /></button>
                                        <div className="w-10 h-10 rounded-full overflow-hidden border border-white/10">
                                            <img src={getUserAvatar(selectedFriend.avatar_url, selectedFriend.gender, selectedFriend.id)} alt={selectedFriend.full_name || 'Friend'} className="w-full h-full object-cover" />
                                        </div>
                                        <div className="flex-1">
                                            <div className="font-bold">{selectedFriend.full_name || selectedFriend.username || 'User'}</div>
                                            {presenceMap[selectedFriend.id]?.status === 'online' ? (
                                                <div className="text-[10px] text-green-500 font-medium">Online</div>
                                            ) : (
                                                selectedFriend.username && <div className="text-xs text-zinc-500">@{selectedFriend.username}</div>
                                            )}
                                        </div>
                                        <button onClick={() => setIsBlockReportOpen(true)} className="p-2 hover:bg-white/10 rounded-full transition-colors text-zinc-400 hover:text-red-400"><Shield className="w-5 h-5" /></button>
                                    </>
                                )}
                            </div>

                            {/* Messages List */}
                            <div className="flex-1 overflow-y-auto p-4 space-y-4 select-none scroll-smooth">
                                {messages.map((message, index) => {
                                    const isMine = message.sender_id === currentUser;
                                    const isEditing = editingMessageId === message.id;
                                    const isSelected = selectedMessages.includes(message.id);
                                    const currentOffset = swipeOffset?.id === message.id ? swipeOffset.x : 0;
                                    const isLastSentByMe = isMine && index === messages.length - 1;

                                    return (
                                        <div
                                            key={message.id}
                                            className={`flex flex-col ${isMine ? 'items-end' : 'items-start'} group relative mb-2 transition-colors ${isSelected ? 'bg-blue-500/10' : ''}`}
                                            onMouseDown={(e) => handleTouchStart(message.id, e as any)}
                                            onMouseUp={() => handleTouchEnd(message.id)}
                                            onMouseMove={(e) => handleTouchMove(message.id, e as any)}
                                            onTouchStart={(e) => handleTouchStart(message.id, e)}
                                            onTouchMove={(e) => handleTouchMove(message.id, e)}
                                            onTouchEnd={() => handleTouchEnd(message.id)}
                                            onClick={() => { if (selectedMessages.length > 0) toggleMessageSelection(message.id); }}
                                        >
                                            {/* Swipe Background Action */}
                                            {currentOffset !== 0 && (
                                                <div className={`absolute inset-y-0 flex items-center px-4 transition-opacity ${Math.abs(currentOffset) > 60 ? 'opacity-100' : 'opacity-50'} ${isMine ? 'right-0' : 'left-0'}`}>
                                                    <CornerUpLeft className="w-5 h-5 text-blue-400" />
                                                </div>
                                            )}

                                            <div
                                                style={{ transform: `translateX(${currentOffset}px)` }}
                                                className={`max-w-[75%] rounded-[20px] px-4 py-2.5 relative transition-transform duration-75 ${isMine
                                                    ? 'bg-gradient-to-tr from-[#3f5efb] via-[#a044ff] to-[#f50057] text-white shadow-md'
                                                    : 'bg-zinc-800 text-white border border-white/5'
                                                    } ${isSelected ? 'ring-2 ring-blue-400 ring-inset' : ''}`}
                                            >
                                                {/* Reply Preview */}
                                                {message.reply_to && (
                                                    <div className={`text-xs mb-1.5 pl-2 border-l-2 ${isMine ? 'border-white/40 text-white/80' : 'border-zinc-500 text-zinc-400'} bg-black/5 rounded-r py-1 px-2 mb-2`}>
                                                        <div className="font-bold opacity-60 text-[10px]">
                                                            {messages.find(m => m.id === message.reply_to)?.sender_id === currentUser ? 'You' : (selectedFriend.full_name || selectedFriend.username)}
                                                        </div>
                                                        <div className="truncate text-[10px] opacity-80">
                                                            {messages.find(m => m.id === message.reply_to)?.deleted ? 'This message was deleted' : messages.find(m => m.id === message.reply_to)?.content || 'Original message not found'}
                                                        </div>
                                                    </div>
                                                )}

                                                {isEditing ? (
                                                    <div className="flex flex-col gap-2 min-w-[200px]">
                                                        <input type="text" value={editContent} onChange={(e) => setEditContent(e.target.value)} className="bg-black/20 rounded px-2 py-1 text-sm text-white w-full border border-white/10 outline-none" autoFocus onKeyDown={(e) => { if (e.key === 'Enter') handleSaveEdit(message.id); if (e.key === 'Escape') cancelEdit(); }} />
                                                        <div className="flex justify-end gap-2 text-xs">
                                                            <button onClick={cancelEdit} className="hover:underline opacity-70">Cancel</button>
                                                            <button onClick={() => handleSaveEdit(message.id)} className="font-bold hover:underline">Save</button>
                                                        </div>
                                                    </div>
                                                ) : (
                                                    <>
                                                        <div className={`break-words leading-tight ${message.deleted ? 'italic text-white/50 text-sm' : ''}`}>
                                                            {message.deleted ? 'This message was deleted' : message.content}
                                                        </div>
                                                        {message.edited_at && !message.deleted && <div className="text-[8px] opacity-40 mt-1 text-right">Edited</div>}
                                                    </>
                                                )}
                                            </div>

                                            {/* Seen Status (Instagram Style) */}
                                            {isLastSentByMe && message.read && (
                                                <div className="text-[10px] text-zinc-500 mt-1 mr-1 font-medium animate-in fade-in duration-500">Seen</div>
                                            )}
                                        </div>
                                    );
                                })}

                                {isTyping && (
                                    <div className="flex justify-start">
                                        <div className="bg-zinc-800 text-white px-4 py-3 rounded-[20px] border border-white/5">
                                            <div className="flex items-center gap-1">
                                                <div className="flex gap-1">
                                                    <div className="w-1.5 h-1.5 bg-zinc-500 rounded-full animate-bounce"></div>
                                                    <div className="w-1.5 h-1.5 bg-zinc-500 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
                                                    <div className="w-1.5 h-1.5 bg-zinc-500 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                )}
                                <div ref={messagesEndRef} />
                            </div>

                            {/* Reply Preview Bar */}
                            {replyingTo && (
                                <div className="px-4 py-2 bg-zinc-900/95 backdrop-blur-sm border-t border-white/10 flex items-center justify-between animate-in slide-in-from-bottom-2 duration-150 shrink-0">
                                    <div className="flex items-center gap-3 overflow-hidden">
                                        <div className="p-1.5 bg-blue-500/20 rounded-md"><CornerUpLeft className="w-4 h-4 text-blue-400" /></div>
                                        <div className="text-xs truncate">
                                            <span className="text-zinc-500 block">Replying to {replyingTo.sender_id === currentUser ? 'yourself' : (selectedFriend.full_name || selectedFriend.username)}</span>
                                            <span className="text-zinc-300 italic truncate max-w-[200px] inline-block">{replyingTo.content}</span>
                                        </div>
                                    </div>
                                    <button onClick={() => setReplyingTo(null)} className="p-1.5 hover:bg-white/10 rounded-full text-zinc-500 hover:text-white transition-colors shrink-0"><XIcon className="w-4 h-4" /></button>
                                </div>
                            )}

                            {/* Message Input Bar */}
                            <div className="p-4 border-t border-white/5 bg-black shrink-0">
                                <div className="relative flex items-center gap-2 bg-zinc-900 border border-white/10 rounded-[24px] px-2 py-1.5 focus-within:border-white/20 transition-all">
                                    <input
                                        type="text"
                                        value={newMessage}
                                        onChange={(e) => { setNewMessage(e.target.value); broadcastTyping(); }}
                                        onKeyPress={handleKeyPress}
                                        placeholder="Message..."
                                        className="flex-1 bg-transparent border-none px-3 py-2 text-white text-[15px] focus:outline-none focus:ring-0 placeholder:text-zinc-500"
                                    />
                                    {newMessage.trim() ? (
                                        <button
                                            onClick={sendMessage}
                                            className="px-4 py-2 text-blue-500 font-bold text-sm hover:text-blue-400 transition-colors"
                                        >
                                            Send
                                        </button>
                                    ) : (
                                        <div className="flex items-center gap-3 pr-2 opacity-60">
                                            {/* Instagram-style placeholders */}
                                            <Shield className="w-5 h-5 text-white/70" />
                                            <UserPlus className="w-5 h-5 text-white/70" />
                                        </div>
                                    )}
                                </div>
                            </div>
                        </>
                    ) : (
                        <div className="flex-1 flex items-center justify-center text-zinc-500">
                            <div className="text-center">
                                <Users className="w-16 h-16 mx-auto mb-4 opacity-30" />
                                <p className="text-sm font-medium">Select a friend to start chatting</p>
                            </div>
                        </div>
                    )}
                </div>
            </div>

            {/* Modals */}
            <CreateGroupModal isOpen={isCreateGroupOpen} onClose={() => setIsCreateGroupOpen(false)} friends={friends} />
            {selectedFriend && (
                <BlockReportModal
                    isOpen={isBlockReportOpen}
                    onClose={() => setIsBlockReportOpen(false)}
                    userId={selectedFriend.id}
                    userName={selectedFriend.full_name || selectedFriend.username || 'User'}
                />
            )}
            {currentUser && (
                <FriendRequestsModal
                    isOpen={isFriendRequestsOpen}
                    onClose={() => setIsFriendRequestsOpen(false)}
                    currentUserId={currentUser}
                />
            )}
        </div>
    );
}

export default function MessagesPage() {
    return (
        <Suspense fallback={<div className="h-screen bg-black flex items-center justify-center text-white">Loading messages...</div>}>
            <MessagesContent />
        </Suspense>
    );
}
