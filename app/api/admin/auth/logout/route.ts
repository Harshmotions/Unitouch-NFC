import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { verifyOrigin } from "@/lib/csrf";
import { createAdminServerSupabaseClient } from "@/lib/supabase/server";
import { ADMIN_2FA_COOKIE, ADMIN_PASSWORD_COOKIE } from "@/lib/admin-session";

/* Signs this browser out of admin: clears the 2FA cookies and ends this
   device's admin Supabase session only. Other admins stay signed in, and any
   customer session in this browser is untouched. */
export async function POST(request: Request) {
  if (!verifyOrigin(request)) {
    return NextResponse.json({ error: "Invalid request origin." }, { status: 403 });
  }
  const jar = await cookies();
  jar.delete(ADMIN_2FA_COOKIE);
  jar.delete(ADMIN_PASSWORD_COOKIE);
  const supabase = await createAdminServerSupabaseClient();
  await supabase.auth.signOut({ scope: "local" });
  return NextResponse.json({ ok: true });
}
