"use client";

import { useRef, useState, useEffect, MouseEvent } from 'react';
import {
    Download, Shield, Database, Cloud, Upload, RefreshCw, Skull, Calendar,
    User, Lock, Bell, Globe, Moon, ChevronRight, Eye, EyeOff, Trash2,
    Home, Flame, Coins, Sword, ClipboardList, MessageCircle, ScrollText,
    Settings, LogOut, TestTube, LogIn, Volume2, VolumeX
} from 'lucide-react';
import { useUserData, ALL_NAV_ITEMS, NavItemKey } from '@/context/user-data-context';
import { sfx } from '@/utils/sfx';
import {
    enablePushNotifications,
    disablePushNotifications,
    isPushSubscribed,
    isPushSupported,
    getNotificationPermission
} from '@/lib/push-notifications';
import { useInstallPrompt } from '@/hooks/use-install-prompt';
import { getUserAvatar } from '@/utils/avatar-helpers';

const ICON_MAP = {
    Home, Globe, Flame, Coins, Shield, Sword,
    ClipboardList, MessageCircle, ScrollText, Skull, User
};

interface SettingsViewProps {
    isModal?: boolean;
}

export function SettingsView({ isModal = false }: SettingsViewProps) {
    const {
        tasks, records, pacts, notes,
        currentStreak, longestStreak, consistencyScore, streakTier, streakStrength,
        restoreData,
        birthDate, setBirthDate,
        mementoViewMode, toggleMementoViewMode,
        showStatsCard, toggleStatsCard,
        user, profile, theme, setTheme, language, setLanguage,
        navPreferences, updateNavPreferences,
        lifeEvents, debts, vows, investments, currentFaction, isExiled, exiledUntil, onboardingCompleted
    } = useUserData();

    const { isInstallable, promptInstall } = useInstallPrompt();
    const fileInputRef = useRef<HTMLInputElement>(null);
    const [pushNotifications, setPushNotifications] = useState(false);
    const [pushLoading, setPushLoading] = useState(false);
    const [pushSupported, setPushSupported] = useState(true);
    const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' | 'info' } | null>(null);

    // Legacy state for other notifications if needed, generally replaced by pushNotifications
    const [notificationStatus, setNotificationStatus] = useState('Off');
    const [resetSending, setResetSending] = useState(false);
    const [isTestingPush, setIsTestingPush] = useState(false);

    // Date Logic
    const [day, setDay] = useState('');
    const [month, setMonth] = useState('');

    const [year, setYear] = useState('');
    const [soundEnabled, setSoundEnabled] = useState(true);

    useEffect(() => {
        setSoundEnabled(sfx.isEnabled());
    }, []);

    const handleSoundToggle = () => {
        const newState = sfx.toggle();
        setSoundEnabled(newState);
        if (newState) sfx.playSuccess();
    };

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

    useEffect(() => {
        const timeoutId = setTimeout(() => {
            if (day && month && year && year.length === 4) {
                const newDate = `${year}-${month.padStart(2, '0')}-${day.padStart(2, '0')}`;
                if (newDate !== birthDate) {
                    setBirthDate(newDate);
                }
            }
        }, 800);
        return () => clearTimeout(timeoutId);
    }, [day, month, year, birthDate, setBirthDate]);

    useEffect(() => {
        const checkPushStatus = async () => {
            const supported = await isPushSupported();
            setPushSupported(supported);

            if (supported) {
                const isSubscribed = await isPushSubscribed();
                setPushNotifications(isSubscribed);
                setNotificationStatus(isSubscribed ? 'On' : 'Off');
            } else {
                setNotificationStatus('Off');
            }
        };
        checkPushStatus();
    }, []);

    const showToast = (message: string, type: 'success' | 'error' | 'info' = 'info') => {
        setToast({ message, type });
        setTimeout(() => setToast(null), 4000);
    };

    const handleResetPassword = async () => {
        if (!user?.email) return;
        if (!confirm(`Send password reset email to ${user.email}?`)) return;

        setResetSending(true);
        try {
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

    const handleTestPush = async (e?: MouseEvent<HTMLButtonElement>, type: 'morning' | 'evening' | 'general' = 'general') => {
        e?.stopPropagation();
        if (notificationStatus !== 'On') {
            alert("Enable notifications first.");
            return;
        }

        setIsTestingPush(true);

        const MESSAGES = {
            general: {
                title: "Signal Received",
                body: "The Neural Link is active even in the void."
            },
            morning: {
                title: "Morning Briefing",
                body: "The sun rises. What will you conquer today?"
            },
            evening: {
                title: "Evening Evaluation",
                body: "The day ends. Update your records. Did you live according to your nature?"
            }
        };

        const msg = MESSAGES[type];

        try {
            // Always show via native notification (reliable, works immediately)
            if ('serviceWorker' in navigator) {
                const reg = await navigator.serviceWorker.ready;
                await reg.showNotification(msg.title, {
                    body: msg.body,
                    icon: '/icons/icon-192.png',
                    badge: '/icons/icon-192.png',
                });
            } else {
                new Notification(msg.title, {
                    body: msg.body,
                    icon: '/icons/icon-192.png',
                });
            }

            // For morning/evening, also test the server API (in the background, non-blocking)
            if (type !== 'general') {
                fetch(`/api/cron/${type}`, { method: 'POST' })
                    .then(res => res.json())
                    .then(data => {
                        console.log(`Server ${type} test:`, data);
                        if (data.error) alert(`Server Error: ${data.error}`);
                        if (data.success) alert(`Server sent to ${data.sent || data.message} devices`);
                    })
                    .catch(err => {
                        console.warn(`Server ${type} test failed:`, err);
                        alert(`Server Connection Failed: ${err.message}`);
                    });
            }
        } catch (err: any) {
            console.error(err);
            alert("Signal failed: " + (err?.message || "Unknown error"));
        } finally {
            setIsTestingPush(false);
        }
    };

    const handlePushToggle = async () => {
        if (pushLoading) return;

        if (!pushSupported) {
            showToast('Push notifications are not supported in this browser', 'error');
            return;
        }

        setPushLoading(true);
        try {
            if (pushNotifications) {
                const success = await disablePushNotifications();
                if (success) {
                    setPushNotifications(false);
                    setNotificationStatus('Off');
                    showToast('Push notifications disabled', 'success');
                } else {
                    showToast('Failed to disable push notifications', 'error');
                }
            } else {
                const success = await enablePushNotifications();
                if (success) {
                    setPushNotifications(true);
                    setNotificationStatus('On');
                    showToast('🔔 Push notifications enabled! You\'ll receive notifications even when the app is closed.', 'success');
                } else {
                    const permission = getNotificationPermission();
                    if (permission === 'denied') {
                        showToast('Notification permission denied. Please enable it in your browser settings.', 'error');
                    } else {
                        showToast('Failed to enable push notifications. Please try again.', 'error');
                    }
                }
            }
        } catch (error) {
            console.error('Error toggling push notifications:', error);
            showToast('An error occurred. Please try again.', 'error');
        } finally {
            setPushLoading(false);
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
            habits: { tasks, records },
            modules: {
                pacts, notes,
                memento_mori: { life_events: lifeEvents, debts },
                nights_watch: { vows, status: { isExiled, exiledUntil } },
                investment_bank: { investments }
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
            {title && <h3 className="text-sm font-semibold text-zinc-500 mb-3 px-1 tracking-wider uppercase">{title}</h3>}
            <div className="bg-zinc-900/50 border border-white/5 rounded-2xl overflow-hidden backdrop-blur-sm">
                {children}
            </div>
        </div>
    );

    const SettingsItem = ({
        icon: Icon, label, value, onClick, isLast, danger, action, customHeight
    }: {
        icon: any, label: string, value?: string | React.ReactNode, onClick?: (e: React.MouseEvent) => void | Promise<void>, isLast?: boolean, danger?: boolean, action?: React.ReactNode, customHeight?: boolean
    }) => (
        <div
            onClick={(e) => onClick?.(e)}
            className={`flex items-center justify-between p-4 cursor-pointer hover:bg-white/10 transition-colors ${!isLast ? 'border-b border-white/5' : ''} ${customHeight ? 'py-5' : ''}`}
        >
            <div className="flex items-center gap-4">
                <div className={`p-2 rounded-xl ${danger ? 'bg-red-500/10 text-red-500' : 'bg-zinc-800 text-zinc-400'}`}>
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
        <div className={`w-full ${isModal ? 'pb-8' : ''}`}>
            {/* Identity Card */}
            <div className="bg-zinc-900/50 border border-white/5 rounded-3xl p-6 mb-8 backdrop-blur-sm flex items-center gap-5">
                <div className="w-20 h-20 shrink-0 rounded-full border-2 border-white/10 overflow-hidden bg-gradient-to-br from-indigo-500 to-purple-500 flex items-center justify-center shadow-lg shadow-purple-900/20">
                    {user?.id ? (
                        <img
                            src={getUserAvatar(profile?.avatar_url, profile?.gender, user.id)}
                            alt="Profile"
                            className="w-full h-full object-cover rounded-full"
                        />
                    ) : (
                        <span className="text-3xl font-bold text-white">
                            {(profile?.full_name?.[0] || user?.email?.[0] || 'D').toUpperCase()}
                        </span>
                    )}
                </div>
                <div className="min-w-0 flex-1">
                    <h3 className="text-xl font-bold text-white tracking-tight truncate">
                        {profile?.full_name || user?.user_metadata?.full_name || user?.email?.split('@')[0] || 'Traveler'}
                    </h3>
                    <p className="text-sm text-zinc-500 font-mono truncate">
                        {user?.email || 'Guest Access'}
                    </p>
                    {!user && (
                        <a href="/login" className="text-xs text-indigo-400 hover:text-indigo-300 mt-1 inline-block">
                            ➔ Sign In to Sync
                        </a>
                    )}
                </div>
            </div>

            {/* Neural Link / Install Banner */}
            {isInstallable && (
                <div className="mb-8 relative group overflow-hidden rounded-3xl border border-white/10">
                    <div className="absolute inset-0 bg-gradient-to-r from-indigo-900/40 via-purple-900/40 to-pink-900/40 opacity-50 transition-opacity" />
                    <div className="relative p-6 flex flex-col sm:flex-row items-center justify-between gap-6 backdrop-blur-md">
                        <div className="flex items-center gap-4">
                            <div className="p-4 rounded-2xl bg-white text-black">
                                <Download className="w-6 h-6" />
                            </div>
                            <div>
                                <h3 className="text-lg font-bold text-white">Initialize Neural Link</h3>
                                <p className="text-xs text-zinc-400">Install Gyral for the full immersive experience.</p>
                            </div>
                        </div>
                        <button
                            onClick={promptInstall}
                            className="w-full sm:w-auto px-6 py-2.5 bg-white text-black font-bold text-xs rounded-full hover:scale-105 active:scale-95 transition-all shadow-xl"
                        >
                            INSTALL APP
                        </button>
                    </div>
                </div>
            )}

            <div className={`grid grid-cols-1 ${!isModal ? 'lg:grid-cols-2 lg:gap-8' : 'gap-0'}`}>
                {/* Column One */}
                <div className="space-y-6">
                    <SettingsGroup title="Account">
                        <SettingsItem icon={User} label="Handle and Bio" value="Edit" />
                        <SettingsItem
                            icon={Lock}
                            label="Reset Password"
                            onClick={handleResetPassword}
                            value={resetSending ? "Dispatching..." : "Send Link"}
                        />
                        <div className="flex items-center justify-between p-4 border-b border-white/5">
                            <div className="flex items-center gap-4">
                                <div className="p-2 rounded-xl bg-zinc-800 text-zinc-400">
                                    <Bell className="w-5 h-5" />
                                </div>
                                <div className="flex flex-col">
                                    <div className="flex items-center gap-2">
                                        <span className="font-medium text-zinc-200">Push Notifications</span>
                                        {pushNotifications && (
                                            <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-green-500/20 text-green-400 border border-green-500/30 uppercase tracking-widest font-bold">
                                                Active
                                            </span>
                                        )}
                                        {!pushSupported && (
                                            <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-yellow-500/20 text-yellow-400 border border-yellow-500/30 uppercase tracking-widest font-bold">
                                                Unsupported
                                            </span>
                                        )}
                                    </div>
                                    <span className="text-xs text-zinc-500 mt-0.5">
                                        {pushSupported
                                            ? "Receive neural signals when the app is closed"
                                            : "Your browser doesn't support neural links"}
                                    </span>
                                </div>
                            </div>

                            <button
                                onClick={handlePushToggle}
                                disabled={pushLoading || !pushSupported}
                                className={`relative w-11 h-6 rounded-full transition-colors duration-300 shrink-0 ${pushNotifications ? 'bg-indigo-600' : 'bg-zinc-700'
                                    } ${pushLoading ? 'opacity-70 cursor-wait' : ''} ${!pushSupported ? 'opacity-30 cursor-not-allowed' : 'hover:scale-105 active:scale-95'
                                    }`}
                            >
                                {pushLoading ? (
                                    <div className="absolute inset-0 flex items-center justify-center">
                                        <div className="w-3 h-3 border-2 border-white/50 border-t-white rounded-full animate-spin" />
                                    </div>
                                ) : (
                                    <div className={`absolute top-1 left-1 w-4 h-4 rounded-full bg-white shadow-sm transition-transform duration-300 ${pushNotifications ? 'translate-x-5' : 'translate-x-0'
                                        }`} />
                                )}
                            </button>
                        </div>
                    </SettingsGroup>

                    <SettingsGroup title="Mobile Access">
                        <div className="p-4 space-y-4">
                            <p className="text-[10px] text-zinc-500 uppercase font-bold tracking-widest mb-2">Navigation Pins (Select 3)</p>
                            <div className="grid grid-cols-2 gap-2">
                                {ALL_NAV_ITEMS.map((item: any) => {
                                    const isActive = navPreferences.includes(item.key);
                                    const toggleItem = () => {
                                        if (isActive) {
                                            updateNavPreferences(navPreferences.filter((k: NavItemKey) => k !== item.key));
                                        } else if (navPreferences.length < 3) {
                                            updateNavPreferences([...navPreferences, item.key]);
                                        }
                                    };
                                    const Icon = ICON_MAP[item.icon as keyof typeof ICON_MAP] || Globe;

                                    return (
                                        <button
                                            key={item.key}
                                            onClick={toggleItem}
                                            className={`flex items-center gap-3 p-3 rounded-2xl border transition-all text-left ${isActive
                                                ? 'bg-white/10 border-white/20 text-white'
                                                : 'bg-zinc-800/30 border-white/5 text-zinc-600 opacity-60'
                                                }`}
                                        >
                                            <Icon className={`w-4 h-4 ${isActive ? 'text-white' : 'text-zinc-700'}`} />
                                            <span className="text-xs font-bold truncate">{item.label}</span>
                                        </button>
                                    );
                                })}
                            </div>
                        </div>
                    </SettingsGroup>
                </div>

                {/* Column Two */}
                <div className="space-y-6">
                    <SettingsGroup title="Architecture">
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
                                </select>
                            }
                        />
                        <SettingsItem
                            icon={Moon}
                            label="App Theme"
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
                            icon={soundEnabled ? Volume2 : VolumeX}
                            label="Sound Effects"
                            onClick={handleSoundToggle}
                            action={
                                <div className={`w-10 h-5 rounded-full p-1 transition-colors duration-300 ${soundEnabled ? 'bg-indigo-600' : 'bg-zinc-700'}`}>
                                    <div className={`w-3 h-3 bg-white rounded-full transition-transform duration-300 ${soundEnabled ? 'translate-x-5' : 'translate-x-0'}`} />
                                </div>
                            }
                        />
                        <SettingsItem
                            icon={Calendar}
                            label="Death Date"
                            customHeight
                            action={
                                <div className="flex items-center gap-1.5 focus-within:text-white transition-colors">
                                    <input
                                        type="number"
                                        placeholder="DD"
                                        value={day}
                                        onChange={(e) => setDay(e.target.value.slice(0, 2))}
                                        className="w-8 bg-transparent text-center border-b border-white/20 focus:border-white focus:outline-none text-xs p-1"
                                    />
                                    <span className="text-zinc-700">/</span>
                                    <input
                                        type="number"
                                        placeholder="MM"
                                        value={month}
                                        onChange={(e) => setMonth(e.target.value.slice(0, 2))}
                                        className="w-8 bg-transparent text-center border-b border-white/20 focus:border-white focus:outline-none text-xs p-1"
                                    />
                                    <span className="text-zinc-700">/</span>
                                    <input
                                        type="number"
                                        placeholder="YYYY"
                                        value={year}
                                        onChange={(e) => setYear(e.target.value.slice(0, 4))}
                                        className="w-12 bg-transparent text-center border-b border-white/20 focus:border-white focus:outline-none text-xs p-1"
                                    />
                                </div>
                            }
                        />
                        <SettingsItem
                            icon={mementoViewMode === 'life' ? ScrollText : Calendar}
                            label="Memento View"
                            onClick={toggleMementoViewMode}
                            value={mementoViewMode === 'life' ? 'Whole Life' : 'Year Remaining'}
                        />
                        <SettingsItem
                            icon={showStatsCard ? Eye : EyeOff}
                            label="Activity Visualization"
                            onClick={toggleStatsCard}
                            action={
                                <div className={`w-10 h-5 rounded-full p-1 transition-colors duration-300 ${showStatsCard ? 'bg-indigo-600' : 'bg-zinc-700'}`}>
                                    <div className={`w-3 h-3 bg-white rounded-full transition-transform duration-300 ${showStatsCard ? 'translate-x-5' : 'translate-x-0'}`} />
                                </div>
                            }
                            isLast
                        />
                    </SettingsGroup>

                    <SettingsGroup title="Preservation">
                        <SettingsItem
                            icon={Cloud}
                            label="Archive (JSON)"
                            onClick={handleExport}
                            value="Export"
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
                            label="Resurrect Backup"
                            onClick={handleImportClick}
                            value="Import"
                        />
                        <SettingsItem
                            icon={Trash2}
                            label="Total Wipe"
                            danger
                            isLast
                            onClick={() => {
                                if (confirm("SEVERE WARNING: This will permanently delete ALL local data. Proceed with extreme caution?")) {
                                    localStorage.clear();
                                    window.location.reload();
                                }
                            }}
                        />
                    </SettingsGroup>

                    {/* Notification Tests - Unified */}
                    {notificationStatus === 'On' && (
                        <SettingsGroup title="Diagnostic Signals">
                            <SettingsItem
                                icon={TestTube}
                                label="Test Morning Briefing"
                                onClick={() => handleTestPush(undefined, 'morning')}
                            />
                            <SettingsItem
                                icon={TestTube}
                                label="Test Evening Evaluation"
                                onClick={() => handleTestPush(undefined, 'evening')}
                                isLast
                            />
                        </SettingsGroup>
                    )}
                </div>
            </div>

            <div className="text-center text-[10px] font-mono text-zinc-700 mt-12 opacity-50">
                <p>GYRAL CORE v1.2.0</p>
                <p className="mt-1 tracking-[0.3em]">SYNCHRONIZED</p>
            </div>
            {toast && (
                <div className="fixed bottom-24 left-1/2 -translate-x-1/2 z-50 animate-fade-in-up">
                    <div className={`px-6 py-3 rounded-xl backdrop-blur-xl border shadow-2xl max-w-md flex items-center gap-3 ${toast.type === 'success' ? 'bg-green-500/10 border-green-500/20 text-green-200' :
                        toast.type === 'error' ? 'bg-red-500/10 border-red-500/20 text-red-200' :
                            'bg-blue-500/10 border-blue-500/20 text-blue-200'
                        }`}>
                        {toast.type === 'success' && <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />}
                        {toast.type === 'error' && <div className="w-2 h-2 rounded-full bg-red-500 animate-pulse" />}
                        {toast.type === 'info' && <div className="w-2 h-2 rounded-full bg-blue-500 animate-pulse" />}
                        <p className="text-xs font-medium tracking-wide">{toast.message}</p>
                    </div>
                </div>
            )}
        </div>
    );
}
