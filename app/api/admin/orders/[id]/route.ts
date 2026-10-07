import { NextResponse, after } from "next/server";
import { z } from "zod";
import { verifyOrigin } from "@/lib/csrf";
import { getAdminUser } from "@/lib/admin";
import { profileWriteLimiter, rateLimitOrResponse } from "@/lib/rate-limit";
import { createServiceRoleClient } from "@/lib/supabase/server";
import { ORDER_STATUSES } from "@/lib/orders";
import { sendShippedEmail } from "@/lib/email";

const updateSchema = z.object({
  orderStatus: z.enum(ORDER_STATUSES.map((s) => s.value) as [string, ...string[]]),
  trackingNumber: z.string().trim().max(200).optional().default(""),
  adminNotes: z.string().trim().max(4000).optional().default(""),
});

/* Admin: update an order's fulfilment status, tracking details, and internal
   notes. Moving a PAID order to "shipped" (or changing its tracking details
   while shipped) emails the customer "your card has shipped". */
export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }) {
  if (!verifyOrigin(request)) {
    return NextResponse.json({ error: "Invalid request origin." }, { status: 403 });
  }
  const admin = await getAdminUser();
  if (!admin) {
    return NextResponse.json({ error: "Your admin session expired. Please sign in again." }, { status: 401 });
  }
  const limited = await rateLimitOrResponse(profileWriteLimiter, admin.id);
  if (limited) return limited;

  const { id } = await params;
  const parsed = updateSchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.issues[0]?.message ?? "Invalid details" }, { status: 400 });
  }
  const { orderStatus, trackingNumber, adminNotes } = parsed.data;

  const supabase = createServiceRoleClient();
  const { data: current } = await supabase
    .from("orders")
    .select("id, payment_status, order_status, tracking_number")
    .eq("id", id)
    .maybeSingle();
  if (!current) {
    return NextResponse.json({ error: "Order not found." }, { status: 404 });
  }
  if (current.payment_status !== "paid" && orderStatus !== "received") {
    return NextResponse.json({ error: "This order hasn't been paid, so it can't move forward." }, { status: 400 });
  }

  const { error } = await supabase
    .from("orders")
    .update({
      order_status: orderStatus,
      tracking_number: trackingNumber || null,
      admin_notes: adminNotes || null,
    })
    .eq("id", id);
  if (error) {
    return NextResponse.json({ error: "Could not save the order. Please try again." }, { status: 500 });
  }

  const newlyShipped = orderStatus === "shipped" && current.order_status !== "shipped";
  const trackingChangedWhileShipped =
    orderStatus === "shipped" && (current.tracking_number ?? "") !== trackingNumber;
  const notify = current.payment_status === "paid" && (newlyShipped || trackingChangedWhileShipped);
  if (notify) after(() => sendShippedEmail(id));

  return NextResponse.json({ ok: true, customerEmailed: notify });
}
