"use client";

import React, { createContext, useContext, useEffect, useState } from 'react';
import { createClient } from '@/utils/supabase/client';

import { User } from '@supabase/supabase-js';
import { addDays, differenceInCalendarDays, format, isBefore, subDays, parseISO } from 'date-fns';

// --- TYPES ---

export type MetricConfig = {
    unit: string;
    phases: {
        name: string;
        threshold: number;
        intensity: number;
    }[];
};

export type TaskAnalytics = {
    baselineValue: number;
    baselinePhase: number;
    baselineTime: number;
    predictedRange: [number, number];
    honestyScore: number;
    driftStatus: 'stable' | 'drifting' | 'collapsing';
    trajectory: string;
};

export type Task = {
    id: string;
    name: string;
    color: string;
    isArchived?: boolean;
    metricConfig?: MetricConfig;
};

export type Record = {
    id?: string; // Added for DB sync
    taskId: string;
    intensity: number | null; // null means standard completion, 1-4 is intensity
    value?: number; // Raw metric value
    timestamp?: string; // ISO date-time
};

export type RecordsMap = {
    [date: string]: Record[];
};

export type StreakStatus = 'safe' | 'at-risk' | 'lost';

export type Pact = {
    id: string;
    text: string;
    isCompleted: boolean;
};

export type PactsMap = {
    [date: string]: Pact[];
};

export type Note = {
    id: string;
    title: string;
    content: string;
    updatedAt: string;
};

export type LifeEvent = {
    id: string;
    user_id: string;
    event_date: string;
    title: string;
    description?: string;
    type: 'MEMORY' | 'GOAL';
    created_at?: string;
};

export type Debt = {
    id: string;
    user_id: string;
    description: string;
    amount: string;
    interest_rate?: string;
    status: 'OWED' | 'PAID';
    created_at?: string;
};

export type Vow = {
    id: string;
    text: string;
    status: 'active' | 'broken' | 'archived';
    currentStreak: number;
    maxStreak: number;
    lastCompletedDate?: string;
    startDate: string;
    brokenOn?: string;
};


export type NavItemKey = 'world' | 'ritual' | 'bank' | 'watch' | 'arena' | 'notes' | 'messages' | 'pacts' | 'memento' | 'citadel';

export const ALL_NAV_ITEMS: { key: NavItemKey, label: string, icon: string, href?: string }[] = [
    { key: 'world', label: 'World', icon: 'Globe', href: '/world' },
    { key: 'ritual', label: 'Ritual', icon: 'Flame' },
    { key: 'bank', label: 'Bank', icon: 'Coins' },
    { key: 'watch', label: 'The Watch', icon: 'Shield' },
    { key: 'arena', label: 'Arena', icon: 'Sword' },
    { key: 'notes', label: 'Notes', icon: 'ClipboardList', href: '/notes' },
    { key: 'messages', label: 'Messages', icon: 'MessageCircle', href: '/messages' },
    { key: 'pacts', label: 'Pacts Modal', icon: 'ScrollText' },
    { key: 'memento', label: 'Memento Page', icon: 'Skull', href: '/memento' },
    { key: 'citadel', label: 'Pacts Page', icon: 'ScrollText', href: '/citadel' },
];

export type Faction = {
    id: string;
    name: string;
    sigilUrl: string;
    primaryColor: string;
    quote?: string;
};

export type Investment = {
    id: string;
    userId: string;
    amount: string;
    goal: string;
    deadline: string;
    status: 'pending' | 'completed' | 'failed';
    createdAt: string;
    completedAt?: string;
};

export const DEFAULT_FACTIONS: Faction[] = [
    {
        id: 'stark',
        name: 'House Stark',
        sigilUrl: '/factions/stark.jpg',
        primaryColor: '#94a3b8',
        quote: 'Winter is Coming.'
    },
    {
        id: 'lannister',
        name: 'House Lannister',
        sigilUrl: '/factions/lannister.jpg',
        primaryColor: '#dc2626',
        quote: 'Hear Me Roar!'
    },
    {
        id: 'targaryen',
        name: 'House Targaryen',
        sigilUrl: '/factions/targaryen.jpg',
        primaryColor: '#991b1b',
        quote: 'Fire and Blood.'
    },
    {
        id: 'baratheon',
        name: 'House Baratheon',
        sigilUrl: '/factions/baratheon.jpg',
        primaryColor: '#eab308',
        quote: 'Ours is the Fury.'
    },
    {
        id: 'tyrell',
        name: 'House Tyrell',
        sigilUrl: '/factions/tyrell.jpg',
        primaryColor: '#16a34a',
        quote: 'Growing Strong.'
    },
    {
        id: 'martell',
        name: 'House Martell',
        sigilUrl: '/factions/martell.jpg',
        primaryColor: '#ea580c',
        quote: 'Unbowed, Unbent, Unbroken.'
    },
    {
        id: 'greyjoy',
        name: 'House Greyjoy',
        sigilUrl: '/factions/greyjoy.jpg',
        primaryColor: '#0f172a',
        quote: 'We Do Not Sow.'
    },
    {
        id: 'arryn',
        name: 'House Arryn',
        sigilUrl: '/factions/arryn.jpg',
        primaryColor: '#38bdf8',
        quote: 'As High as Honor.'
    },
    {
        id: 'mormont',
        name: 'House Mormont',
        sigilUrl: '/factions/mormont.jpg',
        primaryColor: '#14532d',
        quote: 'Here We Stand.'
    },
    {
        id: 'tully',
        name: 'House Tully',
        sigilUrl: '/factions/tully.jpg',
        primaryColor: '#2563eb',
        quote: 'Family, Duty, Honor.'
    },
    {
        id: 'bolton',
        name: 'House Bolton',
        sigilUrl: '/factions/bolton.jpg',
        primaryColor: '#450a0a',
        quote: 'Our Blades Are Sharp.'
    }
];

import { StreakTier } from '../data/quotes';
import { ARTIFACTS } from '@/lib/artifacts';

interface UserDataContextType {
    tasks: Task[];
    records: RecordsMap;
    addTask: (name: string, color: string, metricConfig?: MetricConfig) => void;
    updateTask: (taskId: string, updates: Partial<Task>) => void;
    deleteTask: (taskId: string) => void;
    toggleTaskArchive: (taskId: string) => void;
    addRecord: (date: string, taskId: string, intensity: number | null, value?: number) => void;
    deleteRecord: (date: string, taskId: string) => void;
    getRecordsForDate: (date: string) => Record[];
    activeFilterTaskId: string | null;
    setActiveFilterTaskId: (id: string | null) => void;

    // Gamification State
    consistencyScore: number;
    currentStreak: number;
    longestStreak: number;
    streakStatus: StreakStatus;
    streakTier: StreakTier;
    streakStrength: number;
    rebuildMode: boolean;

    // Analysis Helpers
    analyzePatterns: (taskId: string) => string[];
    getAdaptiveSuggestion: (taskId: string) => string | null;
    getTaskAnalytics: (taskId: string) => TaskAnalytics | null;

    lastCompletion: { date: string, taskId: string } | null;
    setLastCompletion: (value: { date: string, taskId: string } | null) => void;
    getStreakForDate: (date: string, taskId?: string | null) => number;

    showLossModal: boolean;
    setShowLossModal: (value: boolean) => void;

    // Pacts
    pacts: PactsMap;
    addPact: (text: string, date: string) => void;
    togglePact: (id: string, date: string) => void;
    deletePact: (id: string, date: string) => void;

    // Notes
    notes: Note[];
    addNote: () => Promise<void>;
    updateNote: (id: string, updates: Partial<Note>) => Promise<void>;
    deleteNote: (id: string) => Promise<void>;

    lifeEvents: LifeEvent[];
    addLifeEvent: (event: Omit<LifeEvent, 'id' | 'user_id' | 'created_at'>) => Promise<void>;
    deleteLifeEvent: (id: string) => Promise<void>;

    navPreferences: NavItemKey[];
    updateNavPreferences: (prefs: NavItemKey[]) => Promise<void>;

    // Iron Bank
    debts: Debt[];
    addDebt: (debt: Omit<Debt, 'id' | 'user_id' | 'created_at' | 'status'>) => Promise<void>;
    payDebt: (id: string) => Promise<void>;

    // The Night's Watch
    vows: Vow[];
    addVow: (text: string) => Promise<void>;
    completeVowDaily: (id: string) => Promise<void>;

    // Data Management
    restoreData: (data: any) => boolean;

    // Memento Mori
    birthDate: string | null;
    setBirthDate: (date: string | null) => void;


    // Preferences
    showStatsCard: boolean;
    toggleStatsCard: () => void;
    theme: string;
    setTheme: (theme: string) => void;
    language: string;
    setLanguage: (lang: string) => void;

    // User Access
    user: User | null;

    // Exile & Factions
    isExiled: boolean;
    exiledUntil: string | null;
    redeemExile: () => Promise<void>;
    breakVow: (id: string) => Promise<void>;
    restoreVowStreak: (id: string) => Promise<void>;
    getBrokenVows: (vows: Vow[]) => Vow[];
    factions: Faction[];
    currentFaction: Faction | null;
    setFaction: (factionId: string) => Promise<void>;
    profile: any;
    setProfile: (profile: any) => void;

    // Investments
    investments: Investment[];
    addInvestment: (amount: string, goal: string, deadline: string) => Promise<void>;
    completeInvestment: (id: string, success: boolean) => Promise<void>;
    ALL_NAV_ITEMS: typeof ALL_NAV_ITEMS;

    // Onboarding
    onboardingCompleted: boolean;
    completeOnboarding: (dateOfBirth: string, gender: 'male' | 'female' | 'other') => Promise<void>;
    mementoViewMode: 'life' | 'year';
    toggleMementoViewMode: () => void;

    // Artifacts
    unlockedArtifacts: string[];
    displayedArtifactId: string | null;
    equipArtifact: (artifactId: string) => Promise<void>;
    checkUnlockables: () => void;

    // Default Filter
    defaultFilterTaskId: string | null;
    setDefaultFilterTask: (taskId: string | null) => Promise<void>;

    newlyUnlockedArtifacts: string[];
    clearNewlyUnlocked: () => void;

    profileStreakMode: 'pinned' | 'combined';
    setProfileStreakMode: (mode: 'pinned' | 'combined') => Promise<void>;
    calculateAverageStreak: () => number;
}

const UserDataContext = createContext<UserDataContextType | undefined>(undefined);

export function UserDataProvider({ children }: { children: React.ReactNode }) {
    // --- STATE ---
    const [user, setUser] = useState<User | null>(null);
    const [profile, setProfile] = useState<any>(null);
    const [tasks, setTasks] = useState<Task[]>([]);
    const [records, setRecords] = useState<RecordsMap>({});
    const [pacts, setPacts] = useState<PactsMap>({});
    const [notes, setNotes] = useState<Note[]>([]);
    const [birthDate, setBirthDate] = useState<string | null>(null);
    const [mementoViewMode, setMementoViewMode] = useState<'life' | 'year'>('life');
    const [showStatsCard, setShowStatsCard] = useState(() => {
        if (typeof window !== 'undefined') {
            const saved = localStorage.getItem('diogenes-show-stats');
            if (saved) {
                try { return JSON.parse(saved); } catch (e) { console.error(e); }
            }
        }
        return true;
    });
    const [theme, setThemeState] = useState('dark');
    const [language, setLanguageState] = useState('en');

    // Artifacts State
    const [unlockedArtifacts, setUnlockedArtifacts] = useState<string[]>([]);
    const [displayedArtifactId, setDisplayedArtifactId] = useState<string | null>(null);

    const [isLoaded, setIsLoaded] = useState(false);
    const [activeFilterTaskId, setActiveFilterTaskId] = useState<string | null>(null);
    const [defaultFilterTaskId, setDefaultFilterTaskIdState] = useState<string | null>(null);


    // Gamification
    const [currentStreak, setCurrentStreak] = useState(0);
    const [longestStreak, setLongestStreak] = useState(0);
    const [streakStatus, setStreakStatus] = useState<StreakStatus>('safe');
    const [streakTier, setStreakTier] = useState<StreakTier>('spark');
    const [streakStrength, setStreakStrength] = useState(0);
    const [rebuildMode, setRebuildMode] = useState(false);

    const [lastCompletion, setLastCompletion] = useState<{ date: string, taskId: string } | null>(null);
    const [showLossModal, setShowLossModal] = useState(false);

    // New Life Events
    const [lifeEvents, setLifeEvents] = useState<LifeEvent[]>([]);
    const [debts, setDebts] = useState<Debt[]>([]);
    const [vows, setVows] = useState<Vow[]>([]);
    const [isExiled, setIsExiled] = useState(false);
    const [exiledUntil, setExiledUntil] = useState<string | null>(null);
    const [factions, setFactions] = useState<Faction[]>([]);
    const [currentFaction, setCurrentFaction] = useState<Faction | null>(null);
    const [navPreferences, setNavPreferences] = useState<NavItemKey[]>(['world', 'ritual', 'bank']);
    const [investments, setInvestments] = useState<Investment[]>([]);
    const [onboardingCompleted, setOnboardingCompleted] = useState(false);

    const supabase = createClient();

    // --- INITIAL DATA LOADING ---
    useEffect(() => {
        const initData = async () => {
            // Check if supabase is configured before calling getUser to avoid errors in dev if not set up
            const { data: { user } } = await supabase.auth.getUser();
            setUser(user);

            if (user) {
                // FETCH FROM DB
                let dbTasks: any[] | null = null;
                let dbRecords: any[] | null = null;

                try {
                    // 1. Tasks
                    try {
                        const { data, error: tasksError } = await supabase.from('tasks').select('*');
                        if (tasksError) throw tasksError;
                        dbTasks = data;
                        if (dbTasks) setTasks(dbTasks.map(t => ({
                            id: t.id,
                            name: t.name,
                            color: t.color,
                            isArchived: t.is_archived,
                            metricConfig: t.metric_config
                        })));
                    } catch (e) {
                        console.error("Error loading tasks:", e);
                    }

                    // 2. Records
                    const { data } = await supabase.from('records').select('*');
                    dbRecords = data;
                    if (dbRecords) {
                        const newRecords: RecordsMap = {};
                        dbRecords.forEach(r => {
                            if (!newRecords[r.date]) newRecords[r.date] = [];
                            newRecords[r.date].push({
                                id: r.id,
                                taskId: r.task_id,
                                intensity: r.intensity,
                                value: r.value,
                                timestamp: r.timestamp
                            });
                        });
                        setRecords(newRecords);
                    }

                    // 3. Pacts
                    const { data: dbPacts } = await supabase.from('pacts').select('*');
                    if (dbPacts) {
                        const newPacts: PactsMap = {};
                        dbPacts.forEach(p => {
                            const d = p.date;
                            if (!newPacts[d]) newPacts[d] = [];
                            newPacts[d].push({ id: p.id, text: p.text, isCompleted: p.is_completed });
                        });
                        setPacts(newPacts);
                    }

                    try {
                        // 4. Notes
                        const { data: dbNotes, error: notesError } = await supabase.from('notes').select('*');
                        if (notesError) throw notesError;
                        if (dbNotes) setNotes(dbNotes.map(n => ({
                            id: n.id,
                            title: n.title,
                            content: n.content,
                            updatedAt: n.updated_at
                        })));
                    } catch (e) {
                        console.error("Error loading notes:", e);
                    }

                    // 5. Settings
                    const { data: dbSettings } = await supabase.from('user_settings').select('*').single();
                    if (dbSettings) {
                        setBirthDate(dbSettings.birth_date);
                        if (dbSettings.show_stats_card !== undefined) setShowStatsCard(dbSettings.show_stats_card);
                        if (dbSettings.theme) setThemeState(dbSettings.theme);
                        if (dbSettings.language) setLanguageState(dbSettings.language);

                        if (dbSettings.default_filter_task_id) {
                            setDefaultFilterTaskIdState(dbSettings.default_filter_task_id);
                            // Apply it immediately if no filter is set (fresh load)
                            setActiveFilterTaskId(dbSettings.default_filter_task_id);
                        }

                        if (dbSettings.profile_streak_mode) {
                            setProfileStreakModeState(dbSettings.profile_streak_mode as 'pinned' | 'combined');
                        }
                    }

                    // 6. Life Events
                    const { data: dbLifeEvents } = await supabase.from('life_events').select('*').order('event_date', { ascending: true });
                    if (dbLifeEvents) setLifeEvents(dbLifeEvents as LifeEvent[]);

                    // 7. Debts
                    const { data: dbDebts } = await supabase.from('debts').select('*').eq('status', 'OWED').order('created_at', { ascending: false });
                    if (dbDebts) setDebts(dbDebts as Debt[]);

                    // 9. Vows
                    const { data: dbVows } = await supabase.from('vows').select('*');
                    if (dbVows) {
                        const loadedVows = dbVows.map(v => ({
                            id: v.id,
                            text: v.text,
                            status: v.status,
                            currentStreak: v.current_streak,
                            maxStreak: v.max_streak,
                            lastCompletedDate: v.last_completed_date,
                            startDate: v.start_date,
                            brokenOn: v.broken_on
                        }));
                        setVows(loadedVows);
                        // checkVowFailures removed - deferred to UI
                    }

                    const { data: dbFactions, error: fetchErr } = await supabase.from('factions').select('*');
                    if (fetchErr) console.error("Error fetching factions:", fetchErr.message);

                    // Seed missing factions if user is login
                    if (user && dbFactions) {
                        const missingFactions = DEFAULT_FACTIONS.filter(df => !dbFactions.find(f => f.name === df.name));
                        if (missingFactions.length > 0) {
                            console.log("Seeding missing factions:", missingFactions.map(f => f.name));
                            const { error: insErr } = await supabase.from('factions').insert(missingFactions.map(f => ({
                                name: f.name,
                                sigil_url: f.sigilUrl,
                                primary_color: f.primaryColor,
                                quote: f.quote
                            })));
                            if (insErr) console.warn("Factions seeded failed (likely RLS). Run advanced-features.sql manually.", insErr.message);

                            // Re-fetch to get new IDs
                            const { data: reFetched } = await supabase.from('factions').select('*');
                            const available = reFetched || dbFactions || [];
                            const mapped = DEFAULT_FACTIONS.map(df => {
                                const dbMatch = available.find(f => f.name === df.name);
                                return dbMatch ? { ...df, id: dbMatch.id } : df;
                            });
                            setFactions(mapped);
                        } else {
                            const mapped = DEFAULT_FACTIONS.map(df => {
                                const dbMatch = dbFactions.find(f => f.name === df.name);
                                return dbMatch ? { ...df, id: dbMatch.id } : df;
                            });
                            setFactions(mapped);
                        }
                    } else {
                        setFactions(DEFAULT_FACTIONS);
                    }

                    const { data: profileData } = await supabase.from('profiles').select('*').eq('id', user.id).single();
                    if (profileData) {
                        setProfile(profileData);

                        // Set onboarding status - explicitly check for true
                        const isOnboardingComplete = profileData.onboarding_completed === true;
                        setOnboardingCompleted(isOnboardingComplete);

                        if (isOnboardingComplete && profileData.date_of_birth) {
                            setBirthDate(profileData.date_of_birth);
                        }

                        if (profileData.navigation_preferences) {
                            setNavPreferences(profileData.navigation_preferences as NavItemKey[]);
                        }
                        if (profileData.faction_id) {
                            // Try to find in fetched dbFactions
                            const finalDbFactions = (await supabase.from('factions').select('*')).data || dbFactions || [];
                            let dbMatch = finalDbFactions.find((f: any) => f.id === profileData.faction_id);

                            // Fallback: If not found by ID (maybe RLS issue), try matching by name from local defaults if possible, 
                            // OR just try to use localStorage as a fail-safe if the ID exists but we can't resolve it.
                            if (!dbMatch) {
                                // Last ditch: check if we have a saved local faction that matches the ID? 
                                // Or more likely, if we can't load factions table, we can't verify ID.
                                // Let's rely on Guest Mode-style local storage check as a backup below if DB fails.
                            }

                            if (dbMatch) {
                                const localMatch = DEFAULT_FACTIONS.find(df => df.name === dbMatch.name);
                                if (localMatch) {
                                    setCurrentFaction({ ...localMatch, id: dbMatch.id });
                                }
                            }
                        }
                    }

                    // Always allow local storage override/backup if DB failed to produce a faction but we have one saved locally
                    // This handles the "I selected it but it's not showing" case if DB update worked but read failed
                    const savedLocalFaction = localStorage.getItem('diogenes-current-faction');
                    if (savedLocalFaction && !currentFaction) {
                        try {
                            // Only use local if we didn't find one from DB, OR if we trust local more for immediate UI
                            const parsed = JSON.parse(savedLocalFaction);
                            // If we haven't set a faction from DB yet, use this
                            setCurrentFaction((prev) => prev || parsed);
                        } catch (e) { console.error(e); }
                    }

                    const { data: dbSettingsExile } = await supabase.from('user_settings').select('is_exiled, exiled_until').single();
                    if (dbSettingsExile) {
                        setIsExiled(dbSettingsExile.is_exiled || false);
                        setExiledUntil(dbSettingsExile.exiled_until || null);
                    }

                    const { data: dbInvestments } = await supabase.from('investments').select('*').order('created_at', { ascending: false });
                    if (dbInvestments) setInvestments(dbInvestments as Investment[]);

                    if (dbSettings && dbSettings.last_audit_date) {
                        const lastAudit = new Date(dbSettings.last_audit_date);
                        const yesterday = subDays(new Date(), 1);

                        if (isBefore(lastAudit, yesterday)) {
                            const missed: any[] = [];
                            let checkDate = addDays(lastAudit, 1);
                            const recordsMap: { [key: string]: any[] } = {};
                            const dbRecordsData = dbRecords || [];
                            dbRecordsData.forEach((r: any) => {
                                if (!recordsMap[r.date]) recordsMap[r.date] = [];
                                recordsMap[r.date].push(r);
                            });

                            const activeTasks = (dbTasks || []).filter((t: any) => !t.is_archived);

                            while (isBefore(checkDate, new Date()) && differenceInCalendarDays(new Date(), checkDate) >= 1) {
                                const dateStr = format(checkDate, 'yyyy-MM-dd');
                                activeTasks.forEach((task: any) => {
                                    const hasRecord = recordsMap[dateStr]?.some((r: any) => r.task_id === task.id);
                                    if (!hasRecord) {
                                        missed.push({
                                            user_id: user.id,
                                            description: `Missed ${task.name} on ${dateStr}`,
                                            amount: 'Penalty Session',
                                            status: 'OWED',
                                            created_at: new Date().toISOString()
                                        });
                                    }
                                });
                                checkDate = addDays(checkDate, 1);
                            }

                            if (missed.length > 0) {
                                const { error: debtError } = await supabase.from('debts').insert(missed);
                                if (!debtError) {
                                    const { data: newDebts } = await supabase.from('debts').select('*').eq('status', 'OWED').order('created_at', { ascending: false });
                                    if (newDebts) setDebts(newDebts as Debt[]);
                                }
                            }

                            await supabase.from('user_settings').update({
                                last_audit_date: format(subDays(new Date(), 1), 'yyyy-MM-dd')
                            }).eq('user_id', user.id);
                        }
                    }
                } catch (error) {
                    console.error("Error loading cloud data:", error);
                }
            } else {
                // FETCH FROM LOCAL STORAGE (Guest Mode)
                const savedTasks = localStorage.getItem('diogenes-tasks');
                const savedRecords = localStorage.getItem('diogenes-records');
                const savedPacts = localStorage.getItem('diogenes-pacts');
                const savedNotes = localStorage.getItem('diogenes-notes');
                const savedBirthDate = localStorage.getItem('diogenes-birth-date');

                if (savedTasks) try { setTasks(JSON.parse(savedTasks)); } catch (e) { console.error(e); }
                if (savedRecords) try { setRecords(JSON.parse(savedRecords)); } catch (e) { console.error(e); }
                if (savedPacts) try { setPacts(JSON.parse(savedPacts)); } catch (e) { console.error(e); }
                if (savedNotes) try { setNotes(JSON.parse(savedNotes)); } catch (e) { console.error(e); }
                if (savedBirthDate) setBirthDate(savedBirthDate);
                const savedShowStats = localStorage.getItem('diogenes-show-stats');
                if (savedShowStats) setShowStatsCard(JSON.parse(savedShowStats));
                const savedTheme = localStorage.getItem('diogenes-theme');
                if (savedTheme) setThemeState(savedTheme);
                const savedLang = localStorage.getItem('diogenes-lang');
                if (savedLang) setLanguageState(savedLang);
                const savedNav = localStorage.getItem('diogenes-nav-prefs');
                if (savedNav) try { setNavPreferences(JSON.parse(savedNav)); } catch (e) { console.error(e); }
                const savedFaction = localStorage.getItem('diogenes-current-faction');
                if (savedFaction) try { setCurrentFaction(JSON.parse(savedFaction)); } catch (e) { console.error(e); }
                const savedMementoMode = localStorage.getItem('diogenes-memento-mode');
                if (savedMementoMode) setMementoViewMode(savedMementoMode as 'life' | 'year');

                const savedDefaultFilter = localStorage.getItem('diogenes-default-filter');
                if (savedDefaultFilter) {
                    setDefaultFilterTaskIdState(savedDefaultFilter);
                    setActiveFilterTaskId(savedDefaultFilter);
                }

                const savedProfileStreakMode = localStorage.getItem('diogenes-profile-streak-mode');
                if (savedProfileStreakMode) {
                    setProfileStreakModeState(savedProfileStreakMode as 'pinned' | 'combined');
                }
            }
            setIsLoaded(true);
        };

        initData();
    }, []);

    // --- LOCAL STORAGE BACKUP (Only if Guest) ---
    useEffect(() => {
        if (isLoaded && !user) {
            localStorage.setItem('diogenes-tasks', JSON.stringify(tasks));
            localStorage.setItem('diogenes-records', JSON.stringify(records));
            localStorage.setItem('diogenes-pacts', JSON.stringify(pacts));
            localStorage.setItem('diogenes-notes', JSON.stringify(notes));
            if (birthDate) localStorage.setItem('diogenes-birth-date', birthDate);
            localStorage.setItem('diogenes-show-stats', JSON.stringify(showStatsCard));
            localStorage.setItem('diogenes-theme', theme);
            localStorage.setItem('diogenes-lang', language);
            localStorage.setItem('diogenes-nav-prefs', JSON.stringify(navPreferences));
        }
    }, [tasks, records, pacts, notes, birthDate, isLoaded, user, showStatsCard, theme, language, navPreferences]);

    // --- THEME APPLICATION ---
    useEffect(() => {
        const root = document.documentElement;
        root.classList.remove('theme-midnight', 'theme-obsidian');
        if (theme === 'midnight') root.classList.add('theme-midnight');
        if (theme === 'obsidian') root.classList.add('theme-obsidian');

        // Apply House Color if pledged
        if (currentFaction) {
            root.style.setProperty('--accent', currentFaction.primaryColor);
            root.style.setProperty('--accent-glow', `${currentFaction.primaryColor}60`);
        } else {
            // Default Emerald
            root.style.setProperty('--accent', '#34d399');
            root.style.setProperty('--accent-glow', '#34d39960');
        }
    }, [theme, currentFaction]);

    // --- LIFE EVENTS ---
    const fetchLifeEvents = async () => {
        const { data } = await supabase.from('life_events').select('*').order('event_date', { ascending: true });
        if (data) setLifeEvents(data as LifeEvent[]);
    };

    const addLifeEvent = async (event: Omit<LifeEvent, 'id' | 'user_id' | 'created_at'>) => {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return;

        const { error } = await supabase.from('life_events').insert({
            user_id: user.id,
            ...event
        });

        if (!error) {
            await fetchLifeEvents();
        } else {
            console.error("Error adding life event:", error);
        }
    };

    const deleteLifeEvent = async (id: string) => {
        const { error } = await supabase.from('life_events').delete().match({ id });
        if (!error) {
            setLifeEvents(prev => prev.filter(e => e.id !== id));
        }
    };

    // --- DEBTS ---
    const fetchDebts = async () => {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return;
        const { data } = await supabase.from('debts').select('*').eq('status', 'OWED').order('created_at', { ascending: false });
        if (data) setDebts(data as Debt[]);
    };

    const addDebt = async (debt: Omit<Debt, 'id' | 'user_id' | 'created_at' | 'status'>) => {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return;

        const { error } = await supabase.from('debts').insert({
            user_id: user.id,
            status: 'OWED',
            ...debt
        });

        if (!error) {
            await fetchDebts();
        } else {
            console.error("Error adding debt:", error);
        }
    };

    const payDebt = async (id: string) => {
        const { error } = await supabase.from('debts').update({ status: 'PAID' }).match({ id });
        if (!error) {
            setDebts(prev => prev.filter(d => d.id !== id));
        }
    };

    // --- HELPERS (Streak Calc) ---
    const calculateStreak = (currentRecords: RecordsMap, filterTaskId: string | null = null, anchorDateStr?: string) => {
        const sortedDates = Object.keys(currentRecords).sort((a, b) => b.localeCompare(a));
        if (sortedDates.length === 0) return 0;

        const today = anchorDateStr ? new Date(anchorDateStr) : new Date();
        const todayStr = today.toISOString().split('T')[0];

        let baseStreak = 0;
        let checkDate = new Date(today);

        const hasValidRecord = (dateStr: string) => {
            const dayRecords = currentRecords[dateStr] || [];
            if (filterTaskId) return dayRecords.some(r => r.taskId === filterTaskId);
            return dayRecords.length > 0;
        };

        if (anchorDateStr) {
            if (hasValidRecord(todayStr)) {
                baseStreak = 1;
            }
            let backDate = new Date(checkDate);
            backDate.setDate(backDate.getDate() - 1);
            while (true) {
                const dStr = backDate.toISOString().split('T')[0];
                if (hasValidRecord(dStr)) {
                    baseStreak++;
                    backDate.setDate(backDate.getDate() - 1);
                } else {
                    break;
                }
            }
            return baseStreak;
        }

        if (!hasValidRecord(todayStr)) {
            const yesterday = new Date(today);
            yesterday.setDate(yesterday.getDate() - 1);
            const yesterdayStr = yesterday.toISOString().split('T')[0];
            if (hasValidRecord(yesterdayStr)) {
                checkDate = yesterday;
            } else {
                return 0;
            }
        }

        let backDate = new Date(checkDate);
        while (true) {
            const dStr = backDate.toISOString().split('T')[0];
            if (hasValidRecord(dStr)) {
                baseStreak++;
                backDate.setDate(backDate.getDate() - 1);
            } else {
                break;
            }
        }
        return baseStreak;
    };

    const getStreakForDate = (date: string, taskId: string | null = null) => {
        return calculateStreak(records, taskId, date);
    };

    const calculateStrength = (streakDays: number, currentRecords: RecordsMap, filterTaskId: string | null = null) => {
        if (streakDays === 0) return 0;
        let strength = 0;
        let count = 0;
        const today = new Date();
        const todayStr = today.toISOString().split('T')[0];
        let date = new Date(today);

        const getDayRecords = (dStr: string) => {
            const recs = currentRecords[dStr] || [];
            if (filterTaskId) return recs.filter(r => r.taskId === filterTaskId);
            return recs;
        };

        if (getDayRecords(todayStr).length === 0) {
            date.setDate(date.getDate() - 1);
        }

        while (count < streakDays) {
            const dStr = date.toISOString().split('T')[0];
            const recs = getDayRecords(dStr);
            let dayWeight = 0;
            recs.forEach(r => {
                const i = r.intensity || 0;
                let w = 0.5;
                if (i === 2) w = 1.0;
                if (i === 3) w = 1.5;
                if (i === 4) w = 2.0;
                if (i === 0) w = 0.5;
                dayWeight += w;
            });
            strength += dayWeight;
            count++;
            date.setDate(date.getDate() - 1);
        }
        return strength;
    };

    const getStreakTier = (streak: number): StreakTier => {
        if (streak >= 15) return 'committed';
        if (streak >= 4) return 'habit';
        return 'spark';
    };

    useEffect(() => {
        if (!isLoaded) return;
        const newStreak = calculateStreak(records, activeFilterTaskId);
        setCurrentStreak(newStreak);
        setStreakTier(getStreakTier(newStreak));
        setStreakStrength(calculateStrength(newStreak, records, activeFilterTaskId));
        if (newStreak > longestStreak) setLongestStreak(newStreak);
    }, [records, isLoaded, activeFilterTaskId]);

    // --- ACTIONS ---
    const addTask = async (name: string, color: string, metricConfig?: MetricConfig) => {
        const newTask: Task = { id: crypto.randomUUID(), name, color, isArchived: false, metricConfig };
        setTasks((prev) => [...prev, newTask]);
        if (user) {
            await supabase.from('tasks').insert({
                id: newTask.id, user_id: user.id, name, color, metric_config: metricConfig, is_archived: false
            });
        }
    };

    const updateTask = async (taskId: string, updates: Partial<Task>) => {
        setTasks(prev => prev.map(t => t.id === taskId ? { ...t, ...updates } : t));
        if (user) {
            const dbUpdates: any = {};
            if (updates.name) dbUpdates.name = updates.name;
            if (updates.color) dbUpdates.color = updates.color;
            if (updates.isArchived !== undefined) dbUpdates.is_archived = updates.isArchived;
            await supabase.from('tasks').update(dbUpdates).eq('id', taskId);
        }
    };

    const deleteTask = async (taskId: string) => {
        setTasks(prev => prev.filter(t => t.id !== taskId));
        setRecords(prev => {
            const newRecords = { ...prev };
            Object.keys(newRecords).forEach(date => {
                newRecords[date] = newRecords[date].filter(r => r.taskId !== taskId);
                if (newRecords[date].length === 0) delete newRecords[date];
            });
            return newRecords;
        });
        if (user) await supabase.from('tasks').delete().eq('id', taskId);
    };

    const toggleTaskArchive = async (taskId: string) => {
        const task = tasks.find(t => t.id === taskId);
        if (task) updateTask(taskId, { isArchived: !task.isArchived });
    };

    const addRecord = async (date: string, taskId: string, intensity: number | null, value?: number) => {
        const timestamp = new Date().toISOString();
        const newRecord: Record = { taskId, intensity, value, timestamp };
        setRecords((prev) => {
            const dayRecords = prev[date] || [];
            setLastCompletion({ date, taskId });
            const filteredRecords = dayRecords.filter(r => r.taskId !== taskId);
            return { ...prev, [date]: [...filteredRecords, newRecord] };
        });
        if (user) {
            await supabase.from('records').delete().match({ task_id: taskId, date });
            await supabase.from('records').insert({
                user_id: user.id, task_id: taskId, date, intensity, value, timestamp
            });

            // Increment Activity Points
            const pointsToAdd = intensity ? (intensity + 1) * 10 : 10;
            // Best to use a relative update if possible, but for now we'll fetch/update
            const { data: profile } = await supabase.from('profiles').select('activity_points').eq('id', user.id).single();
            if (profile) {
                await supabase.from('profiles').update({
                    activity_points: (profile.activity_points || 0) + pointsToAdd
                }).eq('id', user.id);
            }
        }
    };

    const deleteRecord = async (date: string, taskId: string) => {
        setRecords((prev) => {
            const dayRecords = prev[date] || [];
            const filteredRecords = dayRecords.filter(r => r.taskId !== taskId);
            if (filteredRecords.length === 0) {
                const newRecords = { ...prev };
                delete newRecords[date];
                return newRecords;
            }
            return { ...prev, [date]: filteredRecords };
        });
        if (user) await supabase.from('records').delete().match({ task_id: taskId, date });
    };

    const getRecordsForDate = (date: string) => records[date] || [];

    const addPact = async (text: string, date: string) => {
        const newPact = { id: crypto.randomUUID(), text, isCompleted: false };
        setPacts(prev => {
            const dayPacts = prev[date] || [];
            return { ...prev, [date]: [...dayPacts, newPact] };
        });
        if (user) {
            await supabase.from('pacts').insert({ id: newPact.id, user_id: user.id, text, date, is_completed: false });
        }
    };

    const togglePact = async (id: string, date: string) => {
        let newState = false;
        setPacts(prev => {
            const dayPacts = prev[date] || [];
            const updated = dayPacts.map(p => {
                if (p.id === id) {
                    newState = !p.isCompleted;
                    return { ...p, isCompleted: newState };
                }
                return p;
            });
            return { ...prev, [date]: updated };
        });
        if (user) await supabase.from('pacts').update({ is_completed: newState }).eq('id', id);
    };

    const deletePact = async (id: string, date: string) => {
        setPacts(prev => {
            const dayPacts = prev[date] || [];
            return { ...prev, [date]: dayPacts.filter(p => p.id !== id) };
        });
        if (user) await supabase.from('pacts').delete().eq('id', id);
    };

    const addNote = async () => {
        const newNote: Note = {
            id: crypto.randomUUID(), title: 'Untitled Note', content: '', updatedAt: new Date().toISOString()
        };
        setNotes(prev => [newNote, ...prev]);
        if (user) {
            await supabase.from('notes').insert({
                id: newNote.id, user_id: user.id, title: newNote.title, content: newNote.content, updated_at: newNote.updatedAt
            });
        }
    };

    const updateNote = async (id: string, updates: Partial<Note>) => {
        const now = new Date().toISOString();
        setNotes(prev => prev.map(n => n.id === id ? { ...n, ...updates, updatedAt: now } : n));
        if (user) {
            const dbUpdates: any = { updated_at: now };
            if (updates.title !== undefined) dbUpdates.title = updates.title;
            if (updates.content !== undefined) dbUpdates.content = updates.content;
            await supabase.from('notes').update(dbUpdates).eq('id', id);
        }
    };

    const deleteNote = async (id: string) => {
        setNotes(prev => prev.filter(n => n.id !== id));
        if (user) await supabase.from('notes').delete().eq('id', id);
    };

    const updateBirthDate = async (date: string | null) => {
        setBirthDate(date);
        if (user && date) await supabase.from('user_settings').upsert({ user_id: user.id, birth_date: date });
    };

    const toggleStatsCard = async () => {
        const newValue = !showStatsCard;
        setShowStatsCard(newValue);
        localStorage.setItem('diogenes-show-stats', JSON.stringify(newValue));
        if (user) await supabase.from('user_settings').upsert({ user_id: user.id, show_stats_card: newValue });
    };

    const setTheme = async (newTheme: string) => {
        setThemeState(newTheme);
        if (user) await supabase.from('user_settings').upsert({ user_id: user.id, theme: newTheme });
    };

    const setLanguage = async (newLang: string) => {
        setLanguageState(newLang);
        if (user) await supabase.from('user_settings').upsert({ user_id: user.id, language: newLang });
    };

    const restoreData = (data: any): boolean => {
        try {
            if (!data.habits || !Array.isArray(data.habits)) throw new Error("Invalid format: habits");
            if (!data.records) throw new Error("Invalid format: records");
            setTasks(data.habits);
            setRecords(data.records);
            setPacts(data.pacts || {});
            setNotes(data.notes || []);
            return true;
        } catch (e) {
            console.error("Resurrection failed:", e);
            return false;
        }
    };

    const getBrokenVows = (currentVows: Vow[]) => {
        const yesterday = new Date();
        yesterday.setDate(yesterday.getDate() - 1);
        const yesterdayStr = yesterday.toISOString().split('T')[0];
        const todayStr = new Date().toISOString().split('T')[0];
        const brokenVows: Vow[] = [];

        currentVows.forEach(v => {
            if (v.status !== 'active') return;
            if (v.startDate && v.startDate.startsWith(todayStr)) return;
            const lastDate = v.lastCompletedDate;
            if (lastDate !== yesterdayStr && lastDate !== todayStr) {
                brokenVows.push(v);
            }
        });
        return brokenVows;
    };

    const breakVow = async (id: string) => {
        const brokenOn = new Date().toISOString();
        setVows(prev => prev.map(v => v.id === id ? { ...v, status: 'broken', brokenOn } : v));

        if (user) {
            await supabase.from('vows').update({ status: 'broken', broken_on: brokenOn }).eq('id', id);

            // Apply Exile
            const exiledUntil = new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString();
            setIsExiled(true);
            setExiledUntil(exiledUntil);
            await supabase.from('user_settings').update({ is_exiled: true, exiled_until: exiledUntil }).eq('user_id', user.id);
        }
    };

    const restoreVowStreak = async (id: string) => {
        const yesterday = new Date();
        yesterday.setDate(yesterday.getDate() - 1);
        const yesterdayStr = yesterday.toISOString().split('T')[0];

        setVows(prev => prev.map(v => {
            if (v.id === id) {
                const newStreak = (v.currentStreak || 0) + 1;
                return {
                    ...v,
                    currentStreak: newStreak,
                    maxStreak: Math.max(v.maxStreak || 0, newStreak),
                    lastCompletedDate: yesterdayStr
                };
            }
            return v;
        }));

        if (user) {
            const vow = vows.find(v => v.id === id);
            // We need to fetch the fresh vow or rely on local state?
            // Local state inside setVows is safest but here we are outside.
            // Let's assume the previous state was correct before the update.
            // Actually, best to just calculate based on known logic:
            // logic: we are marking it as done yesterday.
            // Streak + 1.

            // Fetch current to be safe? Or just use strict increment?
            // "vow" here might be stale if we just setVows? No, it captures current render `vows`.
            const currentStreak = (vow?.currentStreak || 0) + 1;
            const maxStreak = Math.max(vow?.maxStreak || 0, currentStreak);

            await supabase.from('vows').update({
                last_completed_date: yesterdayStr,
                current_streak: currentStreak,
                max_streak: maxStreak
            }).eq('id', id);
        }
    };

    const redeemExile = async () => {
        setIsExiled(false);
        setExiledUntil(null);
        if (user) await supabase.from('user_settings').update({ is_exiled: false, exiled_until: null }).eq('user_id', user.id);
    };

    const setFaction = async (factionId: string) => {
        const faction = factions.find(f => f.id === factionId);
        if (faction) {
            console.log("Pledging to house:", faction.name, factionId);
            setCurrentFaction(faction);

            // Apply theme immediately
            const root = document.documentElement;
            root.style.setProperty('--accent', faction.primaryColor);
            root.style.setProperty('--accent-glow', `${faction.primaryColor}60`);

            if (user) {
                // Only attempt DB update if factionId is a valid UUID
                const isUUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-5][0-9a-f]{3}-[089ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(factionId);

                if (isUUID) {
                    const { error } = await supabase.from('profiles').update({ faction_id: factionId }).eq('id', user.id);
                    if (error) {
                        console.error("Error updating faction in DB:", error.message, error.details);
                    }
                } else {
                    console.warn("Skipping DB update: factionId is not a UUID. Please ensure factions are seeded correctly.");
                    // We might want to try finding the UUID by name if we have a match
                    const dbFactions = (await supabase.from('factions').select('*')).data;
                    const dbMatch = dbFactions?.find(f => f.name === faction.name);
                    if (dbMatch) {
                        const { error } = await supabase.from('profiles').update({ faction_id: dbMatch.id }).eq('id', user.id);
                        if (error) console.error("Error updating faction in DB (fallback by name):", error.message);
                    }
                }
            }
            localStorage.setItem('diogenes-current-faction', JSON.stringify(faction));
        }
    };

    const addInvestment = async (amount: string, goal: string, deadline: string) => {
        if (!user) return;
        const newInvestment: Investment = {
            id: crypto.randomUUID(), userId: user.id, amount, goal, deadline, status: 'pending', createdAt: new Date().toISOString()
        };
        setInvestments(prev => [newInvestment, ...prev]);
        await supabase.from('investments').insert({
            id: newInvestment.id, user_id: user.id, amount, goal, deadline, status: 'pending'
        });
    };

    const completeInvestment = async (id: string, success: boolean) => {
        const status = success ? 'completed' : 'failed';
        const now = new Date().toISOString();
        setInvestments(prev => prev.map(inv => inv.id === id ? { ...inv, status, completedAt: now } : inv));
        if (user) await supabase.from('investments').update({ status, completed_at: now }).eq('id', id);
    };

    const completeOnboarding = async (dateOfBirth: string, gender: 'male' | 'female' | 'other') => {
        if (!user) {
            console.error('No user found for onboarding');
            return;
        }

        console.log('Completing onboarding for user:', user.id, { dateOfBirth, gender });

        const { data, error } = await supabase
            .from('profiles')
            .update({
                date_of_birth: dateOfBirth,
                gender: gender,
                onboarding_completed: true
            })
            .eq('id', user.id)
            .select();

        if (error) {
            console.error('Error completing onboarding:', error);
            throw error;
        }

        console.log('Onboarding saved successfully:', data);

        // Update local state
        setProfile((prev: any) => ({
            ...prev,
            date_of_birth: dateOfBirth,
            gender: gender,
            onboarding_completed: true
        }));
        setOnboardingCompleted(true);
        setBirthDate(dateOfBirth);
    };

    const addVow = async (text: string) => {
        const newVow: Vow = {
            id: crypto.randomUUID(), text, status: 'active', currentStreak: 0, maxStreak: 0, startDate: new Date().toISOString()
        };
        setVows(prev => [...prev, newVow]);
        if (user) {
            await supabase.from('vows').insert({
                id: newVow.id, user_id: user.id, text, status: 'active', current_streak: 0, max_streak: 0, start_date: newVow.startDate
            });
        }
    };



    const toggleMementoViewMode = () => {
        setMementoViewMode(prev => {
            const next = prev === 'life' ? 'year' : 'life';
            localStorage.setItem('diogenes-memento-mode', next);
            return next;
        });
    };

    const completeVowDaily = async (id: string) => {
        const today = new Date().toISOString().split('T')[0];
        setVows(prev => prev.map(v => {
            if (v.id === id) {
                if (v.lastCompletedDate === today) return v;
                const newStreak = (v.currentStreak || 0) + 1;
                return { ...v, currentStreak: newStreak, maxStreak: Math.max(v.maxStreak || 0, newStreak), lastCompletedDate: today };
            }
            return v;
        }));
        if (user) {
            const vow = vows.find(v => v.id === id);
            const currentStreak = (vow?.currentStreak || 0) + 1;
            const maxStreak = Math.max(vow?.maxStreak || 0, currentStreak);
            await supabase.from('vows').update({ last_completed_date: today, current_streak: currentStreak, max_streak: maxStreak }).eq('id', id);
        }
    };

    const analyzePatterns = (taskId: string): string[] => {
        const warnings: string[] = [];
        const taskRecords = Object.entries(records)
            .flatMap(([date, recs]) => recs.filter(r => r.taskId === taskId).map(r => ({ ...r, date })))
            .sort((a, b) => b.date.localeCompare(a.date));
        if (taskRecords.length < 5) return [];
        const recent = taskRecords.slice(0, 5);
        if (recent.every(r => (r.intensity || 0) <= 1)) warnings.push("Bottom Feeder: You're maintaining the streak, not the habit.");
        if (recent.every(r => r.timestamp && new Date(r.timestamp).getHours() >= 22)) warnings.push("Night Owl: You always do this tired.");
        return warnings;
    };

    const getAdaptiveSuggestion = (taskId: string): string | null => {
        const task = tasks.find(t => t.id === taskId);
        if (!task || !task.metricConfig) return null;
        const taskRecords = Object.entries(records).flatMap(([date, recs]) => recs.filter(r => r.taskId === taskId && r.value !== undefined).map(r => ({ ...r, date }))).sort((a, b) => b.date.localeCompare(a.date));
        if (taskRecords.length < 5) return null;
        const sample = taskRecords.slice(0, 10);
        const avg = sample.reduce((acc, r) => acc + (r.value || 0), 0) / sample.length;
        const phase2 = task.metricConfig.phases.find(p => p.intensity === 2);
        if (phase2 && avg >= phase2.threshold * 1.5) return `You usually hit ~${Math.round(avg)}. Want to update Phase 2?`;
        return null;
    };

    const getTaskAnalytics = (taskId: string): TaskAnalytics | null => {
        const task = tasks.find(t => t.id === taskId);
        if (!task) return null;
        const taskRecords = Object.entries(records).flatMap(([date, recs]) => recs.filter(r => r.taskId === taskId && r.value !== undefined).map(r => ({ ...r, date }))).sort((a, b) => b.date.localeCompare(a.date));
        if (taskRecords.length < 5) return null;
        const baselineSample = taskRecords.slice(0, 14);
        const values = baselineSample.map(r => r.value || 0).sort((a, b) => a - b);
        const mid = Math.floor(values.length / 2);
        const medianValue = values.length % 2 !== 0 ? values[mid] : (values[mid - 1] + values[mid]) / 2;
        let honestyScore = 1.0;
        const uniqueValues = new Set(baselineSample.map(r => r.value));
        if (baselineSample.length > 5 && uniqueValues.size === 1) honestyScore -= 0.3;
        const last3 = taskRecords.slice(0, 3);
        const recentAvg = last3.reduce((acc, r) => acc + (r.value || 0), 0) / last3.length;
        let driftStatus: 'stable' | 'drifting' | 'collapsing' = 'stable';
        if (recentAvg < medianValue * 0.6) driftStatus = 'collapsing';
        else if (recentAvg < medianValue * 0.85) driftStatus = 'drifting';
        return {
            baselineValue: medianValue, baselinePhase: 0, baselineTime: 0, predictedRange: [Math.round(medianValue * 0.8), Math.round(medianValue * 1.2)],
            honestyScore, driftStatus, trajectory: driftStatus === 'stable' ? "Compounding." : "Weakening."
        };
    };

    const updateNavPreferences = async (prefs: NavItemKey[]) => {
        setNavPreferences(prefs);
        if (user) {
            await supabase.from('profiles').update({ navigation_preferences: prefs }).eq('id', user.id);
        }
    };

    const checkUnlockables = async () => {
        if (!user) return;

        // Calculate stats
        const allRecords = Object.values(records).flat();
        const totalEntries = allRecords.length;
        // consistencyScore is likely 0 in the provider value in the return statement? 
        // "consistencyScore: 0" was seen in the return. so it might not be a state variable.
        // I need to calculate it or just use 0 for now if not implemented.
        // Actually, looking at the previous file view, `consistencyScore` was passed as `0` in value.
        // So I should define it in the function or read it from somewhere.
        // For now, I will calculate it simply: (currentStreak / (days since start)) * 100? Or just use a placeholder.
        // I'll calculate a simple one: totalEntries / (days since first entry).

        // Let's just define a mock consistency for now if it's missing, or calculate it.
        const consistencyScore = totalEntries > 0 ? Math.min(100, Math.round((currentStreak / (totalEntries + 1)) * 100)) : 0; // Placeholder logic

        console.log("Checking Artifacts:", { currentStreak, totalEntries, unlockedArtifacts, consistencyScore });
        // currentStreak is already in state

        const newUnlocks: string[] = [];

        for (const artifact of ARTIFACTS) {
            if (unlockedArtifacts.includes(artifact.id)) continue;

            let unlocked = false;
            if (artifact.type === 'streak' && currentStreak >= artifact.threshold) unlocked = true;
            if (artifact.type === 'entries' && totalEntries >= artifact.threshold) unlocked = true;
            if (artifact.type === 'consistency' && consistencyScore >= artifact.threshold) unlocked = true;

            if (unlocked) {
                newUnlocks.push(artifact.id);
                // DB Insert
                await supabase.from('user_artifacts').insert({
                    user_id: user.id,
                    artifact_id: artifact.id
                });
            }
        }

        if (newUnlocks.length > 0) {
            setUnlockedArtifacts(prev => [...prev, ...newUnlocks]);
            setNewlyUnlockedArtifacts(prev => [...prev, ...newUnlocks]);
            console.log("Unlocked Artifacts:", newUnlocks);
        }
    };

    const equipArtifact = async (artifactId: string) => {
        if (!unlockedArtifacts.includes(artifactId)) return;
        setDisplayedArtifactId(artifactId);
        if (user) {
            await supabase.from('profiles').update({ displayed_artifact_id: artifactId }).eq('id', user.id);
        }
    };

    // Load Artifacts on Init
    useEffect(() => {
        if (!user) return;
        const loadArtifacts = async () => {
            const { data } = await supabase.from('user_artifacts').select('artifact_id');
            if (data) setUnlockedArtifacts(data.map(d => d.artifact_id));

            const { data: profile } = await supabase.from('profiles').select('displayed_artifact_id').eq('id', user.id).single();
            if (profile) setDisplayedArtifactId(profile.displayed_artifact_id);
        };
        loadArtifacts();
    }, [user]);

    // Check unlocks when relevant stats change
    useEffect(() => {
        if (isLoaded && user) {
            checkUnlockables();
        }
    }, [currentStreak, records, isLoaded, user]);

    const [newlyUnlockedArtifacts, setNewlyUnlockedArtifacts] = useState<string[]>([]);
    const clearNewlyUnlocked = () => setNewlyUnlockedArtifacts([]);

    const [profileStreakMode, setProfileStreakModeState] = useState<'pinned' | 'combined'>('pinned');

    const setProfileStreakMode = async (mode: 'pinned' | 'combined') => {
        setProfileStreakModeState(mode);
        if (user) {
            await supabase.from('user_settings').upsert({ user_id: user.id, profile_streak_mode: mode });
        } else {
            localStorage.setItem('diogenes-profile-streak-mode', mode);
        }
    };

    const calculateAverageStreak = () => {
        const activeTasks = tasks.filter(t => !t.isArchived);
        if (activeTasks.length === 0) return 0;
        const totalStreak = activeTasks.reduce((acc, t) => acc + calculateStreak(records, t.id), 0);
        return Math.round(totalStreak / activeTasks.length);
    };

    const setDefaultFilterTask = async (taskId: string | null) => {
        // Find if valid
        if (taskId && !tasks.find(t => t.id === taskId)) return;

        // If we are setting a default, we probably want to view it now too
        if (taskId) setActiveFilterTaskId(taskId);

        if (user) {
            await supabase.from('user_settings').upsert({
                user_id: user.id,
                default_filter_task_id: taskId
            });
            // Update local state implicitly via init or just assume success if we want tracking
            // Use initData pattern or simple state? 
            // We need a state for defaultFilterTaskId to update UI immediately
            setDefaultFilterTaskIdState(taskId);
        } else {
            localStorage.setItem('diogenes-default-filter', taskId || '');
            setDefaultFilterTaskIdState(taskId);
        }
    };

    return (
        <UserDataContext.Provider value={{
            tasks, records, addTask, updateTask, deleteTask, toggleTaskArchive, addRecord, deleteRecord, getRecordsForDate, activeFilterTaskId, setActiveFilterTaskId,
            consistencyScore: 0, currentStreak, longestStreak, streakStatus, streakTier, streakStrength, rebuildMode, analyzePatterns, getAdaptiveSuggestion, getTaskAnalytics,
            lastCompletion, setLastCompletion, getStreakForDate, showLossModal, setShowLossModal, pacts, addPact, togglePact, deletePact, notes, addNote, updateNote, deleteNote,
            restoreData, birthDate, setBirthDate: updateBirthDate, showStatsCard, toggleStatsCard, theme, setTheme, language, setLanguage, user, lifeEvents, addLifeEvent, deleteLifeEvent,
            debts, addDebt, payDebt, vows, addVow, completeVowDaily, isExiled, exiledUntil, redeemExile, factions, currentFaction, setFaction, investments, addInvestment, completeInvestment,
            navPreferences, updateNavPreferences, ALL_NAV_ITEMS, profile, setProfile, onboardingCompleted, completeOnboarding, mementoViewMode, toggleMementoViewMode,
            breakVow, restoreVowStreak, getBrokenVows,
            unlockedArtifacts, displayedArtifactId, equipArtifact, checkUnlockables,
            defaultFilterTaskId, setDefaultFilterTask,
            newlyUnlockedArtifacts, clearNewlyUnlocked,
            profileStreakMode, setProfileStreakMode, calculateAverageStreak
        }}>
            {children}
        </UserDataContext.Provider>
    );
}

export function useUserData() {
    const context = useContext(UserDataContext);
    if (context === undefined) throw new Error('useUserData must be used within a UserDataProvider');
    return context;
}
