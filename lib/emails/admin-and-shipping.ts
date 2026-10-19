import { detailRows, esc, p, renderLayout, rupees, type EmailBusiness } from "@/lib/emails/layout";

/* The other transactional emails: new-order, late-payment and email-problem
   (bounce/spam) alerts (to the admin inbox), "your card has shipped" and the "your profile isn't
   live yet" draft reminder (to the customer).
   Pure render functions; lib/email.ts loads data and sends. */

interface Common {
  siteUrl: string;
  business: EmailBusiness;
}

export interface OrderSummary {
  id: string;
  orderNumber: string;
  fullName: string;
  email: string;
  phone: string;
  cardName: string;
  quantity: number;
  amountPaise: number;
  shippingAddress: { line1: string; line2?: string; city: string; state: string; pincode: string };
  additionalNotes: string | null;
  username: string | null;
  accountType: string | null;
}

function addressLines(a: OrderSummary["shippingAddress"]): string[] {
  return [a.line1, a.line2, `${a.city}, ${a.state} ${a.pincode}`].filter((l): l is string => Boolean(l && l.trim()));
}

export function renderNewOrderAlert(o: OrderSummary, c: Common) {
  const subject = `New order ${o.orderNumber}: ${o.cardName} x ${o.quantity}, ${rupees(o.amountPaise)}`;
  const adminUrl = `${c.siteUrl}/admin/orders/${o.id}`;
  const rows = detailRows([
    ["Order", esc(o.orderNumber)],
    ["Card", `${esc(o.cardName)} &times; ${o.quantity}`],
    ["Paid", `<strong>${rupees(o.amountPaise)}</strong>`],
    ["Customer", esc(o.fullName)],
    ["Email", esc(o.email)],
    ["Phone", esc(o.phone)],
    ["Ship to", addressLines(o.shippingAddress).map(esc).join("<br>")],
    ["Profile link", o.username ? `${esc(c.siteUrl.replace(/^https?:\/\//, ""))}/u/${esc(o.username)}` : "-"],
    ...(o.accountType ? ([["Account", esc(o.accountType)]] as [string, string][]) : []),
    ...(o.additionalNotes ? ([["Notes", esc(o.additionalNotes)]] as [string, string][]) : []),
  ]);
  const html = renderLayout({
    title: subject,
    preheader: `${o.fullName} paid ${rupees(o.amountPaise)}. Open the order in admin.`,
    heading: "New paid order",
    bodyHtml: p(`A new order has been paid and is ready to design.`) + rows,
    cta: { label: "Open in admin", href: adminUrl },
    siteUrl: c.siteUrl,
    business: c.business,
    internal: true,
  });
  const text = [
    `New paid order ${o.orderNumber}`,
    `Card: ${o.cardName} x ${o.quantity}`,
    `Paid: ${rupees(o.amountPaise)}`,
    `Customer: ${o.fullName} <${o.email}>, ${o.phone}`,
    `Ship to: ${addressLines(o.shippingAddress).join(", ")}`,
    o.username ? `Profile link: ${c.siteUrl}/u/${o.username}` : "",
    o.additionalNotes ? `Notes: ${o.additionalNotes}` : "",
    ``,
    `Open in admin: ${adminUrl}`,
  ]
    .filter((l) => l !== "")
    .join("\n");
  return { subject, html, text };
}

export function renderOrderShipped(
  o: Pick<OrderSummary, "orderNumber" | "fullName" | "cardName" | "quantity" | "shippingAddress"> & {
    /* Free text from the admin order page, e.g. "DTDC 7D123456789". */
    trackingNumber: string | null;
  },
  c: Common,
) {
  const firstName = o.fullName.trim().split(/\s+/)[0] || "there";
  const subject = `Your Unitouch card is on its way (${o.orderNumber})`;
  const rows = detailRows([
    ["Order number", `<strong>${esc(o.orderNumber)}</strong>`],
    ["Card", `${esc(o.cardName)} &times; ${o.quantity}`],
    ...(o.trackingNumber ? ([["Tracking", `<strong>${esc(o.trackingNumber)}</strong>`]] as [string, string][]) : []),
    ["Shipping to", addressLines(o.shippingAddress).map(esc).join("<br>")],
  ]);
  const html = renderLayout({
    title: subject,
    preheader: `Order ${o.orderNumber} has shipped${o.trackingNumber ? `. Tracking: ${o.trackingNumber}` : ""}.`,
    heading: "Your card has shipped",
    bodyHtml:
      p(`Hi ${esc(firstName)}, good news: your Unitouch card is on its way. Most deliveries arrive within 1 to 2 business days of dispatch.`) +
      rows +
      p(
        `Once it arrives, tap it on the back of any phone to open your profile. You can keep editing your profile anytime by signing in at ${esc(
          c.siteUrl.replace(/^https?:\/\//, ""),
        )}/login with the email you ordered with.`,
      ),
    cta: { label: "Manage your profile", href: `${c.siteUrl}/login` },
    siteUrl: c.siteUrl,
    business: c.business,
  });
  const text = [
    `Hi ${firstName}, your Unitouch card is on its way.`,
    ``,
    `Order number: ${o.orderNumber}`,
    `Card: ${o.cardName} x ${o.quantity}`,
    o.trackingNumber ? `Tracking: ${o.trackingNumber}` : "",
    `Shipping to: ${addressLines(o.shippingAddress).join(", ")}`,
    ``,
    `Manage your profile anytime: ${c.siteUrl}/login (sign in with the email you ordered with).`,
    ``,
    `Questions? Reply to this email, write to ${c.business.email}, or call ${c.business.phoneDisplay}.`,
  ]
    .filter((l, i, arr) => l !== "" || arr[i - 1] !== "")
    .join("\n");
  return { subject, html, text };
}

export function renderLatePaymentAlert(
  d: { razorpayOrderId: string; paymentId: string; refunded: boolean; refundError?: string },
  c: Common,
) {
  const subject = d.refunded
    ? `Payment auto-refunded for an expired checkout (${d.paymentId})`
    : `ACTION NEEDED: payment for an expired checkout could not be refunded (${d.paymentId})`;
  const body =
    p(
      `A payment arrived for a checkout that had already expired and been released, so there is no order for it in the database.`,
    ) +
    detailRows([
      ["Razorpay order", esc(d.razorpayOrderId)],
      ["Payment", esc(d.paymentId)],
      ["Refund", d.refunded ? "Issued automatically" : `<strong>Failed</strong>${d.refundError ? `: ${esc(d.refundError)}` : ""}`],
    ]) +
    p(
      d.refunded
        ? `No action is needed. The customer will see the refund in 5 to 7 business days. If they contact support, they can place a fresh order.`
        : `Please refund this payment manually from the Razorpay dashboard (Transactions > Payments).`,
    );
  const html = renderLayout({
    title: subject,
    preheader: subject,
    heading: d.refunded ? "Late payment refunded" : "Late payment needs a manual refund",
    bodyHtml: body,
    cta: { label: "Open Razorpay dashboard", href: "https://dashboard.razorpay.com/app/payments" },
    siteUrl: c.siteUrl,
    business: c.business,
    internal: true,
  });
  const text = [
    subject,
    `Razorpay order: ${d.razorpayOrderId}`,
    `Payment: ${d.paymentId}`,
    d.refunded ? `Refund issued automatically.` : `Refund FAILED${d.refundError ? `: ${d.refundError}` : ""}. Refund manually in the Razorpay dashboard.`,
  ].join("\n");
  return { subject, html, text };
}

/* A customer email bounced or was marked as spam (Resend webhook). */
export function renderEmailProblemAlert(
  d: {
    kind: "bounced" | "complained";
    recipient: string;
    emailSubject: string;
    reason?: string;
    orders: { id: string; orderNumber: string; fullName: string; phone: string }[];
  },
  c: Common,
) {
  const what = d.kind === "bounced" ? "could not be delivered" : "was marked as spam by the customer";
  const subject = `Customer email ${d.kind === "bounced" ? "bounced" : "marked as spam"}: ${d.recipient}`;
  const orderLines = d.orders.map((o) => `${o.orderNumber}, ${o.fullName}, phone ${o.phone}`);
  const body =
    p(`An email to a customer ${what}, so they may not have our order details or login codes.`) +
    detailRows([
      ["To", esc(d.recipient)],
      ["Email", esc(d.emailSubject)],
      ...(d.reason ? ([["Reason", esc(d.reason)]] as [string, string][]) : []),
      ["Orders", d.orders.length ? orderLines.map(esc).join("<br>") : "None found for this address"],
    ]) +
    p(
      d.orders.length
        ? `Please contact the customer by phone to confirm their email address.${d.kind === "bounced" ? " The order is flagged in the admin." : ""}`
        : `No order uses this address, so no action may be needed.`,
    );
  const href = d.orders.length === 1 ? `${c.siteUrl}/admin/orders/${d.orders[0].id}` : `${c.siteUrl}/admin/orders`;
  const html = renderLayout({
    title: subject,
    preheader: subject,
    heading: d.kind === "bounced" ? "Customer email bounced" : "Customer marked our email as spam",
    bodyHtml: body,
    cta: { label: "Open in admin", href },
    siteUrl: c.siteUrl,
    business: c.business,
    internal: true,
  });
  const text = [
    subject,
    `Email: ${d.emailSubject}`,
    ...(d.reason ? [`Reason: ${d.reason}`] : []),
    d.orders.length ? `Orders:\n${orderLines.join("\n")}` : "No order uses this address.",
    d.orders.length ? "Please contact the customer by phone to confirm their email address." : "",
  ]
    .filter(Boolean)
    .join("\n");
  return { subject, html, text };
}

export function renderDraftReminder(
  d: { fullName: string; email: string; username: string; reminderNumber: number },
  c: Common,
) {
  const firstName = d.fullName.trim().split(/\s+/)[0] || "there";
  const host = c.siteUrl.replace(/^https?:\/\//, "");
  const subject =
    d.reminderNumber > 1
      ? `Reminder: your Unitouch profile ${host}/u/${d.username} is still a draft`
      : `Your Unitouch profile isn't live yet`;
  const html = renderLayout({
    title: subject,
    preheader: `Finish and publish ${host}/u/${d.username} so your card opens your profile.`,
    heading: "Your profile isn't live yet",
    bodyHtml:
      p(
        `Hi ${esc(firstName)}, your profile <strong>${esc(host)}/u/${esc(d.username)}</strong> is saved as a draft and isn't published yet. Until you publish it, anyone who taps your card sees a "not live yet" page instead of your details.`,
      ) +
      p(
        `It only takes a few minutes: sign in with <strong>${esc(d.email)}</strong> (we'll email you a one-time code, no password needed), add your details and links, then tap <strong>Publish profile</strong>.`,
      ) +
      p(`Already ordered more than one card? They're all under the same sign-in, so you can switch between profiles there.`),
    cta: { label: "Finish my profile", href: `${c.siteUrl}/login` },
    siteUrl: c.siteUrl,
    business: c.business,
  });
  const text = [
    `Hi ${firstName}, your profile ${host}/u/${d.username} is saved as a draft and isn't published yet.`,
    `Until you publish it, anyone who taps your card sees a "not live yet" page.`,
    ``,
    `Sign in at ${c.siteUrl}/login with ${d.email} (one-time code, no password), add your details, then tap Publish profile.`,
    ``,
    `Questions? Reply to this email, write to ${c.business.email}, or call ${c.business.phoneDisplay}.`,
  ].join("\n");
  return { subject, html, text };
}
