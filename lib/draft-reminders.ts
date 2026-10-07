import { Redis } from "@upstash/redis";
import { createServiceRoleClient } from "@/lib/supabase/server";
import { sendDraftReminder } from "@/lib/email";

/* "Your profile isn't live yet" reminders for customers who paid but never
   published their profile.

   Automatic: a daily Vercel cron (/api/cron/draft-reminders) sends reminder
   #1 once the order is 1 day old, #2 at 3 days, #3 at 7 days, then stops.
   Manual: admins can send one any time from /admin/profiles.

   The sent count lives in Upstash Redis (no DB schema change needed), keyed
   by profile id. Only profiles linked to a PAID order are eligible: demo
   profiles have no order and unpaid checkouts are released anyway.

   WhatsApp: planned once a Unitouch WhatsApp Business number exists; the
   phone number is already on every order (orders.phone). */

export const REMINDER_SCHEDULE_DAYS = [1, 3, 7];

const redis = Redis.fromEnv();
const key = (profileId: string) => `draft-reminders:${profileId}`;

export async function getReminderCounts(profileIds: string[]): Promise<Record<string, number>> {
  if (!profileIds.length) return {};
  try {
    const values = await redis.mget<(number | null)[]>(...profileIds.map(key));
    return Object.fromEntries(profileIds.map((id, i) => [id, Number(values[i] ?? 0)]));
  } catch (err) {
    console.error("getReminderCounts failed", err);
    return {};
  }
}

type Draft = { profileId: string; username: string; fullName: string; email: string; paidAt: string };

/* Unpublished profiles whose order is paid. */
async function paidDrafts(profileId?: string): Promise<Draft[]> {
  const supabase = createServiceRoleClient();
  let q = supabase.from("profiles").select("id, username, full_name, order_id").eq("is_published", false).not("order_id", "is", null);
  if (profileId) q = q.eq("id", profileId);
  const { data: profiles } = await q;
  if (!profiles?.length) return [];

  const { data: orders } = await supabase
    .from("orders")
    .select("id, email, full_name, created_at")
    .in(
      "id",
      profiles.map((p) => p.order_id as string),
    )
    .eq("payment_status", "paid");
  const byId = new Map((orders ?? []).map((o) => [o.id as string, o]));

  return profiles
    .filter((p) => byId.has(p.order_id as string))
    .map((p) => {
      const o = byId.get(p.order_id as string)!;
      return {
        profileId: p.id as string,
        username: p.username as string,
        fullName: (o.full_name as string) || (p.full_name as string) || "",
        email: o.email as string,
        paidAt: o.created_at as string,
      };
    });
}

async function sendAndCount(d: Draft, reminderNumber: number): Promise<void> {
  await sendDraftReminder({ ...d, reminderNumber });
  await redis.set(key(d.profileId), reminderNumber, { ex: 60 * 60 * 24 * 120 });
}

/* Cron: send whichever scheduled reminder is due for each paid draft. */
export async function sendDueDraftReminders(): Promise<{ checked: number; sent: number }> {
  const drafts = await paidDrafts();
  const counts = await getReminderCounts(drafts.map((d) => d.profileId));
  let sent = 0;
  for (const d of drafts) {
    const already = counts[d.profileId] ?? 0;
    if (already >= REMINDER_SCHEDULE_DAYS.length) continue;
    const ageDays = (Date.now() - new Date(d.paidAt).getTime()) / 86_400_000;
    if (ageDays < REMINDER_SCHEDULE_DAYS[already]) continue;
    await sendAndCount(d, already + 1);
    sent++;
  }
  return { checked: drafts.length, sent };
}

/* Admin "Send reminder" button. */
export async function sendDraftReminderNow(
  profileId: string,
): Promise<{ ok: true; reminderNumber: number } | { ok: false; error: string }> {
  const [d] = await paidDrafts(profileId);
  if (!d) return { ok: false, error: "Only unpublished profiles with a paid order can get a reminder." };
  const counts = await getReminderCounts([profileId]);
  const reminderNumber = (counts[profileId] ?? 0) + 1;
  await sendAndCount(d, reminderNumber);
  return { ok: true, reminderNumber };
}
