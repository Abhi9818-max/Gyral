"use client";

import { useState, useEffect } from 'react';
import { X, Search, User } from 'lucide-react';
import { createClient } from '@/utils/supabase/client';
import { useRouter } from 'next/navigation';
import { getUserAvatar } from '@/utils/avatar-helpers';

interface SearchModalProps {
    isOpen: boolean;
    onClose: () => void;
}

interface SearchResult {
    id: string;
    username: string | null;
    full_name: string | null;
    avatar_url: string | null;
    bio: string | null;
    gender: string | null;
}

export function SearchModal({ isOpen, onClose }: SearchModalProps) {
    const [query, setQuery] = useState('');
    const [results, setResults] = useState<SearchResult[]>([]);
    const [isSearching, setIsSearching] = useState(false);
    const router = useRouter();
    const supabase = createClient();

    // Debounced search
    useEffect(() => {
        if (!query.trim()) {
            setResults([]);
            return;
        }

        const timeoutId = setTimeout(async () => {
            setIsSearching(true);
            try {
                const searchTerm = `%${query}%`;
                const { data, error } = await supabase
                    .from('profiles')
                    .select('id, username, full_name, avatar_url, bio, gender')
                    .or(`username.ilike.${searchTerm},full_name.ilike.${searchTerm}`)
                    .limit(10);

                if (error) throw error;
                setResults(data || []);
            } catch (err) {
                console.error('Search error:', err);
                setResults([]);
            } finally {
                setIsSearching(false);
            }
        }, 300); // 300ms debounce

        return () => clearTimeout(timeoutId);
    }, [query]);

    const handleUserClick = (user: SearchResult) => {
        // Use username if available, otherwise use user ID
        const identifier = user.username || user.id;
        onClose();
        setQuery('');
        setResults([]);
        router.push(`/u/${identifier}`);
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-[70] flex items-start justify-center pt-20 px-4">
            <div className="absolute inset-0 bg-black/80 backdrop-blur-sm" onClick={onClose} />

            <div className="relative w-full max-w-2xl bg-zinc-900 border border-zinc-800 rounded-2xl shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-200">

                {/* Header */}
                <div className="flex items-center gap-3 p-4 border-b border-zinc-800">
                    <Search className="w-5 h-5 text-zinc-400" />
                    <input
                        type="text"
                        value={query}
                        onChange={(e) => setQuery(e.target.value)}
                        placeholder="Search users by username or name..."
                        className="flex-1 bg-transparent text-white placeholder-zinc-500 focus:outline-none text-base"
                        autoFocus
                    />
                    <button onClick={onClose} className="p-2 rounded-full hover:bg-white/10 text-zinc-400 hover:text-white transition-colors">
                        <X className="w-5 h-5" />
                    </button>
                </div>

                {/* Results */}
                <div className="max-h-[400px] overflow-y-auto">
                    {isSearching && (
                        <div className="p-8 text-center text-zinc-500">
                            <div className="inline-block w-6 h-6 border-2 border-zinc-600 border-t-white rounded-full animate-spin mb-2" />
                            <p className="text-sm">Searching...</p>
                        </div>
                    )}

                    {!isSearching && query && results.length === 0 && (
                        <div className="p-8 text-center text-zinc-500">
                            <User className="w-12 h-12 mx-auto mb-3 opacity-50" />
                            <p className="text-sm">No users found</p>
                        </div>
                    )}

                    {!isSearching && results.length > 0 && (
                        <div className="divide-y divide-zinc-800">
                            {results.map((user) => (
                                <button
                                    key={user.id}
                                    onClick={() => handleUserClick(user)}
                                    className="w-full p-4 flex items-center gap-4 hover:bg-white/5 transition-colors text-left"
                                >
                                    {/* Avatar */}
                                    <div className="w-12 h-12 rounded-full bg-gradient-to-br from-zinc-700 to-zinc-900 border border-white/10 overflow-hidden flex-shrink-0">
                                        <img
                                            src={getUserAvatar(user.avatar_url, user.gender, user.id)}
                                            alt={user.full_name || 'User'}
                                            className="w-full h-full object-cover"
                                        />
                                    </div>

                                    {/* Info */}
                                    <div className="flex-1 min-w-0">
                                        <div className="font-semibold text-white truncate">
                                            {user.full_name || user.username || 'Anonymous'}
                                        </div>
                                        {user.username && (
                                            <div className="text-sm text-zinc-400 truncate">
                                                @{user.username}
                                            </div>
                                        )}
                                        {user.bio && (
                                            <div className="text-xs text-zinc-500 truncate mt-1">
                                                {user.bio}
                                            </div>
                                        )}
                                    </div>
                                </button>
                            ))}
                        </div>
                    )}

                    {!query && (
                        <div className="p-8 text-center text-zinc-500">
                            <Search className="w-12 h-12 mx-auto mb-3 opacity-50" />
                            <p className="text-sm">Search for users by username or name</p>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
