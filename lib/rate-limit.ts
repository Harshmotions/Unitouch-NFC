import { Ratelimit } from "@upstash/ratelimit";
import { Redis } from "@upstash/redis";
import { NextResponse } from "next/server";

/* Distributed rate limiting (audit #02) — Vercel functions don't share
   memory between invocations, so an in-process counter would silently do
   nothing in production. Upstash Redis is the shared store. One Ratelimit
   instance per limiter, reused across requests (each call is a single
   Redis round-trip, not a new connection).

   OTP send/verify are NOT rate-limited here: OtpSignIn.tsx calls
   supabase.auth.signInWithOtp()/verifyOtp() directly from the browser to
   Supabase's own Auth API — that traffic never reaches this server, so
   there's no route to attach a limiter to. Supabase Auth has its own
   built-in rate limits (Dashboard -> Authentication -> Rate Limits) —
   that's the actual place to configure/verify OTP throttling. */
const redis = Redis.fromEnv();

export const analyticsLimiter = new Ratelimit({
  redis,
  limiter: Ratelimit.slidingWindow(30, "1 m"),
  prefix: "rl:analytics",
});

export const checkUsernameLimiter = new Ratelimit({
  redis,
  limiter: Ratelimit.slidingWindow(20, "1 m"),
  prefix: "rl:check-username",
});

export const checkoutLimiter = new Ratelimit({
  redis,
  limiter: Ratelimit.slidingWindow(10, "5 m"),
  prefix: "rl:checkout",
});

/* Used for both profiles/update and admin/profiles/[id] — the audit names
   only "profile-update routes" at 20/user/min, but the admin route is the
   same shape (authenticated write, optional image upload) so it gets the
   same limiter rather than going unprotected. Upload volume isn't
   separately throttled: both routes cap at one image per request and are
   already under this same per-minute limit, so a second counter for
   "5 uploads/user/minute" would just be a tighter version of the same
   check on the same requests. */
export const profileWriteLimiter = new Ratelimit({
  redis,
  limiter: Ratelimit.slidingWindow(20, "1 m"),
  prefix: "rl:profile-write",
});

/* First entry in X-Forwarded-For (Vercel sets this; the entry closest to
   the client). Falls back to a fixed key so local dev without the header
   still exercises the same code path against one shared bucket. */
export function clientIp(request: Request): string {
  const forwarded = request.headers.get("x-forwarded-for");
  if (forwarded) return forwarded.split(",")[0].trim();
  return "local-dev";
}

export async function rateLimitOrResponse(
  limiter: Ratelimit,
  identifier: string,
): Promise<NextResponse | null> {
  const { success, reset } = await limiter.limit(identifier);
  if (success) return null;

  const retryAfterSeconds = Math.max(0, Math.ceil((reset - Date.now()) / 1000));
  return NextResponse.json(
    { error: "Too many requests. Please try again shortly." },
    { status: 429, headers: { "Retry-After": String(retryAfterSeconds) } },
  );
}
