"use client";

import { useEffect, useState } from "react";
import { RecommendedReel } from "@/components/world/recommended-reel";
import { SearchModal } from "@/components/modals/search-modal";
import { FriendRequestsModal } from "@/components/modals/friend-requests-modal";
import { createClient } from "@/utils/supabase/client";
import { Bell, Search, Sparkles, Loader2, ArrowUpRight, Globe } from "lucide-react";
import { WorldUser, FeedPost } from "@/data/mock-world";
import { DEFAULT_FACTIONS } from "@/context/user-data-context";
import { useMessageNotifications } from "@/context/message-notification-context";
import { getUserAvatar } from "@/utils/avatar-helpers";
import { haptic } from "@/utils/haptic";
import { sfx } from "@/utils/sfx";
import { motion } from "framer-motion";

export default function WorldPage() {
    const supabase = createClient();
    const [users, setUsers] = useState<WorldUser[]>([]);
    const [posts, setPosts] = useState<FeedPost[]>([]);
    const [factionsPower, setFactionsPower] = useState<{ name: string, sigil: string, power: number, primaryColor: string }[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const [currentUser, setCurrentUser] = useState<any>(null);
    const [isSearchModalOpen, setIsSearchModalOpen] = useState(false);
    const [isFriendRequestsModalOpen, setIsFriendRequestsModalOpen] = useState(false);
    const { friendRequestCount } = useMessageNotifications();
    const [activeTab, setActiveTab] = useState<'houses' | 'chronicles' | 'atlas'>('houses');

    useEffect(() => {
        const fetchData = async () => {
            setIsLoading(true);

            // 1. Get Current User
            const { data: { user } } = await supabase.auth.getUser();
            setCurrentUser(user);

            // 2. Fetch Profiles, Records, and Factions concurrently
            const [profilesRes, recordsRes, factionsRes] = await Promise.all([
                supabase
                    .from('profiles')
                    .select('*')
                    .limit(20),
                supabase
                    .from('records')
                    .select(`
                        *,
                        tasks (name, color)
                    `)
                    .order('timestamp', { ascending: false })
                    .limit(20),
                supabase
                    .from('factions')
                    .select('*')
            ]);

            const profiles = profilesRes.data;
            const records = recordsRes.data;
            const factions = factionsRes.data;

            if (profiles) {
                const mappedUsers: WorldUser[] = profiles.map(p => ({
                    id: p.id,
                    name: p.full_name || 'Anonymous',
                    handle: p.username ? `@${p.username}` : '@user',
                    avatar: p.avatar_url || getUserAvatar(p.avatar_url, p.gender, p.id),
                    followers: '-',
                    following: '-',
                    creations: '-',
                    bio: p.bio || '',
                    isLive: false
                }));
                setUsers(mappedUsers);
            }

            if (records) {
                const mappedPosts: FeedPost[] = records.map(r => {
                    const author = profiles?.find(p => p.id === r.user_id) || {
                        id: r.user_id,
                        full_name: 'Anonymous',
                        username: 'user',
                        avatar_url: null,
                        gender: null
                    };

                    return {
                        id: r.id,
                        user: {
                            id: author.id,
                            name: author.full_name || 'Anonymous',
                            handle: author.username ? `@${author.username}` : '@user',
                            avatar: author.avatar_url || getUserAvatar(author.avatar_url, author.gender || null, author.id),
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
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    return (
        <div className="min-h-screen flex flex-col bg-black text-white font-sans selection:bg-purple-500/30 overflow-x-hidden">
            {/* Custom Sleek Header */}
            <div className="fixed top-0 left-0 right-0 z-50 bg-black/85 backdrop-blur-xl border-b border-white/5">
                <div className="flex items-center justify-between px-6 py-4 max-w-md mx-auto md:max-w-4xl w-full">
                    <div className="flex items-center gap-2.5">
                        <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-purple-600 to-indigo-650 flex items-center justify-center border border-white/15 shadow-md shadow-indigo-950/40">
                            <Globe className="w-4 h-4 text-white" />
                        </div>
                        <span className="text-sm font-bold tracking-widest uppercase font-serif">THE REALM</span>
                    </div>
                    <div className="flex items-center gap-4">
                        <button
                            onClick={() => {
                                sfx.playClick();
                                haptic.light();
                                setIsFriendRequestsModalOpen(true);
                            }}
                            className="relative text-zinc-400 hover:text-white transition-colors p-1"
                        >
                            <Bell className="w-5.5 h-5.5" />
                            {friendRequestCount > 0 && (
                                <span className="absolute -top-0.5 -right-0.5 w-4 h-4 bg-purple-600 text-white text-[9px] font-black rounded-full flex items-center justify-center animate-pulse">
                                    {friendRequestCount > 9 ? '9+' : friendRequestCount}
                                </span>
                            )}
                        </button>
                        {currentUser && (
                            <div className="w-7 h-7 rounded-full bg-gradient-to-br from-zinc-700 to-zinc-900 border border-white/20 overflow-hidden shadow-inner">
                                {/* eslint-disable-next-line @next/next/no-img-element */}
                                <img
                                    src={currentUser.user_metadata?.avatar_url || getUserAvatar(currentUser.user_metadata?.avatar_url, currentUser.user_metadata?.gender, currentUser.id)}
                                    alt="Profile"
                                    className="w-full h-full object-cover"
                                />
                            </div>
                        )}
                    </div>
                </div>
            </div>

            {/* Main Content */}
            <main className="flex-1 pt-20 pb-28 px-6 md:px-0 max-w-md mx-auto md:max-w-4xl w-full space-y-8">
                
                {/* 1. Immersive Hero Title Section */}
                <div className="relative pt-6 pb-2 text-center flex flex-col items-center gap-3 overflow-hidden rounded-3xl bg-zinc-950/20 border border-white/5 px-6 py-8">
                    {/* Atmospheric Glow backdrop */}
                    <div className="absolute top-[-50%] left-[25%] right-[25%] h-full w-[50%] rounded-full blur-[80px] bg-gradient-to-r from-purple-900/10 via-indigo-900/10 to-transparent opacity-60 pointer-events-none" />
                    
                    <span className="text-[10px] font-black text-purple-400 uppercase tracking-widest leading-none font-mono">WESTEROS CHRONICLES</span>
                    <h1 className="text-3xl md:text-4xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-white via-zinc-200 to-zinc-500 uppercase tracking-tight font-serif leading-none mt-1">
                        Explore the Realm
                    </h1>
                    <p className="text-zinc-500 text-xs max-w-md">
                        Witness the clash of Great Houses, the chronicle of live deeds, and the ledger of active vassals.
                    </p>

                    {/* Integrated Search Bar inside Hero */}
                    <div className="relative max-w-sm w-full mt-4">
                        <input
                            type="text"
                            placeholder="Search chronicles, houses, or vassals..."
                            readOnly
                            tabIndex={-1}
                            onFocus={(e) => e.currentTarget.blur()}
                            onClick={() => {
                                sfx.playClick();
                                haptic.light();
                                setIsSearchModalOpen(true);
                            }}
                            className="w-full bg-zinc-900/40 border border-white/5 rounded-2xl py-3 pl-10 pr-4 text-xs text-zinc-300 placeholder-zinc-550 backdrop-blur-md cursor-pointer hover:bg-zinc-900/60 hover:border-white/10 transition-all focus:outline-none focus:ring-0 focus:border-white/5 focus-visible:outline-none focus-visible:ring-0 active:outline-none active:ring-0 select-none"
                        />
                        <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-555" />
                    </div>
                </div>

                {/* 2. Sleek Capsule Tab Switcher */}
                <div className="flex p-1 bg-zinc-950/60 border border-white/5 rounded-2xl backdrop-blur-md max-w-md mx-auto w-full relative">
                    {(['houses', 'chronicles', 'atlas'] as const).map((tab) => {
                        const isActive = activeTab === tab;
                        const labels = {
                            houses: '⚔️ Great Houses',
                            chronicles: '📜 Chronicles',
                            atlas: '🗺️ Atlas'
                        };
                        return (
                            <button
                                key={tab}
                                onClick={() => {
                                    sfx.playClick();
                                    haptic.light();
                                    setActiveTab(tab);
                                }}
                                className={`flex-1 text-center py-2.5 rounded-xl text-[10px] sm:text-xs font-bold uppercase tracking-wider transition-all duration-300 cursor-pointer ${
                                    isActive 
                                        ? 'bg-gradient-to-tr from-purple-600 to-indigo-650 text-white shadow-lg shadow-indigo-950/40 border border-white/10 font-black' 
                                        : 'text-zinc-400 hover:text-white hover:bg-white/5'
                                }`}
                            >
                                {labels[tab]}
                            </button>
                        );
                    })}
                </div>

                {/* 3. Loader State */}
                {isLoading ? (
                    <div className="flex items-center justify-center py-20">
                        <Loader2 className="w-8 h-8 text-purple-500 animate-spin" />
                    </div>
                ) : (
                    <div className="animate-in fade-in duration-500">
                        {/* Tab 1: Great Houses */}
                        {activeTab === 'houses' && (
                            <div className="space-y-6">
                                <div className="flex items-center justify-between">
                                    <div>
                                        <h3 className="text-white text-base font-bold font-serif uppercase tracking-wider">Territorial Dominance</h3>
                                        <p className="text-zinc-500 text-xs">Overall influence and activity points of each House in the Realm</p>
                                    </div>
                                    <div className="flex items-center gap-1.5 px-3 py-1 bg-yellow-500/10 border border-yellow-500/20 rounded-full">
                                        <Sparkles className="w-3 h-3 text-yellow-500" />
                                        <span className="text-[9px] font-black text-yellow-500 uppercase tracking-widest font-mono">SUPREMACY</span>
                                    </div>
                                </div>

                                <div className="space-y-4">
                                    {factionsPower.map((house, index) => {
                                        const maxPower = Math.max(...factionsPower.map(f => f.power), 1);
                                        const percentage = (house.power / maxPower) * 100;
                                        const rank = index + 1;
                                        const isRuling = index === 0;

                                        return (
                                            <div
                                                key={house.name}
                                                className="relative group p-5 rounded-3xl bg-zinc-900/30 border border-white/5 hover:border-white/10 transition-all duration-300 overflow-hidden"
                                            >
                                                {/* Glow Effect */}
                                                <div
                                                    className="absolute -top-16 -right-16 w-32 h-32 rounded-full blur-[50px] opacity-[0.03] group-hover:opacity-[0.08] transition-opacity duration-500"
                                                    style={{ backgroundColor: house.primaryColor }}
                                                />

                                                <div className="flex items-center gap-4 relative">
                                                    {/* Rank Badge */}
                                                    <div className={`w-8 h-8 rounded-full flex items-center justify-center font-mono font-black border text-xs shrink-0 ${
                                                        rank === 1 
                                                            ? 'bg-amber-500/10 text-amber-400 border-amber-500/30 shadow-[0_0_10px_rgba(245,158,11,0.1)]' 
                                                            : rank === 2 
                                                                ? 'bg-zinc-300/10 text-zinc-300 border-zinc-300/30' 
                                                                : rank === 3 
                                                                    ? 'bg-amber-700/10 text-amber-600 border-amber-700/30'
                                                                    : 'bg-black/40 text-zinc-500 border-white/5'
                                                    }`}>
                                                        #{rank}
                                                    </div>

                                                    {/* Faction Sigil */}
                                                    <div className="w-12 h-12 rounded-2xl bg-zinc-950 border border-white/10 flex items-center justify-center p-1.5 overflow-hidden shrink-0 group-hover:scale-105 transition-transform duration-300">
                                                        {/* eslint-disable-next-line @next/next/no-img-element */}
                                                        <img src={house.sigil} alt={house.name} className="w-full h-full object-cover rounded-xl" />
                                                    </div>

                                                    {/* Info details */}
                                                    <div className="min-w-0 flex-1">
                                                        <div className="flex items-center gap-2">
                                                            <span className="text-xs font-black text-zinc-500 uppercase tracking-widest leading-none">
                                                                {house.name.replace('House ', '')}
                                                            </span>
                                                            {isRuling && (
                                                                <span className="bg-yellow-500 text-black text-[8px] font-black px-1.5 py-0.5 rounded-full uppercase tracking-wider font-mono">
                                                                    RULING
                                                                </span>
                                                            )}
                                                        </div>
                                                        <div className="text-base font-black text-white mt-1 flex items-baseline gap-1">
                                                            {house.power}
                                                            <span className="text-[10px] text-zinc-550 font-bold uppercase tracking-wider font-mono">PWR</span>
                                                        </div>
                                                    </div>
                                                </div>

                                                {/* Progress Bar showing dominant ratio */}
                                                <div className="mt-4 w-full h-1.5 bg-black/40 rounded-full overflow-hidden border border-white/5 p-[1px]">
                                                    <motion.div
                                                        initial={{ width: 0 }}
                                                        animate={{ width: `${percentage}%` }}
                                                        transition={{ duration: 1, ease: 'easeOut' }}
                                                        className="h-full rounded-full"
                                                        style={{ backgroundColor: house.primaryColor }}
                                                    />
                                                </div>
                                            </div>
                                        );
                                    })}
                                </div>
                            </div>
                        )}

                        {/* Tab 2: Chronicles (Feed) */}
                        {activeTab === 'chronicles' && (
                            <div className="space-y-6">
                                <div className="flex items-center justify-between">
                                    <div>
                                        <h3 className="text-white text-base font-bold font-serif uppercase tracking-wider">Chronicles of Deeds</h3>
                                        <p className="text-zinc-500 text-xs">Real-time chronicle of active logs and achievements in the Realm</p>
                                    </div>
                                    <span className="text-xs font-bold text-white bg-zinc-900 border border-white/10 px-3 py-1 rounded-full font-mono">
                                        {posts.length} ACTIVE
                                    </span>
                                </div>

                                {/* Stories Reel */}
                                <RecommendedReel />

                                {posts.length > 0 ? (
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                        {posts.map((post, index) => (
                                            <div
                                                key={post.id}
                                                className="relative rounded-3xl overflow-hidden bg-zinc-950/40 border border-white/5 shadow-xl hover:border-white/10 transition-all duration-300 group flex flex-col"
                                                style={{ contentVisibility: 'auto' }}
                                            >
                                                {/* Gradient Border Glow */}
                                                <div className="absolute top-0 left-0 right-0 h-[2px] bg-gradient-to-r from-purple-500 via-indigo-500 to-transparent opacity-50" />

                                                {/* Author & Header */}
                                                <div className="p-4 flex items-center justify-between border-b border-white/5 bg-zinc-900/20">
                                                    <div className="flex items-center gap-3">
                                                        <div className="w-9 h-9 rounded-full overflow-hidden border border-white/10 bg-zinc-900">
                                                            {/* eslint-disable-next-line @next/next/no-img-element */}
                                                            <img src={post.user.avatar} alt={post.user.name} className="w-full h-full object-cover" />
                                                        </div>
                                                        <div>
                                                            <div className="text-xs font-black text-white leading-none">{post.user.name}</div>
                                                            <div className="text-[9px] text-zinc-500 font-mono mt-0.5">{post.user.handle}</div>
                                                        </div>
                                                    </div>
                                                    <div className="flex items-center gap-1.5 bg-purple-500/10 border border-purple-500/20 text-purple-400 px-2.5 py-0.5 rounded-full text-[9px] font-bold uppercase tracking-wider font-mono">
                                                        ACTIVE
                                                    </div>
                                                </div>

                                                {/* Post Content */}
                                                <div className="p-5 flex-1 flex flex-col justify-between gap-4">
                                                    <div>
                                                        <span className="text-[10px] font-black text-zinc-550 uppercase tracking-widest font-mono">TASK LOGGED</span>
                                                        <h4 className="text-lg font-bold text-white leading-tight uppercase font-serif mt-1">
                                                            {post.title}
                                                        </h4>
                                                        <p className="text-xs text-zinc-400 mt-2 font-serif italic">
                                                            "{post.description}"
                                                        </p>
                                                    </div>

                                                    {/* Score and Activity Power stats */}
                                                    <div className="flex items-center justify-between bg-black/40 border border-white/5 rounded-2xl p-3 mt-2">
                                                        <div className="flex items-center gap-1">
                                                            <Sparkles className="w-3.5 h-3.5 text-amber-400" />
                                                            <span className="text-xs font-bold text-zinc-300">Deed Value:</span>
                                                            <span className="text-xs font-black text-white font-mono ml-1">+{post.stats.likes} PWR</span>
                                                        </div>
                                                        {post.stats.isHot && (
                                                            <span className="text-[9px] font-black bg-orange-500/10 border border-orange-500/20 text-orange-400 px-2 py-0.5 rounded-md uppercase tracking-widest font-mono">
                                                                TRENDING
                                                            </span>
                                                        )}
                                                    </div>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                ) : (
                                    <div className="py-20 text-center border border-dashed border-white/10 rounded-3xl bg-zinc-950/20">
                                        <h4 className="text-zinc-500 font-medium font-serif mb-2">The Ether is Silent</h4>
                                        <p className="text-zinc-600 text-sm">Be the first to record a deed in the Realm.</p>
                                    </div>
                                )}
                            </div>
                        )}

                        {/* Tab 3: Atlas (Stats & Discovery) */}
                        {activeTab === 'atlas' && (
                            <div className="space-y-6">
                                <div>
                                    <h3 className="text-white text-base font-bold font-serif uppercase tracking-wider">Realm Statistics</h3>
                                    <p className="text-zinc-500 text-xs">Real-time status of the Westeros Realm and global activity</p>
                                </div>

                                {/* Stats Ledger Grid */}
                                <div className="grid grid-cols-3 gap-4">
                                    {[
                                        { label: 'ACTIVE VASSALS', value: users.length || '-', icon: '👥', color: '#8b5cf6' },
                                        { label: 'TOTAL POWER', value: factionsPower.reduce((sum, f) => sum + f.power, 0), icon: '⚡', color: '#f59e0b' },
                                        { label: 'CHRONICLES', value: posts.length || '-', icon: '📜', color: '#10b981' }
                                    ].map((stat) => (
                                        <div key={stat.label} className="p-4 rounded-2xl bg-zinc-900/30 border border-white/5 text-center flex flex-col justify-center items-center gap-1.5 relative overflow-hidden group">
                                            <span className="text-2xl">{stat.icon}</span>
                                            <span className="text-[9px] font-black text-zinc-500 uppercase tracking-widest leading-none mt-1">{stat.label}</span>
                                            <span className="text-base font-black text-white font-mono mt-1">{stat.value}</span>
                                            <div className="absolute top-0 bottom-0 left-0 w-[2px] transition-all duration-300 group-hover:h-full h-0" style={{ backgroundColor: stat.color }} />
                                        </div>
                                    ))}
                                </div>

                                {/* Immersive Exploration banner */}
                                <div className="relative h-56 rounded-3xl overflow-hidden group cursor-pointer border border-white/10 shadow-2xl transition-all duration-500 hover:border-purple-500/40">
                                    {/* eslint-disable-next-line @next/next/no-img-element */}
                                    <img
                                        src="https://images.unsplash.com/photo-1451187580459-43490279c0fa?q=80&w=800&auto=format&fit=crop"
                                        alt="Universe"
                                        className="w-full h-full object-cover opacity-40 group-hover:opacity-60 transition-all duration-700 group-hover:scale-105"
                                    />
                                    <div className="absolute inset-0 bg-gradient-to-t from-black via-black/40 to-transparent" />
                                    <div className="absolute inset-0 p-6 flex flex-col justify-between">
                                        <span className="bg-purple-500/10 border border-purple-500/20 text-purple-400 px-3 py-1 rounded-full text-[9px] font-bold uppercase tracking-wider font-mono self-start">
                                            DISCOVERY PORTAL
                                        </span>
                                        <div className="space-y-2">
                                            <h4 className="text-xl font-bold text-white uppercase font-serif tracking-wide leading-tight">Explore Deep Space</h4>
                                            <p className="text-xs text-zinc-400 max-w-sm">Synchronize with spatial sensors to unlock cosmic achievements and secure stardust.</p>
                                            <div className="pt-2">
                                                <span className="inline-flex items-center gap-1.5 text-[10px] font-black text-purple-400 uppercase tracking-wider hover:text-purple-300 transition-colors">
                                                    Enter coordinates <ArrowUpRight className="w-3.5 h-3.5" />
                                                </span>
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                {/* Legendary Milestones Section */}
                                <div className="space-y-4 pt-4 border-t border-white/5">
                                    <h3 className="text-zinc-550 text-xs font-medium tracking-wide uppercase">Legendary Milestones</h3>
                                    <div className="space-y-3">
                                        {[
                                            { title: 'The Wall Restored', desc: 'Secure 10,000 Stark points to rebuild defenses.', progress: 65 },
                                            { title: 'Iron Throne Consolidation', desc: 'Lannister or Targaryen dominance reaches 15,000.', progress: 42 }
                                        ].map((milestone) => (
                                            <div key={milestone.title} className="p-4 rounded-2xl bg-zinc-900/20 border border-white/5 flex flex-col gap-2">
                                                <div className="flex items-center justify-between">
                                                    <span className="text-xs font-bold text-white uppercase font-serif">{milestone.title}</span>
                                                    <span className="text-[10px] font-bold font-mono text-zinc-500">{milestone.progress}%</span>
                                                </div>
                                                <p className="text-[11px] text-zinc-500">{milestone.desc}</p>
                                                <div className="w-full h-1 bg-black/40 rounded-full overflow-hidden border border-white/5">
                                                    <div className="h-full bg-indigo-500 rounded-full" style={{ width: `${milestone.progress}%` }} />
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            </div>
                        )}
                    </div>
                )}
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
