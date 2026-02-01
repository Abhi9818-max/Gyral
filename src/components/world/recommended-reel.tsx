"use client";

"use client";

import { useState } from "react";
import { Plus } from "lucide-react";
import { useStories } from "@/context/stories-context";
import { CreateStoryModal } from "@/components/stories/create-story-modal";
import { StoryViewer } from "@/components/stories/story-viewer";

export function RecommendedReel() {
    const { stories, myStories } = useStories();
    const [isCreateOpen, setIsCreateOpen] = useState(false);
    const [viewingStoryIndex, setViewingStoryIndex] = useState<number | null>(null);

    // Group stories by user? 
    // For now, let's just show individual stories or the "Latest" stories like a feed.
    // Better: Show unique users who have stories.
    // If I click User A, I want to see User A's stories.
    // BUT my StoryViewer takes a flat list. 
    // Let's just pass the FULL list to StoryViewer, and jump to the index of the clicked story.
    // So the reel shows the *Author* of the story. If author has multiple, maybe show just the latest?

    // Grouping logic:
    const uniqueStories = stories.reduce((acc, story) => {
        if (!acc.find(s => s.user_id === story.user_id)) {
            acc.push(story);
        }
        return acc;
    }, [] as typeof stories);

    const handleStoryClick = (storyId: string) => {
        const index = stories.findIndex(s => s.id === storyId);
        if (index !== -1) setViewingStoryIndex(index);
    };

    return (
        <div className="space-y-4">
            <h3 className="text-zinc-500 text-xs font-medium tracking-wide">Live Signals (Stories)</h3>

            <div className="flex gap-4 overflow-x-auto pb-4 scrollbar-hide snap-x">
                {/* Add Button */}
                <div className="flex flex-col items-center gap-2 min-w-[64px] snap-start">
                    <button
                        onClick={() => setIsCreateOpen(true)}
                        className={`w-16 h-16 rounded-full border-2 border-dashed flex items-center justify-center transition-all bg-white/5 ${myStories.length > 0 ? 'border-purple-500 text-purple-400' : 'border-white/20 text-white/50 hover:text-white hover:border-white/50'}`}
                    >
                        <Plus className="w-6 h-6" />
                    </button>
                    <span className="text-[10px] text-zinc-500 font-medium">Add Signal</span>
                </div>

                {/* Stories */}
                {uniqueStories.map((story) => {
                    const userName = story.profiles?.full_name || story.profiles?.username || 'User';
                    const userAvatar = story.profiles?.avatar_url || `https://api.dicebear.com/7.x/shapes/svg?seed=${story.user_id}`;

                    return (
                        <div
                            key={story.id}
                            onClick={() => handleStoryClick(story.id)}
                            className="flex flex-col items-center gap-2 min-w-[64px] snap-start group cursor-pointer"
                        >
                            <div className="relative">
                                <div className="w-16 h-16 rounded-full p-0.5 bg-gradient-to-tr from-yellow-500 via-red-500 to-purple-500 group-hover:scale-105 transition-transform duration-300">
                                    <img
                                        src={userAvatar}
                                        alt={userName}
                                        className="w-full h-full rounded-full object-cover border-2 border-black"
                                    />
                                </div>
                            </div>
                            <span className="text-[10px] text-zinc-400 font-medium truncate w-16 text-center group-hover:text-white transition-colors">
                                {userName.length > 8 ? userName.slice(0, 8) + '...' : userName}
                            </span>
                        </div>
                    );
                })}
            </div>

            {/* Modals */}
            <CreateStoryModal isOpen={isCreateOpen} onClose={() => setIsCreateOpen(false)} />

            {viewingStoryIndex !== null && (
                <StoryViewer
                    initialStoryIndex={viewingStoryIndex}
                    stories={stories}
                    onClose={() => setViewingStoryIndex(null)}
                />
            )}
        </div>
    );
}
