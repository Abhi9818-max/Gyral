"use client";

import { useRef, useState, useEffect, MouseEvent } from 'react';
import Link from 'next/link';
import {
    ChevronLeft, Download, Shield, Database, Cloud, Upload, RefreshCw, Skull, Calendar,
    User, Lock, Bell, Globe, Moon, ChevronRight, Eye, EyeOff, Trash2,
    Home, Flame, Coins, Sword, ClipboardList, MessageCircle, ScrollText
} from 'lucide-react';
import { useUserData, ALL_NAV_ITEMS, NavItemKey } from '@/context/user-data-context';
import { subscribeUserToPush } from '@/lib/push-notifications';
import { useInstallPrompt } from '@/hooks/use-install-prompt';

const ICON_MAP = {
    Home, Globe, Flame, Coins, Shield, Sword,
    ClipboardList, MessageCircle, ScrollText, Skull, User
};

export default function SettingsPage() {
    const {
        tasks, records, pacts, notes,
        currentStreak, longestStreak, consistencyScore, streakTier, streakStrength,
        restoreData,
        birthDate, setBirthDate,
        showStatsCard, toggleStatsCard,
        user, profile, theme, setTheme, language, setLanguage,
        navPreferences, updateNavPreferences, ALL_NAV_ITEMS,
        lifeEvents, debts, vows, investments, currentFaction, isExiled, exiledUntil, onboardingCompleted
    } = useUserData();

    const { isInstallable, promptInstall } = useInstallPrompt();
    const fileInputRef = useRef<HTMLInputElement>(null);
    // const [localBirthDate, setLocalBirthDate] = useState(''); // Removed in favor of split state
    const [notificationStatus, setNotificationStatus] = useState('Off');
    const [resetSending, setResetSending] = useState(false);

    // Date Logic
    const [day, setDay] = useState('');
    const [month, setMonth] = useState('');
    const [year, setYear] = useState('');

    useEffect(() => {
        if (birthDate) {
            const date = new Date(birthDate);
            if (!isNaN(date.getTime())) {
                setDay(date.getDate().toString().padStart(2, '0'));
                setMonth((date.getMonth() + 1).toString().padStart(2, '0'));
                setYear(date.getFullYear().toString());
            }
        }
    }, [birthDate]);

    // Debug: Log user data
    useEffect(() => {
        console.log('Settings Page - User Data:', {
            user: user ? { id: user.id, email: user.email } : null,
            profile: profile ? { full_name: profile.full_name, avatar_url: profile.avatar_url } : null
        });
    }, [user, profile]);

    // Debounced Update
    useEffect(() => {
        const timeoutId = setTimeout(() => {
            if (day && month && year && year.length === 4) {
                const newDate = `${year}-${month.padStart(2, '0')}-${day.padStart(2, '0')}`;
                // Only update if different to avoid loops
                if (newDate !== birthDate) {
                    setBirthDate(newDate);
                }
            }
        }, 800);

        return () => clearTimeout(timeoutId);
    }, [day, month, year, birthDate, setBirthDate]);

    const handleResetPassword = async () => {
        if (!user?.email) return;
        if (!confirm(`Send password reset email to ${user.email}?`)) return;

        setResetSending(true);
        try {
            // Dynamic import to avoid server-side issues if any
            const { createClient } = require('@/utils/supabase/client');
            const supabase = createClient();
            const { error } = await supabase.auth.resetPasswordForEmail(user.email, {
                redirectTo: window.location.origin + '/auth/callback?next=/settings',
            });
            if (error) throw error;
            alert('Password reset email sent! Check your inbox.');
        } catch (e: any) {
            alert('Error sending reset email: ' + e.message);
        } finally {
            setResetSending(false);
        }
    };

    const handleTestPush = async (e: MouseEvent<HTMLButtonElement>) => {
        e.stopPropagation();
        if (notificationStatus !== 'On') {
            alert("Enable notifications first.");
            return;
        }

        try {
            await fetch('/api/push/send', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    title: "Signal Received",
                    body: "The Neural Link is active even in the void."
                })
            });
            alert("Signal dispatched. \n\nTry closing the app (Home Screen) to verify background delivery.");
        } catch (err) {
            console.error(err);
            alert("Signal failed to transmit.");
        }
    };

    const requestNotifications = async () => {
        if (!('Notification' in window)) return;
        const permission = await Notification.requestPermission();
        setNotificationStatus(permission === 'granted' ? 'On' : 'Off');

        if (permission === 'granted') {
            const subscribed = await subscribeUserToPush();
            if (subscribed) {
                new Notification("Gyral", { body: "Connection established. The Order is watching." });
            } else {
                alert("Notification permission granted, but failed to connect to background services.");
            }
        }
    };

    const handleExport = () => {
        const timestamp = new Date().toISOString();
        const data = {
            meta: {
                exportDate: timestamp,
                appVersion: "1.0.0",
                description: "Gyral Life Data Export - Complete Archive",
                generatedBy: "Gyral System"
            },
            identity: {
                user: { id: user?.id, email: user?.email, metadata: user?.user_metadata },
                profile,
                faction: currentFaction,
                preferences: { theme, language, navPreferences, showStatsCard }
            },
            core: {
                birthDate,
                onboardingCompleted,
                streaks: { currentStreak, longestStreak, consistencyScore, streakTier, streakStrength }
            },
            habits: {
                tasks,
                records
            },
            modules: {
                pacts,
                notes,
                memento_mori: {
                    life_events: lifeEvents,
                    debts
                },
                nights_watch: {
                    vows,
                    status: { isExiled, exiledUntil }
                },
                investment_bank: {
                    investments
                }
            }
        };

        const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `gyral-archive-${timestamp.split('T')[0]}.json`;
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
        action,
        customHeight
    }: {
        icon: any,
        label: string,
        value?: string | React.ReactNode,
        onClick?: () => void,
        isLast?: boolean,
        danger?: boolean,
        action?: React.ReactNode,
        customHeight?: boolean
    }) => (
        <div
            onClick={onClick}
            className={`flex items-center justify-between p-4 cursor-pointer hover:bg-white/5 transition-colors ${!isLast ? 'border-b border-white/5' : ''} ${customHeight ? 'py-5' : ''}`}
        >
            <div className="flex items-center gap-4">
                <div className={`p-2 rounded-full ${danger ? 'bg-red-500/10 text-red-500' : 'bg-zinc-800 text-zinc-400'}`}>
                    <Icon className="w-5 h-5" />
                </div>
                <div className="flex flex-col">
                    <span className={`font-medium ${danger ? 'text-red-400' : 'text-zinc-200'}`}>{label}</span>
                </div>
            </div>

            <div className="flex items-center gap-3">
                {value && <span className="text-sm text-zinc-500">{value}</span>}
                {action ? action : <ChevronRight className="w-4 h-4 text-zinc-600" />}
            </div>
        </div>
    );

    return (
        <div className="min-h-screen bg-black text-white p-4 pb-20 md:p-8">
            <div className="max-w-5xl mx-auto">
                {/* Header */}
                <div className="flex items-center gap-4 mb-8">
                    <Link href="/" className="p-2 -ml-2 rounded-full hover:bg-white/10 text-zinc-400 hover:text-white transition-colors">
                        <ChevronLeft className="w-6 h-6" />
                    </Link>
                    <h1 className="text-2xl font-bold">Settings</h1>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                    {/* Left Column */}
                    <div className="space-y-6">
                        {/* Profile Card */}
                        <div className="bg-zinc-900/50 border border-white/5 rounded-2xl p-6 backdrop-blur-sm flex items-center gap-4">
                            <div className="w-16 h-16 rounded-full border-2 border-white/10 overflow-hidden bg-gradient-to-br from-indigo-500 to-purple-500 flex items-center justify-center shadow-lg shadow-purple-900/20">
                                {user?.id ? (
                                    <img
                                        src={require('@/utils/avatar-helpers').getUserAvatar(profile?.avatar_url, profile?.gender, user.id)}
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
                                <h3 className="text-lg font-bold text-white max-w-[200px] truncate">
                                    {profile?.full_name || user?.user_metadata?.full_name || user?.email?.split('@')[0] || 'Traveler'}
                                </h3>
                                <p className="text-sm text-zinc-500 max-w-[200px] truncate">
                                    {user?.email || 'diogenes@example.com'}
                                </p>
                            </div>
                        </div>

                        {/* Neural Link / Install Banner */}
                        <div className="mb-8 relative group overflow-hidden rounded-2xl border border-white/10 cursor-default">
                            {/* Animated Gradient Background */}
                            <div className="absolute inset-0 bg-gradient-to-r from-indigo-900/40 via-purple-900/40 to-pink-900/40 opacity-50 group-hover:opacity-70 transition-opacity duration-500" />

                            <div className="relative p-6 md:p-8 flex flex-col md:flex-row items-center justify-between gap-6 backdrop-blur-md">
                                <div className="flex items-center gap-5">
                                    <div className="p-4 rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 shadow-[0_0_15px_rgba(139,92,246,0.3)] animate-pulse">
                                        <Download className="w-6 h-6 text-white" />
                                    </div>
                                    <div className="text-center md:text-left">
                                        <h3 className="text-xl font-bold text-white mb-1 tracking-wide">
                                            {isInstallable ? "Initialize Neural Link" : "System Synchronized"}
                                        </h3>
                                        <p className="text-sm text-zinc-400 max-w-sm">
                                            {isInstallable
                                                ? "Install Gyral for the full immersive experience. Offline access, instant load times, and deeper focus."
                                                : "You are connected to the source. Gyral is running natively on your device."}
                                        </p>
                                    </div>
                                </div>

                                {isInstallable && (
                                    <button
                                        onClick={promptInstall}
                                        className="relative px-8 py-3 bg-white text-black font-bold tracking-widest text-sm rounded-full hover:scale-105 active:scale-95 transition-all shadow-[0_0_30px_rgba(255,255,255,0.15)] hover:shadow-[0_0_40px_rgba(255,255,255,0.4)]"
                                    >
                                        INSTALL APP
                                    </button>
                                )}
                            </div>
                        </div>

                        {/* Account */}
                        <SettingsGroup title="Account">
                            <SettingsItem
                                icon={User}
                                label="Manage Profile"
                                value={user ? "Signed In" : "Guest"}
                            />
                            <SettingsItem
                                icon={Lock}
                                label="Password & Security"
                                onClick={handleResetPassword}
                                value={resetSending ? "Sending..." : "Reset"}
                            />
                            <SettingsItem
                                icon={Bell}
                                label="Notifications"
                                onClick={requestNotifications}
                                value={notificationStatus}
                                action={
                                    notificationStatus === 'On' && (
                                        <button
                                            onClick={handleTestPush}
                                            className="px-3 py-1 text-xs bg-white/10 hover:bg-white/20 rounded-full text-zinc-300 transition-colors"
                                        >
                                            TEST SIGNAL
                                        </button>
                                    )
                                }
                                isLast
                            />
                        </SettingsGroup>

                        {/* Mobile Navigation */}
                        <SettingsGroup title="Mobile Navigation">
                            <div className="p-4 space-y-4">
                                <p className="text-xs text-zinc-500 mb-2">Pin up to 3 features to your bottom navigation bar. Home and Profile stay fixed.</p>
                                <div className="grid grid-cols-2 gap-2">
                                    {ALL_NAV_ITEMS.map((item: any) => {
                                        const isActive = navPreferences.includes(item.key);
                                        const toggleItem = () => {
                                            if (isActive) {
                                                updateNavPreferences(navPreferences.filter((k: NavItemKey) => k !== item.key));
                                            } else {
                                                if (navPreferences.length < 3) {
                                                    updateNavPreferences([...navPreferences, item.key]);
                                                }
                                            }
                                        };
                                        const Icon = ICON_MAP[item.icon as keyof typeof ICON_MAP] || Globe;

                                        return (
                                            <button
                                                key={item.key}
                                                onClick={toggleItem}
                                                className={`flex items-center gap-3 p-3 rounded-xl border transition-all text-left ${isActive
                                                    ? 'bg-white/10 border-white/20 text-white shadow-lg'
                                                    : 'bg-zinc-800/50 border-white/5 text-zinc-500 grayscale opacity-60 hover:grayscale-0 hover:opacity-100'
                                                    }`}
                                            >
                                                <div className="w-8 h-8 rounded-lg bg-zinc-900 flex items-center justify-center">
                                                    <Icon className={`w-4 h-4 ${isActive ? 'text-white' : 'text-zinc-600'}`} />
                                                </div>
                                                <div>
                                                    <div className="text-sm font-bold">{item.label}</div>
                                                    <div className="text-[10px] text-zinc-500 uppercase tracking-tighter">
                                                        {item.href ? 'Navigate' : 'Modal'}
                                                    </div>
                                                </div>
                                            </button>
                                        );
                                    })}
                                </div>
                            </div>
                        </SettingsGroup>
                    </div>

                    {/* Right Column */}
                    <div className="space-y-6">
                        {/* Preferences */}
                        <SettingsGroup title="Preferences">
                            <SettingsItem
                                icon={Globe}
                                label="Language"
                                action={
                                    <select
                                        value={language}
                                        onChange={(e) => setLanguage(e.target.value)}
                                        className="bg-transparent text-sm text-zinc-400 focus:outline-none text-right cursor-pointer"
                                    >
                                        <option value="en">English</option>
                                        <option value="la">Latin</option>
                                        <option value="es">Spanish</option>
                                        <option value="jp">Japanese</option>
                                    </select>
                                }
                            />
                            <SettingsItem
                                icon={Moon}
                                label="Theme"
                                action={
                                    <select
                                        value={theme}
                                        onChange={(e) => setTheme(e.target.value)}
                                        className="bg-transparent text-sm text-zinc-400 focus:outline-none text-right cursor-pointer"
                                    >
                                        <option value="dark">Cosmic Dark</option>
                                        <option value="midnight">Midnight</option>
                                        <option value="obsidian">Obsidian</option>
                                    </select>
                                }
                            />
                            <SettingsItem
                                icon={Calendar}
                                label="Memento Mori"
                                customHeight
                                action={
                                    <div className="flex items-center gap-2">
                                        <input
                                            type="number"
                                            placeholder="DD"
                                            value={day}
                                            onChange={(e) => {
                                                const v = e.target.value.slice(0, 2);
                                                setDay(v);
                                            }}
                                            className="w-10 bg-transparent text-center border-b border-white/20 focus:border-white focus:outline-none text-sm p-1 placeholder-zinc-700"
                                        />
                                        <span className="text-zinc-600">/</span>
                                        <input
                                            type="number"
                                            placeholder="MM"
                                            value={month}
                                            onChange={(e) => {
                                                const v = e.target.value.slice(0, 2);
                                                setMonth(v);
                                            }}
                                            className="w-10 bg-transparent text-center border-b border-white/20 focus:border-white focus:outline-none text-sm p-1 placeholder-zinc-700"
                                        />
                                        <span className="text-zinc-600">/</span>
                                        <input
                                            type="number"
                                            placeholder="YYYY"
                                            value={year}
                                            onChange={(e) => {
                                                const v = e.target.value.slice(0, 4);
                                                setYear(v);
                                            }}
                                            className="w-14 bg-transparent text-center border-b border-white/20 focus:border-white focus:outline-none text-sm p-1 placeholder-zinc-700"
                                        />
                                    </div>
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
                        <div className="text-center text-xs text-zinc-600 mt-12 mb-8">
                            <p>Diogenes v1.0.0</p>
                            <p className="mt-1">Stoic Engineering</p>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
