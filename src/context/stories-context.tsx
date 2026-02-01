"use client";

import { createContext, useContext, useEffect, useState } from 'react';
import { createClient } from '@/utils/supabase/client';
import { useUserData } from './user-data-context';

export interface Story {
    id: string;
    user_id: string;
    content_text: string | null;
    media_url: string | null;
    created_at: string;
    expires_at: string;
    views?: StoryView[];
    is_viewed_by_me?: boolean;
    profiles?: {
        id: string;
        full_name: string | null;
        username: string | null;
        avatar_url: string | null;
    };
}

export interface StoryView {
    viewer_id: string;
    viewed_at: string;
    viewer_email?: string; // Loaded client side if possible, or just user_id for now
}

interface StoriesContextType {
    stories: Story[];
    myStories: Story[];
    isLoading: boolean;
    addStory: (text: string, mediaFile?: File) => Promise<boolean>;
    viewStory: (storyId: string) => Promise<void>;
    deleteStory: (storyId: string) => Promise<void>;
    refreshStories: () => Promise<void>;
}

const StoriesContext = createContext<StoriesContextType | undefined>(undefined);

export function StoriesProvider({ children }: { children: React.ReactNode }) {
    const supabase = createClient();
    const { user } = useUserData();
    const [stories, setStories] = useState<Story[]>([]);
    const [isLoading, setIsLoading] = useState(true);

    const refreshStories = async () => {
        setIsLoading(true);
        try {
            // Fetch all valid stories
            const { data: storiesData, error: storiesError } = await supabase
                .from('stories')
                .select('*')
                .gt('expires_at', new Date().toISOString())
                .order('created_at', { ascending: false });

            if (storiesError) {
                console.error("Supabase error fetching stories:", storiesError.message, storiesError.details, storiesError.hint);
                throw storiesError;
            }

            // If we have stories, fetch the associated profiles
            if (storiesData && storiesData.length > 0) {
                const userIds = [...new Set(storiesData.map(s => s.user_id))];

                const { data: profilesData, error: profilesError } = await supabase
                    .from('profiles')
                    .select('id, full_name, username, avatar_url')
                    .in('id', userIds);

                if (profilesError) {
                    console.error("Error fetching profiles:", profilesError);
                }

                // Merge profiles data into stories
                const storiesWithProfiles = storiesData.map(story => ({
                    ...story,
                    profiles: profilesData?.find(p => p.id === story.user_id) || null
                }));

                console.log("Fetched stories with profiles:", storiesWithProfiles);
                setStories(storiesWithProfiles);
            } else {
                setStories([]);
            }

        } catch (err: any) {
            console.error("Error fetching stories (Exception):", err?.message || err);
        } finally {
            setIsLoading(false);
        }
    };

    // Cleanup expired stories function
    const cleanupExpiredStories = async () => {
        try {
            // Delete expired stories from database
            const { error } = await supabase
                .from('stories')
                .delete()
                .lt('expires_at', new Date().toISOString());

            if (error) {
                console.error('Error cleaning up expired stories:', error);
            } else {
                console.log('Expired stories cleaned up successfully');
            }
        } catch (err) {
            console.error('Exception cleaning up stories:', err);
        }
    };

    useEffect(() => {
        // Clean up expired stories first
        cleanupExpiredStories();

        // Then fetch current valid stories
        refreshStories();

        // Subscription for real-time? Optional for MVP
        const channel = supabase
            .channel('stories-channel')
            .on('postgres_changes', { event: '*', schema: 'public', table: 'stories' }, () => {
                refreshStories();
            })
            .subscribe();

        return () => {
            supabase.removeChannel(channel);
        };
    }, []);

    const addStory = async (text: string, mediaFile?: File): Promise<boolean> => {
        if (!user) return false;
        try {
            let media_url = null;

            // Upload media file to Supabase storage
            if (mediaFile) {
                // Compress video before upload if it's larger than 5MB
                let fileToUpload = mediaFile;
                const maxSize = 5 * 1024 * 1024; // 5MB

                if (mediaFile.size > maxSize && mediaFile.type.startsWith('video/')) {
                    console.log(`Video is ${(mediaFile.size / 1024 / 1024).toFixed(2)}MB, compressing...`);

                    // Show compression message
                    try {
                        fileToUpload = await compressVideo(mediaFile);
                        console.log(`Compressed to ${(fileToUpload.size / 1024 / 1024).toFixed(2)}MB`);
                    } catch (compressError) {
                        console.warn('Compression failed, uploading original:', compressError);
                        // Fall back to original file if compression fails
                    }
                }

                const fileExt = fileToUpload.name.split('.').pop() || 'webm';
                const fileName = `${user.id}-${Date.now()}.${fileExt}`;

                const { error: uploadError } = await supabase.storage
                    .from('stories-media')
                    .upload(fileName, fileToUpload, {
                        cacheControl: '3600',
                        upsert: false
                    });

                if (uploadError) {
                    console.error('Storage upload error:', uploadError);
                    alert('Failed to upload media. Please ensure the "stories-media" bucket exists in Supabase Storage.');
                    return false;
                }

                // Get public URL
                const { data: { publicUrl } } = supabase.storage
                    .from('stories-media')
                    .getPublicUrl(fileName);

                media_url = publicUrl;
            }

            const { error } = await supabase.from('stories').insert({
                user_id: user.id,
                content_text: text,
                media_url: media_url
            });

            if (error) throw error;
            await refreshStories();
            return true;
        } catch (err) {
            console.error("Error adding story:", err);
            return false;
        }
    };

    // Helper function to compress video
    const compressVideo = (file: File): Promise<File> => {
        return new Promise((resolve, reject) => {
            const video = document.createElement('video');
            video.src = URL.createObjectURL(file);

            video.onloadedmetadata = () => {
                const canvas = document.createElement('canvas');
                const ctx = canvas.getContext('2d');

                // Reduce resolution if needed
                const maxWidth = 720; // 720p max
                const maxHeight = 1280;

                let width = video.videoWidth;
                let height = video.videoHeight;

                if (width > maxWidth) {
                    height = (height / width) * maxWidth;
                    width = maxWidth;
                }
                if (height > maxHeight) {
                    width = (width / height) * maxHeight;
                    height = maxHeight;
                }

                canvas.width = width;
                canvas.height = height;

                const stream = canvas.captureStream(30); // 30fps
                const audioTrackPromise = new Promise<MediaStreamTrack | null>(async (resolveAudio) => {
                    try {
                        const audioContext = new AudioContext();
                        const source = audioContext.createMediaElementSource(video);
                        const destination = audioContext.createMediaStreamDestination();
                        source.connect(destination);
                        resolveAudio(destination.stream.getAudioTracks()[0] || null);
                    } catch {
                        resolveAudio(null);
                    }
                });

                audioTrackPromise.then((audioTrack) => {
                    if (audioTrack) {
                        stream.addTrack(audioTrack);
                    }

                    const mediaRecorder = new MediaRecorder(stream, {
                        mimeType: 'video/webm;codecs=vp8',
                        videoBitsPerSecond: 1000000 // 1 Mbps - much lower bitrate
                    });

                    const chunks: Blob[] = [];

                    mediaRecorder.ondataavailable = (e) => {
                        if (e.data.size > 0) {
                            chunks.push(e.data);
                        }
                    };

                    mediaRecorder.onstop = () => {
                        const compressedBlob = new Blob(chunks, { type: 'video/webm' });
                        const compressedFile = new File([compressedBlob], file.name, {
                            type: 'video/webm'
                        });
                        URL.revokeObjectURL(video.src);
                        resolve(compressedFile);
                    };

                    video.play();
                    mediaRecorder.start();

                    const drawFrame = () => {
                        if (!video.paused && !video.ended) {
                            ctx?.drawImage(video, 0, 0, width, height);
                            requestAnimationFrame(drawFrame);
                        }
                    };
                    drawFrame();

                    video.onended = () => {
                        mediaRecorder.stop();
                    };
                });
            };

            video.onerror = () => {
                URL.revokeObjectURL(video.src);
                reject(new Error('Failed to load video for compression'));
            };
        });
    };


    const viewStory = async (storyId: string) => {
        if (!user) return;
        try {
            // Check if already viewed to avoid duplicate errors? unique constraint handles it on backend, 
            // but helpful to check client side to save calls.
            // Just insert on conflict do nothing? Supabase JS support `ignoreDuplicates`?
            const { error } = await supabase.from('story_views').insert({
                story_id: storyId,
                viewer_id: user.id
            }).select(); // .select to see result? 

            // If error is uniqueness violation, it's fine.
            if (error && error.code !== '23505') { // 23505 is unique_violation
                console.error("Error viewing story:", error);
            }
        } catch (err) {
            // ignore
        }
    };

    const deleteStory = async (storyId: string) => {
        if (!user) return;
        try {
            const { error } = await supabase.from('stories').delete().eq('id', storyId).eq('user_id', user.id);
            if (error) throw error;
            await refreshStories();
        } catch (err) {
            console.error("Error deleting story:", err);
        }
    };

    const myStories = stories.filter(s => s.user_id === user?.id);

    return (
        <StoriesContext.Provider value={{
            stories,
            myStories,
            isLoading,
            addStory,
            viewStory,
            deleteStory,
            refreshStories
        }}>
            {children}
        </StoriesContext.Provider>
    );
}

export function useStories() {
    const context = useContext(StoriesContext);
    if (context === undefined) {
        throw new Error('useStories must be used within a StoriesProvider');
    }
    return context;
}
