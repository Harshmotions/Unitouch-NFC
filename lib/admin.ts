import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import type { User } from "@supabase/supabase-js";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { BUSINESS } from "@/lib/business";
import { ADMIN_2FA_COOKIE, readToken } from "@/lib/admin-session";

/* Admin access: ONE shared account (BUSINESS.adminEmail) that the team signs
   into with the shared password AND a one-time code emailed to that inbox.

   Both factors are enforced: the Supabase session (created by verifying the
   code) must belong to the admin email, and the signed 2FA cookie (only
   issued after the password step, see lib/admin-session.ts and
   /api/admin/auth/*) must be present and bound to that same user. A customer
   session, or the admin email signed in through the normal customer /login
   (code only, no password), does not pass. */

export function isAdminEmail(email: string | null | undefined): boolean {
  return Boolean(email) && email!.trim().toLowerCase() === BUSINESS.adminEmail;
}

/* The signed-in admin, or null. For API routes and anywhere a redirect is
   wrong. */
export async function getAdminUser(): Promise<User | null> {
  const supabase = await createServerSupabaseClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user || !isAdminEmail(user.email)) return null;

  const proof = readToken((await cookies()).get(ADMIN_2FA_COOKIE)?.value);
  if (!proof || proof.uid !== user.id) return null;
  return user;
}

/* Gate for every protected /admin page: anything short of a full two-factor
   admin login goes to /admin/login. Customer sessions are left alone. */
export async function requireAdmin(): Promise<User> {
  const user = await getAdminUser();
  if (!user) redirect("/admin/login");
  return user;
}
