import { NextResponse, after } from "next/server";
import { sendOrderConfirmation } from "@/lib/email";
import { createServiceRoleClient } from "@/lib/supabase/server";
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
   first, so the update is written to be idempotent (see below).

   Checkout is guest-only, so there's no session to check here. The HMAC is
   the authorization: only Razorpay's checkout can produce a valid signature
   for this razorpay_order_id + payment_id pair, and the flip it allows is the
   true one (that order really was paid). */
export async function POST(request: Request) {
  if (!verifyOrigin(request)) {
    return NextResponse.json({ error: "Invalid request origin." }, { status: 403 });
  }

  const limited = await rateLimitOrResponse(checkoutLimiter, clientIp(request));
  if (limited) return limited;

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
  //    exists on our side.
  const { data: order, error: orderError } = await supabase
    .from("orders")
    .select("id, order_number, payment_status")
    .eq("razorpay_order_id", orderId)
    .maybeSingle();

  if (orderError) {
    return NextResponse.json({ error: "Could not verify your payment. Please contact support." }, { status: 500 });
  }
  if (!order) {
    return NextResponse.json({ error: "Order not found." }, { status: 404 });
  }

  // 3. Flip to paid, guarded on payment_status = 'pending'. If the webhook
  //    already marked it paid, this simply matches no rows — the payment is
  //    still verified and we fall through to success. This conditional update
  //    is the idempotency: 'paid' is written at most once, whichever path
  //    (this route or the webhook) gets there first.
  if (order.payment_status === "pending") {
    const { data: flipped, error: updateError } = await supabase
      .from("orders")
      .update({ payment_status: "paid", razorpay_payment_id: paymentId })
      .eq("razorpay_order_id", orderId)
      .eq("payment_status", "pending")
      .select("id");

    if (updateError) {
      return NextResponse.json({ error: "Could not confirm your payment. Please contact support." }, { status: 500 });
    }
    // Only the path that actually flipped pending -> paid sends the
    // confirmation, so it goes out once. after() runs it once the response
    // is sent, so email can't slow down or fail the payment.
    if (flipped?.length) after(() => sendOrderConfirmation(order.id));
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
