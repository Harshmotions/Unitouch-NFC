import { NextResponse } from "next/server";
import { sendDueDraftReminders } from "@/lib/draft-reminders";
import { releaseStaleReservations } from "@/lib/reservations";

/* Daily Vercel cron (vercel.json -> crons). Vercel calls it with
   "Authorization: Bearer <CRON_SECRET>"; anything else is refused, and so is
   everything if CRON_SECRET isn't configured.

   Sends due "your profile isn't live yet" reminders (lib/draft-reminders.ts)
   and, while it's here, releases stale unpaid checkouts even on days nobody
   checks a link. */
export const maxDuration = 60;

export async function GET(request: Request) {
  const secret = process.env.CRON_SECRET;
  if (!secret || request.headers.get("authorization") !== `Bearer ${secret}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  await releaseStaleReservations();
  const result = await sendDueDraftReminders();
  return NextResponse.json(result);
}
