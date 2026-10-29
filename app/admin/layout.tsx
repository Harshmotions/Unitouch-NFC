import type { Metadata } from "next";

/* Admin area: never indexed by search engines. Auth lives in the
   (protected) route group's layout (requireAdmin); /admin/login is public. */
export const metadata: Metadata = {
  title: { absolute: "Unitouch Admin" },
  robots: { index: false, follow: false },
};

export default function AdminLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  // Admins copy order details, addresses and emails all day: text selects as usual here.
  return <div className="copyable">{children}</div>;
}
