import { statusLabel } from "@/lib/order-status";

/* Small status pills for the admin orders UI. */
const PAYMENT_STYLES: Record<string, string> = {
  paid: "bg-success/10 text-success border-success/20",
  pending: "bg-white/5 text-text-muted border-white/10",
  failed: "bg-error/10 text-error border-error/20",
};

const PAYMENT_LABELS: Record<string, string> = { paid: "Paid", pending: "Unpaid", failed: "Payment failed" };

export function PaymentBadge({ status }: { status: string }) {
  return (
    <span className={`inline-block rounded-full border px-2 py-0.5 text-xs ${PAYMENT_STYLES[status] ?? PAYMENT_STYLES.pending}`}>
      {PAYMENT_LABELS[status] ?? status}
    </span>
  );
}

export function StatusBadge({ status }: { status: string }) {
  const done = status === "shipped" || status === "delivered";
  return (
    <span
      className={`inline-block rounded-full border px-2 py-0.5 text-xs ${
        done ? "border-accent-purple/30 bg-accent-purple/10 text-accent-purple" : "border-white/10 bg-white/5 text-text-secondary"
      }`}
    >
      {statusLabel(status)}
    </span>
  );
}
