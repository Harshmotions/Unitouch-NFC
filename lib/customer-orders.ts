import { createServiceRoleClient } from "@/lib/supabase/server";
import { CARD_VARIANTS } from "@/lib/pricing";
import type { OrderStatus } from "@/lib/order-status";

/* Read-only order status for the signed-in customer ("where's my card?" in
   /studio). Only orders already linked to this account (orders.user_id, set
   by claimProfilesForUser for PAID orders on an OTP-verified email); this
   never claims or changes anything. Service-role because `orders` has no
   RLS read policy, so the user-id filter below is the access control: only
   ever call it with the id of the session's own user. Internal fields
   (admin notes, payment ids, address) are not selected. */

export interface CustomerOrder {
  orderNumber: string;
  createdAt: string;
  cardName: string;
  quantity: number;
  status: OrderStatus;
  trackingNumber: string | null;
  username: string | null;
}

export async function getOrdersForCustomer(userId: string): Promise<CustomerOrder[]> {
  const supabase = createServiceRoleClient();
  const { data, error } = await supabase
    .from("orders")
    .select("id, order_number, created_at, card_type, quantity, order_status, tracking_number")
    .eq("user_id", userId)
    .eq("payment_status", "paid")
    .order("created_at", { ascending: false })
    .limit(50);
  if (error || !data?.length) return [];

  const { data: profiles } = await supabase
    .from("profiles")
    .select("order_id, username")
    .eq("user_id", userId)
    .in("order_id", data.map((o) => o.id as string));
  const usernames = new Map((profiles ?? []).map((p) => [p.order_id as string, p.username as string]));

  return data.map((o) => ({
    orderNumber: o.order_number as string,
    createdAt: o.created_at as string,
    cardName: CARD_VARIANTS.find((v) => v.id === o.card_type)?.name ?? (o.card_type as string),
    quantity: o.quantity as number,
    status: o.order_status as OrderStatus,
    // Only meaningful once it's on its way.
    trackingNumber: o.order_status === "shipped" || o.order_status === "delivered" ? ((o.tracking_number as string | null) ?? null) : null,
    username: usernames.get(o.id as string) ?? null,
  }));
}
