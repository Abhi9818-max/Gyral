"use client";

import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { Globe, Send, ArrowLeft, MessageSquare, Shield, HelpCircle, User, Sparkles, LogIn, Users, Image, X } from 'lucide-react';
import { useUserData, DEFAULT_FACTIONS } from '@/context/user-data-context';
import { createClient } from '@/utils/supabase/client';
import { getUserAvatar } from '@/utils/avatar-helpers';
import { useUserPresence } from '@/hooks/usePresence';
import { motion, AnimatePresence } from 'framer-motion';

interface ProfileInfo {
    id: string;
    full_name: string | null;
    username: string | null;
    avatar_url: string | null;
    gender: string | null;
    faction_id: string | null;
}

interface ChatMessage {
    id: string;
    room: string;
    sender_id: string;
    content: string | null;
    created_at: string;
    image_url?: string | null;
    profiles?: ProfileInfo;
}

export default function ChatRoomsPage() {
    const router = useRouter();
    const supabase = createClient();
    const { currentFaction, user, isLoaded } = useUserData();
    const messagesEndRef = useRef<HTMLDivElement>(null);
    const inputRef = useRef<HTMLInputElement>(null);
    const imageInputRef = useRef<HTMLInputElement>(null);
    const profileRef = useRef<ProfileInfo | null>(null);

    const [mentionSuggestions, setMentionSuggestions] = useState<ProfileInfo[]>([]);
    const [showSuggestions, setShowSuggestions] = useState(false);

    // Navigation and room selection states
    const [activeRoom, setActiveRoom] = useState<string>('westeros');
    const [mobileShowChat, setMobileShowChat] = useState<boolean>(false);

    // Participant list states
    const [showParticipants, setShowParticipants] = useState<boolean>(false);
    const [roomParticipants, setRoomParticipants] = useState<ProfileInfo[]>([]);
    const [participantsLoading, setParticipantsLoading] = useState<boolean>(false);

    // Image upload states
    const [selectedImage, setSelectedImage] = useState<{ file: File; url: string } | null>(null);
    const [isUploading, setIsUploading] = useState<boolean>(false);

    // Chat data states
    const [messages, setMessages] = useState<ChatMessage[]>([]);
    const [newMessage, setNewMessage] = useState('');
    const [isSending, setIsSending] = useState(false);
    const [isLoading, setIsLoading] = useState(true);
    const [dbError, setDbError] = useState(false);

    // Cache to hold profiles and avoid repetitive database queries
    const [profileCache, setProfileCache] = useState<Record<string, ProfileInfo>>({});

    // Fetch user profile on mount
    const [currentUserProfile, setCurrentUserProfile] = useState<ProfileInfo | null>(null);

    useEffect(() => {
        profileRef.current = currentUserProfile;
    }, [currentUserProfile]);

    const playMentionSound = () => {
        try {
            const ctx = new (window.AudioContext || (window as any).webkitAudioContext)();
            const osc = ctx.createOscillator();
            const gain = ctx.createGain();
            osc.type = 'sine';
            osc.frequency.setValueAtTime(587.33, ctx.currentTime); // D5
            osc.frequency.setValueAtTime(880, ctx.currentTime + 0.1); // A5
            gain.gain.setValueAtTime(0.15, ctx.currentTime);
            gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.45);
            osc.connect(gain);
            gain.connect(ctx.destination);
            osc.start();
            osc.stop(ctx.currentTime + 0.45);
        } catch (e) {
            console.error("Audio error:", e);
        }
    };

    const handleMentionUser = (username: string) => {
        if (!username) return;
        setNewMessage(prev => {
            const suffix = `@${username} `;
            return prev.endsWith(' ') || prev === '' ? prev + suffix : prev + ' ' + suffix;
        });
        setTimeout(() => {
            inputRef.current?.focus();
        }, 50);
    };

    const handleInputChange = async (val: string) => {
        setNewMessage(val);

        const words = val.split(' ');
        const lastWord = words[words.length - 1];

        if (lastWord.startsWith('@') && lastWord.length > 1) {
            const query = lastWord.slice(1).toLowerCase();
            try {
                const { data } = await supabase
                    .from('profiles')
                    .select('id, username, full_name, avatar_url, gender, faction_id')
                    .ilike('username', `${query}%`)
                    .limit(5);

                if (data && data.length > 0) {
                    setMentionSuggestions(data as ProfileInfo[]);
                    setShowSuggestions(true);
                } else {
                    setMentionSuggestions([]);
                    setShowSuggestions(false);
                }
            } catch (e) {
                console.error("Mention search error:", e);
                setMentionSuggestions([]);
                setShowSuggestions(false);
            }
        } else {
            setMentionSuggestions([]);
            setShowSuggestions(false);
        }
    };

    const selectSuggestion = (username: string) => {
        if (!username) return;
        setNewMessage(prev => {
            const words = prev.trim().split(' ');
            if (words.length > 0) {
                words[words.length - 1] = `@${username} `;
            }
            return words.join(' ');
        });
        setShowSuggestions(false);
        setMentionSuggestions([]);
        setTimeout(() => {
            inputRef.current?.focus();
        }, 50);
    };

    // Fetch current user details
    useEffect(() => {
        const fetchCurrentUser = async () => {
            const { data: { user: authUser } } = await supabase.auth.getUser();
            if (!authUser) {
                router.push('/login');
                return;
            }

            const { data: profile } = await supabase
                .from('profiles')
                .select('id, full_name, username, avatar_url, gender, faction_id')
                .eq('id', authUser.id)
                .single();

            if (profile) {
                setCurrentUserProfile(profile);
            }
        };

        fetchCurrentUser();
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    // Fetch room participants
    useEffect(() => {
        if (!user) return;

        let active = true;
        setParticipantsLoading(true);

        const fetchParticipants = async () => {
            try {
                let query = supabase
                    .from('profiles')
                    .select('id, full_name, username, avatar_url, gender, faction_id');

                if (activeRoom !== 'westeros') {
                    // For house rooms, fetch users in that faction
                    query = query.eq('faction_id', activeRoom);
                }

                const { data, error } = await query.order('username', { ascending: true });

                if (error) {
                    console.error('Error fetching participants:', error);
                    return;
                }

                if (active) {
                    setRoomParticipants(data as ProfileInfo[] || []);
                }
            } catch (err) {
                console.error('Failed to fetch participants:', err);
            } finally {
                if (active) {
                    setParticipantsLoading(false);
                }
            }
        };

        fetchParticipants();

        return () => {
            active = false;
        };
    }, [activeRoom, user]);

    const participantIds = roomParticipants.map(p => p.id);
    const presenceMap = useUserPresence(participantIds);

    const handleImageSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        if (!file.type.startsWith('image/')) {
            alert('Please select an image file.');
            return;
        }

        setSelectedImage({
            file,
            url: URL.createObjectURL(file)
        });

        if (imageInputRef.current) {
            imageInputRef.current.value = '';
        }
    };

    // Load messages and subscribe to Realtime channel
    useEffect(() => {
        if (!user) return;

        let active = true;
        setIsLoading(true);
        setDbError(false);

        const loadMessages = async () => {
            try {
                const { data, error } = await supabase
                    .from('house_chats')
                    .select('*, profiles:sender_id(id, full_name, username, avatar_url, gender, faction_id)')
                    .eq('room', activeRoom)
                    .order('created_at', { ascending: true });

                if (error) {
                    // Check if table does not exist
                    if (error.code === '42P01') {
                        setDbError(true);
                    } else {
                        console.error('Error fetching room messages:', error);
                    }
                    setIsLoading(false);
                    return;
                }

                if (active) {
                    setMessages(data || []);
                    setIsLoading(false);
                }
            } catch (err) {
                console.error(err);
                if (active) {
                    setDbError(true);
                    setIsLoading(false);
                }
            }
        };

        loadMessages();

        // Subscribe to real-time updates
        const channel = supabase
            .channel(`room:${activeRoom}`)
            .on(
                'postgres_changes',
                {
                    event: '*',
                    schema: 'public',
                    table: 'house_chats',
                    filter: `room=eq.${activeRoom}`
                },
                async (payload) => {
                    if (payload.eventType === 'INSERT') {
                        const newMsg = payload.new as ChatMessage;
                        
                        // Check if sender profile is already in cache
                        let senderProfile = profileCache[newMsg.sender_id];

                        if (!senderProfile) {
                            const { data } = await supabase
                                .from('profiles')
                                .select('id, full_name, username, avatar_url, gender, faction_id')
                                .eq('id', newMsg.sender_id)
                                .single();
                            
                            if (data) {
                                senderProfile = data;
                                setProfileCache(prev => ({ ...prev, [newMsg.sender_id]: data }));
                            }
                        }

                        if (active) {
                            const enrichedMsg: ChatMessage = {
                                ...newMsg,
                                profiles: senderProfile
                            };
                            setMessages(prev => [...prev, enrichedMsg]);

                            // Play alert sound if mentioned in real-time
                            if (
                                newMsg.sender_id !== user?.id &&
                                profileRef.current?.username &&
                                newMsg.content &&
                                newMsg.content.includes(`@${profileRef.current.username}`)
                            ) {
                                playMentionSound();
                            }
                        }
                    } else if (payload.eventType === 'DELETE') {
                        const deletedMsgId = (payload.old as { id: string }).id;
                        if (active) {
                            setMessages(prev => prev.filter(m => m.id !== deletedMsgId));
                        }
                    }
                }
            )
            .subscribe();

        return () => {
            active = false;
            supabase.removeChannel(channel);
        };
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [activeRoom, user]);

    // Auto-scroll to bottom
    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [messages, isLoading]);

    const handleSendMessage = async () => {
        if ((!newMessage.trim() && !selectedImage) || !user || isSending) return;

        setIsSending(true);
        try {
            let imageUrl: string | null = null;

            if (selectedImage) {
                const fileExt = selectedImage.file.name.split('.').pop() || 'png';
                const fileName = `chat-${activeRoom}-${Date.now()}.${fileExt}`;

                const { error: uploadError } = await supabase.storage
                    .from('chat-media')
                    .upload(fileName, selectedImage.file, {
                        cacheControl: '3600',
                        upsert: false
                    });

                if (uploadError) {
                    console.error('Storage upload error:', uploadError);
                    alert('Failed to upload image. Please ensure the "chat-media" bucket exists in Supabase Storage by running the chat-enhancements.sql script.');
                    setIsSending(false);
                    return;
                }

                // Get public URL
                const { data: { publicUrl } } = supabase.storage
                    .from('chat-media')
                    .getPublicUrl(fileName);

                imageUrl = publicUrl;
            }

            const { error } = await supabase
                .from('house_chats')
                .insert({
                    room: activeRoom,
                    sender_id: user.id,
                    content: newMessage.trim() || null,
                    image_url: imageUrl
                });

            if (error) {
                console.error('Error inserting message:', error);
            } else {
                setNewMessage('');
                setSelectedImage(null);
            }
        } catch (err) {
            console.error('Failed to send message:', err);
        } finally {
            setIsSending(false);
        }
    };

    const handleKeyPress = (e: React.KeyboardEvent) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            handleSendMessage();
        }
    };

    // Find the faction details for a given ID
    const getFactionDetails = (factionId: string | null | undefined) => {
        if (!factionId) return null;
        return DEFAULT_FACTIONS.find(f => f.id === factionId) || null;
    };

    const activeFactionDetails = activeRoom === 'westeros' 
        ? null 
        : DEFAULT_FACTIONS.find(f => f.id === activeRoom);

    if (!isLoaded) {
        return (
            <div className="h-screen bg-black flex flex-col items-center justify-center text-white">
                <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-indigo-500 mb-4" />
                <p className="text-xs font-mono tracking-widest text-zinc-500 uppercase">Entering Westeros...</p>
            </div>
        );
    }

    return (
        <div className="h-screen flex flex-col bg-black text-white overflow-hidden pt-3 md:pt-4 pb-16 md:pb-0">
            {/* Rooms View Layout */}
            <div className="flex-1 flex max-w-7xl mx-auto w-full overflow-hidden relative">
                
                {/* Rooms Selection List Sidebar */}
                <div className={`${mobileShowChat ? 'hidden md:flex' : 'flex'} w-full md:w-80 border-r border-white/10 flex-col shrink-0 bg-zinc-950/20`}>
                    <div className="py-3.5 px-5 border-b border-white/10">
                        <h2 className="text-xl font-black tracking-wider flex items-center gap-2">
                            <MessageSquare className="w-5 h-5 text-indigo-400" />
                            CHAT HALLS
                        </h2>
                        <p className="text-[10px] text-zinc-500 uppercase tracking-widest font-mono mt-1">Select a Room to Chat</p>
                    </div>

                    <div className="flex-1 overflow-y-auto p-3 space-y-2 custom-scrollbar">
                        {/* Westeros Global Room */}
                        <button
                            onClick={() => {
                                setActiveRoom('westeros');
                                setMobileShowChat(true);
                            }}
                            className={`w-full p-4 rounded-xl flex items-center gap-3 transition-all border ${
                                activeRoom === 'westeros'
                                    ? 'bg-gradient-to-r from-yellow-500/10 to-amber-600/5 border-yellow-500/30 shadow-[0_0_15px_rgba(234,179,8,0.05)]'
                                    : 'bg-zinc-900/30 border-white/5 hover:bg-zinc-900/60'
                            }`}
                        >
                            <div className="p-2 bg-yellow-500/10 border border-yellow-500/20 rounded-lg text-yellow-500">
                                <Globe className="w-5 h-5" />
                            </div>
                            <div className="text-left min-w-0 flex-1">
                                <div className="font-bold text-sm tracking-wide text-white">Westeros (Global)</div>
                                <div className="text-[9px] text-yellow-600 font-serif italic mt-0.5">"All realm talks."</div>
                            </div>
                        </button>

                        <div className="h-px bg-white/10 my-4" />
                        <div className="text-[10px] text-zinc-600 font-mono uppercase tracking-widest px-2 pb-1 block">House Rooms</div>

                        {/* House Specific Rooms */}
                        {DEFAULT_FACTIONS.map((faction) => {
                            const isSelected = activeRoom === faction.id;
                            const isUserHouse = currentUserProfile?.faction_id === faction.id;

                            return (
                                <button
                                    key={faction.id}
                                    onClick={() => {
                                        setActiveRoom(faction.id);
                                        setMobileShowChat(true);
                                    }}
                                    className={`w-full p-3.5 rounded-xl flex items-center gap-3 transition-all border ${
                                        isSelected
                                            ? `bg-zinc-900/70 border-white/20`
                                            : 'bg-zinc-900/10 border-white/5 hover:bg-zinc-900/40'
                                    }`}
                                    style={isSelected ? { borderColor: `${faction.primaryColor}50` } : {}}
                                >
                                    <div 
                                        className="w-10 h-10 rounded-lg flex items-center justify-center text-lg border relative flex-shrink-0 overflow-hidden bg-black/50"
                                        style={{ borderColor: isSelected ? faction.primaryColor : 'rgba(255,255,255,0.05)' }}
                                    >
                                        {/* Sigil Image Fallback to Faction First Letter */}
                                        {/* eslint-disable-next-line @next/next/no-img-element */}
                                        <img 
                                            src={faction.sigilUrl} 
                                            alt={faction.name} 
                                            className="w-full h-full object-cover" 
                                            onError={(e) => {
                                                (e.target as HTMLImageElement).style.display = 'none';
                                            }}
                                        />
                                        <span className="text-xs font-mono font-black opacity-40 absolute uppercase">{faction.name.charAt(6)}</span>
                                    </div>
                                    <div className="text-left min-w-0 flex-1">
                                        <div className="flex items-center gap-1.5">
                                            <span className="font-bold text-sm truncate text-white">{faction.name}</span>
                                            {isUserHouse && (
                                                <span className="text-[8px] bg-indigo-500/20 text-indigo-400 border border-indigo-500/30 px-1 rounded uppercase tracking-wider font-mono">My House</span>
                                            )}
                                        </div>
                                        {faction.quote && (
                                            <div className="text-[9px] text-zinc-500 font-serif italic truncate mt-0.5">"{faction.quote}"</div>
                                        )}
                                    </div>
                                </button>
                            );
                        })}
                    </div>
                </div>

                {/* Chat Message Window Area */}
                <div className={`${mobileShowChat ? 'flex' : 'hidden md:flex'} flex-1 flex-col relative overflow-hidden h-full bg-zinc-950/10`}>
                    
                    {/* Header */}
                    <div className="py-3.5 px-4 border-b border-white/10 flex items-center justify-between bg-black/85 backdrop-blur-md sticky top-0 z-30 shrink-0">
                        <div className="flex items-center gap-3">
                            <button 
                                onClick={() => setMobileShowChat(false)} 
                                className="md:hidden p-2 hover:bg-white/5 rounded-full border border-white/10 transition-colors"
                            >
                                <ArrowLeft className="w-5 h-5 text-zinc-400" />
                            </button>

                            {activeRoom === 'westeros' ? (
                                <div className="p-2 bg-yellow-500/10 border border-yellow-500/20 rounded-xl text-yellow-500">
                                    <Globe className="w-6 h-6 animate-pulse" />
                                </div>
                            ) : (
                                <div 
                                    className="w-11 h-11 rounded-xl overflow-hidden border flex items-center justify-center relative bg-black/50"
                                    style={{ borderColor: activeFactionDetails?.primaryColor || 'rgba(255,255,255,0.1)' }}
                                >
                                    {activeFactionDetails && (
                                        /* eslint-disable-next-line @next/next/no-img-element */
                                        <img src={activeFactionDetails.sigilUrl} alt={activeFactionDetails.name} className="w-full h-full object-cover" />
                                    )}
                                </div>
                            )}

                            <div>
                                <h3 className="font-extrabold text-base tracking-wide uppercase">
                                    {activeRoom === 'westeros' ? 'WESTEROS HALL' : activeFactionDetails?.name.toUpperCase()}
                                </h3>
                                <p className="text-[10px] text-zinc-500 font-serif italic">
                                    {activeRoom === 'westeros' ? 'The common speak of the Realm' : `"${activeFactionDetails?.quote}"`}
                                </p>
                            </div>
                        </div>

                        <button
                            onClick={() => setShowParticipants(prev => !prev)}
                            className={`p-2 rounded-full border transition-colors flex items-center justify-center gap-1.5 ${
                                showParticipants 
                                    ? 'bg-indigo-650/40 text-indigo-400 border-indigo-500/30 shadow-[0_0_10px_rgba(99,102,241,0.1)]' 
                                    : 'border-white/10 text-zinc-400 hover:text-white hover:bg-white/5'
                            }`}
                            title="Room Members"
                        >
                            <Users className="w-4 h-4" />
                            <span className="text-[10px] font-mono font-bold">{roomParticipants.length}</span>
                        </button>
                    </div>

                    {/* Messages Panel */}
                    <div className="flex-1 overflow-y-auto p-5 space-y-4 scroll-smooth custom-scrollbar">
                        {dbError ? (
                            <div className="h-full flex items-center justify-center p-6 text-center">
                                <div className="bg-zinc-900/50 border border-yellow-900/30 p-6 rounded-3xl max-w-md space-y-4 shadow-[0_4px_25px_rgba(234,179,8,0.02)]">
                                    <div className="w-12 h-12 bg-yellow-500/10 border border-yellow-500/30 rounded-2xl flex items-center justify-center mx-auto text-yellow-500">
                                        <Shield className="w-6 h-6" />
                                    </div>
                                    <h4 className="text-base font-bold text-white uppercase tracking-wider font-mono">Migration Required</h4>
                                    <p className="text-xs text-zinc-400 leading-relaxed font-mono">
                                        The `house_chats` table is missing in your Supabase database. Please copy the code inside:
                                    </p>
                                    <div className="bg-black/60 p-2.5 rounded-lg border border-white/5 select-all text-[10px] font-mono text-zinc-300">
                                        house-chats-schema.sql
                                    </div>
                                    <p className="text-[10px] text-zinc-500 leading-normal">
                                        Run it in your Supabase SQL Editor to instantly unlock real-time house channels.
                                    </p>
                                </div>
                            </div>
                        ) : isLoading ? (
                            <div className="h-full flex flex-col items-center justify-center text-zinc-500 font-mono text-[11px] uppercase tracking-widest">
                                <div className="animate-pulse mb-2 text-indigo-400">Loading Scroll...</div>
                            </div>
                        ) : messages.length === 0 ? (
                            <div className="h-full flex flex-col items-center justify-center text-center text-zinc-600">
                                <Sparkles className="w-8 h-8 opacity-20 mb-3 animate-[spin_5s_linear_infinite]" />
                                <p className="text-xs font-mono uppercase tracking-wider">The hall falls silent...</p>
                                <p className="text-[10px] text-zinc-700 font-serif italic mt-0.5">Start the conversation</p>
                            </div>
                        ) : (
                            messages.map((message) => {
                                const isMine = message.sender_id === user?.id;
                                const senderFaction = getFactionDetails(message.profiles?.faction_id);
                                const isSystemRoom = activeRoom === 'westeros';

                                const isMentioned = currentUserProfile?.username && message.content && message.content.includes(`@${currentUserProfile.username}`);

                                return (
                                    <div 
                                        key={message.id} 
                                        className={`flex gap-3 max-w-[85%] ${isMine ? 'ml-auto flex-row-reverse' : ''}`}
                                    >
                                        {/* Avatar */}
                                        <div 
                                            onClick={() => handleMentionUser(message.profiles?.username || '')}
                                            className="w-9 h-9 rounded-full overflow-hidden border border-white/10 flex-shrink-0 bg-zinc-900 shadow-inner cursor-pointer hover:border-indigo-500/50 transition-colors"
                                        >
                                            {/* eslint-disable-next-line @next/next/no-img-element */}
                                            <img 
                                                src={getUserAvatar(message.profiles?.avatar_url, message.profiles?.gender, message.sender_id)} 
                                                alt="Avatar" 
                                                className="w-full h-full object-cover" 
                                            />
                                        </div>

                                        {/* Content Bubble */}
                                        <div className="flex flex-col space-y-1 min-w-0">
                                            {/* Meta Header */}
                                            <div className={`flex items-center gap-1.5 text-xs text-zinc-400 select-none ${isMine ? 'justify-end' : ''}`}>
                                                <span 
                                                    onClick={() => handleMentionUser(message.profiles?.username || '')}
                                                    className="font-bold text-white hover:underline cursor-pointer truncate"
                                                >
                                                    {message.profiles?.full_name || message.profiles?.username || 'Vassal'}
                                                </span>
                                                {message.profiles?.username && (
                                                    <span className="text-[10px] text-zinc-500 opacity-80 truncate">
                                                        @{message.profiles.username}
                                                    </span>
                                                )}
                                                
                                                {/* Faction Badge */}
                                                {senderFaction && (
                                                    <span 
                                                        className="text-[8px] px-1.5 py-0.5 rounded font-mono uppercase font-black"
                                                        style={{ 
                                                            backgroundColor: `${senderFaction.primaryColor}15`, 
                                                            color: senderFaction.primaryColor,
                                                            border: `1px solid ${senderFaction.primaryColor}30` 
                                                        }}
                                                    >
                                                        {senderFaction.name.replace('House ', '')}
                                                    </span>
                                                )}
                                            </div>

                                            {/* Chat Bubble Body */}
                                            <div 
                                                className={`rounded-2xl break-words leading-relaxed text-[13px] sm:text-sm border shadow-sm ${
                                                    message.image_url ? 'p-1.5' : 'px-4 py-2.5'
                                                } ${
                                                    isMine
                                                        ? 'bg-gradient-to-tr from-indigo-650 via-indigo-600 to-indigo-500 text-white border-indigo-500/20'
                                                        : isMentioned
                                                            ? 'bg-amber-500/10 text-amber-100 border-amber-500/40 shadow-[0_0_15px_rgba(245,158,11,0.15)] animate-[pulse_2s_infinite]'
                                                            : 'bg-zinc-900/50 text-zinc-100 border-white/5'
                                                }`}
                                                style={isMine && currentFaction ? {
                                                    backgroundImage: `linear-gradient(to top right, ${currentFaction.primaryColor}aa, ${currentFaction.primaryColor}80)`
                                                } : {}}
                                            >
                                                {message.image_url && (
                                                    <div className="mb-1 overflow-hidden rounded-xl border border-white/5 bg-black/20">
                                                        {/* eslint-disable-next-line @next/next/no-img-element */}
                                                        <img 
                                                            src={message.image_url} 
                                                            alt="Shared photo" 
                                                            className="max-w-full max-h-64 sm:max-h-72 object-cover rounded-xl cursor-pointer hover:opacity-90 transition-opacity"
                                                            onClick={() => window.open(message.image_url!, '_blank')}
                                                        />
                                                    </div>
                                                )}
                                                {message.content && (
                                                    <div className={message.image_url ? 'px-2 py-1' : ''}>{message.content}</div>
                                                )}
                                            </div>

                                            {/* Timestamp */}
                                            <span className={`text-[9px] text-zinc-600 font-mono select-none ${isMine ? 'text-right' : ''}`}>
                                                {new Date(message.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                            </span>
                                        </div>
                                    </div>
                                );
                            })
                        )}
                        <div ref={messagesEndRef} />
                    </div>

                    {/* Suggestions Dropdown */}
                    {showSuggestions && mentionSuggestions.length > 0 && (
                        <div className="mx-4 mb-2 p-1.5 bg-zinc-900/95 backdrop-blur-md border border-white/15 rounded-xl shadow-2xl z-40 max-h-40 overflow-y-auto animate-in slide-in-from-bottom-2 duration-150">
                            <div className="text-[9px] text-zinc-500 uppercase tracking-widest font-mono px-2.5 py-1 border-b border-white/5">Suggested Users</div>
                            {mentionSuggestions.map((suggestedUser) => (
                                <button
                                    key={suggestedUser.id}
                                    onClick={() => selectSuggestion(suggestedUser.username || '')}
                                    className="w-full px-2.5 py-1.5 flex items-center gap-2 hover:bg-white/5 rounded-lg transition-colors text-left"
                                >
                                    <div className="w-6 h-6 rounded-full overflow-hidden border border-white/10 shrink-0 bg-zinc-800">
                                        {/* eslint-disable-next-line @next/next/no-img-element */}
                                        <img 
                                            src={getUserAvatar(suggestedUser.avatar_url, suggestedUser.gender, suggestedUser.id)} 
                                            alt={suggestedUser.username || 'User'} 
                                            className="w-full h-full object-cover"
                                        />
                                    </div>
                                    <div className="min-w-0 flex-1">
                                        <div className="text-[11px] font-bold text-white truncate leading-none">{suggestedUser.full_name || 'Vassal'}</div>
                                        {suggestedUser.username && <div className="text-[9px] text-zinc-450 font-mono truncate mt-0.5">@{suggestedUser.username}</div>}
                                    </div>
                                </button>
                            ))}
                        </div>
                    )}

                    {/* Message Input Bar */}
                    {!dbError && (
                        <div className="p-4 border-t border-white/5 bg-black shrink-0">
                            {/* Hidden file input */}
                            <input
                                ref={imageInputRef}
                                type="file"
                                onChange={handleImageSelect}
                                accept="image/*"
                                className="hidden"
                            />

                            {/* Selected Image Preview */}
                            {selectedImage && (
                                <div className="flex items-center gap-2 p-1.5 bg-zinc-900 border border-white/5 rounded-xl mb-3 relative max-w-xs animate-in slide-in-from-bottom-2 duration-150">
                                    <div className="relative w-12 h-12 rounded-lg overflow-hidden border border-white/10 shrink-0 bg-black">
                                        {/* eslint-disable-next-line @next/next/no-img-element */}
                                        <img src={selectedImage.url} alt="Selected preview" className="w-full h-full object-cover" />
                                        <button
                                            onClick={() => setSelectedImage(null)}
                                            className="absolute top-0.5 right-0.5 p-0.5 bg-black/75 hover:bg-black text-zinc-400 hover:text-white rounded-full transition-colors"
                                            title="Remove image"
                                        >
                                            <X className="w-3.5 h-3.5" />
                                        </button>
                                    </div>
                                    <div className="min-w-0 flex-1">
                                        <div className="text-[10px] text-white font-bold truncate">{selectedImage.file.name}</div>
                                        <div className="text-[8px] text-zinc-500 font-mono">{(selectedImage.file.size / 1024).toFixed(1)} KB</div>
                                    </div>
                                </div>
                            )}

                            <div className="relative flex items-center gap-2 bg-zinc-900 border border-white/10 rounded-[22px] px-2.5 py-1.5 transition-all shadow-inner">
                                <input
                                    ref={inputRef}
                                    type="text"
                                    value={newMessage}
                                    onChange={(e) => handleInputChange(e.target.value)}
                                    onKeyDown={handleKeyPress}
                                    placeholder={selectedImage ? "Add a message or send photo..." : `Send message to ${activeRoom === 'westeros' ? 'Westeros Global' : getFactionDetails(activeRoom)?.name || 'House'}...`}
                                    className="flex-1 bg-transparent border-none !outline-none focus:!outline-none focus:ring-0 focus-visible:!outline-none focus-visible:ring-0 px-3 py-1.5 text-white text-sm placeholder:text-zinc-500 !shadow-none ring-0"
                                    style={{ outline: 'none', border: 'none', boxShadow: 'none' }}
                                    disabled={isLoading || isSending}
                                />
                                
                                {/* Image upload icon */}
                                <button
                                    onClick={() => imageInputRef.current?.click()}
                                    disabled={isSending || isLoading}
                                    className="p-2 hover:bg-white/5 text-zinc-400 hover:text-white rounded-full transition-colors shrink-0"
                                    title="Upload Photo"
                                >
                                    <Image className="w-4 h-4" />
                                </button>

                                {(newMessage.trim() || selectedImage) ? (
                                    <button
                                        onClick={handleSendMessage}
                                        disabled={isSending || isLoading}
                                        className="p-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-full transition-colors flex items-center justify-center shrink-0"
                                        style={currentFaction ? { backgroundColor: currentFaction.primaryColor } : {}}
                                    >
                                        {isSending ? (
                                            <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                                        ) : (
                                            <Send className="w-4 h-4" />
                                        )}
                                    </button>
                                ) : (
                                    <div className="flex items-center gap-2 pr-2 text-zinc-500 select-none" title="Realtime chat active">
                                        <HelpCircle className="w-5 h-5 opacity-40 hover:opacity-100 cursor-help" />
                                    </div>
                                )}
                            </div>
                        </div>
                    )}
                </div>

                {/* Desktop Participant Sidebar */}
                <AnimatePresence>
                    {showParticipants && (
                        <motion.div
                            initial={{ width: 0, opacity: 0 }}
                            animate={{ width: 280, opacity: 1 }}
                            exit={{ width: 0, opacity: 0 }}
                            className="hidden lg:flex w-[280px] border-l border-white/10 flex-col shrink-0 bg-zinc-950/20 h-full relative"
                        >
                            <div className="py-3.5 px-4 border-b border-white/10 flex items-center justify-between bg-black/50">
                                <h3 className="text-[10px] font-black tracking-widest font-mono text-zinc-450 uppercase">ROOM MEMBERS</h3>
                                <button 
                                    onClick={() => setShowParticipants(false)}
                                    className="p-1 hover:bg-white/5 rounded-full text-zinc-500 hover:text-white transition-colors"
                                >
                                    <X className="w-4 h-4" />
                                </button>
                            </div>
                            <div className="flex-1 overflow-y-auto p-4 space-y-3 custom-scrollbar">
                                {participantsLoading ? (
                                    <div className="text-center py-8 text-xs font-mono text-zinc-500 animate-pulse">Loading members...</div>
                                ) : roomParticipants.length === 0 ? (
                                    <div className="text-center py-8 text-xs font-serif italic text-zinc-650">No members in this House yet</div>
                                ) : (
                                    roomParticipants.map((p) => {
                                        const status = presenceMap[p.id]?.status || 'offline';
                                        return (
                                            <div key={p.id} className="flex items-center gap-2.5 p-1 hover:bg-white/5 rounded-lg transition-colors">
                                                <div className="relative w-8 h-8 rounded-full overflow-hidden border border-white/5 bg-zinc-900 shrink-0">
                                                    {/* eslint-disable-next-line @next/next/no-img-element */}
                                                    <img 
                                                        src={getUserAvatar(p.avatar_url, p.gender, p.id)} 
                                                        alt={p.username || 'User'} 
                                                        className="w-full h-full object-cover"
                                                    />
                                                </div>
                                                <div className="min-w-0 flex-1">
                                                    <div className="text-xs font-bold text-white truncate leading-tight flex items-center gap-1.5">
                                                        <span className="truncate">{p.full_name || 'Vassal'}</span>
                                                        <span className={`w-1.5 h-1.5 rounded-full shrink-0 ${
                                                            status === 'online' 
                                                                ? 'bg-emerald-500 shadow-[0_0_8px_#10b981]' 
                                                                : status === 'away' 
                                                                    ? 'bg-amber-500 shadow-[0_0_8px_#f59e0b]' 
                                                                    : 'bg-zinc-600'
                                                        }`} />
                                                    </div>
                                                    {p.username && <div className="text-[9px] text-zinc-550 font-mono truncate">@{p.username}</div>}
                                                </div>
                                            </div>
                                        );
                                    })
                                )}
                            </div>
                        </motion.div>
                    )}
                </AnimatePresence>

                {/* Mobile Participant Sidebar Overlay */}
                <AnimatePresence>
                    {showParticipants && (
                        <div className="lg:hidden fixed inset-0 z-50 flex justify-end">
                            {/* Backdrop */}
                            <motion.div
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                exit={{ opacity: 0 }}
                                onClick={() => setShowParticipants(false)}
                                className="absolute inset-0 bg-black/75 backdrop-blur-sm"
                            />
                            {/* Panel */}
                            <motion.div
                                initial={{ x: '100%' }}
                                animate={{ x: 0 }}
                                exit={{ x: '100%' }}
                                transition={{ type: 'spring', damping: 25, stiffness: 200 }}
                                className="relative w-64 bg-zinc-950 border-l border-white/10 h-full flex flex-col z-10 shadow-2xl"
                            >
                                <div className="py-4 px-4 border-b border-white/10 flex items-center justify-between">
                                    <h3 className="text-[10px] font-black tracking-widest font-mono text-zinc-450 uppercase">ROOM MEMBERS</h3>
                                    <button 
                                        onClick={() => setShowParticipants(false)}
                                        className="p-1 hover:bg-white/5 rounded-full text-zinc-500 hover:text-white transition-colors"
                                    >
                                        <X className="w-5 h-5" />
                                    </button>
                                </div>
                                <div className="flex-1 overflow-y-auto p-4 space-y-3 custom-scrollbar">
                                    {participantsLoading ? (
                                        <div className="text-center py-8 text-xs font-mono text-zinc-500 animate-pulse">Loading members...</div>
                                    ) : roomParticipants.length === 0 ? (
                                        <div className="text-center py-8 text-xs font-serif italic text-zinc-650">No members in this House yet</div>
                                    ) : (
                                        roomParticipants.map((p) => {
                                            const status = presenceMap[p.id]?.status || 'offline';
                                            return (
                                                <div key={p.id} className="flex items-center gap-2.5 p-1 hover:bg-white/5 rounded-lg transition-colors">
                                                    <div className="relative w-8 h-8 rounded-full overflow-hidden border border-white/5 bg-zinc-900 shrink-0">
                                                        {/* eslint-disable-next-line @next/next/no-img-element */}
                                                        <img 
                                                            src={getUserAvatar(p.avatar_url, p.gender, p.id)} 
                                                            alt={p.username || 'User'} 
                                                            className="w-full h-full object-cover"
                                                        />
                                                    </div>
                                                    <div className="min-w-0 flex-1">
                                                        <div className="text-xs font-bold text-white truncate leading-tight flex items-center gap-1.5">
                                                            <span className="truncate">{p.full_name || 'Vassal'}</span>
                                                            <span className={`w-1.5 h-1.5 rounded-full shrink-0 ${
                                                                status === 'online' 
                                                                    ? 'bg-emerald-500 shadow-[0_0_8px_#10b981]' 
                                                                    : status === 'away' 
                                                                        ? 'bg-amber-500 shadow-[0_0_8px_#f59e0b]' 
                                                                        : 'bg-zinc-600'
                                                            }`} />
                                                        </div>
                                                        {p.username && <div className="text-[9px] text-zinc-550 font-mono truncate">@{p.username}</div>}
                                                    </div>
                                                </div>
                                            );
                                        })
                                    )}
                                </div>
                            </motion.div>
                        </div>
                    )}
                </AnimatePresence>

            </div>
        </div>
    );
}
