"use client";

import { useEffect, useState } from "react";
import { Header } from "@/components/header";
import { RecommendedReel } from "@/components/world/recommended-reel";
import { WorldFeedCard } from "@/components/world/world-feed-card";
import { SearchModal } from "@/components/modals/search-modal";
import { FriendRequestsModal } from "@/components/modals/friend-requests-modal";
import { createClient } from "@/utils/supabase/client";
import { Bell, Search, Sparkles, Loader2 } from "lucide-react";
import { WorldUser, FeedPost } from "@/data/mock-world"; // Keeping interfaces, ignoring mock data
import { DEFAULT_FACTIONS } from "@/context/user-data-context";
import { useMessageNotifications } from "@/context/message-notification-context";

export default function WorldPage() {
    const supabase = createClient();
    const [users, setUsers] = useState<WorldUser[]>([]);
    const [posts, setPosts] = useState<FeedPost[]>([]);
    const [factionsPower, setFactionsPower] = useState<{ name: string, sigil: string, power: number, primaryColor: string }[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [currentUser, setCurrentUser] = useState<any>(null);
    const [isSearchModalOpen, setIsSearchModalOpen] = useState(false);
    const [isFriendRequestsModalOpen, setIsFriendRequestsModalOpen] = useState(false);
    const { friendRequestCount } = useMessageNotifications();

    useEffect(() => {
        const fetchData = async () => {
            setIsLoading(true);

            // 1. Get Current User
            const { data: { user } } = await supabase.auth.getUser();
            setCurrentUser(user);

            // 2. Fetch Profiles for Reel (Real Users)
            const { data: profiles } = await supabase
                .from('profiles')
                .select('*')
                .limit(20);

            if (profiles) {
                const mappedUsers: WorldUser[] = profiles.map(p => ({
                    id: p.id,
                    name: p.full_name || 'Anonymous',
                    handle: p.username ? `@${p.username}` : '@user',
                    avatar: p.avatar_url || `https://api.dicebear.com/7.x/shapes/svg?seed=${p.id}`,
                    // Mocking social stats as they don't exist in DB yet
                    followers: '-',
                    following: '-',
                    creations: '-',
                    bio: p.bio || '',
                    isLive: false
                }));
                setUsers(mappedUsers);
            }

            // 3. Fetch Recent Records for Feed (Real Activity)
            const { data: records } = await supabase
                .from('records')
                .select(`
                    *,
                    tasks (name, color)
                `)
                .order('timestamp', { ascending: false })
                .limit(20);

            if (records) {
                const mappedPosts: FeedPost[] = records.map(r => {
                    // Try to find profile in fetched profiles
                    const author = profiles?.find(p => p.id === r.user_id) || {
                        id: r.user_id,
                        full_name: 'Unknown',
                        username: 'unknown',
                        avatar_url: null
                    };

                    return {
                        id: r.id,
                        user: {
                            id: author.id,
                            name: author.full_name || 'Anonymous',
                            handle: author.username ? `@${author.username}` : '@user',
                            avatar: author.avatar_url || `https://api.dicebear.com/7.x/shapes/svg?seed=${author.id}`,
                            followers: '',
                            following: '',
                            creations: '',
                            bio: ''
                        },
                        title: r.tasks?.name || 'Unknown Task',
                        description: `Logged with intensity ${r.intensity}`,
                        backgroundImage: `https://ui-avatars.com/api/?name=${r.tasks?.name || 'Task'}&background=random&size=800`,
                        stats: {
                            likes: r.value ? `${r.value}` : '-',
                            isHot: (r.intensity || 0) > 3
                        }
                    };
                });
                setPosts(mappedPosts);
            }

            // 4. Fetch Faction Power (Leaderboard)
            const { data: factions } = await supabase.from('factions').select('*');
            if (factions && profiles) {
                const power = factions.map(f => {
                    const houseMembers = profiles.filter(p => p.faction_id === f.id);
                    const totalPower = houseMembers.reduce((sum, p) => sum + (p.activity_points || 0), 0);

                    // Reconcile with local config for high-quality sigils
                    const localMatch = DEFAULT_FACTIONS.find(df => df.name === f.name);

                    return {
                        name: f.name,
                        sigil: localMatch ? localMatch.sigilUrl : f.sigil_url,
                        power: totalPower,
                        primaryColor: localMatch ? localMatch.primaryColor : f.primary_color
                    };
                }).sort((a, b) => b.power - a.power);
                setFactionsPower(power);
            }

            setIsLoading(false);
        };

        fetchData();
    }, []);

    return (
        <div className="min-h-screen flex flex-col bg-black text-white font-sans selection:bg-purple-500/30">
            {/* Custom Header for World Page (Adverse Style) */}
            <div className="fixed top-0 left-0 right-0 z-50 bg-black/80 backdrop-blur-xl border-b border-white/5">
                <div className="flex items-center justify-between px-6 py-4 max-w-md mx-auto md:max-w-4xl">
                    <div className="flex items-center gap-2">
                        <Sparkles className="w-6 h-6 text-transparent bg-clip-text bg-gradient-to-tr from-yellow-400 to-purple-600 fill-current" />
                        <span className="text-lg font-bold tracking-tight">Diogenes</span>
                    </div>
                    <div className="flex items-center gap-4">
                        <button
                            onClick={() => setIsSearchModalOpen(true)}
                            className="relative text-zinc-400 hover:text-white transition-colors"
                        >
                            <Search className="w-6 h-6" />
                        </button>
                        <button
                            onClick={() => setIsFriendRequestsModalOpen(true)}
                            className="relative text-zinc-400 hover:text-white transition-colors"
                        >
                            <Bell className="w-6 h-6" />
                            {friendRequestCount > 0 && (
                                <span className="absolute -top-1 -right-1 w-5 h-5 bg-purple-500 text-white text-[10px] font-bold rounded-full flex items-center justify-center animate-pulse">
                                    {friendRequestCount > 9 ? '9+' : friendRequestCount}
                                </span>
                            )}
                        </button>
                        {currentUser && (
                            <div className="w-8 h-8 rounded-full bg-gradient-to-br from-zinc-700 to-zinc-900 border border-white/20 overflow-hidden">
                                <img
                                    src={currentUser.user_metadata?.avatar_url || `https://api.dicebear.com/7.x/shapes/svg?seed=${currentUser.id}`}
                                    alt="Profile"
                                    className="w-full h-full object-cover"
                                />
                            </div>
                        )}
                    </div>
                </div>
            </div>

            {/* Main Content */}
            <main className="flex-1 pt-24 pb-24 px-6 md:px-0 max-w-md mx-auto md:max-w-4xl w-full space-y-10 animate-in fade-in duration-700">

                {isLoading ? (
                    <div className="flex items-center justify-center py-20">
                        <Loader2 className="w-8 h-8 text-purple-500 animate-spin" />
                    </div>
                ) : (
                    <>
                        {/* Recommended Reel (Stories) */}
                        <section>
                            <RecommendedReel />
                        </section>

                        {/* Great Houses Leaderboard */}
                        <section className="space-y-4">
                            <div className="flex items-center justify-between">
                                <h3 className="text-zinc-500 text-xs font-medium tracking-wide uppercase">Great Houses of the Realm</h3>
                                <div className="flex items-center gap-1.5 px-2 py-1 bg-yellow-500/10 border border-yellow-500/20 rounded-md">
                                    <Sparkles className="w-3 h-3 text-yellow-500" />
                                    <span className="text-[10px] font-bold text-yellow-500 uppercase">Supremacy</span>
                                </div>
                            </div>

                            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                                {factionsPower.slice(0, 4).map((house, index) => (
                                    <div
                                        key={house.name}
                                        className="relative group p-4 rounded-3xl bg-zinc-900/50 border border-white/5 hover:border-white/10 transition-all overflow-hidden"
                                    >
                                        <div
                                            className="absolute -top-12 -right-12 w-24 h-24 rounded-full blur-[40px] opacity-10 group-hover:opacity-20 transition-opacity"
                                            style={{ backgroundColor: house.primaryColor }}
                                        />
                                        <div className="relative flex flex-col items-center text-center gap-3">
                                            <div className="w-12 h-12 rounded-xl bg-black border border-white/5 flex items-center justify-center p-1.5 overflow-hidden">
                                                <img src={house.sigil} alt={house.name} className="w-full h-full object-cover rounded-lg" />
                                            </div>
                                            <div>
                                                <div className="text-[10px] font-bold text-zinc-500 uppercase tracking-wider">{house.name.replace('House ', '')}</div>
                                                <div className="text-lg font-black text-white">{house.power} <span className="text-[10px] text-zinc-500 font-medium">PWR</span></div>
                                            </div>
                                            {index === 0 && (
                                                <div className="absolute -top-2 -left-2 bg-yellow-500 text-black text-[8px] font-black px-1.5 py-0.5 rounded-full uppercase tracking-tighter">Ruling</div>
                                            )}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </section>

                        {/* Feed Section */}
                        <section className="space-y-4">
                            <div className="flex items-center justify-between">
                                <h3 className="text-zinc-500 text-xs font-medium tracking-wide">Protocol Live Feed</h3>
                                <span className="text-xs font-bold text-white bg-white/10 px-2 py-1 rounded-md">
                                    {posts.length} Active
                                </span>
                            </div>

                            {posts.length > 0 ? (
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                    {posts.map((post, index) => (
                                        <div
                                            key={post.id}
                                            className="animate-in fade-in slide-in-from-bottom-8 fill-mode-backwards"
                                            style={{ animationDelay: `${index * 150}ms` }}
                                        >
                                            <WorldFeedCard post={post} />
                                        </div>
                                    ))}
                                </div>
                            ) : (
                                <div className="py-20 text-center border border-dashed border-white/10 rounded-3xl bg-white/5">
                                    <h4 className="text-zinc-500 font-medium mb-2">The Ether is Silent</h4>
                                    <p className="text-zinc-600 text-sm">Be the first to create a ripple.</p>
                                </div>
                            )}
                        </section>
                    </>
                )}

                {/* Discovery / Popular Section (Bottom) */}
                <section className="space-y-4 pt-4 border-t border-white/5">
                    <h3 className="text-zinc-500 text-xs font-medium tracking-wide">Popular Protocols</h3>
                    <div className="relative h-48 rounded-2xl overflow-hidden group cursor-pointer">
                        <img
                            src="https://images.unsplash.com/photo-1451187580459-43490279c0fa?q=80&w=800&auto=format&fit=crop"
                            alt="Universe"
                            className="w-full h-full object-cover opacity-60 group-hover:opacity-80 transition-opacity duration-500 group-hover:scale-105"
                        />
                        <div className="absolute inset-0 flex items-center justify-center">
                            <div className="bg-black/50 backdrop-blur-md px-6 py-3 rounded-full border border-white/10">
                                <span className="text-sm font-bold text-white tracking-widest uppercase">Explore Deep Space</span>
                            </div>
                        </div>
                    </div>
                </section>

            </main>

            <SearchModal
                isOpen={isSearchModalOpen}
                onClose={() => setIsSearchModalOpen(false)}
            />
            <FriendRequestsModal
                isOpen={isFriendRequestsModalOpen}
                onClose={() => setIsFriendRequestsModalOpen(false)}
                currentUserId={currentUser?.id}
            />
        </div>
    );
}
