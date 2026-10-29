import { Redis } from "@upstash/redis";
import { createServiceRoleClient } from "@/lib/supabase/server";
import { getReminderCounts } from "@/lib/draft-reminders";
import { DEMO_USERNAMES } from "@/lib/profile-demo";

/* Admin profile management: the enriched profiles list and deletion.
   Callers are behind requireAdmin()/getAdminUser(). */

/* Demo profiles linked from the marketing site ("See a Live Profile",
   navbar "Demo Profile"). Deleting them would break those links. */
export const PROTECTED_USERNAMES = DEMO_USERNAMES;

export type AdminProfileStatus = "published" | "draft-paid" | "unpaid" | "demo" | "draft";

export interface AdminProfileRow {
  id: string;
  username: string;
  fullName: string | null;
  /* The email the customer ordered with (falls back to the profile's contact email). */
  email: string | null;
  isPublished: boolean;
  createdAt: string;
  status: AdminProfileStatus;
  order: { id: string; orderNumber: string; paymentStatus: string } | null;
  remindersSent: number;
  protected: boolean;
}

export async function listAdminProfiles(): Promise<AdminProfileRow[]> {
  const supabase = createServiceRoleClient();
  const { data: profiles } = await supabase
    .from("profiles")
    .select("id, username, full_name, email, is_published, created_at, order_id")
    .order("created_at", { ascending: false });
  if (!profiles?.length) return [];

  const orderIds = profiles.map((p) => p.order_id).filter(Boolean) as string[];
  const { data: orders } = orderIds.length
    ? await supabase.from("orders").select("id, order_number, payment_status, email").in("id", orderIds)
    : { data: [] as { id: string; order_number: string; payment_status: string; email: string }[] };
  const byId = new Map((orders ?? []).map((o) => [o.id as string, o]));
  const reminders = await getReminderCounts(profiles.map((p) => p.id as string));

  return profiles.map((p) => {
    const o = p.order_id ? byId.get(p.order_id as string) : undefined;
    const isProtected = PROTECTED_USERNAMES.includes(p.username as string);
    const status: AdminProfileStatus = isProtected && !o
      ? "demo"
      : p.is_published
        ? "published"
        : !o
          ? "draft"
          : o.payment_status === "paid"
            ? "draft-paid"
            : "unpaid";

    return {
      id: p.id as string,
      username: p.username as string,
      fullName: (p.full_name as string | null) ?? null,
      email: (o?.email as string | undefined) ?? (p.email as string | null) ?? null,
      isPublished: Boolean(p.is_published),
      createdAt: p.created_at as string,
      status,
      order: o ? { id: o.id as string, orderNumber: o.order_number as string, paymentStatus: o.payment_status as string } : null,
      remindersSent: reminders[p.id as string] ?? 0,
      protected: isProtected,
    };
  });
}

/* Deletes a profile for good: the profile row, its photo, its view stats
   (stats are keyed by username, so they'd otherwise carry over to whoever
   takes the link next) and its reminder counter. An UNPAID checkout's order
   is deleted with it; a PAID order is kept (the customer paid; its
   profile_id is cleared by the foreign key). Demo profiles are refused. */
export async function deleteProfileAsAdmin(
  id: string,
): Promise<{ ok: true; username: string; keptPaidOrder: string | null } | { ok: false; error: string; status: number }> {
  const supabase = createServiceRoleClient();
  const { data: profile } = await supabase
    .from("profiles")
    .select("id, username, avatar_url, order_id")
    .eq("id", id)
    .maybeSingle();
  if (!profile) return { ok: false, error: "Profile not found.", status: 404 };
  const username = profile.username as string;
  if (PROTECTED_USERNAMES.includes(username)) {
    return { ok: false, error: "Demo profiles are linked from the homepage and can't be deleted.", status: 400 };
  }

  let keptPaidOrder: string | null = null;
  if (profile.order_id) {
    const { data: order } = await supabase
      .from("orders")
      .select("id, order_number, payment_status")
      .eq("id", profile.order_id)
      .maybeSingle();
    if (order?.payment_status === "paid") {
      keptPaidOrder = order.order_number as string;
    } else if (order) {
      await supabase.from("orders").delete().eq("id", order.id).neq("payment_status", "paid");
    }
  }

  await supabase.from("analytics_events").delete().eq("username", username);
  await supabase.from("daily_analytics").delete().eq("username", username);

  const { error } = await supabase.from("profiles").delete().eq("id", id);
  if (error) return { ok: false, error: "Could not delete the profile. Please try again.", status: 500 };

  const photoPath = (profile.avatar_url as string | null)?.split("/profile-photos/")[1];
  if (photoPath) await supabase.storage.from("profile-photos").remove([decodeURIComponent(photoPath)]);

  try {
    await Redis.fromEnv().del(`draft-reminders:${id}`, `draft-reminders-at:${id}`);
  } catch {
    // Counter is advisory; a stale key for a deleted id is harmless.
  }

  return { ok: true, username, keptPaidOrder };
}
