import { NextResponse } from "next/server";
import { verifyOrigin } from "@/lib/csrf";
import { clientIp, emailCheckLimiter, rateLimitOrResponse } from "@/lib/rate-limit";
import { checkEmailDomain, EMAIL_DOMAIN_ERROR } from "@/lib/email-domain";
import { DISPOSABLE_EMAIL_ERROR, isDisposableEmail } from "@/lib/disposable-email";

/* Early "is this an email the customer can keep using?" check (not a
   throwaway inbox, and the domain takes mail) for the checkout email
   field (on blur) and /login (before requesting a code). UX only: checkout
   re-checks in create-order, and login codes go from the browser straight
   to Supabase, so this can't be the enforcement point there.

   Answers ok unless the domain is on the throwaway list
   (lib/disposable-email.ts) or DNS definitively says it can't receive mail
   (lib/email-domain.ts). */
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

  if (isDisposableEmail(email)) {
    return NextResponse.json({ ok: false, error: DISPOSABLE_EMAIL_ERROR });
  }
  if ((await checkEmailDomain(email)) === "no_mail") {
    return NextResponse.json({ ok: false, error: EMAIL_DOMAIN_ERROR });
  }
  return NextResponse.json({ ok: true });
}
