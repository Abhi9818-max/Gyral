// Helper function to hash user ID into a number
function hashUserId(userId: string): number {
    let hash = 0;
    for (let i = 0; i < userId.length; i++) {
        const char = userId.charCodeAt(i);
        hash = ((hash << 5) - hash) + char;
        hash = hash & hash; // Convert to 32bit integer
    }
    return Math.abs(hash);
}

// Helper function to get default avatar based on gender and user ID
export function getDefaultAvatar(gender: string | null | undefined, userId: string | undefined): string {
    // Fallback if no userId provided
    if (!userId) {
        return gender === 'female'
            ? '/avatars/default-female1.jpeg.jpeg'
            : '/avatars/default-male1.jpeg.jpeg';
    }

    const hash = hashUserId(userId);

    if (gender === 'female') {
        const femaleCount = 15;
        const index = (hash % femaleCount) + 1;
        return `/avatars/default-female${index}.jpeg.jpeg`;
    }

    // Default to male avatar for 'male', 'other', or null
    // Note: We have 1-13 and 15-20 (missing #14), so use 19 total
    const maleCount = 19;
    let index = (hash % maleCount) + 1;
    // Skip #14 since that file is missing
    if (index >= 14) {
        index = index + 1;
    }
    return `/avatars/default-male${index}.jpeg.jpeg`;
}

// Helper function to get user avatar with fallback to default
export function getUserAvatar(avatarUrl: string | null | undefined, gender: string | null | undefined, userId: string | undefined): string {
    return avatarUrl || getDefaultAvatar(gender, userId);
}
