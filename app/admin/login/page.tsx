import { redirect } from "next/navigation";
import { getAdminUser } from "@/lib/admin";
import AdminLoginForm from "@/components/admin/AdminLoginForm";

/* Two-factor admin sign in: shared password, then a one-time code emailed to
   the admin inbox (see lib/admin.ts). Already signed in -> dashboard. */
export default async function AdminLoginPage() {
  if (await getAdminUser()) redirect("/admin/dashboard");

  return (
    <main className="bg-bg-base flex min-h-screen flex-col items-center justify-center px-6 py-16">
      <AdminLoginForm />
    </main>
  );
}
