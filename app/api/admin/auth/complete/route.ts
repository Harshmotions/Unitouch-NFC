import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { verifyOrigin } from "@/lib/csrf";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { isAdminEmail } from "@/lib/admin";
import {
  ADMIN_2FA_COOKIE,
  ADMIN_PASSWORD_COOKIE,
  ADMIN_SESSION_TTL_SECONDS,
  cookieOptions,
  issueToken,
  readToken,
} from "@/lib/admin-session";

/* Admin login, factor 2 completion. Called right after the browser verified
   the emailed code (which created the Supabase session). Requires that
   session to be the admin account AND the password-step proof cookie for the
   same email; only then issues the 12-hour admin 2FA cookie. */
export async function POST(request: Request) {
  if (!verifyOrigin(request)) {
    return NextResponse.json({ error: "Invalid request origin." }, { status: 403 });
  }

  const supabase = await createServerSupabaseClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  const jar = await cookies();
  const proof = readToken(jar.get(ADMIN_PASSWORD_COOKIE)?.value);

  if (!user || !isAdminEmail(user.email) || !proof || proof.email !== user.email?.toLowerCase()) {
    return NextResponse.json(
      { error: "Your sign-in expired. Please enter the password again." },
      { status: 401 },
    );
  }

  jar.delete(ADMIN_PASSWORD_COOKIE);
  jar.set(
    ADMIN_2FA_COOKIE,
    issueToken({ uid: user.id }, ADMIN_SESSION_TTL_SECONDS),
    cookieOptions(ADMIN_SESSION_TTL_SECONDS),
  );
  return NextResponse.json({ ok: true });
}
