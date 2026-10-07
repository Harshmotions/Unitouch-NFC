import { requireAdmin } from "@/lib/admin";
import AdminNav from "@/components/admin/AdminNav";

// Always per-request: these pages read the admin session cookies and live
// data. Never attempt build-time prerendering.
export const dynamic = "force-dynamic";

/* Every page under this route group requires the full two-factor admin
   login (shared password + emailed code, see lib/admin.ts); requireAdmin()
   redirects to /admin/login otherwise. Nothing below this layout needs to
   repeat the check. */
export default async function AdminProtectedLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const user = await requireAdmin();

  return (
    <div className="bg-bg-base min-h-screen">
      <AdminNav email={user.email ?? ""} />
      <div className="mx-auto max-w-5xl px-6 py-10">{children}</div>
    </div>
  );
}
