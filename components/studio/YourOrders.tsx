import { ORDER_STATUSES } from "@/lib/order-status";
import type { CustomerOrder } from "@/lib/customer-orders";

/* "Your orders" in the studio: each paid order's progress through the
   fulfilment pipeline (set by the team in the admin) and, once shipped, the
   tracking details. Read-only. */

const HINTS: Record<string, string> = {
  received: "We've got your order and will start on your design soon.",
  designing: "We're designing your card.",
  in_review: "Your design is ready for your approval. We'll get in touch with you about it.",
  printing: "Your card is being printed.",
  shipped: "Your card is on its way.",
  delivered: "Delivered. Enjoy your card!",
};

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric", timeZone: "Asia/Kolkata" });
}

export default function YourOrders({ orders }: { orders: CustomerOrder[] }) {
  if (!orders.length) return null;

  return (
    <section className="surface-card mb-8 rounded-2xl p-4" aria-label="Your orders">
      <h2 className="text-text-primary mb-3 font-[600]">Your orders</h2>
      <ul className="flex flex-col gap-4">
        {orders.map((o) => {
          const step = Math.max(0, ORDER_STATUSES.findIndex((s) => s.value === o.status));
          const current = ORDER_STATUSES[step];
          return (
            <li key={o.orderNumber} className="border-bg-border bg-bg-elevated rounded-xl border p-4">
              <div className="flex flex-wrap items-baseline justify-between gap-2">
                <p className="text-text-primary text-sm font-[600]">{o.orderNumber}</p>
                <p className="text-text-muted text-xs">Ordered {formatDate(o.createdAt)}</p>
              </div>
              <p className="text-text-secondary mt-0.5 text-xs">
                {o.cardName} card &times; {o.quantity}
                {o.username ? ` · unitouch.in/u/${o.username}` : ""}
              </p>

              <div
                className="mt-3 flex gap-1"
                role="img"
                aria-label={`Step ${step + 1} of ${ORDER_STATUSES.length}: ${current.label}`}
              >
                {ORDER_STATUSES.map((s, i) => (
                  <span
                    key={s.value}
                    className={`h-1.5 flex-1 rounded-full ${i <= step ? "bg-accent-purple" : "bg-white/10"}`}
                  />
                ))}
              </div>
              <p className="text-text-primary mt-2 text-sm">
                {current.label}
                <span className="text-text-muted text-xs">
                  {" "}
                  · step {step + 1} of {ORDER_STATUSES.length}
                </span>
              </p>
              <p className="text-text-secondary text-xs">{HINTS[o.status] ?? ""}</p>
              {o.trackingNumber && (
                <p className="text-text-secondary mt-2 text-xs">
                  Tracking: <span className="text-text-primary">{o.trackingNumber}</span>
                </p>
              )}
            </li>
          );
        })}
      </ul>
    </section>
  );
}
