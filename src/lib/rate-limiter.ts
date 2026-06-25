// In-memory rate limiter for API routes to prevent resource exhaustion and abuse.
//
// 🔒 SECURITY NOTE:
// In-memory Maps are acceptable for early-stage or single-tenant deployments,
// but they do not share state across serverless function instances or multi-instance containers.
// For a production deployment with multiple server instances or serverless cold-starts,
// this rate limiter should be replaced with a distributed store like Redis (e.g., Upstash Redis).
//
// We enforce a windowed rate-limit check and clean up stale memory entries periodically
// to prevent memory exhaustion attacks (denial of service via memory bloat).

interface RateLimitEntry {
    lastRequestTime: number;
    requestCount: number;
    windowStart: number;
}

const rateLimitMap = new Map<string, RateLimitEntry>();
let lastCleanup = Date.now();
const CLEANUP_INTERVAL_MS = 300000; // 5 minutes

// Stale entry cleanup to prevent memory exhaustion (DoS)
function cleanupStaleEntries() {
    const now = Date.now();
    for (const [key, entry] of rateLimitMap.entries()) {
        // Evict if the entry has been inactive for more than 1 hour
        if (now - entry.lastRequestTime > 3600000) {
            rateLimitMap.delete(key);
        }
    }
    lastCleanup = now;
}

interface RateLimitConfig {
    cooldownMs: number;
    maxRequests: number;
    windowMs: number;
    reason?: string;
}

const DEFAULT_CONFIG: RateLimitConfig = {
    cooldownMs: 60000,   // 60 seconds cooldown between consecutive requests
    maxRequests: 10,     // 10 requests max per window
    windowMs: 3600000,    // 1 hour window
    reason: "Lucius requires time between reflections."
};

/**
 * Checks if a request by a user/IP is within the rate limits.
 * @param identifier The user ID, IP address, or API key identifier
 * @param routeKey The name of the route (e.g., 'lucius-chat', 'ai-context')
 * @param config Configuration options for the rate limit
 */
export function checkRateLimit(
    identifier: string = 'default',
    routeKey: string = 'lucius-chat',
    config: RateLimitConfig = DEFAULT_CONFIG
): { allowed: boolean; waitTime?: number; reason?: string } {
    const now = Date.now();

    // Perform periodic memory cleanup
    if (now - lastCleanup > CLEANUP_INTERVAL_MS) {
        try {
            cleanupStaleEntries();
        } catch (e) {
            console.error('Rate limiter cleanup error:', e);
        }
    }

    const key = `${routeKey}:${identifier}`;
    const entry = rateLimitMap.get(key);

    if (!entry) {
        // First request in the current tracking period
        rateLimitMap.set(key, {
            lastRequestTime: now,
            requestCount: 1,
            windowStart: now
        });
        return { allowed: true };
    }

    const timeSinceWindowStart = now - entry.windowStart;

    // 1. Reset window if elapsed
    if (timeSinceWindowStart > config.windowMs) {
        rateLimitMap.set(key, {
            lastRequestTime: now,
            requestCount: 1,
            windowStart: now
        });
        return { allowed: true };
    }

    // 2. Check cooldown between consecutive requests (if cooldownMs is set)
    if (config.cooldownMs > 0) {
        const timeSinceLast = now - entry.lastRequestTime;
        if (timeSinceLast < config.cooldownMs) {
            const waitTime = Math.ceil((config.cooldownMs - timeSinceLast) / 1000);
            return {
                allowed: false,
                waitTime,
                reason: config.reason || `Too many requests. Please wait ${waitTime} seconds.`
            };
        }
    }

    // 3. Check window request count limit
    if (entry.requestCount >= config.maxRequests) {
        const waitTime = Math.ceil((config.windowMs - timeSinceWindowStart) / 1000);
        return {
            allowed: false,
            waitTime,
            reason: config.reason || `Rate limit exceeded. Please wait ${waitTime} seconds.`
        };
    }

    // Allow request and update entry state
    entry.lastRequestTime = now;
    entry.requestCount++;
    return { allowed: true };
}

export function resetRateLimit(identifier: string = 'default', routeKey: string = 'lucius-chat') {
    const key = `${routeKey}:${identifier}`;
    rateLimitMap.delete(key);
}
