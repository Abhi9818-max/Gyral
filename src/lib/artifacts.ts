
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
    }
];
