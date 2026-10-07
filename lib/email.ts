import { Resend } from "resend";
import { createServiceRoleClient } from "@/lib/supabase/server";
import { BUSINESS } from "@/lib/business";
import { CARD_VARIANTS } from "@/lib/pricing";
import { renderOrderConfirmation } from "@/lib/emails/order-confirmation";

/* Transactional email via Resend.

   Needs RESEND_API_KEY, and the sending domain (unitouch.in) verified in the
   Resend dashboard. Without a key every send is skipped with a warning
   rather than failing — email must never break the payment flow. The From
   address can be overridden with EMAIL_FROM. */

let client: Resend | null | undefined;

function getResend(): Resend | null {
  if (client === undefined) {
    const key = process.env.RESEND_API_KEY;
    client = key ? new Resend(key) : null;
  }
  return client;
}

const FROM = process.env.EMAIL_FROM || "Unitouch <orders@unitouch.in>";

/* Sends the "order confirmed" email for a just-paid order.

   Call it only from the code path that actually flipped the order from
   pending to paid (the /razorpay/verify route or the payment.captured
   webhook — whichever wins), so it goes out once. The Resend idempotency key
   is a second guard against a duplicate within 24h.

   Never throws: it's run via after() once the response has been sent, and a
   failure here must not affect the order. */
export async function sendOrderConfirmation(orderId: string): Promise<void> {
  try {
    const resend = getResend();
    if (!resend) {
      console.warn("RESEND_API_KEY is not set; skipping order confirmation email.");
      return;
    }

    const supabase = createServiceRoleClient();
    const { data: order, error } = await supabase
      .from("orders")
      .select("order_number, full_name, email, phone, card_type, quantity, shipping_address, amount, payment_status")
      .eq("id", orderId)
      .maybeSingle();
    if (error || !order || order.payment_status !== "paid") {
      console.error("Order confirmation: order not found or not paid", orderId, error);
      return;
    }

    const { data: profile } = await supabase
      .from("profiles")
      .select("username")
      .eq("order_id", orderId)
      .maybeSingle();

    const cardName = CARD_VARIANTS.find((v) => v.id === order.card_type)?.name ?? order.card_type;

    const { subject, html, text } = renderOrderConfirmation({
      orderNumber: order.order_number,
      fullName: order.full_name,
      email: order.email,
      phone: order.phone,
      cardName,
      quantity: order.quantity,
      amountPaise: order.amount,
      shippingAddress: order.shipping_address,
      username: profile?.username ?? null,
      siteUrl: BUSINESS.siteUrl,
      business: BUSINESS,
    });

    const { error: sendError } = await resend.emails.send(
      { from: FROM, to: order.email, replyTo: BUSINESS.email, subject, html, text },
      { idempotencyKey: `order-confirmation/${order.order_number}` },
    );
    if (sendError) {
      console.error("Order confirmation email failed", order.order_number, sendError);
    }
  } catch (err) {
    console.error("Order confirmation email threw", orderId, err);
  }
}
