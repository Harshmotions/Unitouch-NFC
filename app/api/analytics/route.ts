import { NextResponse } from "next/server";
import { z } from "zod";
import { logEvent } from "@/lib/analytics";
import { getPublishedProfile } from "@/lib/profile";
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

  await logEvent(eventType, normalizedUsername);

  return NextResponse.json({ status: "ok" });
}
