import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { z } from "zod";
import { logEvent } from "@/lib/analytics";
import { getPublishedProfile } from "@/lib/profile";
import { getAdminUser } from "@/lib/admin";
import { ADMIN_AUTH_COOKIE } from "@/lib/supabase/admin-cookie";
import { createServerSupabaseClient, createServiceRoleClient } from "@/lib/supabase/server";
import { analyticsLimiter, clientIp, rateLimitOrResponse } from "@/lib/rate-limit";

const EVENT_TYPES = [
  "page_view",
  "whatsapp_click",
  "website_click",
  "contact_save",
  "instagram_click",
  "linkedin_click",
  "email_click",
  "phone_click",
  "youtube_click",
  "portfolio_click",
] as const;

/* Allow-listed metadata shape (audit #03 — Harden Analytics). `.strict()`
   rejects any key outside this list instead of silently accepting arbitrary
   JSON. Values aren't persisted (see lib/analytics.ts) — this exists to
   reject malformed/oversized payloads cheaply, before they cost a DB call. */
const metadataSchema = z
  .object({
    source: z.string().max(200).optional(),
    referrer: z.string().max(200).optional(),
    device: z.string().max(200).optional(),
    country: z.string().max(200).optional(),
    utm_source: z.string().max(200).optional(),
    utm_medium: z.string().max(200).optional(),
  })
  .strict();

const bodySchema = z.object({
  eventType: z.enum(EVENT_TYPES),
  username: z.string().min(1),
  metadata: metadataSchema.optional(),
});

export async function POST(request: Request) {
  const limited = await rateLimitOrResponse(analyticsLimiter, clientIp(request));
  if (limited) return limited;

  const json = await request.json().catch(() => null);
  const parsed = bodySchema.safeParse(json);
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid event payload" }, { status: 400 });
  }

  const { eventType, username } = parsed.data;
  const normalizedUsername = username.trim().toLowerCase();

  /* 404 (not 400) for a username that doesn't resolve to a published
     profile — matches getPublishedProfile's own "missing and unpublished
     look identical" behavior, so this endpoint can't be used to enumerate
     which usernames exist. */
  const profile = await getPublishedProfile(normalizedUsername);
  if (!profile) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  // The owner checking their own page (or the team checking it from the
  // admin) isn't a real visitor; counting it would inflate their stats.
  if (await isOwnOrTeamVisit(normalizedUsername)) {
    return NextResponse.json({ status: "ok", counted: false });
  }

  await logEvent(eventType, normalizedUsername);

  return NextResponse.json({ status: "ok" });
}

/* True when the request carries the profile owner's customer session, or a
   full admin session. Visitors without an auth cookie (nearly everyone) skip
   the session lookups entirely. Any error counts the visit as usual. */
async function isOwnOrTeamVisit(username: string): Promise<boolean> {
  try {
    const names = (await cookies()).getAll().map((c) => c.name);
    const hasAdmin = names.some((n) => n.startsWith(ADMIN_AUTH_COOKIE));
    const hasCustomer = names.some((n) => n.startsWith("sb-") && !n.startsWith(ADMIN_AUTH_COOKIE));

    if (hasAdmin && (await getAdminUser())) return true;
    if (!hasCustomer) return false;

    const supabase = await createServerSupabaseClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) return false;
    const { data } = await createServiceRoleClient()
      .from("profiles")
      .select("user_id")
      .eq("username", username)
      .maybeSingle();
    return Boolean(data?.user_id) && data?.user_id === user.id;
  } catch {
    return false;
  }
}
