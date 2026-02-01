export type StreakTier = 'spark' | 'habit' | 'committed';

export const STREAK_QUOTES = {
    spark: [
        "Everyone starts. Few continue.",
        "A journey of a thousand miles begins with a single step... or a nap.",
        "Consistency is the only currency that matters.",
        "Small moves, Ellie. Small moves.",
        "You can't build a reputation on what you are going to do.",
        "Action is the foundational key to all success.",
        "Don't watch the clock; do what it does. Keep going.",
    ],
    habit: [
        "We are what we repeatedly do. Excellence, then, is not an act, but a habit.",
        "Discipline is choosing what you want most over what you want now.",
        "The chains of habit are too light to be felt until they are too heavy to be broken.",
        "First we make our habits, then our habits make us.",
        "Motivation is what gets you started. Habit is what keeps you going.",
        "Success is the sum of small efforts, repeated day in and day out.",
        "You do not rise to the level of your goals. You fall to the level of your systems.",
    ],
    committed: [
        "You are free—and that's the burden.",
        "Man is condemned to be free; because once thrown into the world, he is responsible for everything he does.",
        "To be is to be perceived. To persist is to defy the void.",
        "The unexamined life is not worth living.",
        "It is not death that a man should fear, but he should fear never beginning to live.",
        "He who has a why to live can bear almost any how.",
        "Most men live lives of quiet desperation. You chose otherwise.",
        "The obstacle is the way.",
    ],
};

export const STREAK_TITLES = {
    spark: [
        "The Spark Ignites",
        "You Showed Up",
        "Motion Created",
        "Ignition Confirmed",
    ],
    habit: [
        "You're Building a Pattern",
        "Consistency is Power",
        "The Momentum Builds",
        "You Didn't Quit",
        "This Is Routine Now",
    ],
    committed: [
        "This Is Who You Are Now",
        "The Fire Burns Bright",
        "Unstoppable Force",
        "Beyond Motivation",
        "Legacy in the Making",
    ],
};

export interface Quote {
    text: string;
    author: string;
}

export const quotes: Quote[] = [
    { text: "We suffer more often in imagination than in reality.", author: "Seneca" },
    { text: "You have power over your mind - not outside events. Realize this, and you will find strength.", author: "Marcus Aurelius" },
    { text: "Man is not worried by real problems so much as by his imagined anxieties about real problems.", author: "Epictetus" },
    { text: "The happiness of your life depends upon the quality of your thoughts.", author: "Marcus Aurelius" },
    { text: "It is not death that a man should fear, but he should fear never beginning to live.", author: "Marcus Aurelius" },
    { text: "Luck is what happens when preparation meets opportunity.", author: "Seneca" },
    { text: "To be calm is the highest achievement of the self.", author: "Zen Proverb" },
    { text: "Waste no more time arguing about what a good man should be. Be one.", author: "Marcus Aurelius" },
    { text: "He who fears death will never do anything worth of a man who is alive.", author: "Seneca" },
    { text: "If it is not right do not do it; if it is not true do not say it.", author: "Marcus Aurelius" },
    { text: "First say to yourself what you would be; and then do what you have to do.", author: "Epictetus" },
    { text: "The best revenge is to be unlike him who performed the injury.", author: "Marcus Aurelius" },
    { text: "No man is free who is not master of himself.", author: "Epictetus" },
    { text: "Whatever happens to you has been waiting to happen since the beginning of time.", author: "Marcus Aurelius" },
    { text: "Difficulties strengthen the mind, as labor does the body.", author: "Seneca" },
];
