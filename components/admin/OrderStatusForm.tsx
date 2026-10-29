"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { ORDER_STATUSES, type OrderStatus } from "@/lib/order-status";
import Button from "@/components/ui/Button";
import Label from "@/components/ui/Label";
import Input from "@/components/ui/Input";
import ProgressNotice from "@/components/ui/ProgressNotice";

/* Admin fulfilment controls for a paid order: status, tracking details, and
   internal notes. Saving as "Shipped" emails the customer (server side). */
export default function OrderStatusForm({
  orderId,
  initialStatus,
  initialTracking,
  initialNotes,
}: {
  orderId: string;
  initialStatus: OrderStatus;
  initialTracking: string;
  initialNotes: string;
}) {
  const router = useRouter();
  const [status, setStatus] = useState<OrderStatus>(initialStatus);
  const [tracking, setTracking] = useState(initialTracking);
  const [notes, setNotes] = useState(initialNotes);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState<{ kind: "ok" | "error"; text: string } | null>(null);

  const willEmail = status === "shipped" && (initialStatus !== "shipped" || tracking.trim() !== initialTracking.trim());

  async function save(e: React.FormEvent) {
    e.preventDefault();
    if (status === "shipped" && !tracking.trim()) {
      const ok = window.confirm("Mark as shipped without tracking details? The customer email won't include tracking.");
      if (!ok) return;
    }
    setBusy(true);
    setMessage(null);
    try {
      const res = await fetch(`/api/admin/orders/${orderId}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ orderStatus: status, trackingNumber: tracking, adminNotes: notes }),
      });
      const data = await res.json().catch(() => null);
      if (!res.ok) {
        setMessage({ kind: "error", text: data?.error ?? "Couldn't save. Please try again." });
        return;
      }
      setMessage({
        kind: "ok",
        text: data?.customerEmailed ? "Saved. The customer has been emailed that their card shipped." : "Saved.",
      });
      router.refresh();
    } catch {
      setMessage({ kind: "error", text: "We couldn't reach the server. Check your connection and try again." });
    } finally {
      setBusy(false);
    }
  }

  return (
    <form onSubmit={save} className="flex flex-col gap-5">
      <div>
        <Label>Status</Label>
        <div className="flex flex-wrap gap-2">
          {ORDER_STATUSES.map((s, i) => (
            <button
              key={s.value}
              type="button"
              onClick={() => setStatus(s.value)}
              className={`rounded-full border px-3 py-1.5 text-sm transition-colors ${
                status === s.value
                  ? "border-accent bg-accent/10 text-text-primary"
                  : "border-bg-border text-text-secondary hover:text-text-primary"
              }`}
            >
              {i + 1}. {s.label}
            </button>
          ))}
        </div>
      </div>

      <div>
        <Label htmlFor="tracking">Tracking details</Label>
        <Input id="tracking" value={tracking} onChange={(e) => setTracking(e.target.value)} placeholder="e.g. DTDC 7D123456789" />
        <p className="text-text-muted mt-1.5 text-xs">Courier name and tracking number. Included in the shipped email.</p>
      </div>

      <div>
        <Label htmlFor="notes">Internal notes</Label>
        <textarea
          id="notes"
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          rows={4}
          placeholder="Only visible to admins"
          className="border-bg-border bg-bg-elevated text-text-primary placeholder:text-text-muted focus:border-accent/50 w-full rounded-xl border px-4 py-3 text-sm outline-none transition-colors"
        />
      </div>

      {willEmail && (
        <p className="border-accent/30 bg-accent/10 text-text-secondary rounded-xl border px-4 py-3 text-xs">
          Saving will email the customer that their card has shipped
          {tracking.trim() ? `, with tracking "${tracking.trim()}"` : ""}.
        </p>
      )}

      <Button variant="primary" size="md" type="submit" loading={busy} disabled={busy}>
        Save changes
      </Button>
      {busy && <ProgressNotice title="Saving…" hint={willEmail ? "Also sending the shipped email to the customer." : undefined} />}
      {message && <p className={`text-sm ${message.kind === "ok" ? "text-success" : "text-error"}`}>{message.text}</p>}
    </form>
  );
}
