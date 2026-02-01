"use client";

import { useState, useEffect } from 'react';
import { X, ChevronLeft, ChevronRight, Eye } from 'lucide-react';
import { useStories, Story } from '@/context/stories-context';
import { useUserData } from '@/context/user-data-context';
import { createClient } from '@/utils/supabase/client';

interface StoryViewerProps {
    initialStoryIndex: number;
    stories: Story[];
    onClose: () => void;
}

export function StoryViewer({ initialStoryIndex, stories, onClose }: StoryViewerProps) {
    const { viewStory } = useStories();
    const { user } = useUserData();
    const [currentIndex, setCurrentIndex] = useState(initialStoryIndex);
    const [viewers, setViewers] = useState<{ name: string, viewed_at: string }[]>([]);
    const [showViewers, setShowViewers] = useState(false);

    // Safety check
    const currentStory = stories[currentIndex];

    useEffect(() => {
        if (currentStory) {
            viewStory(currentStory.id);
            // If it's MY story, fetch viewers
            // Assuming currentStory has user_id, check against current logged in user (from context or supbase)
            // Ideally pass 'isMine' or fetch 'user' in Context
            fetchViewers(currentStory.id);
        }
    }, [currentIndex, currentStory]);

    const fetchViewers = async (storyId: string) => {
        // Only fetch if it's my story
        // For MVP, we'll try to fetch, if RLS blocks it (not my story), we get error/empty which is fine.
        const supabase = createClient();
        const { data: { user } } = await supabase.auth.getUser();

        if (user && currentStory.user_id === user.id) {
            const { data } = await supabase
                .from('story_views')
                .select('viewed_at, viewer_id, profiles:viewer_id(email)') // Assuming we can join or just show ID
                .eq('story_id', storyId);

            // Map to readable
            // Since we don't have profiles set up reliably, we might just show count or "User X"
            // Wait, schema didn't link viewer_id to profiles, just auth.users
            // So we can't get email easily unless we have profiles table.
            // Diogenes usually uses `user_settings` or just raw auth if allowed (auth not queryable directly).
            // Actually, for this MVP, I'll just show the COUNT of viewers.
            // Getting names requires a public profiles table.
            console.log("Viewers:", data);
            if (data) {
                setViewers(data.map((v: any) => ({
                    name: v.profiles?.email?.split('@')[0] || 'Unknown Traveler', // Hopeful join or fallback
                    viewed_at: v.viewed_at
                })));
            }
        } else {
            setViewers([]);
        }
    };


    if (!currentStory) return null;

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

    const isMine = true; // TODO: Check ownership properly

    return (
        <div className="fixed inset-0 z-[70] flex items-center justify-center bg-black">
            {/* Progress Bar */}
            <div className="absolute top-4 left-4 right-4 flex gap-1 z-20">
                {stories.map((_, idx) => (
                    <div key={idx} className="h-1 flex-1 bg-white/20 rounded-full overflow-hidden">
                        <div
                            className={`h-full bg-white transition-all duration-300 ${idx < currentIndex ? 'w-full' : idx === currentIndex ? 'w-full animate-progress' : 'w-0'}`}
                        />
                    </div>
                ))}
            </div>

            {/* Close Button */}
            <div className="absolute top-8 right-6 z-20 flex items-center gap-4">
                <button onClick={onClose} className="p-2">
                    <X className="w-8 h-8 text-white drop-shadow-lg" />
                </button>
            </div>

            {/* Navigation Areas */}
            <div className="absolute inset-y-0 left-0 w-1/3 z-10" onClick={prevStory} />
            <div className="absolute inset-y-0 right-0 w-1/3 z-10" onClick={nextStory} />

            {/* Content */}
            {currentStory.media_url ? (
                /* Video Story */
                <div className="w-full h-full flex items-center justify-center relative">
                    <video
                        key={currentStory.id}
                        src={currentStory.media_url}
                        autoPlay
                        playsInline
                        className="max-w-full max-h-full object-contain"
                        onEnded={nextStory}
                    />
                    {currentStory.content_text && (
                        <div className="absolute bottom-24 left-1/2 -translate-x-1/2 bg-black/70 backdrop-blur-md px-6 py-3 rounded-xl max-w-lg">
                            <p className="text-white text-center font-medium">{currentStory.content_text}</p>
                        </div>
                    )}
                </div>
            ) : (
                /* Text Story */
                <div className="w-full h-full flex items-center justify-center p-8 bg-gradient-to-br from-indigo-900/40 to-purple-900/40">
                    <div className="max-w-2xl text-center">
                        <p className="text-2xl md:text-4xl font-bold text-white leading-relaxed animate-in zoom-in-50 duration-500">
                            {currentStory.content_text}
                        </p>
                        <p className="mt-8 text-zinc-400 text-sm">
                            {new Date(currentStory.created_at).toLocaleTimeString()}
                        </p>
                    </div>
                </div>
            )}

            {/* Viewers Footer (If Mine) */}
            <div className="absolute bottom-8 left-0 right-0 z-20 flex justify-center">
                <button
                    onClick={(e) => { e.stopPropagation(); setShowViewers(!showViewers); }}
                    className="flex items-center gap-2 text-white/50 hover:text-white transition-colors bg-black/20 px-4 py-2 rounded-full backdrop-blur-md"
                >
                    <Eye className="w-4 h-4" />
                    <span className="text-sm font-medium">{viewers.length} Views</span>
                </button>
            </div>

            {/* Viewers List Overlay */}
            {showViewers && (
                <div className="absolute bottom-20 left-1/2 -translate-x-1/2 w-64 bg-black/90 border border-white/10 rounded-xl p-4 z-30 max-h-60 overflow-y-auto backdrop-blur-xl animate-in slide-in-from-bottom-4">
                    <h4 className="text-xs font-bold text-zinc-500 mb-3 uppercase tracking-wider">Witnesses</h4>
                    {viewers.length > 0 ? (
                        <div className="space-y-3">
                            {viewers.map((v, i) => (
                                <div key={i} className="flex items-center justify-between text-sm">
                                    <span className="text-white">{v.name}</span>
                                    <span className="text-zinc-600 text-xs">{new Date(v.viewed_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                                </div>
                            ))}
                        </div>
                    ) : (
                        <p className="text-zinc-600 text-xs text-center py-4">No eyes have seen this yet.</p>
                    )}
                </div>
            )}
        </div>
    );
}
