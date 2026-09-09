import { NextResponse } from "next/server";
import { createServiceRoleClient } from "@/lib/supabase/server";
import { verifyWebhookSignature } from "@/lib/razorpay/verify";

/* Razorpay webhook (audit #01 — real payment flow).

   The independent, authoritative payment path: Razorpay calls this
   server-to-server whenever a payment is captured or fails, so an order still
   gets activated even if the customer closes the tab before the interactive
   /verify call runs.

   Trust model — deliberately different from the browser-facing routes:
     - NO CSRF check. There's no browser Origin on a server-to-server call;
       the X-Razorpay-Signature HMAC over the raw body is the authentication.
     - NO rate limit. Razorpay is the only legitimate caller and it retries
       failed deliveries; throttling by IP would just drop real webhooks.
     - NO auth session. The order is located by its globally-unique
       razorpay_order_id, not a logged-in user.

   The raw request body must be read verbatim (request.text()) — the signature
   is computed over those exact bytes, so parsing to JSON and re-serializing
   would break verification. */
export async function POST(request: Request) {
  const rawBody = await request.text();
  const signature = request.headers.get("x-razorpay-signature");

  // 1. Authenticate the call. A missing secret is a server misconfiguration
  //    (500, so Razorpay retries later); a bad/absent signature is a rejected
  //    caller (400).
  let valid: boolean;
  try {
    valid = verifyWebhookSignature(rawBody, signature);
  } catch {
    return NextResponse.json({ error: "Webhook not configured." }, { status: 500 });
  }
  if (!valid) {
    return NextResponse.json({ error: "Invalid signature." }, { status: 400 });
  }

  // 2. Only now parse the (verified) body.
  let event: {
    event?: string;
    payload?: { payment?: { entity?: { id?: string; order_id?: string } } };
  };
  try {
    event = JSON.parse(rawBody);
  } catch {
    return NextResponse.json({ error: "Malformed payload." }, { status: 400 });
  }

  const eventType = event.event;
  const payment = event.payload?.payment?.entity;
  const orderId = payment?.order_id;
  const paymentId = payment?.id;

  // Events we don't handle (or that carry no order) are acknowledged with 200
  // so Razorpay stops redelivering them — there's nothing for us to do.
  if ((eventType !== "payment.captured" && eventType !== "payment.failed") || !orderId) {
    return NextResponse.json({ received: true });
  }

  const supabase = createServiceRoleClient();

  if (eventType === "payment.captured") {
    // Idempotent activation: flip to paid only while still pending, so a
    // redelivered event — or the /verify route having already run — matches no
    // rows instead of writing 'paid' twice.
    const { error } = await supabase
      .from("orders")
      .update({ payment_status: "paid", razorpay_payment_id: paymentId })
      .eq("razorpay_order_id", orderId)
      .eq("payment_status", "pending");

    // A DB error returns 500 so Razorpay retries the delivery later.
    if (error) {
      return NextResponse.json({ error: "Could not process webhook." }, { status: 500 });
    }
  } else {
    // payment.failed — mark failed only while still pending. Guarding on
    // 'pending' means a late failure event can never clobber an order that was
    // already captured and paid.
    const { error } = await supabase
      .from("orders")
      .update({ payment_status: "failed", razorpay_payment_id: paymentId })
      .eq("razorpay_order_id", orderId)
      .eq("payment_status", "pending");

    if (error) {
      return NextResponse.json({ error: "Could not process webhook." }, { status: 500 });
    }
  }

  return NextResponse.json({ received: true });
}
