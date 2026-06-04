export interface Quote {
    text: string;
    author: string;
    source?: string;
}

export const philosophicalQuotes: Quote[] = [
    // Socrates
    { text: "The unexamined life is not worth living.", author: "Socrates" },
    { text: "I know that I know nothing.", author: "Socrates" },
    { text: "The only true wisdom is in knowing you know nothing.", author: "Socrates" },

    // Plato
    { text: "The first and greatest victory is to conquer yourself.", author: "Plato" },
    { text: "We can easily forgive a child who is afraid of the dark; the real tragedy of life is when men are afraid of the light.", author: "Plato" },
    { text: "The measure of a man is what he does with power.", author: "Plato" },

    // Aristotle
    { text: "We are what we repeatedly do. Excellence, then, is not an act, but a habit.", author: "Aristotle" },
    { text: "It is during our darkest moments that we must focus to see the light.", author: "Aristotle" },
    { text: "The roots of education are bitter, but the fruit is sweet.", author: "Aristotle" },

    // Marcus Aurelius
    { text: "You have power over your mind - not outside events. Realize this, and you will find strength.", author: "Marcus Aurelius", source: "Meditations" },
    { text: "The impediment to action advances action. What stands in the way becomes the way.", author: "Marcus Aurelius", source: "Meditations" },
    { text: "Waste no more time arguing about what a good man should be. Be one.", author: "Marcus Aurelius", source: "Meditations" },
    { text: "Very little is needed to make a happy life; it is all within yourself, in your way of thinking.", author: "Marcus Aurelius", source: "Meditations" },

    // Diogenes
    { text: "It is not that I am mad, it is only that my head is different from yours.", author: "Diogenes" },
    { text: "The foundation of every state is the education of its youth.", author: "Diogenes" },
    { text: "I am a citizen of the world.", author: "Diogenes" },

    // Niccolo Machiavelli
    { text: "The lion cannot protect himself from traps, and the fox cannot defend himself from wolves. One must therefore be a fox to recognize traps, and a lion to frighten wolves.", author: "Niccolò Machiavelli", source: "The Prince" },
    { text: "Never was anything great achieved without danger.", author: "Niccolò Machiavelli" },
    { text: "Men are so simple and so much inclined to obey immediate needs that a deceiver will never lack victims for his deceptions.", author: "Niccolò Machiavelli", source: "The Prince" },

    // Friedrich Nietzsche
    { text: "He who has a why to live can bear almost any how.", author: "Friedrich Nietzsche" },
    { text: "That which does not kill us makes us stronger.", author: "Friedrich Nietzsche" },
    { text: "To live is to suffer, to survive is to find some meaning in the suffering.", author: "Friedrich Nietzsche" },
    { text: "The individual has always had to struggle to keep from being overwhelmed by the tribe.", author: "Friedrich Nietzsche" },
    { text: "In heaven, all the interesting people are missing.", author: "Friedrich Nietzsche" },

    // Epictetus
    { text: "It's not what happens to you, but how you react to it that matters.", author: "Epictetus" },
    { text: "First say to yourself what you would be; and then do what you have to do.", author: "Epictetus" },
    { text: "No man is free who is not master of himself.", author: "Epictetus" },

    // Seneca
    { text: "Luck is what happens when preparation meets opportunity.", author: "Seneca" },
    { text: "We suffer more often in imagination than in reality.", author: "Seneca" },
    { text: "It is not the man who has too little, but the man who craves more, that is poor.", author: "Seneca" },

    // Alexander the Great
    { text: "There is nothing impossible to him who will try.", author: "Alexander the Great" },
    { text: "I am not afraid of an army of lions led by a sheep; I am afraid of an army of sheep led by a lion.", author: "Alexander the Great" },

    // Sun Tzu
    { text: "The greatest victory is that which requires no battle.", author: "Sun Tzu", source: "The Art of War" },
    { text: "Appear weak when you are strong, and strong when you are weak.", author: "Sun Tzu", source: "The Art of War" },
    { text: "In the midst of chaos, there is also opportunity.", author: "Sun Tzu", source: "The Art of War" },

    // Confucius
    { text: "It does not matter how slowly you go as long as you do not stop.", author: "Confucius" },
    { text: "Our greatest glory is not in never falling, but in rising every time we fall.", author: "Confucius" },

    // Lao Tzu
    { text: "The journey of a thousand miles begins with one step.", author: "Lao Tzu" },
    { text: "When I let go of what I am, I become what I might be.", author: "Lao Tzu" },
    { text: "Knowing others is intelligence; knowing yourself is true wisdom.", author: "Lao Tzu" },

    // Carl Jung
    { text: "Until you make the unconscious conscious, it will direct your life and you will call it fate.", author: "Carl Jung" },
    { text: "The meeting of two personalities is like the contact of two chemical substances: if there is any reaction, both are transformed.", author: "Carl Jung" },
    { text: "I am not what happened to me, I am what I choose to become.", author: "Carl Jung" },

    // Viktor Frankl
    { text: "When we are no longer able to change a situation, we are challenged to change ourselves.", author: "Viktor Frankl", source: "Man's Search for Meaning" },
    { text: "Everything can be taken from a man but one thing: the last of the human freedoms—to choose one's attitude in any given set of circumstances.", author: "Viktor Frankl" },

    // Franz Kafka
    { text: "I have the true feeling of myself only when I am unbearably unhappy.", author: "Franz Kafka" },
    { text: "Youth is happy because it has the capacity to see beauty. Anyone who keeps the ability to see beauty never grows old.", author: "Franz Kafka" },
    { text: "A book must be the axe for the frozen sea within us.", author: "Franz Kafka" },

    // Oscar Wilde
    { text: "We are all in the gutter, but some of us are looking at the stars.", author: "Oscar Wilde" },
    { text: "To live is the rarest thing in the world. Most people exist, that is all.", author: "Oscar Wilde" },
    { text: "Experience is simply the name we give our mistakes.", author: "Oscar Wilde" },

    // Fyodor Dostoevsky
    { text: "Pain and suffering are always inevitable for a large intelligence and a deep heart.", author: "Fyodor Dostoevsky", source: "Crime and Punishment" },
    { text: "To go wrong in one's own way is better than to go right in someone else's.", author: "Fyodor Dostoevsky", source: "Crime and Punishment" },
    { text: "The mystery of human existence lies not in just staying alive, but in finding something to live for.", author: "Fyodor Dostoevsky", source: "The Brothers Karamazov" },

    // Robert Greene
    { text: "When you show yourself to the world and display your talents, you naturally stir all kinds of resentment, envy, and other manifestations of insecurity... you cannot spend your life worrying about the petty feelings of others.", author: "Robert Greene", source: "The 48 Laws of Power" },
    { text: "Do not leave your reputation to chance or gossip; it is your life's artwork, and you must craft it, hone it, and display it with the care of an artist.", author: "Robert Greene", source: "The 48 Laws of Power" },
    { text: "The future belongs to those who learn more skills and combine them in creative ways.", author: "Robert Greene", source: "Mastery" },

    // Arthur Schopenhauer
    { text: "Talent hits a target no one else can hit; Genius hits a target no one else can see.", author: "Arthur Schopenhauer" },
    { text: "All truth passes through three stages. First, it is ridiculed. Second, it is violently opposed. Third, it is accepted as being self-evident.", author: "Arthur Schopenhauer" },

    // Albert Camus
    { text: "The only way to deal with an unfree world is to become so absolutely free that your very existence is an act of rebellion.", author: "Albert Camus" },
    { text: "In the depth of winter, I finally learned that within me there lay an invincible summer.", author: "Albert Camus" },

    // Miyamoto Musashi
    { text: "There is nothing outside of yourself that can ever enable you to get better, stronger, richer, quicker, or smarter. Everything is within. Everything exists.", author: "Miyamoto Musashi", source: "The Book of Five Rings" },
    { text: "Think lightly of yourself and deeply of the world.", author: "Miyamoto Musashi" },

    // Additional classics
    { text: "Wise men speak because they have something to say; Fools because they have to say something.", author: "Plato" },
    { text: "Knowing yourself is the beginning of all wisdom.", author: "Aristotle" },
    { text: "If an injury has to be done to a man it should be so severe that his vengeance need not be feared.", author: "Niccolò Machiavelli", source: "The Prince" }
];

/**
 * Gets the quote of the day based on the current date.
 * The same quote will be shown for the entire day.
 */
export function getQuoteOfTheDay(): Quote {
    const today = new Date();
    // Create a seed from the date (YYYYMMDD format)
    const seed = today.getFullYear() * 10000 + (today.getMonth() + 1) * 100 + today.getDate();

    // Use the seed to deterministically select a quote
    const index = seed % philosophicalQuotes.length;

    return philosophicalQuotes[index];
}
