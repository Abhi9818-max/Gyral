"use client";

import { useRef, useState, useEffect } from 'react';
import {
    X, Download, Shield, Database, Cloud, Upload, RefreshCw, Skull, Calendar,
    User, Lock, Bell, Globe, Moon, ChevronRight, Eye, EyeOff, FileJson, Trash2, LogOut
} from 'lucide-react';
import { useUserData } from '@/context/user-data-context';
import { getUserAvatar } from '@/utils/avatar-helpers';

interface SettingsModalProps {
    isOpen: boolean;
    onClose: () => void;
}

export function SettingsModal({ isOpen, onClose }: SettingsModalProps) {
    const {
        tasks, records, pacts, notes,
        currentStreak, longestStreak, consistencyScore, streakTier, streakStrength,
        restoreData,
        birthDate, setBirthDate,
        showStatsCard, toggleStatsCard,
        user, profile
    } = useUserData();

    const fileInputRef = useRef<HTMLInputElement>(null);
    const [localBirthDate, setLocalBirthDate] = useState('');

    useEffect(() => {
        if (birthDate) setLocalBirthDate(birthDate);
    }, [birthDate]);

    if (!isOpen) return null;

    const handleBirthDateChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const newValue = e.target.value;
        setLocalBirthDate(newValue);
        if (newValue) {
            setBirthDate(newValue);
        }
    };

    const handleExport = () => {
        const timestamp = new Date().toISOString();
        const data = {
            meta: {
                exportDate: timestamp,
                appVersion: "1.0.0",
                description: "Diogenes Life Data Export - Use with AI for analysis"
            },
            profile: {
                currentStreak,
                longestStreak,
                consistencyScore,
                streakTier,
                streakStrength,
                birthDate
            },
            habits: tasks,
            records,
            pacts,
            notes
        };

        const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `diogenes-life-data-${timestamp.split('T')[0]}.json`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
    };

    const handleImportClick = () => {
        fileInputRef.current?.click();
    };

    const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0];
        if (!file) return;

        const reader = new FileReader();
        reader.onload = (e) => {
            try {
                const json = JSON.parse(e.target?.result as string);
                if (confirm("⚠️ RESURRECTION PROTOCOL\n\nThis will OVERWRITE your current data with the backup file.\n\nAre you sure you want to proceed?")) {
                    const success = restoreData(json);
                    if (success) {
                        alert("Resurrection complete. The cycle continues.");
                        window.location.reload();
                    } else {
                        alert("Resurrection failed. The data was corrupted.");
                    }
                }
            } catch (error) {
                console.error("Import error:", error);
                alert("Invalid file format.");
            }
        };
        reader.readAsText(file);
        if (event.target) event.target.value = '';
    };

    const SettingsGroup = ({ title, children }: { title?: string, children: React.ReactNode }) => (
        <div className="mb-6">
            {title && <h3 className="text-sm font-semibold text-zinc-500 mb-3 px-1">{title}</h3>}
            <div className="bg-zinc-900/50 border border-white/5 rounded-2xl overflow-hidden backdrop-blur-sm">
                {children}
            </div>
        </div>
    );

    const SettingsItem = ({
        icon: Icon,
        label,
        value,
        onClick,
        isLast,
        danger,
        action
    }: {
        icon: any,
        label: string,
        value?: string | React.ReactNode,
        onClick?: () => void,
        isLast?: boolean,
        danger?: boolean,
        action?: React.ReactNode
    }) => (
        <div
            onClick={onClick}
            className={`flex items-center justify-between p-4 cursor-pointer hover:bg-white/5 transition-colors ${!isLast ? 'border-b border-white/5' : ''}`}
        >
            <div className="flex items-center gap-4">
                <div className={`p-2 rounded-full ${danger ? 'bg-red-500/10 text-red-500' : 'bg-zinc-800 text-zinc-400'}`}>
                    <Icon className="w-5 h-5" />
                </div>
                <span className={`font-medium ${danger ? 'text-red-400' : 'text-zinc-200'}`}>{label}</span>
            </div>

            <div className="flex items-center gap-3">
                {value && <span className="text-sm text-zinc-500">{value}</span>}
                {action ? action : <ChevronRight className="w-4 h-4 text-zinc-600" />}
            </div>
        </div>
    );

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
            <div
                className="absolute inset-0 bg-black/80 backdrop-blur-md animate-[fadeIn_0.3s_ease-out]"
                onClick={onClose}
            />

            <div className="relative w-full max-w-md bg-[#0a0a0a] rounded-3xl overflow-hidden shadow-2xl animate-[scaleIn_0.3s_ease-out] max-h-[90vh] overflow-y-auto custom-scrollbar border border-white/10">
                {/* Header */}
                <div className="sticky top-0 z-20 bg-[#0a0a0a]/80 backdrop-blur-xl border-b border-white/5 p-4 flex items-center justify-between">
                    <h2 className="text-lg font-bold text-white pl-2">Settings</h2>
                    <button
                        onClick={onClose}
                        className="p-2 rounded-full hover:bg-white/10 text-zinc-400 hover:text-white transition-colors"
                    >
                        <X className="w-5 h-5" />
                    </button>
                </div>

                <div className="p-6">
                    {/* Profile Section */}
                    <div className="flex items-center gap-4 mb-8 p-2">
                        <div className="w-16 h-16 rounded-full border-2 border-white/10 overflow-hidden bg-gradient-to-br from-indigo-500 to-purple-500 flex items-center justify-center shadow-lg shadow-purple-900/20">
                            {user?.id ? (
                                <img
                                    src={getUserAvatar(profile?.avatar_url, profile?.gender, user.id)}
                                    alt="Profile"
                                    className="w-full h-full object-cover"
                                />
                            ) : (
                                <span className="text-2xl font-bold text-white">
                                    {(profile?.full_name?.[0] || user?.user_metadata?.full_name?.[0] || user?.email?.[0] || 'D').toUpperCase()}
                                </span>
                            )}
                        </div>
                        <div>
                            <h3 className="text-lg font-bold text-white">
                                {profile?.full_name || user?.user_metadata?.full_name || user?.email?.split('@')[0] || 'Traveler'}
                            </h3>
                            <p className="text-sm text-zinc-500">
                                {user?.email || 'diogenes@example.com'}
                            </p>
                        </div>
                    </div>

                    {/* Account */}
                    <SettingsGroup title="Account">
                        <SettingsItem icon={User} label="Manage Profile" />
                        <SettingsItem icon={Lock} label="Password & Security" />
                        <SettingsItem icon={Bell} label="Notifications" isLast />
                    </SettingsGroup>

                    {/* Preferences */}
                    <SettingsGroup title="Preferences">
                        <SettingsItem icon={Globe} label="Language" value="English" />
                        <SettingsItem icon={Moon} label="Theme" value="Dark" />
                        <SettingsItem
                            icon={Calendar}
                            label="Memento Mori"
                            action={
                                <input
                                    type="date"
                                    value={localBirthDate}
                                    onChange={handleBirthDateChange}
                                    className="bg-transparent text-sm text-zinc-400 focus:outline-none text-right cursor-pointer"
                                />
                            }
                        />
                        <SettingsItem
                            icon={showStatsCard ? Eye : EyeOff}
                            label="30-Day Activity Card"
                            onClick={toggleStatsCard}
                            action={
                                <div className={`w-11 h-6 rounded-full p-1 transition-colors duration-300 ${showStatsCard ? 'bg-blue-600' : 'bg-zinc-700'}`}>
                                    <div className={`w-4 h-4 bg-white rounded-full shadow-sm transition-transform duration-300 ${showStatsCard ? 'translate-x-5' : 'translate-x-0'}`} />
                                </div>
                            }
                            isLast
                        />
                    </SettingsGroup>

                    {/* System / Data */}
                    <SettingsGroup title="Data Management">
                        <SettingsItem
                            icon={Cloud}
                            label="Export Data"
                            onClick={handleExport}
                            value="JSON"
                        />
                        <input
                            type="file"
                            accept=".json"
                            ref={fileInputRef}
                            onChange={handleFileChange}
                            className="hidden"
                        />
                        <SettingsItem
                            icon={RefreshCw}
                            label="Import Backup"
                            onClick={handleImportClick}
                        />
                        <SettingsItem
                            icon={Trash2}
                            label="Clear Local Data"
                            danger
                            isLast
                            onClick={() => {
                                if (confirm("Are you sure? This will wipe all diogenes data from this browser.")) {
                                    localStorage.clear();
                                    window.location.reload();
                                }
                            }}
                        />
                    </SettingsGroup>

                    {/* Footer */}
                    <div className="text-center text-xs text-zinc-600 mt-8 mb-4">
                        <p>Diogenes v1.0.0</p>
                        <p className="mt-1">Stoic Engineering</p>
                    </div>

                </div>
            </div>
        </div>
    );
}
