import { redirect } from "next/navigation";
import { createServerSupabaseClient } from "@/lib/supabase/server";

function adminEmails(): string[] {
  return (process.env.ADMIN_EMAILS ?? "")
    .split(",")
    .map((e) => e.trim().toLowerCase())
    .filter(Boolean);
}

export function isAdminEmail(email: string | null | undefined): boolean {
  if (!email) return false;
  return adminEmails().includes(email.trim().toLowerCase());
}

/* Gate for every /admin page. Signs out and redirects to /admin/login when
   there's no session, or when there is one but it isn't an allow-listed
   admin — the latter case would otherwise leave a non-admin's real customer
   session sitting active while stuck bouncing off the admin area. */
export async function requireAdmin() {
  const supabase = await createServerSupabaseClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/admin/login");
  }
  if (!isAdminEmail(user.email)) {
    await supabase.auth.signOut();
    redirect("/admin/login?error=unauthorized");
  }

  return user;
}
