"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { createSupabaseBrowserClient } from "@/lib/supabase/client";

const LINKS = [
  { label: "Dashboard", href: "/admin/dashboard" },
  { label: "Profiles", href: "/admin/profiles" },
];

export default function AdminNav({ email }: { email: string }) {
  const pathname = usePathname();
  const router = useRouter();
  const supabase = createSupabaseBrowserClient();

  async function signOut() {
    await supabase.auth.signOut();
    router.push("/admin/login");
  }

  return (
    <nav className="border-bg-border bg-bg-elevated/70 border-b backdrop-blur-xl">
      <div className="mx-auto flex max-w-5xl items-center justify-between px-6 py-4">
        <div className="flex items-center gap-6">
          <span className="font-display text-text-primary font-[600]">Unitouch Admin</span>
          {LINKS.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className={`text-sm transition-colors ${
                pathname === link.href ? "text-text-primary" : "text-text-secondary hover:text-text-primary"
              }`}
            >
              {link.label}
            </Link>
          ))}
        </div>
        <div className="flex items-center gap-4">
          <span className="text-text-muted text-xs">{email}</span>
          <button
            type="button"
            onClick={signOut}
            className="text-text-muted hover:text-error text-xs underline underline-offset-2"
          >
            Sign out
          </button>
        </div>
      </div>
    </nav>
  );
}
