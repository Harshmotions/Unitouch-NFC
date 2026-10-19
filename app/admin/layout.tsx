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
  return <>{children}</>;
}
