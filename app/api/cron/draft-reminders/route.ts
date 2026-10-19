import { NextResponse } from "next/server";
import { sendDueDraftReminders } from "@/lib/draft-reminders";
import { releaseStaleReservations } from "@/lib/reservations";
import { cleanUpAbandonedAuthUsers, type AuthCleanupResult } from "@/lib/auth-cleanup";
import { createServiceRoleClient } from "@/lib/supabase/server";
import { BUSINESS } from "@/lib/business";

/* Daily Vercel cron (vercel.json -> crons). Vercel calls it with
   "Authorization: Bearer <CRON_SECRET>"; anything else is refused, and so is
   everything if CRON_SECRET isn't configured.

   Sends due "your profile isn't live yet" reminders (lib/draft-reminders.ts)
   and, while it's here, releases stale unpaid checkouts even on days nobody
   checks a link, and removes abandoned sign-in accounts (requested a login
   code, never used it; see lib/auth-cleanup.ts for the exact rules). */
export const maxDuration = 60;

export async function GET(request: Request) {
  const secret = process.env.CRON_SECRET;
  if (!secret || request.headers.get("authorization") !== `Bearer ${secret}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  await releaseStaleReservations();
  const result = await sendDueDraftReminders();

  // Separate from the reminders: a failure here must never stop them.
  let authCleanup: AuthCleanupResult | { error: string };
  try {
    authCleanup = await cleanUpAbandonedAuthUsers(createServiceRoleClient(), { adminEmail: BUSINESS.adminEmail });
  } catch (err) {
    console.error("auth cleanup failed, nothing deleted", err);
    authCleanup = { error: "failed" };
  }

  return NextResponse.json({ ...result, authCleanup });
}
