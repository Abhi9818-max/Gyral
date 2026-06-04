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

    // Franz Kafka
    { text: "I have the true feeling of myself only when I am unbearably unhappy.", author: "Franz Kafka" },
    { text: "Youth is happy because it has the capacity to see beauty. Anyone who keeps the ability to see beauty never grows old.", author: "Franz Kafka" },
    { text: "A book must be the axe for the frozen sea within us.", author: "Franz Kafka" },

    // Oscar Wilde
    { text: "We are all in the gutter, but some of us are looking at the stars.", author: "Oscar Wilde" },
    { text: "To live is the rarest thing in the world. Most people exist, that is all.", author: "Oscar Wilde" },
    { text: "Experience is simply the name we give our mistakes.", author: "Oscar Wilde" },

    // Fyodor Dostoevsky
    { text: "Pain and suffering are always inevitable for a large intelligence and a deep heart.", author: "Fyodor Dostoevsky" },
    { text: "To go wrong in one's own way is better than to go right in someone else's.", author: "Fyodor Dostoevsky" },
    { text: "The mystery of human existence lies not in just staying alive, but in finding something to live for.", author: "Fyodor Dostoevsky" },

    // Robert Greene
    { text: "When you show yourself to the world and display your talents, you naturally stir all kinds of resentment, envy, and other manifestations of insecurity.", author: "Robert Greene" },
    { text: "Do not leave your reputation to chance or gossip; it is your life's artwork, and you must craft it, hone it, and display it with the care of an artist.", author: "Robert Greene" },
    { text: "The future belongs to those who learn more skills and combine them in creative ways.", author: "Robert Greene" },

    // Arthur Schopenhauer
    { text: "Talent hits a target no one else can hit; Genius hits a target no one else can see.", author: "Arthur Schopenhauer" },
    { text: "All truth passes through three stages. First, it is ridiculed. Second, it is violently opposed. Third, it is accepted as being self-evident.", author: "Arthur Schopenhauer" },

    // Albert Camus
    { text: "The only way to deal with an unfree world is to become so absolutely free that your very existence is an act of rebellion.", author: "Albert Camus" },
    { text: "In the depth of winter, I finally learned that within me there lay an invincible summer.", author: "Albert Camus" },

    // Miyamoto Musashi
    { text: "There is nothing outside of yourself that can ever enable you to get better, stronger, richer, quicker, or smarter. Everything is within. Everything exists.", author: "Miyamoto Musashi" },
    { text: "Think lightly of yourself and deeply of the world.", author: "Miyamoto Musashi" },

    // Plato, Aristotle, Machiavelli
    { text: "Wise men speak because they have something to say; Fools because they have to say something.", author: "Plato" },
    { text: "The first and greatest victory is to conquer yourself.", author: "Plato" },
    { text: "Knowing yourself is the beginning of all wisdom.", author: "Aristotle" },
    { text: "We are what we repeatedly do. Excellence, then, is not an act, but a habit.", author: "Aristotle" },
    { text: "If an injury has to be done to a man it should be so severe that his vengeance need not be feared.", author: "Niccolò Machiavelli" },
    { text: "Never was anything great achieved without danger.", author: "Niccolò Machiavelli" }
];
