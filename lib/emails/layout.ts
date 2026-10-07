/* Shared shell for transactional emails (tables + inline styles, light
   background; see order-confirmation.ts for why). Pure, no imports. */

export function esc(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

export function rupees(paise: number): string {
  return `₹${(paise / 100).toLocaleString("en-IN", { maximumFractionDigits: 2 })}`;
}

export interface EmailBusiness {
  legalName: string;
  email: string;
  phoneDisplay: string;
  addressLines: readonly string[];
}

/* Label/value rows; values are inserted as-is, so escape them first. */
export function detailRows(rows: [label: string, valueHtml: string][]): string {
  return `<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="border-top:1px solid #ececec;border-bottom:1px solid #ececec;padding:10px 0;margin-bottom:24px">${rows
    .map(
      ([label, value]) => `
  <tr>
    <td style="padding:6px 12px 6px 0;font-size:14px;color:#6b6b6b;vertical-align:top;white-space:nowrap">${label}</td>
    <td style="padding:6px 0;font-size:14px;text-align:right;color:#111111">${value}</td>
  </tr>`,
    )
    .join("")}
</table>`;
}

export function renderLayout(opts: {
  title: string;
  preheader: string;
  heading: string;
  bodyHtml: string;
  cta?: { label: string; href: string };
  siteUrl: string;
  business: EmailBusiness;
  /* Internal emails (to the Unitouch team) skip the customer footer. */
  internal?: boolean;
}): string {
  const { title, preheader, heading, bodyHtml, cta, siteUrl, business, internal } = opts;
  const footer = internal
    ? `Sent by the Unitouch website to the admin inbox.`
    : `Questions? Reply to this email, write to <a href="mailto:${business.email}" style="color:#6b6b6b">${business.email}</a>, or call ${esc(business.phoneDisplay)}.<br><br>
              ${esc(business.legalName)} &middot; ${business.addressLines.map(esc).join(", ")}`;

  return `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<title>${esc(title)}</title>
</head>
<body style="margin:0;padding:0;background:#f4f4f5;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif">
  <div style="display:none;max-height:0;overflow:hidden">${esc(preheader)}</div>
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#f4f4f5;padding:24px 12px">
    <tr>
      <td align="center">
        <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:560px">
          <tr>
            <td style="padding:8px 4px 20px">
              <img src="${siteUrl}/icon.png" width="40" height="40" alt="Unitouch" style="display:inline-block;vertical-align:middle;border-radius:10px">
              <span style="display:inline-block;vertical-align:middle;margin-left:10px;font-size:18px;font-weight:600;color:#111111">Unitouch</span>
            </td>
          </tr>
          <tr>
            <td style="background:#ffffff;border-radius:16px;padding:32px 28px">
              <h1 style="margin:0 0 16px;font-size:22px;line-height:1.3;color:#111111">${esc(heading)}</h1>
              ${bodyHtml}
              ${
                cta
                  ? `<table role="presentation" cellpadding="0" cellspacing="0" style="margin:8px 0 4px">
                <tr>
                  <td style="background:#111111;border-radius:10px">
                    <a href="${cta.href}" style="display:inline-block;padding:12px 22px;font-size:14px;font-weight:600;color:#ffffff;text-decoration:none">${esc(cta.label)}</a>
                  </td>
                </tr>
              </table>`
                  : ""
              }
            </td>
          </tr>
          <tr>
            <td style="padding:20px 8px;font-size:12px;line-height:1.6;text-align:center;color:#6b6b6b">
              ${footer}
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;
}

export const p = (html: string) =>
  `<p style="margin:0 0 16px;font-size:15px;line-height:1.6;color:#333333">${html}</p>`;
