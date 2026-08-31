/* CSRF defense for authenticated, cookie-session-based state-changing routes
   (audit #06 — order/checkout, profile-update, admin). A cross-site form or
   fetch() call attaches the session cookie automatically, but can't forge
   this check: browsers set Origin/Referer themselves and scripts can't
   override them.

   Deliberately compared against the request's own Host header, not a
   configured domain list — NEXT_PUBLIC_APP_URL is "https://unitouch.in",
   but the site actually serves from "https://www.unitouch.in" (unitouch.in
   redirects there), so allow-listing the env var literally would reject
   real production traffic. Same-origin-to-itself needs no configuration and
   is correct across prod, previews, and localhost automatically.

   Paired with Supabase's SameSite=Lax session cookies (the @supabase/ssr
   default — not overridden here since Strict would break the OTP sign-in
   redirect), which already keeps the cookie from riding along on a
   cross-site POST in the first place; this is defense-in-depth on top of
   that.

   Do NOT use this on the Razorpay webhook route — that's a server-to-server
   call from Razorpay with no browser Origin at all, verified by HMAC
   signature instead. */
export function verifyOrigin(request: Request): boolean {
  const claimed = request.headers.get("origin") ?? originFromReferer(request.headers.get("referer"));
  if (!claimed) return false;

  const host = request.headers.get("host");
  if (!host) return false;
  const proto = request.headers.get("x-forwarded-proto") ?? new URL(request.url).protocol.replace(":", "");

  return claimed === `${proto}://${host}`;
}

function originFromReferer(referer: string | null): string | null {
  if (!referer) return null;
  try {
    return new URL(referer).origin;
  } catch {
    return null;
  }
}
