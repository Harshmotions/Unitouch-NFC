import { NextResponse } from "next/server";
import { createServiceRoleClient, createServerSupabaseClient } from "@/lib/supabase/server";
import { verifyOrigin } from "@/lib/csrf";
import { checkoutLimiter, clientIp, rateLimitOrResponse } from "@/lib/rate-limit";
import { verifyPaymentSignature } from "@/lib/razorpay/verify";

/* Razorpay checkout verification (audit #01 — real payment flow).

   checkout.js hands the browser three values on a successful payment
   (razorpay_order_id, razorpay_payment_id, razorpay_signature). This route
   confirms the signature server-side and, only then, flips the matching order
   to payment_status = 'paid'. Nothing the client sends is trusted until the
   HMAC checks out — a tampered or forged signature is rejected before any DB
   write.

   This is the interactive confirmation path. The payment.captured webhook is
   the independent, authoritative path that does the same flip — either can run
   first, so the update is written to be idempotent (see below). */
export async function POST(request: Request) {
  if (!verifyOrigin(request)) {
    return NextResponse.json({ error: "Invalid request origin." }, { status: 403 });
  }

  const limited = await rateLimitOrResponse(checkoutLimiter, clientIp(request));
  if (limited) return limited;

  // The order belongs to a signed-in buyer; confirm the session before
  // touching anything.
  const authClient = await createServerSupabaseClient();
  const {
    data: { user },
  } = await authClient.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: "Please sign in to complete your order." }, { status: 401 });
  }

  const body = await request.json().catch(() => null);
  const orderId = body?.razorpay_order_id;
  const paymentId = body?.razorpay_payment_id;
  const signature = body?.razorpay_signature;

  if (typeof orderId !== "string" || typeof paymentId !== "string" || typeof signature !== "string") {
    return NextResponse.json({ error: "Invalid payment details." }, { status: 400 });
  }

  // 1. Verify the HMAC first — pure crypto, no DB. Reject forged/tampered
  //    input before it can touch storage.
  if (!verifyPaymentSignature({ orderId, paymentId, signature })) {
    return NextResponse.json({ error: "Payment verification failed." }, { status: 400 });
  }

  const supabase = createServiceRoleClient();

  // 2. The signature proves the payment matches the order; confirm that order
  //    exists and belongs to THIS user (defense-in-depth — a valid signature
  //    for someone else's order still shouldn't be actionable here).
  const { data: order, error: orderError } = await supabase
    .from("orders")
    .select("id, order_number, user_id, payment_status")
    .eq("razorpay_order_id", orderId)
    .maybeSingle();

  if (orderError) {
    return NextResponse.json({ error: "Could not verify your payment. Please contact support." }, { status: 500 });
  }
  if (!order || order.user_id !== user.id) {
    return NextResponse.json({ error: "Order not found." }, { status: 404 });
  }

  // 3. Flip to paid, guarded on payment_status = 'pending'. If the webhook
  //    already marked it paid, this simply matches no rows — the payment is
  //    still verified and we fall through to success. This conditional update
  //    is the idempotency: 'paid' is written at most once, whichever path
  //    (this route or the webhook) gets there first.
  if (order.payment_status === "pending") {
    const { error: updateError } = await supabase
      .from("orders")
      .update({ payment_status: "paid", razorpay_payment_id: paymentId })
      .eq("razorpay_order_id", orderId)
      .eq("payment_status", "pending");

    if (updateError) {
      return NextResponse.json({ error: "Could not confirm your payment. Please contact support." }, { status: 500 });
    }
  }

  // 4. Return the values the client needs for the success page. Read the
  //    username from the linked placeholder profile rather than trusting the
  //    client to echo it back.
  const { data: profile } = await supabase
    .from("profiles")
    .select("username")
    .eq("order_id", order.id)
    .maybeSingle();

  return NextResponse.json({ orderNumber: order.order_number, username: profile?.username ?? null });
}
