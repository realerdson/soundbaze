/**
 * Sliding-window rate limiter using Cloudflare Workers KV.
 *
 * Falls back to no-op when KV is unavailable (local dev, non-CF hosts).
 * Adds at most one KV read + one KV write per request — very cheap.
 */

interface RateLimitConfig {
  /** Cache key — typically `${path}:${userId or IP}` */
  key:    string;
  /** Max requests allowed in the window */
  limit:  number;
  /** Window size in seconds */
  window: number;
  /** Cloudflare KV namespace binding */
  kv:     KVNamespace;
}

interface RateLimitResult {
  ok:        boolean;
  remaining: number;
  resetIn:   number; // seconds until window resets
}

export async function rateLimit({
  key, limit, window, kv,
}: RateLimitConfig): Promise<RateLimitResult> {
  const now      = Math.floor(Date.now() / 1000);
  const slot     = Math.floor(now / window);
  const kvKey    = `rl:${key}:${slot}`;
  const resetIn  = window - (now % window);

  const raw      = await kv.get(kvKey);
  const current  = raw ? parseInt(raw, 10) : 0;

  if (current >= limit) {
    return { ok: false, remaining: 0, resetIn };
  }

  // Increment — TTL is 2× window so the previous slot is still readable for
  // a brief overlap period (prevents reset gaming at window boundaries)
  await kv.put(kvKey, String(current + 1), { expirationTtl: window * 2 });

  return { ok: true, remaining: limit - current - 1, resetIn };
}

/** Per-route limits — tune these once you see real traffic */
export const RATE_LIMITS: Record<string, { limit: number; window: number }> = {
  '/api/annotations': { limit: 30,  window: 3600 }, // 30/hour  per user
  '/api/votes':       { limit: 200, window: 3600 }, // 200/hour per user
  '/api/search':      { limit: 60,  window: 60   }, // 60/min   per IP
  '/login':           { limit: 10,  window: 300  }, // 10/5min  per IP (magic link spam)
};
