"use client";

import { useState, useRef } from 'react';
import { X, Send, Image as ImageIcon } from 'lucide-react';
import { useStories } from '@/context/stories-context';

interface CreateStoryModalProps {
    isOpen: boolean;
    onClose: () => void;
}

export function CreateStoryModal({ isOpen, onClose }: CreateStoryModalProps) {
    const { addStory } = useStories();
    const [text, setText] = useState('');
    const [isPosting, setIsPosting] = useState(false);
    const [selectedImage, setSelectedImage] = useState<{ file: File, url: string } | null>(null);
    
    const imageInputRef = useRef<HTMLInputElement>(null);

    if (!isOpen) return null;

    const handleImageSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;
        if (!file.type.startsWith('image/')) {
            alert('Please select an image file');
            return;
        }
        if (selectedImage?.url) URL.revokeObjectURL(selectedImage.url);
        setSelectedImage({ file, url: URL.createObjectURL(file) });
    };

    const handleClose = () => {
        if (selectedImage?.url) URL.revokeObjectURL(selectedImage.url);
        setSelectedImage(null);
        setText('');
        onClose();
    };

    const handleSubmit = async () => {
        if (!text.trim() && !selectedImage) return;
        setIsPosting(true);
        try {
            const mediaFile = selectedImage?.file;
            const success = await addStory(text, mediaFile);
            if (success) {
                handleClose();
            }
        } finally {
            setIsPosting(false);
        }
    };

    return (
        <>
            <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
                <div className="absolute inset-0 bg-black/90 backdrop-blur-sm" onClick={handleClose} />
                <div className="relative w-full max-w-md bg-zinc-900 border border-zinc-800 rounded-2xl shadow-2xl p-6 overflow-hidden animate-in fade-in zoom-in-95 duration-200">

                    {/* Header */}
                    <div className="flex items-center justify-between mb-4">
                        <div>
                            <h3 className="text-lg font-bold text-white">Add Story</h3>
                            <p className="text-zinc-500 text-[10px] uppercase tracking-wider font-mono mt-0.5">
                                Expires in 24 Hours
                            </p>
                        </div>
                        <button onClick={handleClose} className="p-2 rounded-full hover:bg-white/10 text-zinc-400 hover:text-white transition-colors">
                            <X className="w-5 h-5" />
                        </button>
                    </div>

                    {/* Image Preview */}
                    {selectedImage && (
                        <div className="mb-4 relative group">
                            {/* eslint-disable-next-line @next/next/no-img-element */}
                            <img
                                src={selectedImage.url}
                                alt="Preview"
                                className="w-full rounded-xl max-h-64 object-cover"
                            />
                            <button
                                onClick={() => setSelectedImage(null)}
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
                            className="w-full h-40 bg-zinc-950/50 border border-zinc-800 rounded-xl p-4 text-white placeholder-zinc-550 focus:outline-none focus:ring-1 focus:ring-purple-500/50 resize-none"
                        />
                        <div className="absolute bottom-3 right-3 flex items-center gap-2">
                            <button
                                onClick={() => imageInputRef.current?.click()}
                                className="p-2 rounded-full bg-zinc-800 text-zinc-400 hover:text-white hover:bg-zinc-700 transition-colors"
                                title="Add Image"
                            >
                                <ImageIcon className="w-4 h-4" />
                            </button>
                        </div>
                    </div>

                    <input
                        ref={imageInputRef}
                        type="file"
                        accept="image/*"
                        onChange={handleImageSelect}
                        className="hidden"
                    />

                    {/* Footer */}
                    <div className="mt-4 flex justify-end">
                        <button
                            onClick={handleSubmit}
                            disabled={(!text.trim() && !selectedImage) || isPosting}
                            className={`
                                px-4 py-2 rounded-lg flex items-center gap-2 text-sm font-medium transition-all
                                ${(!text.trim() && !selectedImage) || isPosting
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
        </>
    );
}
