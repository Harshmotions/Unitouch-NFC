import { NextResponse } from "next/server";
import { z } from "zod";
import { logEvent } from "@/lib/analytics";

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

const bodySchema = z.object({
  eventType: z.enum(EVENT_TYPES),
  username: z.string().min(1),
  metadata: z.record(z.string(), z.unknown()).optional(),
});

export async function POST(request: Request) {
  const json = await request.json().catch(() => null);
  const parsed = bodySchema.safeParse(json);
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid event payload" }, { status: 400 });
  }

  const { eventType, username, metadata } = parsed.data;
  await logEvent(eventType, username, metadata);

  return NextResponse.json({ status: "ok" });
}
