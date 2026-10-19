import { NextResponse } from "next/server";
import { verifyOrigin } from "@/lib/csrf";
import { clientIp, emailCheckLimiter, rateLimitOrResponse } from "@/lib/rate-limit";
import { checkEmailDomain, EMAIL_DOMAIN_ERROR } from "@/lib/email-domain";

/* Early "does this email's domain take mail?" check for the checkout email
   field (on blur) and /login (before requesting a code). UX only: checkout
   re-checks in create-order, and login codes go from the browser straight
   to Supabase, so this can't be the enforcement point there.

   Always answers ok unless DNS definitively says the domain can't receive
   mail (see lib/email-domain.ts). */
export async function POST(request: Request) {
  if (!verifyOrigin(request)) {
    return NextResponse.json({ error: "Invalid request origin." }, { status: 403 });
  }

  const limited = await rateLimitOrResponse(emailCheckLimiter, clientIp(request));
  if (limited) return limited;

  const json = await request.json().catch(() => null);
  const email = typeof json?.email === "string" ? json.email.trim().toLowerCase() : "";
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) || email.length > 254) {
    return NextResponse.json({ error: "Invalid email" }, { status: 400 });
  }

  if ((await checkEmailDomain(email)) === "no_mail") {
    return NextResponse.json({ ok: false, error: EMAIL_DOMAIN_ERROR });
  }
  return NextResponse.json({ ok: true });
}
