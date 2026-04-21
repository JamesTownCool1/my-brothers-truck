/**
 * Simple in-memory sliding-window rate limiter.
 *
 * Good enough for an MVP on a single Node process. For production scale,
 * swap this out for Upstash Redis or a similar shared store — the interface
 * is identical (check returns { success, remaining }).
 *
 * Each key (usually ip + route) gets its own bucket of timestamps.
 * On each call we drop timestamps older than the window, then allow the
 * request if the bucket size is below `limit`.
 */
type Bucket = number[];
const buckets = new Map<string, Bucket>();

export interface RateLimitResult {
  success: boolean;
  remaining: number;
  resetMs: number;
}

export function rateLimit(
  key: string,
  opts: { limit: number; windowMs: number }
): RateLimitResult {
  const now = Date.now();
  const cutoff = now - opts.windowMs;

  const bucket = buckets.get(key) ?? [];
  // Drop expired timestamps (sliding window)
  const fresh = bucket.filter((t) => t > cutoff);

  if (fresh.length >= opts.limit) {
    buckets.set(key, fresh);
    const oldest = fresh[0]!;
    return {
      success: false,
      remaining: 0,
      resetMs: oldest + opts.windowMs - now,
    };
  }

  fresh.push(now);
  buckets.set(key, fresh);
  return {
    success: true,
    remaining: opts.limit - fresh.length,
    resetMs: opts.windowMs,
  };
}

/**
 * Pull a stable client identifier from a Next.js request.
 * Falls back in order: x-forwarded-for -> x-real-ip -> "unknown".
 */
export function getClientIp(headers: Headers): string {
  const xff = headers.get('x-forwarded-for');
  if (xff) return xff.split(',')[0]!.trim();
  const real = headers.get('x-real-ip');
  if (real) return real;
  return 'unknown';
}
