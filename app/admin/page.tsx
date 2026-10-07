import { redirect } from "next/navigation";

/* /admin -> dashboard (which sends signed-out visitors to /admin/login). */
export default function AdminIndexPage() {
  redirect("/admin/dashboard");
}
