import { requireAdmin } from "@/lib/admin";
import AdminNav from "@/components/admin/AdminNav";

/* Every page under this route group requires an allow-listed admin session —
   requireAdmin() redirects to /admin/login otherwise. Nothing below this
   layout needs to repeat the check. */
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
