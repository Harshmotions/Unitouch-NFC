import { createServiceRoleClient } from "@/lib/supabase/server";
import { CARD_VARIANTS } from "@/lib/pricing";

/* Admin-side order reads and the fulfilment status model. Service-role only:
   `orders` has no RLS read policy. Callers are behind requireAdmin(). */

export { ORDER_STATUSES, ORDER_VIEWS, statusLabel } from "@/lib/order-status";
import type { OrderStatus, OrderView } from "@/lib/order-status";
export type { OrderStatus, OrderView };

export interface AdminOrder {
  id: string;
  orderNumber: string;
  fullName: string;
  email: string;
  phone: string;
  cardType: string;
  cardName: string;
  quantity: number;
  amountPaise: number;
  paymentStatus: "pending" | "paid" | "failed";
  orderStatus: OrderStatus;
  shippingAddress: { line1: string; line2?: string; city: string; state: string; pincode: string };
  additionalNotes: string | null;
  adminNotes: string | null;
  trackingNumber: string | null;
  razorpayOrderId: string | null;
  razorpayPaymentId: string | null;
  createdAt: string;
  profile: { id: string; username: string; isPublished: boolean } | null;
  // Set when an email to this order's address bounced (Resend webhook).
  emailBouncedAt: string | null;
  emailBounceReason: string | null;
}

const ORDER_COLUMNS =
  "id, order_number, full_name, email, phone, card_type, quantity, amount, payment_status, order_status, shipping_address, additional_notes, admin_notes, tracking_number, razorpay_order_id, razorpay_payment_id, created_at";

type Row = Record<string, unknown>;

async function attachProfiles(rows: Row[]): Promise<AdminOrder[]> {
  const ids = rows.map((r) => r.id as string);
  const profiles = new Map<string, AdminOrder["profile"]>();
  const bounces = new Map<string, { at: string; reason: string | null }>();
  if (ids.length) {
    const supabase = createServiceRoleClient();
    const [{ data }, bounceRes] = await Promise.all([
      supabase.from("profiles").select("id, username, is_published, order_id").in("order_id", ids),
      /* Separate from ORDER_COLUMNS on purpose: until the schema.sql upgrade
         adds these columns this query errors, and the admin must keep working
         (just without bounce flags). */
      supabase.from("orders").select("id, email_bounced_at, email_bounce_reason").in("id", ids).not("email_bounced_at", "is", null),
    ]);
    for (const p of data ?? []) {
      profiles.set(p.order_id as string, { id: p.id, username: p.username, isPublished: p.is_published });
    }
    for (const b of bounceRes.error ? [] : (bounceRes.data ?? [])) {
      bounces.set(b.id as string, { at: b.email_bounced_at as string, reason: (b.email_bounce_reason as string | null) ?? null });
    }
  }
  return rows.map((r) => ({
    id: r.id as string,
    orderNumber: r.order_number as string,
    fullName: r.full_name as string,
    email: r.email as string,
    phone: r.phone as string,
    cardType: r.card_type as string,
    cardName: CARD_VARIANTS.find((v) => v.id === r.card_type)?.name ?? (r.card_type as string),
    quantity: r.quantity as number,
    amountPaise: r.amount as number,
    paymentStatus: r.payment_status as AdminOrder["paymentStatus"],
    orderStatus: r.order_status as OrderStatus,
    shippingAddress: r.shipping_address as AdminOrder["shippingAddress"],
    additionalNotes: (r.additional_notes as string | null) ?? null,
    adminNotes: (r.admin_notes as string | null) ?? null,
    trackingNumber: (r.tracking_number as string | null) ?? null,
    razorpayOrderId: (r.razorpay_order_id as string | null) ?? null,
    razorpayPaymentId: (r.razorpay_payment_id as string | null) ?? null,
    createdAt: r.created_at as string,
    profile: profiles.get(r.id as string) ?? null,
    emailBouncedAt: bounces.get(r.id as string)?.at ?? null,
    emailBounceReason: bounces.get(r.id as string)?.reason ?? null,
  }));
}

export async function listOrdersForAdmin(view: OrderView, search?: string): Promise<AdminOrder[]> {
  let query = createServiceRoleClient().from("orders").select(ORDER_COLUMNS);

  if (view === "to-fulfil") {
    query = query.eq("payment_status", "paid").not("order_status", "in", "(shipped,delivered)");
  } else if (view === "shipped") {
    query = query.eq("payment_status", "paid").in("order_status", ["shipped", "delivered"]);
  } else if (view === "unpaid") {
    query = query.in("payment_status", ["pending", "failed"]);
  }

  const term = search?.trim();
  if (term) {
    // Commas and parentheses would break the PostgREST or() filter syntax.
    const safe = term.replace(/[,()]/g, " ");
    query = query.or(`order_number.ilike.%${safe}%,full_name.ilike.%${safe}%,email.ilike.%${safe}%,phone.ilike.%${safe}%`);
  }

  // Oldest first while fulfilling (work the queue in order); newest first otherwise.
  const { data, error } = await query.order("created_at", { ascending: view === "to-fulfil" }).limit(200);
  if (error || !data) return [];
  return attachProfiles(data as Row[]);
}

export async function getOrderForAdmin(id: string): Promise<AdminOrder | null> {
  const { data, error } = await createServiceRoleClient().from("orders").select(ORDER_COLUMNS).eq("id", id).maybeSingle();
  if (error || !data) return null;
  return (await attachProfiles([data as Row]))[0];
}

export interface AdminStats {
  toFulfil: number;
  paidLast7Days: number;
  revenueLast7DaysPaise: number;
  revenueAllTimePaise: number;
  paidAllTime: number;
  unpaidCheckouts: number;
}

export async function getAdminStats(): Promise<AdminStats> {
  const supabase = createServiceRoleClient();
  const { data } = await supabase.from("orders").select("amount, payment_status, order_status, created_at");
  const rows = data ?? [];
  const weekAgo = Date.now() - 7 * 24 * 60 * 60 * 1000;
  const paid = rows.filter((r) => r.payment_status === "paid");
  const paidWeek = paid.filter((r) => new Date(r.created_at as string).getTime() >= weekAgo);
  return {
    toFulfil: paid.filter((r) => !["shipped", "delivered"].includes(r.order_status as string)).length,
    paidLast7Days: paidWeek.length,
    revenueLast7DaysPaise: paidWeek.reduce((s, r) => s + (r.amount as number), 0),
    revenueAllTimePaise: paid.reduce((s, r) => s + (r.amount as number), 0),
    paidAllTime: paid.length,
    unpaidCheckouts: rows.filter((r) => r.payment_status !== "paid").length,
  };
}

export function formatRupees(paise: number): string {
  return `₹${(paise / 100).toLocaleString("en-IN", { maximumFractionDigits: 2 })}`;
}
