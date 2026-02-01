"use client";

import { useState } from 'react';
import { X, Send, Image as ImageIcon, Video } from 'lucide-react';
import { useStories } from '@/context/stories-context';
import { VideoUploadModal } from './video-upload-modal';

interface CreateStoryModalProps {
    isOpen: boolean;
    onClose: () => void;
}

export function CreateStoryModal({ isOpen, onClose }: CreateStoryModalProps) {
    const { addStory } = useStories();
    const [text, setText] = useState('');
    const [isPosting, setIsPosting] = useState(false);
    const [isVideoModalOpen, setIsVideoModalOpen] = useState(false);
    const [selectedVideo, setSelectedVideo] = useState<{ file: File, url: string } | null>(null);

    if (!isOpen) return null;

    const handleVideoSelected = (file: File, url: string) => {
        setSelectedVideo({ file, url });
        setIsVideoModalOpen(false);
    };

    const handleSubmit = async () => {
        if (!text.trim() && !selectedVideo) return;
        setIsPosting(true);
        try {
            const success = await addStory(text, selectedVideo?.file);
            if (success) {
                setText('');
                setSelectedVideo(null);
                onClose();
            }
        } finally {
            setIsPosting(false);
        }
    };

    return (
        <>
            <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
                <div className="absolute inset-0 bg-black/90 backdrop-blur-sm" onClick={onClose} />
                <div className="relative w-full max-w-md bg-zinc-900 border border-zinc-800 rounded-2xl shadow-2xl p-6 overflow-hidden animate-in fade-in zoom-in-95 duration-200">

                    {/* Header */}
                    <div className="flex items-center justify-between mb-4">
                        <h3 className="text-lg font-bold text-white">Add Story</h3>
                        <button onClick={onClose} className="p-2 rounded-full hover:bg-white/10 text-zinc-400 hover:text-white transition-colors">
                            <X className="w-5 h-5" />
                        </button>
                    </div>

                    {/* Video Preview */}
                    {selectedVideo && (
                        <div className="mb-4 relative group">
                            <video
                                src={selectedVideo.url}
                                controls
                                className="w-full rounded-xl max-h-64 object-cover"
                            />
                            <button
                                onClick={() => setSelectedVideo(null)}
                                className="absolute top-2 right-2 p-2 bg-black/70 rounded-full hover:bg-black transition-colors"
                            >
                                <X className="w-4 h-4 text-white" />
                            </button>
                        </div>
                    )}

                    {/* Input Area */}
                    <div className="relative">
                        <textarea
                            value={text}
                            onChange={(e) => setText(e.target.value)}
                            placeholder="Share a moment..."
                            className="w-full h-40 bg-zinc-950/50 border border-zinc-800 rounded-xl p-4 text-white placeholder-zinc-500 focus:outline-none focus:ring-1 focus:ring-purple-500/50 resize-none"
                        />
                        <div className="absolute bottom-3 right-3 flex items-center gap-2">
                            <button
                                onClick={() => setIsVideoModalOpen(true)}
                                className="p-2 rounded-full bg-zinc-800 text-zinc-400 hover:text-white hover:bg-zinc-700 transition-colors"
                                title="Add Video"
                            >
                                <Video className="w-4 h-4" />
                            </button>
                            <button className="p-2 rounded-full bg-zinc-800 text-zinc-400 hover:text-white hover:bg-zinc-700 transition-colors" title="Add Image (Coming Soon)">
                                <ImageIcon className="w-4 h-4" />
                            </button>
                        </div>
                    </div>

                    {/* Footer */}
                    <div className="mt-4 flex justify-end">
                        <button
                            onClick={handleSubmit}
                            disabled={(!text.trim() && !selectedVideo) || isPosting}
                            className={`
                                px-4 py-2 rounded-lg flex items-center gap-2 text-sm font-medium transition-all
                                ${(!text.trim() && !selectedVideo) || isPosting
                                    ? 'bg-zinc-800 text-zinc-500 cursor-not-allowed'
                                    : 'bg-white text-black hover:bg-zinc-200 shadow-lg shadow-white/10'
                                }
                            `}
                        >
                            {isPosting ? 'Posting...' : (
                                <>
                                    Share Story <Send className="w-4 h-4" />
                                </>
                            )}
                        </button>
                    </div>

                </div>
            </div>

            <VideoUploadModal
                isOpen={isVideoModalOpen}
                onClose={() => setIsVideoModalOpen(false)}
                onVideoSelected={handleVideoSelected}
            />
        </>
    );
}
