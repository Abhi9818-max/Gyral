"use client";

import { FeedPost } from "@/data/mock-world";
import { Heart, User, MoreHorizontal, ArrowUpRight } from "lucide-react";

interface WorldFeedCardProps {
    post: FeedPost;
}

export function WorldFeedCard({ post }: WorldFeedCardProps) {
    return (
        <div className="relative aspect-[3/4] md:aspect-[4/5] rounded-[2rem] overflow-hidden group cursor-pointer transition-all duration-500 hover:shadow-[0_0_30px_rgba(255,255,255,0.1)]">
            {/* Background Image */}
            <div className="absolute inset-0">
                <img
                    src={post.backgroundImage}
                    alt={post.title}
                    className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
                />
                <div className="absolute inset-0 bg-gradient-to-b from-black/20 via-transparent to-black/90" />
            </div>

            {/* Content Overlay */}
            <div className="absolute inset-0 p-6 flex flex-col justify-between">

                {/* Top Info */}
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2 bg-black/40 backdrop-blur-md px-3 py-1.5 rounded-full border border-white/10">
                        <img
                            src={post.user.avatar}
                            alt={post.user.name}
                            className="w-5 h-5 rounded-full border border-white/20"
                        />
                        <span className="text-xs font-bold text-white tracking-wide">{post.user.name}</span>
                        {post.user.isLive && (
                            <span className="text-[9px] font-bold bg-green-500 text-black px-1.5 py-0.5 rounded-full ml-1">LIVE</span>
                        )}
                    </div>

                    <button className="w-8 h-8 rounded-full bg-white/10 backdrop-blur-md flex items-center justify-center text-white hover:bg-white hover:text-black transition-colors">
                        <ArrowUpRight className="w-4 h-4" />
                    </button>
                </div>

                {/* Bottom Content */}
                <div className="space-y-4">
                    <div>
                        <h2 className="text-2xl font-black text-white uppercase tracking-tighter leading-none mb-1 drop-shadow-lg">
                            {post.title}
                        </h2>
                        {post.stats.isHot && (
                            <div className="flex items-center gap-1.5">
                                <div className="w-1.5 h-1.5 rounded-full bg-orange-500 animate-pulse" />
                                <span className="text-xs font-bold text-orange-400 uppercase tracking-widest">Trending Now</span>
                            </div>
                        )}
                    </div>

                    {/* Stats / Action Row */}
                    <div className="flex items-center justify-between bg-white/10 backdrop-blur-xl p-3 rounded-2xl border border-white/10">
                        <div className="flex items-center gap-3">
                            <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-red-500 text-white text-xs font-bold">
                                <span className="uppercase">Live</span>
                            </div>
                            <div className="flex items-center gap-1 text-white/80">
                                <User className="w-3 h-3" />
                                <span className="text-xs font-mono">{post.stats.likes}</span>
                            </div>
                        </div>

                        <div className="flex -space-x-2">
                            {[1, 2, 3].map(i => (
                                <div key={i} className="w-6 h-6 rounded-full border-2 border-black bg-zinc-800" />
                            ))}
                            <div className="w-6 h-6 rounded-full border-2 border-black bg-white/20 flex items-center justify-center text-[8px] font-bold text-white">
                                +15
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
