"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Bell, Loader2, Trash2 } from "lucide-react";
import type { AdminProfileRow, AdminProfileStatus } from "@/lib/admin-profiles";

const STATUS: Record<AdminProfileStatus, { label: string; className: string }> = {
  published: { label: "Published", className: "text-success" },
  "draft-paid": { label: "Not published (paid)", className: "text-warning" },
  unpaid: { label: "Unpaid checkout", className: "text-text-muted" },
  draft: { label: "Draft, no order", className: "text-text-muted" },
  demo: { label: "Demo", className: "text-accent-purple" },
};

const FILTERS: { value: "all" | AdminProfileStatus; label: string }[] = [
  { value: "all", label: "All" },
  { value: "draft-paid", label: "Not published (paid)" },
  { value: "published", label: "Published" },
  { value: "unpaid", label: "Unpaid checkouts" },
  { value: "draft", label: "No order" },
];

export default function ProfilesList({
  profiles,
  stats = {},
}: {
  profiles: AdminProfileRow[];
  // All-time views/saves by username (lib/profile-stats.ts).
  stats?: Record<string, { views: number; saves: number }>;
}) {
  const router = useRouter();
  const [query, setQuery] = useState("");
  const [filter, setFilter] = useState<(typeof FILTERS)[number]["value"]>("all");
  const [busyId, setBusyId] = useState<string | null>(null);
  const [notice, setNotice] = useState<{ kind: "ok" | "error"; text: string } | null>(null);

  const counts = useMemo(() => {
    const c: Record<string, number> = { all: profiles.length };
    for (const p of profiles) c[p.status] = (c[p.status] ?? 0) + 1;
    return c;
  }, [profiles]);

  const filtered = profiles.filter((p) => {
    if (filter !== "all" && p.status !== filter) return false;
    const q = query.trim().toLowerCase();
    if (!q) return true;
    return (
      p.username.toLowerCase().includes(q) ||
      (p.fullName ?? "").toLowerCase().includes(q) ||
      (p.email ?? "").toLowerCase().includes(q) ||
      (p.order?.orderNumber ?? "").toLowerCase().includes(q)
    );
  });

  async function remind(p: AdminProfileRow) {
    if (!window.confirm(`Email ${p.email} that @${p.username} isn't published yet?`)) return;
    setBusyId(p.id);
    setNotice(null);
    try {
      const res = await fetch(`/api/admin/profiles/${p.id}/remind`, { method: "POST" });
      const data = await res.json().catch(() => null);
      setNotice(
        res.ok
          ? { kind: "ok", text: `Reminder #${data.reminderNumber} sent to ${p.email}.` }
          : { kind: "error", text: data?.error ?? "Couldn't send the reminder." },
      );
      if (res.ok) router.refresh();
    } catch {
      setNotice({ kind: "error", text: "We couldn't reach the server." });
    } finally {
      setBusyId(null);
    }
  }

  async function remove(p: AdminProfileRow) {
    const paid = p.order?.paymentStatus === "paid";
    const warning = paid
      ? `@${p.username} belongs to PAID order ${p.order!.orderNumber}. The order stays (the customer paid) but they lose this profile and link.\n\n`
      : "";
    const typed = window.prompt(
      `${warning}This permanently deletes @${p.username}, its photo and its view stats${
        p.order && !paid ? ", plus its unpaid checkout" : ""
      }. The link becomes available again.\n\nType the username to confirm:`,
    );
    if (typed === null) return;
    if (typed.trim().toLowerCase() !== p.username) {
      setNotice({ kind: "error", text: "Username didn't match, nothing was deleted." });
      return;
    }
    setBusyId(p.id);
    setNotice(null);
    try {
      const res = await fetch(`/api/admin/profiles/${p.id}`, { method: "DELETE" });
      const data = await res.json().catch(() => null);
      if (!res.ok) {
        setNotice({ kind: "error", text: data?.error ?? "Couldn't delete the profile." });
      } else {
        setNotice({
          kind: "ok",
          text: `Deleted @${p.username}.${data.keptPaidOrder ? ` Order ${data.keptPaidOrder} was kept.` : ""}`,
        });
        router.refresh();
      }
    } catch {
      setNotice({ kind: "error", text: "We couldn't reach the server." });
    } finally {
      setBusyId(null);
    }
  }

  return (
    <div className="flex flex-col gap-4">
      <input
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        placeholder="Search by username, name, email, or order number"
        className="border-bg-border bg-bg-elevated text-text-primary placeholder:text-text-muted h-11 w-full max-w-md rounded-xl border px-4 text-sm outline-none transition-colors focus:border-accent-purple/50"
      />

      <div className="flex flex-wrap gap-2">
        {FILTERS.map((f) => (
          <button
            key={f.value}
            type="button"
            onClick={() => setFilter(f.value)}
            className={`rounded-full border px-3 py-1.5 text-sm transition-colors ${
              filter === f.value
                ? "border-accent-purple bg-accent-purple/10 text-text-primary"
                : "border-bg-border text-text-secondary hover:text-text-primary"
            }`}
          >
            {f.label} <span className="text-text-muted">{counts[f.value] ?? 0}</span>
          </button>
        ))}
      </div>

      {filter === "draft-paid" && (
        <p className="text-text-muted text-xs">
          Paid, but the customer hasn&apos;t published yet. They get automatic reminder emails 1, 3 and 7
          days after paying; you can also send one now.
        </p>
      )}

      {notice && (
        <p className={`text-sm ${notice.kind === "ok" ? "text-success" : "text-error"}`} role="status">
          {notice.text}
        </p>
      )}

      <div className="surface-card divide-bg-border flex flex-col divide-y rounded-2xl">
        {filtered.length === 0 && <p className="text-text-muted p-5 text-sm">No profiles here.</p>}
        {filtered.map((p) => {
          const busy = busyId === p.id;
          return (
            <div key={p.id} className="flex flex-col gap-3 px-5 py-4 text-sm sm:flex-row sm:items-center sm:justify-between">
              <Link href={`/admin/profiles/${p.id}`} className="group min-w-0 flex-1">
                <p className="text-text-primary truncate font-[500] group-hover:underline">{p.fullName || p.username}</p>
                <p className="text-text-muted truncate text-xs">
                  @{p.username}
                  {p.email ? ` · ${p.email}` : ""}
                  {p.order ? ` · ${p.order.orderNumber}` : ""}
                </p>
              </Link>
              <div className="flex shrink-0 items-center gap-3">
                <span className="text-text-muted text-xs tabular-nums" title="All-time profile views and contact saves">
                  {stats[p.username]?.views ?? 0} views · {stats[p.username]?.saves ?? 0} saves
                </span>
                <span className={`text-xs ${STATUS[p.status].className}`}>{STATUS[p.status].label}</span>
                {p.status === "draft-paid" && (
                  <span className="text-text-muted text-xs">
                    {p.remindersSent ? `${p.remindersSent} reminder${p.remindersSent > 1 ? "s" : ""} sent` : "No reminders yet"}
                  </span>
                )}
                {busy && <Loader2 className="text-text-muted size-4 animate-spin" />}
                {p.status === "draft-paid" && (
                  <button
                    type="button"
                    onClick={() => remind(p)}
                    disabled={busy}
                    title="Email the customer a reminder to publish"
                    className="text-text-muted hover:text-text-primary disabled:opacity-40"
                  >
                    <Bell className="size-4" />
                    <span className="sr-only">Send reminder</span>
                  </button>
                )}
                {!p.protected && (
                  <button
                    type="button"
                    onClick={() => remove(p)}
                    disabled={busy}
                    title="Delete this profile"
                    className="text-text-muted hover:text-error disabled:opacity-40"
                  >
                    <Trash2 className="size-4" />
                    <span className="sr-only">Delete profile</span>
                  </button>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
