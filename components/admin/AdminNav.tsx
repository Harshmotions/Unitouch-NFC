"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";

const LINKS = [
  { label: "Dashboard", href: "/admin/dashboard" },
  { label: "Orders", href: "/admin/orders" },
  { label: "Profiles", href: "/admin/profiles" },
];

export default function AdminNav({ email }: { email: string }) {
  const pathname = usePathname();
  const router = useRouter();
  const [signingOut, setSigningOut] = useState(false);

  async function signOut() {
    setSigningOut(true);
    // Clears the admin 2FA cookie and this device's session (others stay in).
    await fetch("/api/admin/auth/logout", { method: "POST" }).catch(() => null);
    router.replace("/admin/login");
    router.refresh();
  }

  return (
    <nav className="border-bg-border bg-bg-elevated border-b">
      <div className="mx-auto flex max-w-5xl flex-wrap items-center justify-between gap-3 px-6 py-4">
        <div className="flex flex-wrap items-center gap-6">
          <span className="font-display text-text-primary font-[600]">Unitouch Admin</span>
          {LINKS.map((link) => {
            const active = pathname === link.href || pathname.startsWith(`${link.href}/`);
            return (
              <Link
                key={link.href}
                href={link.href}
                className={`text-sm transition-colors ${active ? "text-text-primary" : "text-text-secondary hover:text-text-primary"}`}
              >
                {link.label}
              </Link>
            );
          })}
        </div>
        <div className="flex items-center gap-4">
          <span className="text-text-muted text-xs">{email}</span>
          <button
            type="button"
            onClick={signOut}
            disabled={signingOut}
            className="text-text-muted hover:text-error text-xs underline underline-offset-2 disabled:opacity-50"
          >
            {signingOut ? "Signing out…" : "Sign out"}
          </button>
        </div>
      </div>
    </nav>
  );
}
