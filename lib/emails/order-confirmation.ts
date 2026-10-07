/* Order confirmation email: subject, HTML, and plain-text bodies.

   Pure on purpose (no imports, no I/O) so it can be rendered and previewed
   on its own; lib/email.ts loads the order and passes everything in.

   Email clients ignore <style> blocks and most modern CSS, so the layout is
   tables with inline styles, light background (dark-mode clients invert it
   themselves). Every customer-supplied value goes through esc(). */

export interface OrderConfirmationData {
  orderNumber: string;
  fullName: string;
  email: string;
  phone: string;
  cardName: string;
  quantity: number;
  amountPaise: number;
  shippingAddress: { line1: string; line2?: string; city: string; state: string; pincode: string };
  username: string | null;
  siteUrl: string;
  business: { legalName: string; email: string; phoneDisplay: string; addressLines: readonly string[] };
}

function esc(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

function rupees(paise: number): string {
  return `₹${(paise / 100).toLocaleString("en-IN", { maximumFractionDigits: 2 })}`;
}

export function renderOrderConfirmation(d: OrderConfirmationData) {
  const firstName = d.fullName.trim().split(/\s+/)[0] || "there";
  const total = rupees(d.amountPaise);
  const host = d.siteUrl.replace(/^https?:\/\//, "").replace(/\/$/, "");
  const profileUrl = d.username ? `${d.siteUrl}/u/${d.username}` : null;
  const loginUrl = `${d.siteUrl}/login`;
  const addressLines = [
    d.shippingAddress.line1,
    d.shippingAddress.line2,
    `${d.shippingAddress.city}, ${d.shippingAddress.state} ${d.shippingAddress.pincode}`,
  ].filter((l): l is string => Boolean(l && l.trim()));

  const subject = `Your Unitouch order ${d.orderNumber} is confirmed`;

  const muted = "color:#6b6b6b";
  const row = (label: string, value: string, bold = false) => `
              <tr>
                <td style="padding:6px 0;font-size:14px;${muted}">${label}</td>
                <td style="padding:6px 0;font-size:14px;text-align:right;color:#111111;${bold ? "font-weight:600;" : ""}">${value}</td>
              </tr>`;
  const step = (n: number, title: string, body: string) => `
              <tr>
                <td style="vertical-align:top;padding:0 12px 16px 0;width:28px">
                  <div style="width:24px;height:24px;border-radius:12px;background:#111111;color:#ffffff;font-size:12px;font-weight:600;line-height:24px;text-align:center">${n}</div>
                </td>
                <td style="vertical-align:top;padding:0 0 16px 0;font-size:14px;line-height:1.5;color:#333333">
                  <strong style="color:#111111">${title}</strong><br>${body}
                </td>
              </tr>`;

  const html = `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<title>${esc(subject)}</title>
</head>
<body style="margin:0;padding:0;background:#f4f4f5;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif">
  <div style="display:none;max-height:0;overflow:hidden">Payment received for ${esc(d.orderNumber)}. Here's what happens next.</div>
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#f4f4f5;padding:24px 12px">
    <tr>
      <td align="center">
        <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:560px">
          <tr>
            <td style="padding:8px 4px 20px">
              <img src="${d.siteUrl}/icon.png" width="40" height="40" alt="Unitouch" style="display:inline-block;vertical-align:middle;border-radius:10px">
              <span style="display:inline-block;vertical-align:middle;margin-left:10px;font-size:18px;font-weight:600;color:#111111">Unitouch</span>
            </td>
          </tr>
          <tr>
            <td style="background:#ffffff;border-radius:16px;padding:32px 28px">
              <h1 style="margin:0 0 8px;font-size:22px;line-height:1.3;color:#111111">Your order is confirmed</h1>
              <p style="margin:0 0 24px;font-size:15px;line-height:1.6;color:#333333">
                Hi ${esc(firstName)}, thanks for ordering with Unitouch. We've received your payment and your card is now in our queue.
              </p>

              <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="border-top:1px solid #ececec;border-bottom:1px solid #ececec;padding:10px 0;margin-bottom:24px">${row("Order number", esc(d.orderNumber), true)}${row("Card", `${esc(d.cardName)} &times; ${d.quantity}`)}${row("Shipping", "Free")}${row("Total paid", total, true)}
              </table>

              <p style="margin:0 0 6px;font-size:13px;font-weight:600;text-transform:uppercase;letter-spacing:0.04em;${muted}">Shipping to</p>
              <p style="margin:0 0 24px;font-size:14px;line-height:1.6;color:#111111">
                ${esc(d.fullName)}<br>${addressLines.map(esc).join("<br>")}<br>${esc(d.phone)}
              </p>
${
  profileUrl
    ? `
              <p style="margin:0 0 6px;font-size:13px;font-weight:600;text-transform:uppercase;letter-spacing:0.04em;${muted}">Your profile link</p>
              <p style="margin:0 0 24px;font-size:15px;color:#111111"><strong>${esc(host)}/u/${esc(d.username ?? "")}</strong><br><span style="font-size:13px;${muted}">It goes live once you set it up and publish it.</span></p>
`
    : ""
}
              <p style="margin:0 0 14px;font-size:13px;font-weight:600;text-transform:uppercase;letter-spacing:0.04em;${muted}">What happens next</p>
              <table role="presentation" width="100%" cellpadding="0" cellspacing="0">${step(
                1,
                "Set up your profile",
                `Sign in at ${esc(host)}/login with <strong>${esc(d.email)}</strong>. We'll email you a one-time code, no password needed. Then add your details and links and publish your page.`,
              )}${step(2, "We design your card", "Our team prepares your card design, usually within 24 to 48 hours.")}${step(
                3,
                "We print and ship it",
                "Your order is typically dispatched within 3 to 5 business days and delivered within 5 to 7 days. We'll share tracking details when it ships.",
              )}
              </table>

              <table role="presentation" cellpadding="0" cellspacing="0" style="margin:8px 0 4px">
                <tr>
                  <td style="background:#111111;border-radius:10px">
                    <a href="${loginUrl}" style="display:inline-block;padding:12px 22px;font-size:14px;font-weight:600;color:#ffffff;text-decoration:none">Set up your profile</a>
                  </td>
                </tr>
              </table>
            </td>
          </tr>
          <tr>
            <td style="padding:20px 8px;font-size:12px;line-height:1.6;text-align:center;${muted}">
              Questions about your order? Reply to this email, write to
              <a href="mailto:${d.business.email}" style="color:#6b6b6b">${d.business.email}</a>,
              or call ${esc(d.business.phoneDisplay)}.<br><br>
              ${esc(d.business.legalName)} &middot; ${d.business.addressLines.map(esc).join(", ")}<br>
              <a href="${d.siteUrl}/refunds" style="color:#6b6b6b">Cancellation and Refund Policy</a> &middot;
              <a href="${d.siteUrl}/shipping" style="color:#6b6b6b">Shipping Policy</a>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;

  const text = [
    `Hi ${firstName}, thanks for ordering with Unitouch.`,
    `We've received your payment and your card is now in our queue.`,
    ``,
    `Order number: ${d.orderNumber}`,
    `Card: ${d.cardName} x ${d.quantity}`,
    `Shipping: Free`,
    `Total paid: ${total}`,
    ``,
    `Shipping to:`,
    d.fullName,
    ...addressLines,
    d.phone,
    ...(profileUrl ? [``, `Your profile link: ${host}/u/${d.username} (goes live once you set it up and publish it)`] : []),
    ``,
    `What happens next`,
    `1. Set up your profile: sign in at ${loginUrl} with ${d.email}. We'll email you a one-time code, no password needed.`,
    `2. We design your card, usually within 24 to 48 hours.`,
    `3. We print and ship it. Dispatched within 3 to 5 business days, delivered within 5 to 7 days. Tracking details follow when it ships.`,
    ``,
    `Questions? Reply to this email, write to ${d.business.email}, or call ${d.business.phoneDisplay}.`,
    `${d.business.legalName}, ${d.business.addressLines.join(", ")}`,
  ].join("\n");

  return { subject, html, text };
}
