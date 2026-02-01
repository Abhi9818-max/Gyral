"use client";

import { useEffect, useState } from 'react';
import { use } from 'react';
import { Header } from '@/components/header';
import { Heatmap } from '@/components/heatmap';
import { createClient } from '@/utils/supabase/client';
import { ArrowLeft, User } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { getUserAvatar } from '@/utils/avatar-helpers';
import { FriendButton } from '@/components/friend-button';

interface PublicProfileData {
    id: string;
    username: string | null;
    full_name: string | null;
    avatar_url: string | null;
    bio: string | null;
    gender: string | null;
}

export default function PublicProfilePage({ params }: { params: Promise<{ username: string }> }) {
    const resolvedParams = use(params);
    const username = resolvedParams.username;
    const router = useRouter();
    const supabase = createClient();

    const [profile, setProfile] = useState<PublicProfileData | null>(null);
    const [currentUser, setCurrentUser] = useState<string | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [notFound, setNotFound] = useState(false);
    const [stats, setStats] = useState({ totalEntries: 0, currentStreak: 0, consistencyScore: 0 });

    useEffect(() => {
        const getCurrentUser = async () => {
            const { data: { user } } = await supabase.auth.getUser();
            setCurrentUser(user?.id || null);
        };
        getCurrentUser();
    }, []);

    useEffect(() => {
        const fetchPublicProfile = async () => {
            setIsLoading(true);
            try {
                // Try to fetch profile by username first, then by ID if username fails
                let profileData = null;

                // First try username
                const { data: usernameData, error: usernameError } = await supabase
                    .from('profiles')
                    .select('*')
                    .eq('username', username)
                    .maybeSingle();

                if (usernameData) {
                    profileData = usernameData;
                } else {
                    // If not found by username, try by ID
                    const { data: idData, error: idError } = await supabase
                        .from('profiles')
                        .select('*')
                        .eq('id', username)
                        .maybeSingle();

                    if (idData) {
                        profileData = idData;
                    }
                }

                if (!profileData) {
                    setNotFound(true);
                    setIsLoading(false);
                    return;
                }

                setProfile(profileData);

                // Fetch user's records to calculate stats
                const { data: records } = await supabase
                    .from('records')
                    .select('*')
                    .eq('user_id', profileData.id)
                    .order('date', { ascending: false });

                if (records) {
                    const totalEntries = records.length;

                    // Calculate streak
                    let streak = 0;
                    const today = new Date().toISOString().split('T')[0];
                    const uniqueDates = [...new Set(records.map(r => r.date))].sort().reverse();

                    if (uniqueDates.length > 0 && uniqueDates[0] === today) {
                        streak = 1;
                        let currentDate = new Date(today);
                        for (let i = 1; i < uniqueDates.length; i++) {
                            currentDate.setDate(currentDate.getDate() - 1);
                            const expectedDate = currentDate.toISOString().split('T')[0];
                            if (uniqueDates[i] === expectedDate) {
                                streak++;
                            } else {
                                break;
                            }
                        }
                    }

                    // Calculate consistency (last 30 days)
                    const thirtyDaysAgo = new Date();
                    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
                    const recentRecords = records.filter(r => new Date(r.date) >= thirtyDaysAgo);
                    const daysWithRecords = new Set(recentRecords.map(r => r.date)).size;
                    const consistencyScore = Math.round((daysWithRecords / 30) * 100);

                    setStats({ totalEntries, currentStreak: streak, consistencyScore });
                }

            } catch (err) {
                console.error('Error fetching public profile:', err);
                setNotFound(true);
            } finally {
                setIsLoading(false);
            }
        };

        fetchPublicProfile();
    }, [username]);

    if (isLoading) {
        return (
            <div className="min-h-screen flex flex-col bg-black text-white">
                <Header />
                <div className="flex-1 flex items-center justify-center">
                    <div className="inline-block w-8 h-8 border-2 border-zinc-600 border-t-white rounded-full animate-spin" />
                </div>
            </div>
        );
    }

    if (notFound || !profile) {
        return (
            <div className="min-h-screen flex flex-col bg-black text-white">
                <Header />
                <div className="flex-1 flex flex-col items-center justify-center p-6">
                    <User className="w-16 h-16 text-zinc-600 mb-4" />
                    <h1 className="text-2xl font-bold mb-2">User Not Found</h1>
                    <p className="text-zinc-500 mb-6">@{username} doesn't exist</p>
                    <button
                        onClick={() => router.back()}
                        className="px-6 py-3 bg-white text-black rounded-lg hover:bg-zinc-200 transition-colors flex items-center gap-2"
                    >
                        <ArrowLeft className="w-4 h-4" />
                        Go Back
                    </button>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen flex flex-col bg-black text-white">
            <Header />

            <div className="max-w-4xl mx-auto w-full px-4 sm:px-6 lg:px-8 pt-8">
                {/* Back Button */}
                <button
                    onClick={() => router.back()}
                    className="flex items-center gap-2 text-zinc-400 hover:text-white transition-colors mb-6"
                >
                    <ArrowLeft className="w-4 h-4" />
                    Back
                </button>

                {/* Profile Header */}
                <div className="flex items-start gap-6 mb-8">
                    {/* Avatar */}
                    <div className="w-24 h-24 md:w-32 md:h-32 rounded-full bg-gradient-to-br from-zinc-700 to-zinc-900 border-2 border-white/10 overflow-hidden flex-shrink-0">
                        <img
                            src={getUserAvatar(profile.avatar_url, profile.gender, profile.id)}
                            alt={profile.full_name || 'User'}
                            className="w-full h-full object-cover"
                        />
                    </div>

                    {/* Info */}
                    <div className="flex-1">
                        <h1 className="text-2xl md:text-3xl font-bold mb-1">{profile.full_name || profile.username || 'Anonymous'}</h1>
                        {profile.username && <p className="text-zinc-400 mb-3">@{profile.username}</p>}
                        {profile.bio && <p className="text-zinc-300 text-sm md:text-base">{profile.bio}</p>}
                    </div>
                </div>

                {/* Stats */}
                <div className="grid grid-cols-3 gap-4 mb-8 p-6 bg-white/5 border border-white/10 rounded-2xl">
                    <div className="text-center">
                        <div className="text-2xl md:text-3xl font-bold text-white">{stats.totalEntries}</div>
                        <div className="text-xs md:text-sm text-zinc-400">Entries</div>
                    </div>
                    <div className="text-center">
                        <div className="text-2xl md:text-3xl font-bold text-white">{stats.currentStreak}</div>
                        <div className="text-xs md:text-sm text-zinc-400">Streak</div>
                    </div>
                    <div className="text-center">
                        <div className="text-2xl md:text-3xl font-bold text-white">{stats.consistencyScore}%</div>
                        <div className="text-xs md:text-sm text-zinc-400">Consistency</div>
                    </div>
                </div>

                {/* Friend Actions */}
                {currentUser && profile && (
                    <div className="mb-8 flex justify-center">
                        <FriendButton userId={profile.id} currentUserId={currentUser} />
                    </div>
                )}

                {/* Activity Heatmap */}
                <div className="mb-8">
                    <h2 className="text-xl font-bold mb-4">Activity</h2>
                    <Heatmap />
                </div>
            </div>
        </div>
    );
}
