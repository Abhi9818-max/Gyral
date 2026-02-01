export interface WorldUser {
    id: string;
    name: string;
    handle: string;
    avatar: string; // URL or color gradient class
    isLive?: boolean;
    followers: string;
    following: string;
    creations: string;
    bio: string;
}

export interface FeedPost {
    id: string;
    user: WorldUser;
    title: string;
    description?: string;
    backgroundImage: string; // URL or gradient
    overlayColor?: string;
    stats: {
        likes: string;
        isHot?: boolean;
    };
}

export const RECOMMENDED_USERS: WorldUser[] = [
    {
        id: '1',
        name: 'Marina',
        handle: '@marina_flow',
        avatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?q=80&w=150&auto=format&fit=crop',
        isLive: true,
        followers: '119k',
        following: '42',
        creations: '891',
        bio: 'Digital nomad exploring the ether.'
    },
    {
        id: '2',
        name: 'Adverse',
        handle: '@adverse_labs',
        avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?q=80&w=150&auto=format&fit=crop',
        isLive: false,
        followers: '86.5k',
        following: '12',
        creations: '445',
        bio: 'Building the next protocol.'
    },
    {
        id: '3',
        name: 'Oliver Bennet',
        handle: '@oliver_bennet',
        avatar: 'https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?q=80&w=150&auto=format&fit=crop',
        isLive: true,
        followers: '521',
        following: '345',
        creations: '566',
        bio: 'Designers focused on creating impactful, user-centered digital experiences and branding.'
    },
    {
        id: '4',
        name: 'Sarah Chen',
        handle: '@schen_ai',
        avatar: 'https://images.unsplash.com/photo-1517841905240-472988babdf9?q=80&w=150&auto=format&fit=crop',
        isLive: false,
        followers: '12k',
        following: '890',
        creations: '23',
        bio: 'AI whisperer.'
    },
    {
        id: '5',
        name: 'Marcus',
        handle: '@philosoph_king',
        avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?q=80&w=150&auto=format&fit=crop',
        isLive: true,
        followers: '1.2M',
        following: '0',
        creations: '12',
        bio: 'Stoic reflections.'
    }
];

export const FEED_POSTS: FeedPost[] = [
    {
        id: 'p1',
        user: RECOMMENDED_USERS[0],
        title: 'WINDS OF DESTINY',
        backgroundImage: 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?q=80&w=800&auto=format&fit=crop',
        stats: { likes: '86.54k', isHot: true }
    },
    {
        id: 'p2',
        user: RECOMMENDED_USERS[2],
        title: 'SILENT VOID',
        backgroundImage: 'https://images.unsplash.com/photo-1614850523060-8da1d56ae167?q=80&w=800&auto=format&fit=crop',
        stats: { likes: '12.3k' }
    },
    {
        id: 'p3',
        user: RECOMMENDED_USERS[4],
        title: 'MEDITATIONS',
        backgroundImage: 'https://images.unsplash.com/photo-1505542458156-b0728c0529d4?q=80&w=800&auto=format&fit=crop',
        stats: { likes: '900k', isHot: true }
    },
    {
        id: 'p4',
        user: RECOMMENDED_USERS[1],
        title: 'SYSTEM OVERRIDE',
        backgroundImage: 'https://images.unsplash.com/photo-1550751827-4bd374c3f58b?q=80&w=800&auto=format&fit=crop',
        stats: { likes: '45.2k' }
    }
];
