import type { Metadata } from "next";

// Dev-only harness (shows "Not available" in production); never index it.
export const metadata: Metadata = { title: "Dev", robots: { index: false, follow: false } };

export default function DevIdentityLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return children;
}
