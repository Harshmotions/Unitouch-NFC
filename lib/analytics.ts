import type { EventType } from "@/types";
import { createServiceRoleClient } from "@/lib/supabase/server";

/* Server-only — analytics_events is locked to the service-role key (see the
   RLS migration). Only import this from server components, route handlers,
   or other server-only modules — never from a "use client" file. */

export async function logEvent(
  eventType: EventType,
  username: string,
  metadata?: Record<string, unknown>
) {
  const supabase = createServiceRoleClient();
  await supabase.from("analytics_events").insert({
    username,
    event_type: eventType,
    metadata: metadata ?? null,
  });
}

export async function getProfileStats(username: string): Promise<{ views: number; saves: number }> {
  const supabase = createServiceRoleClient();
  const [views, saves] = await Promise.all([
    supabase
      .from("analytics_events")
      .select("id", { count: "exact", head: true })
      .eq("username", username)
      .eq("event_type", "page_view"),
    supabase
      .from("analytics_events")
      .select("id", { count: "exact", head: true })
      .eq("username", username)
      .eq("event_type", "contact_save"),
  ]);

  return { views: views.count ?? 0, saves: saves.count ?? 0 };
}
