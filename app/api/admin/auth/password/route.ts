import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { createClient } from "@supabase/supabase-js";
import { verifyOrigin } from "@/lib/csrf";
import { adminLoginLimiter, clientIp, rateLimitOrResponse } from "@/lib/rate-limit";
import { isAdminEmail } from "@/lib/admin";
import { ADMIN_PASSWORD_COOKIE, PASSWORD_PROOF_TTL_SECONDS, cookieOptions, issueToken } from "@/lib/admin-session";

/* Admin login, factor 1: the shared password.

   Checks email + password against Supabase Auth using a throwaway,
   non-persisting client (no session is kept from this step), then emails a
   one-time code to the admin inbox and sets a short-lived signed proof
   cookie. Factor 2 happens in the browser (verifyOtp) followed by
   /api/admin/auth/complete. Wrong email and wrong password get the same
   answer so the endpoint doesn't confirm which part was wrong. */
const GENERIC_ERROR = "Incorrect email or password.";

export async function POST(request: Request) {
  if (!verifyOrigin(request)) {
    return NextResponse.json({ error: "Invalid request origin." }, { status: 403 });
  }
  const limited = await rateLimitOrResponse(adminLoginLimiter, clientIp(request));
  if (limited) return limited;

  const body = await request.json().catch(() => null);
  const email = typeof body?.email === "string" ? body.email.trim().toLowerCase() : "";
  const password = typeof body?.password === "string" ? body.password : "";
  if (!email || !password || !isAdminEmail(email)) {
    return NextResponse.json({ error: GENERIC_ERROR }, { status: 401 });
  }

  const auth = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!, {
    auth: { persistSession: false, autoRefreshToken: false },
  }).auth;

  const { error: pwError } = await auth.signInWithPassword({ email, password });
  if (pwError) {
    return NextResponse.json({ error: GENERIC_ERROR }, { status: 401 });
  }
  // Drop only this temporary session; "local" leaves the other admins'
  // existing sessions untouched (the default would revoke all of them).
  await auth.signOut({ scope: "local" });

  const { error: otpError } = await auth.signInWithOtp({ email, options: { shouldCreateUser: false } });
  if (otpError) {
    console.error("Admin OTP send failed", otpError);
    return NextResponse.json(
      { error: "Password accepted, but we couldn't send the code. Wait a minute and try again." },
      { status: 502 },
    );
  }

  (await cookies()).set(
    ADMIN_PASSWORD_COOKIE,
    issueToken({ email }, PASSWORD_PROOF_TTL_SECONDS),
    cookieOptions(PASSWORD_PROOF_TTL_SECONDS),
  );
  return NextResponse.json({ ok: true });
}
