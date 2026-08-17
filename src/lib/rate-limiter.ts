/**
 * In-memory sliding-window rate limiter for Next.js API routes.
 * NOTE: Resets on server restart. Upgrade to Upstash Redis for persistence.
 */

interface RateLimitEntry {
    count: number;
    windowStart: number;
    blockedUntil?: number;
}

const store = new Map<string, RateLimitEntry>();

// Clean up stale entries every 10 minutes to prevent memory leaks.
setInterval(() => {
    const now = Date.now();
    for (const [key, entry] of store.entries()) {
        const windowExpired = now - entry.windowStart > 15 * 60 * 1000;
        const blockExpired = !entry.blockedUntil || now > entry.blockedUntil;
        if (windowExpired && blockExpired) store.delete(key);
    }
}, 10 * 60 * 1000);

interface RateLimitOptions {
    /** Max attempts allowed in the window. Default: 5 */
    maxAttempts?: number;
    /** Window duration in ms. Default: 15 minutes */
    windowMs?: number;
    /** Block duration in ms after limit exceeded. Default: 30 minutes */
    blockDurationMs?: number;
}

interface RateLimitResult {
    allowed: boolean;
    remaining: number;
    retryAfterMs: number;
}

export function checkRateLimit(
    identifier: string,
    options: RateLimitOptions = {}
): RateLimitResult {
    const {
        maxAttempts = 5,
        windowMs = 15 * 60 * 1000,
        blockDurationMs = 30 * 60 * 1000,
    } = options;

    const now = Date.now();
    const entry = store.get(identifier);

    // Currently blocked — reject immediately.
    if (entry?.blockedUntil && now < entry.blockedUntil) {
        return { allowed: false, remaining: 0, retryAfterMs: entry.blockedUntil - now };
    }

    // No entry or window expired — start fresh.
    if (!entry || now - entry.windowStart > windowMs) {
        store.set(identifier, { count: 1, windowStart: now });
        return { allowed: true, remaining: maxAttempts - 1, retryAfterMs: 0 };
    }

    // Increment within current window.
    entry.count += 1;

    if (entry.count > maxAttempts) {
        entry.blockedUntil = now + blockDurationMs;
        store.set(identifier, entry);
        return { allowed: false, remaining: 0, retryAfterMs: blockDurationMs };
    }

    store.set(identifier, entry);
    return { allowed: true, remaining: maxAttempts - entry.count, retryAfterMs: 0 };
}

/** Call on successful login to clear the rate limit for this identifier. */
export function resetRateLimit(identifier: string): void {
    store.delete(identifier);
}
