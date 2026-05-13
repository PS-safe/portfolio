import { sql } from "./db";

const DEMO_LIMIT = 5;
const DEMO_WINDOW_SECONDS = 10;

export type RateResult = {
  allowed: boolean;
  limit: number;
  remaining: number;
  retryAfterSeconds: number;
  resetAt: string; // ISO timestamp
};

/**
 * Sliding-window rate-limit check + record.
 *
 * Two SQL statements in a single round trip: count current window, then
 * conditionally INSERT this hit. Cleanup of expired rows is opportunistic —
 * old rows just don't count, and a periodic cron (or future ON CONFLICT
 * cleanup) can sweep them.
 */
export async function checkAndRecord(
  key: string,
  scope: string,
  limit: number = DEMO_LIMIT,
  windowSeconds: number = DEMO_WINDOW_SECONDS,
): Promise<RateResult> {
  const db = sql();

  const countRows = (await db`
    SELECT count(*)::int AS used,
           min(created_at) AS oldest
      FROM rate_limit_events
     WHERE key = ${key}
       AND scope = ${scope}
       AND created_at > now() - (${windowSeconds} || ' seconds')::interval
  `) as Array<{ used: number; oldest: string | null }>;

  const used = countRows[0].used;
  const oldest = countRows[0].oldest;

  if (used >= limit) {
    const oldestMs = oldest ? new Date(oldest).getTime() : Date.now();
    const resetAtMs = oldestMs + windowSeconds * 1000;
    const retryAfterMs = Math.max(0, resetAtMs - Date.now());
    return {
      allowed: false,
      limit,
      remaining: 0,
      retryAfterSeconds: Math.ceil(retryAfterMs / 1000),
      resetAt: new Date(resetAtMs).toISOString(),
    };
  }

  await db`
    INSERT INTO rate_limit_events (key, scope)
    VALUES (${key}, ${scope})
  `;

  const remaining = limit - used - 1;
  const newOldestMs = oldest
    ? new Date(oldest).getTime()
    : Date.now();
  const resetAtMs = newOldestMs + windowSeconds * 1000;

  return {
    allowed: true,
    limit,
    remaining,
    retryAfterSeconds: 0,
    resetAt: new Date(resetAtMs).toISOString(),
  };
}

export function ipFromHeaders(h: Headers): string {
  // Vercel sets x-vercel-forwarded-for after stripping inbound copies — it
  // cannot be spoofed by the client. Prefer it; fall back to XFF only when
  // running outside Vercel (local dev, alternate hosting).
  const vercel = h.get("x-vercel-forwarded-for");
  if (vercel) return vercel.split(",")[0].trim();
  const xff = h.get("x-forwarded-for");
  if (xff) return xff.split(",")[0].trim();
  const real = h.get("x-real-ip");
  if (real) return real.trim();
  return "unknown";
}
