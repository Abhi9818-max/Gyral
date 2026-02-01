// Simple in-memory rate limiter for Lucius API
// Prevents rapid-fire requests that trigger Gemini rate limits

interface RateLimitEntry {
    lastRequestTime: number;
    requestCount: number;
}

const rateLimitMap = new Map<string, RateLimitEntry>();
const COOLDOWN_MS = 60000; // 60 seconds between requests
const MAX_REQUESTS_PER_HOUR = 10; // Conservative limit

export function checkRateLimit(userId: string = 'default'): { allowed: boolean; waitTime?: number; reason?: string } {
    const now = Date.now();
    const entry = rateLimitMap.get(userId);

    if (!entry) {
        // First request - allow it
        rateLimitMap.set(userId, { lastRequestTime: now, requestCount: 1 });
        return { allowed: true };
    }

    const timeSinceLastRequest = now - entry.lastRequestTime;

    // Check cooldown period
    if (timeSinceLastRequest < COOLDOWN_MS) {
        const waitTime = Math.ceil((COOLDOWN_MS - timeSinceLastRequest) / 1000);
        return {
            allowed: false,
            waitTime,
            reason: `Lucius requires ${waitTime} seconds of silence before the mirror can reflect again.`
        };
    }

    // Reset if more than an hour has passed
    if (timeSinceLastRequest > 3600000) {
        rateLimitMap.set(userId, { lastRequestTime: now, requestCount: 1 });
        return { allowed: true };
    }

    // Check hourly limit
    if (entry.requestCount >= MAX_REQUESTS_PER_HOUR) {
        return {
            allowed: false,
            reason: "Lucius has grown weary. The mirror will clear at the turn of the hour."
        };
    }

    // Allow the request and update
    entry.lastRequestTime = now;
    entry.requestCount++;
    return { allowed: true };
}

export function resetRateLimit(userId: string = 'default') {
    rateLimitMap.delete(userId);
}
