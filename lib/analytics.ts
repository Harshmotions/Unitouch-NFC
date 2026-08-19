import type { EventType } from "@/types";
import { createServiceRoleClient } from "@/lib/supabase/server";

/* Server-only — daily_analytics is locked to the service-role key (see the
   RLS migration). Only import this from server components, route handlers,
   or other server-only modules — never from a "use client" file.

   Writes go into daily_analytics, one row per (username, day, event_type),
   atomically incremented via the increment_daily_analytics RPC — not a row
   per event. This replaces the old analytics_events table (deprecated,
   see supabase/schema.sql) which grew unbounded with traffic and stored
   arbitrary per-event JSON metadata. Metadata isn't persisted under this
   model; the API route still validates it against an allow-list so
   malformed/oversized payloads are rejected before they cost anything. */

export async function logEvent(eventType: EventType, username: string) {
  const supabase = createServiceRoleClient();
  await supabase.rpc("increment_daily_analytics", {
    p_username: username,
    p_event_type: eventType,
  });
}

export async function getProfileStats(username: string): Promise<{ views: number; saves: number }> {
  const supabase = createServiceRoleClient();
  const { data, error } = await supabase
    .from("daily_analytics")
    .select("event_type, count")
    .eq("username", username)
    .in("event_type", ["page_view", "contact_save"]);

  if (error || !data) return { views: 0, saves: 0 };

  let views = 0;
  let saves = 0;
  for (const row of data) {
    if (row.event_type === "page_view") views += row.count;
    else if (row.event_type === "contact_save") saves += row.count;
  }
  return { views, saves };
}
