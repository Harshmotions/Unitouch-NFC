import { createServiceRoleClient } from "@/lib/supabase/server";
import type { EventType } from "@/types";

/* Read-only profile analytics for the admin (views, contact saves, link
   taps), from daily_analytics: one row per (username, day, event_type) with
   a count. Server-only (service role). Days are the database's
   current_date, i.e. UTC days.

   Reads in pages: PostgREST caps a response at 1000 rows and the table
   grows by profiles x days x event types. If it ever gets large, swap the
   totals for a grouped SQL function. */

const PAGE = 1000;

type Row = { username: string; event_date: string; event_type: EventType; count: number };

async function readRows(filter: { usernames?: string[]; username?: string; eventTypes?: EventType[] }): Promise<Row[]> {
  const supabase = createServiceRoleClient();
  const rows: Row[] = [];
  for (let offset = 0; ; offset += PAGE) {
    let q = supabase.from("daily_analytics").select("username, event_date, event_type, count").order("id").range(offset, offset + PAGE - 1);
    if (filter.username) q = q.eq("username", filter.username);
    if (filter.usernames) q = q.in("username", filter.usernames);
    if (filter.eventTypes) q = q.in("event_type", filter.eventTypes);
    const { data, error } = await q;
    if (error || !data) break;
    rows.push(...(data as Row[]));
    if (data.length < PAGE) break;
  }
  return rows;
}

/** All-time views and saves for many profiles at once (admin Profiles list). */
export async function getViewSaveTotals(usernames: string[]): Promise<Record<string, { views: number; saves: number }>> {
  const totals: Record<string, { views: number; saves: number }> = {};
  if (!usernames.length) return totals;
  for (const r of await readRows({ usernames, eventTypes: ["page_view", "contact_save"] })) {
    const t = (totals[r.username] ??= { views: 0, saves: 0 });
    if (r.event_type === "page_view") t.views += r.count;
    else t.saves += r.count;
  }
  return totals;
}

export interface ProfileStatsDetail {
  views: { last7: number; last30: number; all: number };
  saves: { last7: number; last30: number; all: number };
  // All-time taps per button, biggest first; only buttons with taps.
  taps: { type: EventType; count: number }[];
}

// "YYYY-MM-DD" (UTC) n days before today, so last7 = today and the 6 days before.
function utcDaysAgo(n: number): string {
  const d = new Date();
  d.setUTCDate(d.getUTCDate() - n);
  return d.toISOString().slice(0, 10);
}

export async function getProfileStatsDetail(username: string): Promise<ProfileStatsDetail> {
  const since7 = utcDaysAgo(6);
  const since30 = utcDaysAgo(29);
  const stats: ProfileStatsDetail = {
    views: { last7: 0, last30: 0, all: 0 },
    saves: { last7: 0, last30: 0, all: 0 },
    taps: [],
  };
  const taps = new Map<EventType, number>();
  for (const r of await readRows({ username })) {
    const bucket = r.event_type === "page_view" ? stats.views : r.event_type === "contact_save" ? stats.saves : null;
    if (bucket) {
      bucket.all += r.count;
      if (r.event_date >= since30) bucket.last30 += r.count;
      if (r.event_date >= since7) bucket.last7 += r.count;
    } else {
      taps.set(r.event_type, (taps.get(r.event_type) ?? 0) + r.count);
    }
  }
  stats.taps = [...taps.entries()].map(([type, count]) => ({ type, count })).sort((a, b) => b.count - a.count);
  return stats;
}
