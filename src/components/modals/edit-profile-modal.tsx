
"use client";

import { useState, useRef, useEffect } from 'react';
// eslint-disable-next-line @typescript-eslint/no-unused-vars
import { X, Upload, Loader2, Camera, Trash2 } from 'lucide-react';
import { createClient } from '@/utils/supabase/client';
import { User } from '@supabase/supabase-js';
import { getUserAvatar } from '@/utils/avatar-helpers';

interface EditProfileModalProps {
    isOpen: boolean;
    onClose: () => void;
    user: User | null;
    profile?: any;
    onUpdate: () => void;
}

export function EditProfileModal({ isOpen, onClose, user, profile, onUpdate }: EditProfileModalProps) {
    const [fullName, setFullName] = useState('');
    const [bio, setBio] = useState('');
    const [avatarUrl, setAvatarUrl] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [file, setFile] = useState<File | null>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);
    const [presetGender, setPresetGender] = useState<'male' | 'female'>('male');

    // Dynamically set preset gender default based on user gender if available
    useEffect(() => {
        if (profile?.gender === 'female') {
            setPresetGender('female');
        } else {
            setPresetGender('male');
        }
    }, [profile, isOpen]);

    const malePresets = Array.from({ length: 20 }, (_, i) => i + 1)
        .filter(n => n !== 14) // skip missing #14
        .map(n => `/avatars/default-male${n}.jpeg`);

    const femalePresets = Array.from({ length: 15 }, (_, i) => i + 1)
        .map(n => `/avatars/default-female${n}.jpeg`);

    const presets = presetGender === 'male' ? malePresets : femalePresets;

    useEffect(() => {
        if (user) {
            setFullName(profile?.full_name || user.user_metadata?.full_name || '');
            setBio(profile?.bio || user.user_metadata?.bio || '');
            setAvatarUrl(getUserAvatar(profile?.avatar_url || user.user_metadata?.avatar_url, profile?.gender, user.id));
        }
    }, [user, profile, isOpen]);

    if (!isOpen) return null;

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files[0]) {
            const selectedFile = e.target.files[0];
            setFile(selectedFile);
            setAvatarUrl(URL.createObjectURL(selectedFile)); // Preview
        }
    };

    const handleSave = async () => {
        if (!user) return;
        setIsLoading(true);

        try {
            const supabase = createClient();
            let uploadedAvatarUrl = profile?.avatar_url || user.user_metadata?.avatar_url || null;

            // 1. Upload Image if changed
            if (file) {
                // Delete old avatar from storage if it was a user-uploaded image (not a preset)
                const oldAvatarUrl = profile?.avatar_url || user.user_metadata?.avatar_url;
                if (oldAvatarUrl && !oldAvatarUrl.startsWith('/avatars/')) {
                    try {
                        const urlParts = oldAvatarUrl.split('/avatars/');
                        if (urlParts.length > 1) {
                            const oldFileName = urlParts[1];
                            await supabase.storage
                                .from('avatars')
                                .remove([oldFileName]);
                            console.log('Deleted old avatar:', oldFileName);
                        }
                    } catch (deleteError) {
                        console.warn('Could not delete old avatar:', deleteError);
                    }
                }

                const fileExt = file.name.split('.').pop();
                const fileName = `${user.id}-${Date.now()}.${fileExt}`;
                const filePath = `${fileName}`;

                const { error: uploadError } = await supabase.storage
                    .from('avatars')
                    .upload(filePath, file);

                if (uploadError) {
                    console.error('Upload error:', uploadError);
                    alert("Failed to upload image. Ensure 'avatars' bucket exists and is public.");
                } else {
                    const { data: { publicUrl } } = supabase.storage
                        .from('avatars')
                        .getPublicUrl(filePath);
                    uploadedAvatarUrl = publicUrl;
                }
            } else {
                // If they chose a preset or removed it, save the new url state
                const originalAvatar = getUserAvatar(profile?.avatar_url || user.user_metadata?.avatar_url, profile?.gender, user.id);
                if (avatarUrl !== originalAvatar) {
                    uploadedAvatarUrl = avatarUrl || null;

                    // If they had a custom uploaded avatar, clean it up from storage
                    const oldAvatarUrl = profile?.avatar_url || user.user_metadata?.avatar_url;
                    if (oldAvatarUrl && !oldAvatarUrl.startsWith('/avatars/')) {
                        try {
                            const urlParts = oldAvatarUrl.split('/avatars/');
                            if (urlParts.length > 1) {
                                const oldFileName = urlParts[1];
                                await supabase.storage
                                    .from('avatars')
                                    .remove([oldFileName]);
                            }
                        } catch (e) {
                            console.warn('Could not delete old avatar:', e);
                        }
                    }
                }
            }

            // 2. Update User Metadata
            const { error: updateError } = await supabase.auth.updateUser({
                data: {
                    full_name: fullName,
                    bio: bio,
                    avatar_url: uploadedAvatarUrl
                }
            });

            if (updateError) throw updateError;

            // 3. Sync to profiles table (for public access in World/etc)
            const { error: profileError } = await supabase
                .from('profiles')
                .upsert({
                    id: user.id,
                    email: user.email,
                    full_name: fullName,
                    bio: bio,
                    avatar_url: uploadedAvatarUrl,
                    updated_at: new Date().toISOString()
                }, {
                    onConflict: 'id'
                });

            if (profileError) {
                console.error('Profile sync error:', profileError);
                // Don't throw - user_metadata is already updated
            }

            onUpdate(); // Refresh parent
            onClose();
        } catch (error) {
            console.error('Update error:', error);
            alert("Failed to update profile.");
        } finally {
            setIsLoading(false);
        }
    };

    const handleRemovePhoto = async () => {
        if (!user) return;
        setIsLoading(true);

        try {
            const supabase = createClient();
            const oldAvatarUrl = user.user_metadata?.avatar_url;

            // Delete from storage if exists
            if (oldAvatarUrl) {
                try {
                    const urlParts = oldAvatarUrl.split('/avatars/');
                    if (urlParts.length > 1) {
                        const oldFileName = urlParts[1];
                        await supabase.storage
                            .from('avatars')
                            .remove([oldFileName]);
                    }
                } catch (deleteError) {
                    console.warn('Could not delete avatar from storage:', deleteError);
                }
            }

            // Update user metadata - set avatar_url to null
            const { error: updateError } = await supabase.auth.updateUser({
                data: {
                    full_name: fullName,
                    bio: bio,
                    avatar_url: null  // Remove avatar
                }
            });

            if (updateError) throw updateError;

            // Sync to profiles table
            const { error: profileError } = await supabase
                .from('profiles')
                .upsert({
                    id: user.id,
                    email: user.email,
                    full_name: fullName,
                    bio: bio,
                    avatar_url: null,  // Remove avatar
                    updated_at: new Date().toISOString()
                }, {
                    onConflict: 'id'
                });

            if (profileError) {
                console.error('Profile sync error:', profileError);
            }

            setAvatarUrl('');  // Clear preview
            setFile(null);
            onUpdate();
            onClose();
        } catch (error) {
            console.error('Remove photo error:', error);
            alert("Failed to remove photo.");
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
            {/* Backdrop */}
            <div
                className="absolute inset-0 bg-black/80 backdrop-blur-md animate-[fadeIn_0.3s_ease-out]"
                onClick={onClose}
            />

            {/* Modal */}
            <div className="relative w-full max-w-md bg-[#0a0a0a] border border-white/10 rounded-xl overflow-hidden shadow-2xl animate-[scaleIn_0.3s_ease-out]">
                <div className="flex items-center justify-between p-4 border-b border-white/5">
                    <h2 className="text-lg font-bold text-white">Edit Profile</h2>
                    <button onClick={onClose} className="text-zinc-500 hover:text-white transition-colors">
                        <X className="w-5 h-5" />
                    </button>
                </div>

                <div className="p-6 space-y-6">
                    {/* Avatar Upload */}
                    <div className="flex flex-col items-center gap-4">
                        <div className="relative group cursor-pointer" onClick={() => fileInputRef.current?.click()}>
                            <div className="w-24 h-24 rounded-full overflow-hidden border-2 border-white/10 group-hover:border-white/50 transition-colors">
                                {avatarUrl ? (
                                    // eslint-disable-next-line @next/next/no-img-element
                                    <img src={avatarUrl} alt="Avatar" className="w-full h-full object-cover" />
                                ) : (
                                    <div className="w-full h-full bg-zinc-800 flex items-center justify-center text-zinc-500 text-2xl font-bold">
                                        {fullName?.[0] || "?"}
                                    </div>
                                )}
                            </div>
                            <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 flex items-center justify-center rounded-full transition-opacity">
                                <Camera className="w-6 h-6 text-white" />
                            </div>
                        </div>
                        <input
                            type="file"
                            ref={fileInputRef}
                            onChange={handleFileChange}
                            accept="image/*"
                            className="hidden"
                        />
                        <button
                            onClick={() => fileInputRef.current?.click()}
                            className="text-blue-400 text-sm font-semibold hover:text-blue-300 transition-colors"
                        >
                            Change Profile Photo
                        </button>
                        {(user?.user_metadata?.avatar_url || avatarUrl) && (
                            <button
                                onClick={handleRemovePhoto}
                                disabled={isLoading}
                                className="text-red-400 text-sm font-semibold hover:text-red-300 transition-colors flex items-center gap-1.5 disabled:opacity-50"
                            >
                                <Trash2 className="w-3.5 h-3.5" />
                                Remove Photo
                            </button>
                        )}
                    </div>

                    {/* Preset Avatars Selection */}
                    <div className="space-y-3 border-t border-b border-white/5 py-4">
                        <div className="flex items-center justify-between">
                            <label className="text-xs font-bold text-zinc-400 uppercase tracking-wider">Choose a Preset Avatar</label>
                            <div className="flex gap-2 bg-zinc-900/60 p-0.5 rounded-lg border border-white/5">
                                <button
                                    type="button"
                                    onClick={() => setPresetGender('male')}
                                    className={`px-2.5 py-1 text-xs font-semibold rounded-md transition-colors ${presetGender === 'male' ? 'bg-white text-black' : 'text-zinc-400 hover:text-white'}`}
                                >
                                    Male
                                </button>
                                <button
                                    type="button"
                                    onClick={() => setPresetGender('female')}
                                    className={`px-2.5 py-1 text-xs font-semibold rounded-md transition-colors ${presetGender === 'female' ? 'bg-white text-black' : 'text-zinc-400 hover:text-white'}`}
                                >
                                    Female
                                </button>
                            </div>
                        </div>

                        <div className="grid grid-cols-6 gap-2 max-h-[120px] overflow-y-auto p-1 bg-black/40 border border-white/5 rounded-lg scrollbar-thin scrollbar-thumb-zinc-800">
                            {presets.map((presetUrl) => {
                                const isSelected = avatarUrl === presetUrl;
                                return (
                                    <div
                                        key={presetUrl}
                                        onClick={() => {
                                            setAvatarUrl(presetUrl);
                                            setFile(null); // Clear pending upload
                                        }}
                                        className={`relative aspect-square rounded-full overflow-hidden cursor-pointer border-2 transition-all ${isSelected ? 'border-emerald-500 scale-105 shadow-[0_0_8px_rgba(16,185,129,0.3)]' : 'border-transparent hover:border-white/30'}`}
                                    >
                                        <img src={presetUrl} alt="Preset Avatar" className="w-full h-full object-cover" />
                                    </div>
                                );
                            })}
                        </div>
                    </div>

                    {/* Inputs */}
                    <div className="space-y-4">
                        <div className="space-y-1">
                            <label className="text-xs font-bold text-zinc-400 uppercase tracking-wider">Name</label>
                            <input
                                type="text"
                                value={fullName}
                                onChange={(e) => setFullName(e.target.value)}
                                className="w-full bg-black border border-white/20 rounded-lg px-3 py-2 text-white focus:outline-none focus:border-white transition-colors placeholder:text-zinc-700"
                                placeholder="Your Name"
                            />
                        </div>

                        <div className="space-y-1">
                            <label className="text-xs font-bold text-zinc-400 uppercase tracking-wider">Bio</label>
                            <textarea
                                value={bio}
                                onChange={(e) => setBio(e.target.value)}
                                className="w-full bg-black border border-white/20 rounded-lg px-3 py-2 text-white focus:outline-none focus:border-white transition-colors placeholder:text-zinc-700 min-h-[100px] resize-none"
                                placeholder="Tell your story..."
                            />
                        </div>
                    </div>

                    <button
                        onClick={handleSave}
                        disabled={isLoading}
                        className="w-full py-3 bg-white text-black font-bold rounded-lg hover:bg-zinc-200 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                    >
                        {isLoading && <Loader2 className="w-4 h-4 animate-spin" />}
                        {isLoading ? "Saving..." : "Save Changes"}
                    </button>
                </div>
            </div>
        </div>
    );
}
