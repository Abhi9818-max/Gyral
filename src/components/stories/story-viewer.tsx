"use client";

import { useState, useEffect } from 'react';
import { X, Eye } from 'lucide-react';
import { useStories, Story } from '@/context/stories-context';
import { useUserData } from '@/context/user-data-context';
import { createClient } from '@/utils/supabase/client';
import { getUserAvatar } from '@/utils/avatar-helpers';

interface StoryViewerProps {
    initialStoryIndex: number;
    stories: Story[];
    onClose: () => void;
}

const isImage = (url: string | null | undefined): boolean => {
    if (!url) return false;
    const cleanUrl = url.split('?')[0].toLowerCase();
    return (
        cleanUrl.endsWith('.jpg') ||
        cleanUrl.endsWith('.jpeg') ||
        cleanUrl.endsWith('.png') ||
        cleanUrl.endsWith('.webp') ||
        cleanUrl.endsWith('.gif') ||
        cleanUrl.endsWith('.svg') ||
        url.includes('image')
    );
};

function getRelativeTime(dateString: string): string {
    const now = new Date();
    const created = new Date(dateString);
    const diffMs = now.getTime() - created.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMins / 60);

    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    return created.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
}

export function StoryViewer({ initialStoryIndex, stories, onClose }: StoryViewerProps) {
    const { viewStory } = useStories();
    const { user } = useUserData();
    const [currentIndex, setCurrentIndex] = useState(initialStoryIndex);
    const [viewers, setViewers] = useState<{ name: string, viewed_at: string }[]>([]);
    const [showViewers, setShowViewers] = useState(false);
    const [progress, setProgress] = useState(0);

    const currentStory = stories[currentIndex];
    const isVideo = currentStory && currentStory.media_url && !isImage(currentStory.media_url);

    const nextStory = () => {
        if (currentIndex < stories.length - 1) {
            setCurrentIndex(prev => prev + 1);
        } else {
            onClose();
        }
    };

    const prevStory = () => {
        if (currentIndex > 0) {
            setCurrentIndex(prev => prev - 1);
        }
    };

    useEffect(() => {
        if (!currentStory) return;

        setProgress(0);
        viewStory(currentStory.id);
        fetchViewers(currentStory.id);

        if (isVideo) {
            return;
        }

        const totalDuration = 5000; // 5 seconds
        const stepTime = 50; // 50ms interval
        let elapsed = 0;

        const interval = setInterval(() => {
            elapsed += stepTime;
            const currentPct = Math.min((elapsed / totalDuration) * 100, 100);
            setProgress(currentPct);

            if (elapsed >= totalDuration) {
                clearInterval(interval);
                nextStory();
            }
        }, stepTime);

        return () => {
            clearInterval(interval);
        };
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [currentIndex, currentStory, isVideo]);

    const fetchViewers = async (storyId: string) => {
        const supabase = createClient();
        const { data: { user: currentUser } } = await supabase.auth.getUser();

        if (currentUser && currentStory.user_id === currentUser.id) {
            const { data } = await supabase
                .from('story_views')
                .select('viewed_at, viewer_id, profiles:viewer_id(email)')
                .eq('story_id', storyId);

            if (data) {
                // eslint-disable-next-line @typescript-eslint/no-explicit-any
                setViewers(data.map((v: any) => ({
                    name: v.profiles?.email?.split('@')[0] || 'Unknown Traveler',
                    viewed_at: v.viewed_at
                })));
            }
        } else {
            setViewers([]);
        }
    };

    const handleVideoTimeUpdate = (e: React.SyntheticEvent<HTMLVideoElement>) => {
        const video = e.currentTarget;
        if (video.duration) {
            const pct = (video.currentTime / video.duration) * 100;
            setProgress(pct);
        }
    };

    if (!currentStory) return null;

    const isMine = user && currentStory && currentStory.user_id === user.id;

    return (
        <div className="fixed inset-0 z-[70] flex items-center justify-center bg-black select-none">
            {/* Progress Bar */}
            <div className="absolute top-4 left-4 right-4 flex gap-1 z-20">
                {stories.map((_, idx) => (
                    <div key={idx} className="h-1 flex-1 bg-white/20 rounded-full overflow-hidden">
                        <div
                            className="h-full bg-white"
                            style={{
                                width: idx === currentIndex 
                                    ? `${progress}%` 
                                    : idx < currentIndex 
                                        ? '100%' 
                                        : '0%',
                                transition: idx === currentIndex ? 'width 50ms linear' : 'none'
                            }}
                        />
                    </div>
                ))}
            </div>

            {/* Author Header */}
            <div className="absolute top-8 left-6 z-20 flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-full overflow-hidden border border-white/20 bg-zinc-900 flex-shrink-0">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                        src={getUserAvatar(currentStory.profiles?.avatar_url, null, currentStory.user_id)}
                        alt="Author"
                        className="w-full h-full object-cover"
                    />
                </div>
                <div className="flex flex-col text-left">
                    <span className="text-white text-xs font-bold leading-none drop-shadow-md">
                        {currentStory.profiles?.full_name || currentStory.profiles?.username || 'Vassal'}
                    </span>
                    <span className="text-white/70 text-[9px] font-mono leading-none mt-0.5 drop-shadow-md">
                        {currentStory.profiles?.username ? `@${currentStory.profiles.username} • ` : ''}{getRelativeTime(currentStory.created_at)}
                    </span>
                </div>
            </div>

            {/* Close Button */}
            <div className="absolute top-8 right-6 z-20 flex items-center gap-4">
                <button onClick={onClose} className="p-2 hover:scale-110 active:scale-95 transition-transform duration-200 focus:outline-none">
                    <X className="w-8 h-8 text-white drop-shadow-lg" />
                </button>
            </div>

            {/* Navigation Areas */}
            <div className="absolute inset-y-0 left-0 w-1/3 z-10 cursor-pointer" onClick={prevStory} />
            <div className="absolute inset-y-0 right-0 w-1/3 z-10 cursor-pointer" onClick={nextStory} />

            {/* Content */}
            {currentStory.media_url ? (
                isImage(currentStory.media_url) ? (
                    /* Image Story */
                    <div className="w-full h-full flex items-center justify-center relative">
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img
                            key={currentStory.id}
                            src={currentStory.media_url}
                            alt="Story content"
                            className="max-w-full max-h-full object-contain animate-in fade-in duration-300"
                        />
                        {currentStory.content_text && (
                            <div className="absolute bottom-24 left-1/2 -translate-x-1/2 bg-black/75 backdrop-blur-md px-6 py-3 rounded-2xl max-w-lg border border-white/5 shadow-xl">
                                <p className="text-white text-center text-sm font-medium leading-relaxed">{currentStory.content_text}</p>
                            </div>
                        )}
                    </div>
                ) : (
                    /* Video Story */
                    <div className="w-full h-full flex items-center justify-center relative">
                        <video
                            key={currentStory.id}
                            src={currentStory.media_url}
                            autoPlay
                            playsInline
                            onTimeUpdate={handleVideoTimeUpdate}
                            className="max-w-full max-h-full object-contain"
                            onEnded={nextStory}
                        />
                        {currentStory.content_text && (
                            <div className="absolute bottom-24 left-1/2 -translate-x-1/2 bg-black/75 backdrop-blur-md px-6 py-3 rounded-2xl max-w-lg border border-white/5 shadow-xl">
                                <p className="text-white text-center text-sm font-medium leading-relaxed">{currentStory.content_text}</p>
                            </div>
                        )}
                    </div>
                )
            ) : (
                /* Text Story */
                <div className="w-full h-full flex items-center justify-center p-8 bg-gradient-to-br from-indigo-950/40 via-purple-950/40 to-zinc-950/40">
                    <div className="max-w-xl text-center">
                        <p className="text-2xl md:text-3xl font-bold text-white leading-relaxed animate-in zoom-in-95 duration-500 font-serif">
                            {currentStory.content_text}
                        </p>
                        <p className="mt-8 text-zinc-500 text-[10px] font-mono uppercase tracking-widest">
                            {new Date(currentStory.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </p>
                    </div>
                </div>
            )}

            {/* Viewers Footer (If Mine) */}
            {isMine && (
                <div className="absolute bottom-8 left-0 right-0 z-20 flex justify-center">
                    <button
                        onClick={(e) => { e.stopPropagation(); setShowViewers(!showViewers); }}
                        className="flex items-center gap-2 text-white/60 hover:text-white transition-colors bg-zinc-900/60 border border-white/5 px-4 py-2 rounded-full backdrop-blur-md shadow-lg"
                    >
                        <Eye className="w-4 h-4" />
                        <span className="text-xs font-semibold">{viewers.length} Views</span>
                    </button>
                </div>
            )}

            {/* Viewers List Overlay */}
            {isMine && showViewers && (
                <div className="absolute bottom-20 left-1/2 -translate-x-1/2 w-64 bg-zinc-900/90 border border-white/10 rounded-xl p-4 z-30 max-h-60 overflow-y-auto backdrop-blur-xl animate-in slide-in-from-bottom-4">
                    <h4 className="text-[10px] font-bold text-zinc-500 mb-3 uppercase tracking-wider">Witnesses</h4>
                    {viewers.length > 0 ? (
                        <div className="space-y-3">
                            {viewers.map((v, i) => (
                                <div key={i} className="flex items-center justify-between text-xs">
                                    <span className="text-white font-medium">@{v.name}</span>
                                    <span className="text-zinc-500 text-[10px] font-mono">{new Date(v.viewed_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                                </div>
                            ))}
                        </div>
                    ) : (
                        <p className="text-zinc-500 text-xs text-center py-4">No eyes have seen this yet.</p>
                    )}
                </div>
            )}
        </div>
    );
}
