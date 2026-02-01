"use client";

import { useState } from 'react';
import { createClient } from '@/utils/supabase/client';
import { X, Users as UsersIcon, Camera } from 'lucide-react';
import { getUserAvatar } from '@/utils/avatar-helpers';

interface Friend {
    id: string;
    full_name: string | null;
    username: string | null;
    avatar_url: string | null;
    gender: string | null;
}

interface CreateGroupModalProps {
    isOpen: boolean;
    onClose: () => void;
    friends: Friend[];
}

export function CreateGroupModal({ isOpen, onClose, friends }: CreateGroupModalProps) {
    const [groupName, setGroupName] = useState('');
    const [groupBio, setGroupBio] = useState('');
    const [selectedMembers, setSelectedMembers] = useState<string[]>([]);
    const [isCreating, setIsCreating] = useState(false);
    const supabase = createClient();

    const toggleMember = (userId: string) => {
        setSelectedMembers(prev =>
            prev.includes(userId)
                ? prev.filter(id => id !== userId)
                : [...prev, userId]
        );
    };

    const createGroup = async () => {
        if (!groupName.trim() || selectedMembers.length === 0) {
            alert('Please enter a group name and select at least one member');
            return;
        }

        setIsCreating(true);

        try {
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) return;

            // Create group
            const { data: group, error: groupError } = await supabase
                .from('groups')
                .insert({
                    name: groupName.trim(),
                    bio: groupBio.trim() || null,
                    created_by: user.id
                })
                .select()
                .single();

            if (groupError) throw groupError;

            // Add creator as admin
            await supabase
                .from('group_members')
                .insert({
                    group_id: group.id,
                    user_id: user.id,
                    role: 'admin'
                });

            // Add selected members
            const memberInserts = selectedMembers.map(userId => ({
                group_id: group.id,
                user_id: userId,
                role: 'member'
            }));

            await supabase
                .from('group_members')
                .insert(memberInserts);

            // Reset and close
            setGroupName('');
            setGroupBio('');
            setSelectedMembers([]);
            onClose();
        } catch (error) {
            console.error('Error creating group:', error);
            alert('Failed to create group');
        } finally {
            setIsCreating(false);
        }
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-[100] p-4">
            <div className="bg-gradient-to-br from-zinc-900 to-black border border-white/20 rounded-2xl w-full max-w-2xl max-h-[80vh] flex flex-col shadow-2xl">
                {/* Header */}
                <div className="p-6 border-b border-white/10 flex items-center justify-between">
                    <h2 className="text-2xl font-bold flex items-center gap-2">
                        <UsersIcon className="w-6 h-6 text-blue-400" />
                        Create Group
                    </h2>
                    <button
                        onClick={onClose}
                        className="p-2 hover:bg-white/10 rounded-full transition-colors"
                    >
                        <X className="w-5 h-5" />
                    </button>
                </div>

                {/* Content */}
                <div className="flex-1 overflow-y-auto p-6 space-y-6">
                    {/* Group Name */}
                    <div>
                        <label className="block text-sm font-semibold mb-2">
                            Group Name *
                        </label>
                        <input
                            type="text"
                            value={groupName}
                            onChange={(e) => setGroupName(e.target.value)}
                            placeholder="Enter group name..."
                            className="w-full bg-white/10 border border-white/20 rounded-lg px-4 py-3 text-white focus:outline-none focus:border-white/40 transition-colors placeholder:text-zinc-500"
                        />
                    </div>

                    {/* Group Bio */}
                    <div>
                        <label className="block text-sm font-semibold mb-2">
                            Group Bio (Optional)
                        </label>
                        <textarea
                            value={groupBio}
                            onChange={(e) => setGroupBio(e.target.value)}
                            placeholder="Describe your group..."
                            rows={3}
                            className="w-full bg-white/10 border border-white/20 rounded-lg px-4 py-3 text-white focus:outline-none focus:border-white/40 transition-colors placeholder:text-zinc-500 resize-none"
                        />
                    </div>

                    {/* Select Members */}
                    <div>
                        <label className="block text-sm font-semibold mb-2">
                            Add Members * ({selectedMembers.length} selected)
                        </label>
                        <div className="space-y-2 max-h-64 overflow-y-auto">
                            {friends.map(friend => (
                                <button
                                    key={friend.id}
                                    onClick={() => toggleMember(friend.id)}
                                    className={`w-full p-3 flex items-center gap-3 rounded-lg transition-colors ${selectedMembers.includes(friend.id)
                                            ? 'bg-blue-500/20 border-2 border-blue-500'
                                            : 'bg-white/5 border-2 border-transparent hover:bg-white/10'
                                        }`}
                                >
                                    <div className="w-10 h-10 rounded-full overflow-hidden border border-white/10">
                                        <img
                                            src={getUserAvatar(friend.avatar_url, friend.gender, friend.id)}
                                            alt={friend.full_name || 'User'}
                                            className="w-full h-full object-cover"
                                        />
                                    </div>
                                    <div className="flex-1 text-left">
                                        <div className="font-semibold">
                                            {friend.full_name || friend.username || 'User'}
                                        </div>
                                        {friend.username && (
                                            <div className="text-sm text-zinc-400">@{friend.username}</div>
                                        )}
                                    </div>
                                    {selectedMembers.includes(friend.id) && (
                                        <div className="w-5 h-5 bg-blue-500 rounded-full flex items-center justify-center">
                                            <span className="text-xs">✓</span>
                                        </div>
                                    )}
                                </button>
                            ))}
                        </div>
                    </div>
                </div>

                {/* Footer */}
                <div className="p-6 border-t border-white/10 flex justify-end gap-3">
                    <button
                        onClick={onClose}
                        className="px-6 py-3 bg-zinc-700 hover:bg-zinc-600 text-white rounded-lg font-semibold transition-colors"
                    >
                        Cancel
                    </button>
                    <button
                        onClick={createGroup}
                        disabled={isCreating || !groupName.trim() || selectedMembers.length === 0}
                        className="px-6 py-3 bg-blue-500 hover:bg-blue-600 text-white rounded-lg font-semibold transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        {isCreating ? 'Creating...' : 'Create Group'}
                    </button>
                </div>
            </div>
        </div>
    );
}
