"use client";

import { useState } from "react";
import type { ProfileStatsDetail } from "@/lib/profile-stats";
import type { EventType } from "@/types";

/* Premium customers' analytics in the studio: views over the last 30 days
   (one column per day, hover/tap/focus a column for its count), totals for
   views and contact saves, and which buttons visitors tapped. Read-only.
   The owner's own visits aren't counted (app/api/analytics). */

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

// Stats days are UTC dates ("2026-10-12"); show them as "12 Oct".
function dayLabel(date: string) {
  return new Date(`${date}T00:00:00Z`).toLocaleDateString("en-IN", { day: "numeric", month: "short", timeZone: "UTC" });
}

const plural = (n: number, word: string) => `${n} ${word}${n === 1 ? "" : "s"}`;

function Tile({ label, values }: { label: string; values: { last7: number; last30: number; all: number } }) {
  return (
    <div className="border-bg-border bg-bg-elevated rounded-xl border p-4">
      <p className="text-text-muted text-xs">{label}</p>
      <p className="font-display text-text-primary mt-1 text-2xl font-[600] tabular-nums">{values.all}</p>
      <p className="text-text-muted text-xs tabular-nums">
        {values.last7} in 7 days · {values.last30} in 30 days
      </p>
    </div>
  );
}

export default function ProfileAnalytics({ username, stats }: { username: string; stats: ProfileStatsDetail }) {
  const [active, setActive] = useState<number | null>(null);
  const days = stats.dailyViews;
  const max = Math.max(1, ...days.map((d) => d.views));
  const total30 = days.reduce((sum, d) => sum + d.views, 0);
  const readout =
    active === null ? `Last 30 days: ${plural(total30, "view")}` : `${dayLabel(days[active].date)}: ${plural(days[active].views, "view")}`;

  return (
    <section className="surface-card mb-8 rounded-2xl p-4" aria-label="Your analytics">
      <div className="mb-4">
        <h2 className="text-text-primary font-[600]">Your analytics</h2>
        <p className="text-text-muted text-xs">
          For unitouch.in/u/{username}. Counts visits from other people, not your own.
        </p>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <Tile label="Profile views" values={stats.views} />
        <Tile label="Contact saves" values={stats.saves} />
      </div>

      <div className="mt-5">
        <div className="mb-2 flex items-baseline justify-between gap-2">
          <p className="text-text-secondary text-xs">Profile views, last 30 days</p>
          <p className="text-text-primary text-xs tabular-nums" aria-live="polite">
            {readout}
          </p>
        </div>

        <div className="relative" onMouseLeave={() => setActive(null)}>
          {total30 > 0 && <span className="text-text-muted absolute -top-0.5 left-0 text-[10px] tabular-nums">{max}</span>}
          <div className="border-bg-border flex h-24 items-end gap-[2px] border-b pt-3" aria-hidden="true">
            {days.map((d, i) => (
              <button
                key={d.date}
                type="button"
                tabIndex={-1}
                onMouseEnter={() => setActive(i)}
                onClick={() => setActive(i)}
                className="flex h-full min-w-0 flex-1 cursor-default items-end justify-center"
                title={`${dayLabel(d.date)}: ${plural(d.views, "view")}`}
              >
                {d.views > 0 && (
                  <span
                    className={`block w-full max-w-6 rounded-t-[4px] transition-opacity ${
                      active === null || active === i ? "bg-accent" : "bg-accent opacity-40"
                    }`}
                    style={{ height: `${(d.views / max) * 100}%` }}
                  />
                )}
              </button>
            ))}
          </div>
          <div className="text-text-muted mt-1 flex justify-between text-[10px]">
            <span>{dayLabel(days[0].date)}</span>
            <span>Today</span>
          </div>
        </div>

        <table className="sr-only">
          <caption>Profile views per day, last 30 days</caption>
          <thead>
            <tr>
              <th scope="col">Day</th>
              <th scope="col">Views</th>
            </tr>
          </thead>
          <tbody>
            {days.map((d) => (
              <tr key={d.date}>
                <td>{dayLabel(d.date)}</td>
                <td>{d.views}</td>
              </tr>
            ))}
          </tbody>
        </table>

        {stats.views.all === 0 ? (
          <p className="text-text-muted mt-2 text-xs">
            No visits yet. Share your link or tap your card on someone&apos;s phone to get started.
          </p>
        ) : (
          total30 === 0 && (
            <p className="text-text-muted mt-2 text-xs">
              No visits in the last 30 days. Sharing your link again is a good way to get noticed.
            </p>
          )
        )}
      </div>

      <div className="mt-5">
        <p className="text-text-secondary mb-2 text-xs">Buttons people tapped (all time)</p>
        {stats.taps.length ? (
          <ul className="flex flex-wrap gap-2">
            {stats.taps.map((t) => (
              <li key={t.type} className="border-bg-border text-text-secondary rounded-full border px-3 py-1 text-xs">
                {TAP_LABELS[t.type] ?? t.type} <span className="text-text-primary tabular-nums">{t.count}</span>
              </li>
            ))}
          </ul>
        ) : (
          <p className="text-text-muted text-xs">No taps yet.</p>
        )}
      </div>
    </section>
  );
}
