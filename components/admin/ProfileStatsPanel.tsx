import type { ProfileStatsDetail } from "@/lib/profile-stats";
import type { EventType } from "@/types";

/* Admin profile page: views, contact saves and button taps. Read-only. */

const TAP_LABELS: Partial<Record<EventType, string>> = {
  whatsapp_click: "WhatsApp",
  phone_click: "Phone",
  email_click: "Email",
  website_click: "Website",
  instagram_click: "Instagram",
  linkedin_click: "LinkedIn",
  youtube_click: "YouTube",
  portfolio_click: "Portfolio",
};

function Metric({ label, values }: { label: string; values: { last7: number; last30: number; all: number } }) {
  return (
    <div className="bg-bg-elevated border-bg-border rounded-xl border p-4">
      <p className="text-text-muted text-xs">{label}</p>
      <p className="font-display text-text-primary mt-1 text-2xl font-[600] tabular-nums">{values.all}</p>
      <p className="text-text-muted text-xs tabular-nums">
        {values.last7} in 7 days · {values.last30} in 30 days
      </p>
    </div>
  );
}

export default function ProfileStatsPanel({ stats }: { stats: ProfileStatsDetail }) {
  return (
    <section className="surface-card rounded-2xl p-5" aria-label="Profile stats">
      <h2 className="text-text-primary mb-4 font-[600]">Stats</h2>
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        <Metric label="Profile views" values={stats.views} />
        <Metric label="Contact saves" values={stats.saves} />
      </div>
      <div className="mt-4">
        <p className="text-text-muted mb-2 text-xs">Button taps (all time)</p>
        {stats.taps.length ? (
          <ul className="flex flex-wrap gap-2">
            {stats.taps.map((t) => (
              <li key={t.type} className="border-bg-border text-text-secondary rounded-full border px-3 py-1 text-xs">
                {TAP_LABELS[t.type] ?? t.type} <span className="text-text-primary tabular-nums">{t.count}</span>
              </li>
            ))}
          </ul>
        ) : (
          <p className="text-text-muted text-sm">No button taps yet.</p>
        )}
      </div>
      <p className="text-text-muted mt-4 text-xs">Counted per day; no visitor details are stored.</p>
    </section>
  );
}
