import { createServiceRoleClient } from "@/lib/supabase/server";
import { RESERVATION_TTL_MINUTES } from "@/lib/checkout-config";

/* Unpaid checkout reservations.

   Clicking Pay writes a PENDING order + placeholder profile before the
   customer pays (create-order), which reserves the profile link (usernames
   are unique). If they abandon the Razorpay window, that reservation used to
   hold the link forever, so coming back with the same details found their
   own link "taken".

   Rules:
   - A pending reservation older than RESERVATION_TTL_MINUTES is released:
     order, placeholder profile, and uploaded photo are deleted. There's no
     cron (Vercel Hobby crons are daily-only); it runs lazily whenever someone
     checks a link or starts a checkout, which is exactly when a stale hold
     could get in the way.
   - The same person (same email) starting a new checkout for the same link
     replaces their own pending reservation immediately.
   - The Razorpay modal times out after CHECKOUT_TIMEOUT_SECONDS, well inside
     the TTL, so an abandoned tab can't normally be paid after its release.
   - If a payment still arrives for a released order (slow UPI, an old tab),
     the verify route / webhook refund it automatically (lib/late-payment.ts).

   "Unpaid" means pending OR failed (the payment.failed webhook marks a
   declined attempt failed; that checkout still holds the link). Only unpaid
   orders are ever deleted, and never one whose profile is published. Unpaid
   orders from before guest checkout carry a user_id; they're released too. */

const PHOTO_BUCKET = "profile-photos";

type PendingOrder = { id: string };

async function deleteReservations(orders: PendingOrder[]): Promise<number> {
  if (!orders.length) return 0;
  const supabase = createServiceRoleClient();

  const { data: profiles } = await supabase
    .from("profiles")
    .select("id, avatar_url, order_id, is_published")
    .in(
      "order_id",
      orders.map((o) => o.id),
    );
  // Never touch anything whose profile is already live.
  const published = new Set((profiles ?? []).filter((p) => p.is_published).map((p) => p.order_id as string));
  const orderIds = orders.map((o) => o.id).filter((id) => !published.has(id));
  if (!orderIds.length) return 0;

  // Order first (still guarded on pending, so a payment that lands mid-way
  // keeps its order), then the placeholder profiles it held.
  const { data: deleted } = await supabase
    .from("orders")
    .delete()
    .in("id", orderIds)
    .in("payment_status", ["pending", "failed"])
    .select("id");
  const deletedIds = new Set((deleted ?? []).map((o) => o.id as string));
  if (!deletedIds.size) return 0;

  const releasable = (profiles ?? []).filter((p) => deletedIds.has(p.order_id as string) && !p.is_published);
  if (releasable.length) {
    await supabase
      .from("profiles")
      .delete()
      .in(
        "id",
        releasable.map((p) => p.id as string),
      )
      .eq("is_published", false);

    const paths = releasable
      .map((p) => (p.avatar_url as string | null)?.split(`/${PHOTO_BUCKET}/`)[1])
      .filter((p): p is string => Boolean(p))
      .map(decodeURIComponent);
    if (paths.length) await supabase.storage.from(PHOTO_BUCKET).remove(paths);
  }

  return deletedIds.size;
}

/* Releases every pending reservation older than the TTL. Never throws: a
   cleanup failure must not block the request that triggered it. */
export async function releaseStaleReservations(): Promise<void> {
  try {
    const cutoff = new Date(Date.now() - RESERVATION_TTL_MINUTES * 60_000).toISOString();
    const { data } = await createServiceRoleClient()
      .from("orders")
      .select("id")
      .in("payment_status", ["pending", "failed"])
      .lt("created_at", cutoff)
      .limit(50);
    await deleteReservations(data ?? []);
  } catch (err) {
    console.error("releaseStaleReservations failed", err);
  }
}

/* The pending order currently holding `username`, if any, with its email. */
async function pendingHolder(username: string): Promise<{ id: string; email: string } | null> {
  const supabase = createServiceRoleClient();
  const { data: profile } = await supabase
    .from("profiles")
    .select("order_id, is_published")
    .eq("username", username)
    .maybeSingle();
  if (!profile?.order_id || profile.is_published) return null;

  const { data: order } = await supabase
    .from("orders")
    .select("id, email, payment_status")
    .eq("id", profile.order_id)
    .maybeSingle();
  if (!order || order.payment_status === "paid") return null;
  return { id: order.id as string, email: (order.email as string).toLowerCase() };
}

/* True when `username` is held only by this same email's own unpaid
   checkout, i.e. starting a new checkout would take it over. */
export async function isOwnPendingReservation(username: string, email: string): Promise<boolean> {
  const holder = await pendingHolder(username);
  return Boolean(holder && holder.email === email.trim().toLowerCase());
}

/* Called by create-order: drops this email's own earlier unpaid reservation
   of `username` so the new checkout can reserve it again. */
export async function releaseOwnReservation(username: string, email: string): Promise<void> {
  try {
    const holder = await pendingHolder(username);
    if (holder && holder.email === email.trim().toLowerCase()) {
      await deleteReservations([{ id: holder.id }]);
    }
  } catch (err) {
    console.error("releaseOwnReservation failed", err);
  }
}
