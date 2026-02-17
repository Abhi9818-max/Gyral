
export type Artifact = {
    id: string;
    name: string;
    description: string;
    icon: string; // Lucide icon name or image path
    rarity: 'common' | 'rare' | 'epic' | 'legendary';
    condition: string; // Text description of how to unlock
    threshold: number; // Numeric threshold for the condition
    type: 'streak' | 'entries' | 'consistency';
    color: string;
};

export const ARTIFACTS: Artifact[] = [
    {
        id: 'spark_ember',
        name: 'The Ember',
        description: 'A small spark of discipline. The beginning of a fire.',
        icon: 'Flame',
        rarity: 'common',
        condition: 'Reach a 3-day streak',
        threshold: 3,
        type: 'streak',
        color: '#f97316' // Orange
    },
    {
        id: 'quartz_prism',
        name: 'The Prism',
        description: 'Clarity of mind begins to form structures.',
        icon: 'Triangle',
        rarity: 'common',
        condition: 'Reach a 7-day streak',
        threshold: 7,
        type: 'streak',
        color: '#38bdf8' // Sky Blue
    },
    {
        id: 'void_stone',
        name: 'Void Stone',
        description: 'Solidified focus, born from the darkness of the morning.',
        icon: 'Hexagon',
        rarity: 'rare',
        condition: 'Reach a 14-day streak',
        threshold: 14,
        type: 'streak',
        color: '#a855f7' // Purple
    },
    {
        id: 'iron_compass',
        name: 'Iron Compass',
        description: 'Direction is more important than speed.',
        icon: 'Compass',
        rarity: 'rare',
        condition: 'Log 50 total entries',
        threshold: 50,
        type: 'entries',
        color: '#94a3b8' // Slate
    },
    {
        id: 'golden_skull',
        name: 'Memento Mori',
        description: 'Remember your end. Make today count.',
        icon: 'Skull',
        rarity: 'epic',
        condition: 'Reach a 30-day streak',
        threshold: 30,
        type: 'streak',
        color: '#eab308' // Gold
    },
    {
        id: 'monolith_fragment',
        name: 'The Monolith',
        description: 'Unshakeable. Unmovable. Eternal.',
        icon: 'Box',
        rarity: 'legendary',
        condition: 'Log 100 total entries',
        threshold: 100,
        type: 'entries',
        color: '#10b981' // Emerald
    },
    {
        id: 'sentinel_shield',
        name: 'The Sentinel',
        description: 'Vigilance is the price of order.',
        icon: 'Shield',
        rarity: 'rare',
        condition: 'Reach a 21-day streak',
        threshold: 21,
        type: 'streak',
        color: '#60a5fa' // Blue
    },
    {
        id: 'obsidian_ledger',
        name: 'The Ledger',
        description: 'Every action is recorded. Nothing is lost.',
        icon: 'Book',
        rarity: 'epic',
        condition: 'Log 250 total entries',
        threshold: 250,
        type: 'entries',
        color: '#475569' // Slate-600
    },
    {
        id: 'eternal_flame',
        name: 'Eternal Flame',
        description: 'A fire that refuses to die.',
        icon: 'Zap',
        rarity: 'legendary',
        condition: 'Reach a 60-day streak',
        threshold: 60,
        type: 'streak',
        color: '#dc2626' // Red
    },
    {
        id: 'crystal_metronome',
        name: 'The Metronome',
        description: 'Perfect rhythm. Perfect execution.',
        icon: 'Activity',
        rarity: 'rare',
        condition: 'Reach 90% consistency',
        threshold: 90,
        type: 'consistency',
        color: '#ec4899' // Pink
    },
    {
        id: 'grand_codex',
        name: 'The Codex',
        description: 'Knowledge accumulated over a lifetime.',
        icon: 'BookOpen',
        rarity: 'legendary',
        condition: 'Log 500 total entries',
        threshold: 500,
        type: 'entries',
        color: '#8b5cf6' // Violet
    },
    {
        id: 'chronos_dial',
        name: 'The Timekeeper',
        description: 'Time bows to those who master it.',
        icon: 'Clock',
        rarity: 'legendary',
        condition: 'Reach a 90-day streak',
        threshold: 90,
        type: 'streak',
        color: '#fbbf24' // Amber
    }
];
