
"use client";

import { Header } from "@/components/header";
import { useUserData } from "@/context/user-data-context";
import { Settings, Grid, Calendar, LogOut, Share2, LayoutGrid, Video, FileText } from "lucide-react";
import { createClient } from "@/utils/supabase/client";
import { useEffect, useState } from "react";
import { User } from "@supabase/supabase-js";
import { SettingsModal } from "@/components/modals/settings-modal";
import { EditProfileModal } from "@/components/modals/edit-profile-modal";
import { CreateStoryModal } from "@/components/stories/create-story-modal";
import { StoryViewer } from "@/components/stories/story-viewer";
import { useStories } from "@/context/stories-context";
import { useRouter } from "next/navigation";
import { getUserAvatar } from "@/utils/avatar-helpers";
import { ArtifactGallery } from "@/components/artifact-gallery";
import { ARTIFACTS } from "@/lib/artifacts";
import { Lock, CheckCircle, Flame, Triangle, Hexagon, Compass, Skull, Box, Shield, Book, Zap, Activity, BookOpen, Clock } from "lucide-react";

const ICON_MAP = {
    'Flame': Flame,
    'Triangle': Triangle,
    'Hexagon': Hexagon,
    'Compass': Compass,
    'Skull': Skull,
    'Box': Box,
    'Shield': Shield,
    'Book': Book,
    'Zap': Zap,
    'Activity': Activity,
    'BookOpen': BookOpen,
    'Clock': Clock
};

export default function ProfilePage() {
    const { consistencyScore, currentStreak, streakTier, streakStrength, tasks, records, profileStreakMode, calculateAverageStreak, getStreakForDate, defaultFilterTaskId, unlockedArtifacts } = useUserData();
    const { myStories, stories } = useStories();
    const [user, setUser] = useState<User | null>(null);
    const [profile, setProfile] = useState<any>(null);
    const [isSettingsOpen, setIsSettingsOpen] = useState(false);
    const [isEditProfileOpen, setIsEditProfileOpen] = useState(false);
    const [isCreateStoryOpen, setIsCreateStoryOpen] = useState(false);
    const [isArtifactGalleryOpen, setIsArtifactGalleryOpen] = useState(false);
    const [viewingStoryIndex, setViewingStoryIndex] = useState<number | null>(null);
    const [activeTab, setActiveTab] = useState<'artifacts' | 'streaks' | 'history' | 'notes'>('artifacts');
    const router = useRouter();

    const getUser = async () => {
        const supabase = createClient();
        const { data: { user } } = await supabase.auth.getUser();
        setUser(user);

        // Fetch profile data from profiles table
        if (user) {
            const { data: profileData } = await supabase
                .from('profiles')
                .select('*')
                .eq('id', user.id)
                .single();
            setProfile(profileData);
        }
    };

    useEffect(() => {
        getUser();
    }, []);

    const handleLogout = async () => {
        const supabase = createClient();
        await supabase.auth.signOut();
        router.push('/login');
    };

    // Derived Stats
    const allRecords = Object.values(records).flat();
    const totalEntries = allRecords.length;
    const historyDates = Object.keys(records).sort((a, b) => b.localeCompare(a));

    return (
        <div className="min-h-screen bg-black text-white font-[family-name:var(--font-geist-sans)] pb-20 md:pb-8">
            {/* Desktop only header */}
            <div className="hidden md:block">
                <Header />
            </div>

            <div className="max-w-4xl mx-auto md:pt-28 px-4 sm:px-6 lg:px-8">

                {/* Mobile-First Profile Header */}
                <div className="flex items-start gap-5 mb-6 pt-4">
                    {/* Profile Picture */}
                    <div className="relative flex-shrink-0">
                        <div
                            onClick={() => {
                                if (myStories.length > 0) {
                                    // Find the index of the first story by current user
                                    const index = stories.findIndex(s => s.user_id === user?.id);
                                    if (index !== -1) setViewingStoryIndex(index);
                                }
                            }}
                            className={`w-20 h-20 md:w-32 md:h-32 rounded-full p-[2px] ${myStories.length > 0 ? 'bg-gradient-to-tr from-yellow-500 via-red-500 to-purple-600 cursor-pointer hover:scale-105 transition-transform' : 'bg-zinc-800'}`}
                        >
                            <div className="w-full h-full rounded-full bg-black flex items-center justify-center overflow-hidden border-4 border-black">
                                <img
                                    src={user?.id ? getUserAvatar(profile?.avatar_url || user?.user_metadata?.avatar_url, profile?.gender, user.id) : '/avatars/default-male1.jpeg.jpeg'}
                                    alt="Profile"
                                    className="w-full h-full object-cover"
                                />
                            </div>
                        </div>
                    </div>

                    {/* Stats - Instagram Style */}
                    <div className="flex-1 flex flex-col gap-3">
                        {/* Username - Mobile visible, desktop hidden in this section */}
                        <div className="flex items-center gap-2 md:hidden pl-8">
                            <h1 className="text-base font-semibold">{profile?.full_name || user?.user_metadata?.full_name || user?.email?.split('@')[0] || "Initiate"}</h1>
                            {profile?.displayed_artifact_id && (() => {
                                const art = ARTIFACTS.find(a => a.id === profile.displayed_artifact_id);
                                if (!art) return null;
                                const Icon = ICON_MAP[art.icon as keyof typeof ICON_MAP] || Box;
                                return (
                                    <div className="w-5 h-5 rounded-full flex items-center justify-center bg-zinc-900 border border-zinc-800" style={{ boxShadow: `0 0 10px ${art.color}40` }}>
                                        <Icon className="w-3 h-3" style={{ color: art.color }} />
                                    </div>
                                );
                            })()}
                        </div>

                        {/* Username and action buttons - mobile hidden, shown on desktop */}
                        <div className="hidden md:flex items-center gap-4">
                            <h1 className="text-xl font-light tracking-wide">{profile?.full_name || user?.user_metadata?.full_name || user?.email?.split('@')[0] || "Initiate"}</h1>
                            <div className="flex gap-2">
                                <button
                                    onClick={() => setIsEditProfileOpen(true)}
                                    className="px-4 py-1.5 bg-zinc-800 hover:bg-zinc-700 rounded-lg text-sm font-semibold transition-colors"
                                >
                                    Edit Profile
                                </button>
                                <button
                                    onClick={() => setIsSettingsOpen(true)}
                                    className="p-2 bg-zinc-800 hover:bg-zinc-700 rounded-lg transition-colors"
                                >
                                    <Settings className="w-4 h-4" />
                                </button>
                                <button
                                    onClick={handleLogout}
                                    className="p-2 bg-zinc-800 hover:bg-red-900/50 hover:text-red-400 rounded-lg transition-colors"
                                    title="Log Out"
                                >
                                    <LogOut className="w-4 h-4" />
                                </button>
                            </div>
                        </div>

                        {/* Stats Row - horizontal on mobile */}
                        <div className="flex justify-around md:justify-start gap-6 md:gap-10">
                            <div className="text-center md:text-left">
                                <div className="font-bold text-base md:text-lg">{totalEntries}</div>
                                <div className="text-xs md:text-sm text-zinc-400">entries</div>
                            </div>
                            <div className="text-center md:text-left">
                                <div className="font-bold text-base md:text-lg">
                                    {profileStreakMode === 'combined' ? calculateAverageStreak() : getStreakForDate(new Date().toISOString().split('T')[0], defaultFilterTaskId)}
                                </div>
                                <div className="text-xs md:text-sm text-zinc-400">{profileStreakMode === 'combined' ? 'avg streak' : 'pinned streak'}</div>
                            </div>
                            <div className="text-center md:text-left">
                                <div className="font-bold text-base md:text-lg">{consistencyScore}%</div>
                                <div className="text-xs md:text-sm text-zinc-400">consistency</div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Name and Bio - Mobile */}
                <div className="mb-4 md:hidden">
                    <h2 className="font-semibold text-sm mb-0.5">{profile?.full_name || user?.user_metadata?.full_name || user?.email?.split('@')[0] || "Initiate"}</h2>
                    <p className="text-sm text-zinc-300 whitespace-pre-wrap">
                        {profile?.bio || user?.user_metadata?.bio || ""}
                    </p>
                </div>

                {/* Desktop Bio */}
                <div className="hidden md:block mb-6">
                    <p className="text-sm text-zinc-300 whitespace-pre-wrap">
                        {profile?.bio || user?.user_metadata?.bio || ""}
                    </p>
                </div>

                {/* Action Buttons - Mobile Only */}
                <div className="flex gap-2 mb-6 md:hidden">
                    <button
                        onClick={() => setIsEditProfileOpen(true)}
                        className="flex-1 px-4 py-2 bg-zinc-800/80 backdrop-blur-md border border-white/10 hover:border-white/30 hover:bg-zinc-700/80 rounded-lg text-sm font-semibold transition-all active:scale-95"
                    >
                        Edit profile
                    </button>
                    <button
                        onClick={() => setIsArtifactGalleryOpen(true)}
                        className="flex-1 px-4 py-2 bg-zinc-800/80 backdrop-blur-md border border-white/10 hover:border-white/30 hover:bg-zinc-700/80 rounded-lg text-sm font-semibold transition-all active:scale-95 flex items-center justify-center gap-2"
                    >
                        <Box className="w-4 h-4" />
                        Open Vault
                    </button>
                    <button
                        onClick={() => setIsSettingsOpen(true)}
                        className="px-3 py-2 bg-zinc-800/80 backdrop-blur-md border border-white/10 hover:border-white/30 hover:bg-zinc-700/80 rounded-lg transition-all active:scale-95"
                    >
                        <Settings className="w-5 h-5" />
                    </button>
                </div>

                {/* Tab Navigation - Instagram Style with Icons */}
                <div className="flex border-t border-white/10 mb-1">
                    <button
                        onClick={() => setActiveTab('artifacts')}
                        className={`flex-1 flex items-center justify-center gap-2 py-3 md:py-4 text-xs font-semibold uppercase tracking-widest transition-colors relative ${activeTab === 'artifacts' ? 'text-white' : 'text-zinc-500 hover:text-white'}`}
                    >
                        <Hexagon className="w-5 h-5 md:w-4 md:h-4" />
                        <span className="hidden md:inline">Vault</span>
                        {activeTab === 'artifacts' && <div className="absolute top-0 left-0 right-0 h-[1px] bg-white" />}
                    </button>
                    <button
                        onClick={() => setActiveTab('streaks')}
                        className={`flex-1 flex items-center justify-center gap-2 py-3 md:py-4 text-xs font-semibold uppercase tracking-widest transition-colors relative ${activeTab === 'streaks' ? 'text-white' : 'text-zinc-500 hover:text-white'}`}
                    >
                        <Flame className="w-5 h-5 md:w-4 md:h-4" />
                        <span className="hidden md:inline">Streaks</span>
                        {activeTab === 'streaks' && <div className="absolute top-0 left-0 right-0 h-[1px] bg-white" />}
                    </button>
                    <button
                        onClick={() => setActiveTab('history')}
                        className={`flex-1 flex items-center justify-center gap-2 py-3 md:py-4 text-xs font-semibold uppercase tracking-widest transition-colors relative ${activeTab === 'history' ? 'text-white' : 'text-zinc-500 hover:text-white'}`}
                    >
                        <Calendar className="w-5 h-5 md:w-4 md:h-4" />
                        <span className="hidden md:inline">History</span>
                        {activeTab === 'history' && <div className="absolute top-0 left-0 right-0 h-[1px] bg-white" />}
                    </button>
                    <button
                        onClick={() => setActiveTab('notes')}
                        className={`flex-1 flex items-center justify-center gap-2 py-3 md:py-4 text-xs font-semibold uppercase tracking-widest transition-colors relative ${activeTab === 'notes' ? 'text-white' : 'text-zinc-500 hover:text-white'}`}
                    >
                        <FileText className="w-5 h-5 md:w-4 md:h-4" />
                        <span className="hidden md:inline">Notes</span>
                        {activeTab === 'notes' && <div className="absolute top-0 left-0 right-0 h-[1px] bg-white" />}
                    </button>
                </div>

                {/* Grid Content */}
                {activeTab === 'artifacts' && (
                    <div className="grid grid-cols-3 gap-2 md:gap-4 animate-[fadeIn_0.5s_ease-out]">
                        {ARTIFACTS.map((artifact) => {
                            const isUnlocked = unlockedArtifacts.includes(artifact.id);
                            const Icon = ICON_MAP[artifact.icon as keyof typeof ICON_MAP] || Box;

                            return (
                                <div
                                    key={artifact.id}
                                    className={`aspect-square relative group overflow-hidden rounded-xl border transition-all ${isUnlocked
                                        ? 'bg-zinc-900/50 border-white/10 hover:border-white/20 hover:bg-zinc-800/50 cursor-pointer'
                                        : 'bg-zinc-900/20 border-white/5 opacity-50 grayscale'
                                        }`}
                                    onClick={() => {
                                        if (isUnlocked) {
                                            // Optional: Open detail view or something
                                        }
                                    }}
                                >
                                    <div className="absolute inset-0 flex flex-col items-center justify-center p-2">
                                        <div
                                            className={`w-8 h-8 md:w-12 md:h-12 rounded-full flex items-center justify-center mb-1 md:mb-2 transition-transform group-hover:scale-110 ${isUnlocked ? 'bg-black/50 shadow-lg' : 'bg-white/5'
                                                }`}
                                            style={isUnlocked ? { boxShadow: `0 0 20px ${artifact.color}40`, color: artifact.color } : {}}
                                        >
                                            <Icon className="w-4 h-4 md:w-6 md:h-6" />
                                        </div>
                                        <span className={`text-[10px] md:text-xs font-bold text-center truncate w-full px-1 ${isUnlocked ? 'text-zinc-300' : 'text-zinc-600'}`}>
                                            {artifact.name}
                                        </span>
                                    </div>

                                    {/* Hover Overlay */}
                                    <div className="absolute inset-0 bg-black/90 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col items-center justify-center p-3 text-center pointer-events-none backdrop-blur-sm">
                                        {isUnlocked ? (
                                            <>
                                                <span className="text-[10px] md:text-xs font-bold text-white mb-1">{artifact.name}</span>
                                                <span className="text-[9px] md:text-[10px] text-zinc-400 line-clamp-3 leading-tight">{artifact.description}</span>
                                            </>
                                        ) : (
                                            <>
                                                <Lock className="w-4 h-4 md:w-5 md:h-5 text-zinc-500 mb-1" />
                                                <span className="text-[9px] md:text-[10px] text-zinc-500 font-mono leading-tight">{artifact.condition}</span>
                                            </>
                                        )}
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                )}

                {activeTab === 'streaks' && (
                    <div className="py-12 text-center animate-[fadeIn_0.5s_ease-out]">
                        <div className="inline-block p-6 rounded-full bg-zinc-900 mb-4">
                            <Flame className="w-12 h-12 text-zinc-700" />
                        </div>
                        <h3 className="text-xl font-bold mb-2">Active Streaks</h3>
                        <p className="text-zinc-500 text-sm mb-8">Detailed streak visualization coming soon.</p>
                        <div className="grid grid-cols-2 gap-4 max-w-sm mx-auto">
                            <div className="bg-zinc-900/50 p-6 rounded-xl col-span-2">
                                <div className="text-3xl font-bold text-white mb-1">{totalEntries}</div>
                                <div className="text-xs text-zinc-500 uppercase tracking-widest">Total Entries</div>
                            </div>
                            <div className="bg-zinc-900/50 p-6 rounded-xl">
                                <div className="text-3xl font-bold text-white mb-1">
                                    {profileStreakMode === 'combined' ? calculateAverageStreak() : getStreakForDate(new Date().toISOString().split('T')[0], defaultFilterTaskId)}
                                </div>
                                <div className="text-xs text-zinc-500 uppercase tracking-widest">{profileStreakMode === 'combined' ? 'Avg Streak' : 'Pinned'}</div>
                            </div>
                            <div className="bg-zinc-900/50 p-6 rounded-xl">
                                <div className="text-3xl font-bold text-white mb-1">{consistencyScore}%</div>
                                <div className="text-xs text-zinc-500 uppercase tracking-widest">Consistency</div>
                            </div>
                        </div>
                    </div>
                )}

                {activeTab === 'history' && (
                    <div className="space-y-6 animate-[fadeIn_0.5s_ease-out]">
                        {historyDates.length > 0 ? historyDates.slice(0, 30).map(date => {
                            const dayRecords = records[date].sort((a, b) => {
                                if (a.timestamp && b.timestamp) return new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime();
                                return 0;
                            });

                            return (
                                <div key={date} className="bg-zinc-900/30 rounded-xl overflow-hidden border border-white/5">
                                    <div className="px-4 py-3 bg-white/5 flex items-center justify-between border-b border-white/5">
                                        <div className="font-semibold text-white text-sm">
                                            {new Date(date).toLocaleDateString(undefined, { weekday: 'long', month: 'long', day: 'numeric' })}
                                        </div>
                                        <div className="text-xs text-zinc-500 font-mono">
                                            {dayRecords.length} entries
                                        </div>
                                    </div>

                                    <div className="divide-y divide-white/5">
                                        {dayRecords.map((record, i) => {
                                            const task = tasks.find(t => t.id === record.taskId);
                                            const timeStr = record.timestamp
                                                ? new Date(record.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
                                                : 'Completed';

                                            return (
                                                <div key={i} className="flex items-center gap-4 p-4 hover:bg-white/5 transition-colors">
                                                    {/* Task Color Indicator */}
                                                    <div
                                                        className="w-2 h-10 rounded-full shrink-0"
                                                        style={{ backgroundColor: task?.color || '#555' }}
                                                    />

                                                    <div className="flex-1 min-w-0">
                                                        <div className="flex items-center justify-between mb-1">
                                                            <h4 className="font-medium text-white truncate pr-2">
                                                                {task?.name || 'Unknown Task'}
                                                            </h4>
                                                            <span className="text-xs text-zinc-500 font-mono shrink-0">
                                                                {timeStr}
                                                            </span>
                                                        </div>

                                                        <div className="flex items-center gap-3 text-xs text-zinc-400">
                                                            {record.value !== undefined && (
                                                                <span className="bg-zinc-800 px-2 py-0.5 rounded text-zinc-300">
                                                                    Value: {record.value} {task?.metricConfig?.unit}
                                                                </span>
                                                            )}
                                                            {record.intensity !== null && record.intensity !== undefined && (
                                                                <div className="flex items-center gap-1">
                                                                    <Flame className="w-3 h-3 text-orange-500" />
                                                                    <span>Intensity: {record.intensity}</span>
                                                                </div>
                                                            )}
                                                            {!record.value && record.intensity === null && (
                                                                <span>Task Completed</span>
                                                            )}
                                                        </div>
                                                    </div>
                                                </div>
                                            );
                                        })}
                                    </div>
                                </div>
                            );
                        }) : (
                            <div className="text-center py-12 text-zinc-500 text-sm">
                                No history recorded yet. The void awaits your actions.
                            </div>
                        )}
                    </div>
                )}

                {activeTab === 'notes' && (
                    <div className="py-12 text-center animate-[fadeIn_0.5s_ease-out]">
                        <div className="inline-block p-6 rounded-full bg-zinc-900 mb-4">
                            <FileText className="w-12 h-12 text-zinc-700" />
                        </div>
                        <h3 className="text-xl font-bold mb-2">Notes</h3>
                        <p className="text-zinc-500 text-sm">Your personal notes will appear here.</p>
                    </div>
                )}

            </div>

            <SettingsModal isOpen={isSettingsOpen} onClose={() => setIsSettingsOpen(false)} />

            <EditProfileModal
                isOpen={isEditProfileOpen}
                onClose={() => setIsEditProfileOpen(false)}
                user={user}
                onUpdate={getUser}
            />

            <CreateStoryModal
                isOpen={isCreateStoryOpen}
                onClose={() => setIsCreateStoryOpen(false)}
            />

            {viewingStoryIndex !== null && (
                <StoryViewer
                    initialStoryIndex={viewingStoryIndex}
                    stories={stories}
                    onClose={() => setViewingStoryIndex(null)}
                />
            )}

            <ArtifactGallery isOpen={isArtifactGalleryOpen} onClose={() => setIsArtifactGalleryOpen(false)} />
        </div>
    );
}
