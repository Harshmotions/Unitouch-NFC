"use client";

import { useState } from "react";
import Link from "next/link";
import type { AdminProfileSummary } from "@/lib/profile";

export default function ProfilesList({ profiles }: { profiles: AdminProfileSummary[] }) {
  const [query, setQuery] = useState("");

  const filtered = profiles.filter((p) => {
    const q = query.trim().toLowerCase();
    if (!q) return true;
    return (
      p.username.toLowerCase().includes(q) ||
      (p.fullName ?? "").toLowerCase().includes(q) ||
      (p.email ?? "").toLowerCase().includes(q)
    );
  });

  return (
    <div className="flex flex-col gap-4">
      <input
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        placeholder="Search by username, name, or email"
        className="border-bg-border bg-bg-elevated text-text-primary placeholder:text-text-muted h-11 w-full max-w-md rounded-xl border px-4 text-sm outline-none transition-colors focus:border-accent-purple/50"
      />

      <div className="surface-card divide-bg-border flex flex-col divide-y rounded-2xl">
        {filtered.length === 0 && (
          <p className="text-text-muted p-5 text-sm">No profiles match &quot;{query}&quot;.</p>
        )}
        {filtered.map((p) => (
          <Link
            key={p.id}
            href={`/admin/profiles/${p.id}`}
            className="hover:bg-bg-elevated/50 flex items-center justify-between gap-4 px-5 py-4 text-sm transition-colors"
          >
            <div className="min-w-0">
              <p className="text-text-primary truncate font-[500]">{p.fullName || p.username}</p>
              <p className="text-text-muted truncate text-xs">
                @{p.username}
                {p.email ? ` · ${p.email}` : ""}
              </p>
            </div>
            <div className="flex shrink-0 items-center gap-3">
              {!p.studioCompleted && <span className="text-warning text-xs">Awaiting studio</span>}
              <span className={`text-xs ${p.isPublished ? "text-success" : "text-text-muted"}`}>
                {p.isPublished ? "Published" : "Draft"}
              </span>
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}
