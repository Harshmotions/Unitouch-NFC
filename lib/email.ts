import { Resend } from "resend";
import { createServiceRoleClient } from "@/lib/supabase/server";
import { BUSINESS } from "@/lib/business";
import { CARD_VARIANTS } from "@/lib/pricing";
import { renderOrderConfirmation } from "@/lib/emails/order-confirmation";
import {
  renderDraftReminder,
  renderEmailProblemAlert,
  renderLatePaymentAlert,
  renderNewOrderAlert,
  renderOrderShipped,
  type OrderSummary,
} from "@/lib/emails/admin-and-shipping";

/* Transactional email via Resend.

   Needs RESEND_API_KEY, and the sending domain (unitouch.in) verified in the
   Resend dashboard. Without a key every send is skipped with a warning
   rather than failing: email must never break the payment flow. The From
   address can be overridden with EMAIL_FROM.

   Every exported sender is safe to run from after(): it never throws. */

let client: Resend | null | undefined;

function getResend(): Resend | null {
  if (client === undefined) {
    const key = process.env.RESEND_API_KEY;
    client = key ? new Resend(key) : null;
  }
  return client;
}

const FROM = process.env.EMAIL_FROM || "Unitouch <orders@unitouch.in>";
const COMMON = { siteUrl: BUSINESS.siteUrl, business: BUSINESS };

async function send(msg: {
  to: string;
  subject: string;
  html: string;
  text: string;
  idempotencyKey: string;
  replyTo?: string;
}): Promise<void> {
  const resend = getResend();
  if (!resend) {
    console.warn(`RESEND_API_KEY is not set; skipping email "${msg.subject}".`);
    return;
  }
  const { error } = await resend.emails.send(
    { from: FROM, to: msg.to, replyTo: msg.replyTo ?? BUSINESS.email, subject: msg.subject, html: msg.html, text: msg.text },
    { idempotencyKey: msg.idempotencyKey },
  );
  if (error) console.error(`Email failed: "${msg.subject}"`, error);
}

type OrderRow = {
  id: string;
  order_number: string;
  full_name: string;
  email: string;
  phone: string;
  card_type: string;
  quantity: number;
  shipping_address: OrderSummary["shippingAddress"];
  amount: number;
  payment_status: string;
  additional_notes: string | null;
  tracking_number: string | null;
};

async function loadOrder(orderId: string): Promise<{ order: OrderRow; summary: OrderSummary } | null> {
  const supabase = createServiceRoleClient();
  const { data: order, error } = await supabase
    .from("orders")
    .select(
      "id, order_number, full_name, email, phone, card_type, quantity, shipping_address, amount, payment_status, additional_notes, tracking_number",
    )
    .eq("id", orderId)
    .maybeSingle<OrderRow>();
  if (error || !order) {
    console.error("Email: order not found", orderId, error);
    return null;
  }
  const { data: profile } = await supabase
    .from("profiles")
    .select("username, profile_style")
    .eq("order_id", orderId)
    .maybeSingle();

  const summary: OrderSummary = {
    id: order.id,
    orderNumber: order.order_number,
    fullName: order.full_name,
    email: order.email,
    phone: order.phone,
    cardName: CARD_VARIANTS.find((v) => v.id === order.card_type)?.name ?? order.card_type,
    quantity: order.quantity,
    amountPaise: order.amount,
    shippingAddress: order.shipping_address,
    additionalNotes: order.additional_notes,
    username: (profile?.username as string | undefined) ?? null,
    accountType: profile?.profile_style === "standard" ? "Business" : profile ? "Personal" : null,
  };
  return { order, summary };
}

/* Sent once an order flips pending -> paid. Call it only from the code path
   that actually did the flip (/razorpay/verify or the payment.captured
   webhook, whichever wins) so it goes out once; idempotency keys guard
   against a duplicate within 24h. Sends:
     - the order confirmation to the customer
     - the new-order alert to the admin inbox */
export async function sendOrderPaidEmails(orderId: string): Promise<void> {
  try {
    const loaded = await loadOrder(orderId);
    if (!loaded || loaded.order.payment_status !== "paid") return;
    const { order, summary } = loaded;

    const confirmation = renderOrderConfirmation({
      orderNumber: summary.orderNumber,
      fullName: summary.fullName,
      email: summary.email,
      phone: summary.phone,
      cardName: summary.cardName,
      quantity: summary.quantity,
      amountPaise: summary.amountPaise,
      shippingAddress: summary.shippingAddress,
      username: summary.username,
      siteUrl: BUSINESS.siteUrl,
      business: BUSINESS,
    });
    const alert = renderNewOrderAlert(summary, COMMON);

    await Promise.all([
      send({ to: order.email, ...confirmation, idempotencyKey: `order-confirmation/${order.order_number}` }),
      send({
        to: BUSINESS.adminEmail,
        ...alert,
        replyTo: order.email,
        idempotencyKey: `new-order-alert/${order.order_number}`,
      }),
    ]);
  } catch (err) {
    console.error("sendOrderPaidEmails threw", orderId, err);
  }
}

/* "Your card has shipped", sent when an admin moves an order to shipped. */
export async function sendShippedEmail(orderId: string): Promise<void> {
  try {
    const loaded = await loadOrder(orderId);
    if (!loaded) return;
    const { order, summary } = loaded;
    const msg = renderOrderShipped({ ...summary, trackingNumber: order.tracking_number }, COMMON);
    // Keyed on the tracking value too, so correcting a typo and re-saving
    // sends the corrected email instead of being swallowed as a duplicate.
    await send({
      to: order.email,
      ...msg,
      idempotencyKey: `order-shipped/${order.order_number}/${order.tracking_number ?? "none"}`,
    });
  } catch (err) {
    console.error("sendShippedEmail threw", orderId, err);
  }
}

/* A payment arrived for a checkout that was already released (see
   lib/reservations.ts); tell the admin inbox whether the auto-refund worked. */
export async function sendLatePaymentAlert(d: {
  razorpayOrderId: string;
  paymentId: string;
  refunded: boolean;
  refundError?: string;
}): Promise<void> {
  try {
    const msg = renderLatePaymentAlert(d, COMMON);
    await send({ to: BUSINESS.adminEmail, ...msg, idempotencyKey: `late-payment/${d.paymentId}` });
  } catch (err) {
    console.error("sendLatePaymentAlert threw", d.paymentId, err);
  }
}

/* A customer email bounced or was marked as spam; tell the admin inbox which
   orders are affected (lib/email-bounces.ts, from the Resend webhook). Keyed
   on Resend's email id so a retried webhook doesn't alert twice. */
export async function sendEmailProblemAlert(d: {
  emailId: string;
  kind: "bounced" | "complained";
  recipient: string;
  emailSubject: string;
  reason?: string;
  orders: { id: string; orderNumber: string; fullName: string; phone: string }[];
}): Promise<void> {
  try {
    const msg = renderEmailProblemAlert(d, COMMON);
    await send({ to: BUSINESS.adminEmail, ...msg, idempotencyKey: `email-${d.kind}/${d.emailId}/${d.recipient}` });
  } catch (err) {
    console.error("sendEmailProblemAlert threw", d.emailId, err);
  }
}

/* "Your profile isn't live yet" (lib/draft-reminders.ts decides when). */
export async function sendDraftReminder(d: {
  profileId: string;
  username: string;
  fullName: string;
  email: string;
  reminderNumber: number;
}): Promise<void> {
  try {
    const msg = renderDraftReminder(d, COMMON);
    await send({ to: d.email, ...msg, idempotencyKey: `draft-reminder/${d.profileId}/${d.reminderNumber}` });
  } catch (err) {
    console.error("sendDraftReminder threw", d.profileId, err);
  }
}
