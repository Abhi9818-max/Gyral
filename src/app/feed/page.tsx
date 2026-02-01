"use client";

import { useState, useEffect } from 'react';
import { Header } from '@/components/header';
import { createClient } from '@/utils/supabase/client';
import { Heart, MessageSquare, TrendingUp, Award, Flame } from 'lucide-react';
import { getUserAvatar } from '@/utils/avatar-helpers';

interface Activity {
    id: string;
    user_id: string;
    type: string;
    content: any;
    created_at: string;
    profile: {
        full_name: string | null;
        username: string | null;
        avatar_url: string | null;
        gender: string | null;
    };
    likes_count: number;
    comments_count: number;
    user_liked: boolean;
}

export default function ActivityFeedPage() {
    const [activities, setActivities] = useState<Activity[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [currentUser, setCurrentUser] = useState<string | null>(null);
    const supabase = createClient();

    useEffect(() => {
        const init = async () => {
            const { data: { user } } = await supabase.auth.getUser();
            if (user) {
                setCurrentUser(user.id);
                loadActivities(user.id);
            }
        };
        init();
    }, []);

    const loadActivities = async (userId: string) => {
        setIsLoading(true);

        // Get activities from friends and self
        const { data: activities } = await supabase
            .from('activities')
            .select(`
                id,
                user_id,
                type,
                content,
                created_at
            `)
            .order('created_at', { ascending: false })
            .limit(50);

        if (activities) {
            // Get profiles for all activity users
            const userIds = [...new Set(activities.map(a => a.user_id))];
            const { data: profiles } = await supabase
                .from('profiles')
                .select('id, full_name, username, avatar_url, gender')
                .in('id', userIds);

            // Get likes and comments counts
            const enrichedActivities = await Promise.all(
                activities.map(async (activity) => {
                    const { count: likesCount } = await supabase
                        .from('activity_likes')
                        .select('*', { count: 'exact', head: true })
                        .eq('activity_id', activity.id);

                    const { count: commentsCount } = await supabase
                        .from('activity_comments')
                        .select('*', { count: 'exact', head: true })
                        .eq('activity_id', activity.id);

                    const { data: userLike } = await supabase
                        .from('activity_likes')
                        .select('id')
                        .eq('activity_id', activity.id)
                        .eq('user_id', userId)
                        .single();

                    return {
                        ...activity,
                        profile: profiles?.find(p => p.id === activity.user_id) || {
                            full_name: null,
                            username: null,
                            avatar_url: null,
                            gender: null
                        },
                        likes_count: likesCount || 0,
                        comments_count: commentsCount || 0,
                        user_liked: !!userLike
                    };
                })
            );

            setActivities(enrichedActivities);
        }

        setIsLoading(false);
    };

    const toggleLike = async (activityId: string, currentlyLiked: boolean) => {
        if (!currentUser) return;

        if (currentlyLiked) {
            await supabase
                .from('activity_likes')
                .delete()
                .eq('activity_id', activityId)
                .eq('user_id', currentUser);
        } else {
            await supabase
                .from('activity_likes')
                .insert({
                    activity_id: activityId,
                    user_id: currentUser
                });
        }

        // Reload activities
        loadActivities(currentUser);
    };

    const getActivityIcon = (type: string) => {
        switch (type) {
            case 'achievement':
                return <Award className="w-5 h-5 text-yellow-500" />;
            case 'streak':
                return <Flame className="w-5 h-5 text-orange-500" />;
            case 'level_up':
                return <TrendingUp className="w-5 h-5 text-green-500" />;
            default:
                return <MessageSquare className="w-5 h-5 text-blue-500" />;
        }
    };

    const getActivityMessage = (activity: Activity) => {
        switch (activity.type) {
            case 'achievement':
                return `unlocked achievement: ${activity.content.title}`;
            case 'streak':
                return `reached a ${activity.content.days}-day streak!`;
            case 'level_up':
                return `leveled up to ${activity.content.level}!`;
            case 'post':
                return activity.content.message;
            default:
                return 'did something';
        }
    };

    return (
        <>
            <Header />
            <main className="min-h-screen bg-black pt-20 pb-24 md:pb-10">
                <div className="max-w-4xl mx-auto px-4">
                    <h1 className="text-3xl font-bold mb-8 flex items-center gap-2">
                        <TrendingUp className="w-8 h-8 text-blue-400" />
                        Activity Feed
                    </h1>

                    {isLoading ? (
                        <div className="text-center py-12 text-zinc-500">Loading...</div>
                    ) : activities.length === 0 ? (
                        <div className="text-center py-12 text-zinc-500">
                            <MessageSquare className="w-16 h-16 mx-auto mb-4 opacity-50" />
                            <p>No activities yet. Start adding friends to see their updates!</p>
                        </div>
                    ) : (
                        <div className="space-y-4">
                            {activities.map(activity => (
                                <div
                                    key={activity.id}
                                    className="bg-gradient-to-br from-zinc-900 to-black border border-white/20 rounded-2xl p-6 hover:border-white/30 transition-colors"
                                >
                                    {/* Header */}
                                    <div className="flex items-center gap-3 mb-4">
                                        <div className="w-12 h-12 rounded-full overflow-hidden border border-white/10">
                                            <img
                                                src={getUserAvatar(activity.profile.avatar_url, activity.profile.gender, activity.user_id)}
                                                alt={activity.profile.full_name || 'User'}
                                                className="w-full h-full object-cover"
                                            />
                                        </div>
                                        <div className="flex-1">
                                            <div className="font-bold">
                                                {activity.profile.full_name || activity.profile.username || 'User'}
                                            </div>
                                            <div className="text-sm text-zinc-400">
                                                {new Date(activity.created_at).toLocaleDateString()} at{' '}
                                                {new Date(activity.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                            </div>
                                        </div>
                                        {getActivityIcon(activity.type)}
                                    </div>

                                    {/* Content */}
                                    <div className="mb-4 text-lg">
                                        {getActivityMessage(activity)}
                                    </div>

                                    {/* Actions */}
                                    <div className="flex items-center gap-6 text-sm">
                                        <button
                                            onClick={() => toggleLike(activity.id, activity.user_liked)}
                                            className={`flex items-center gap-2 ${activity.user_liked ? 'text-red-500' : 'text-zinc-400 hover:text-red-500'
                                                } transition-colors`}
                                        >
                                            <Heart className={`w-5 h-5 ${activity.user_liked ? 'fill-current' : ''}`} />
                                            <span>{activity.likes_count}</span>
                                        </button>
                                        <div className="flex items-center gap-2 text-zinc-400">
                                            <MessageSquare className="w-5 h-5" />
                                            <span>{activity.comments_count}</span>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </main>
        </>
    );
}
