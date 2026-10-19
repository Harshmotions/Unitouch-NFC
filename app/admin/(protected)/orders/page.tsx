import Link from "next/link";
import { ORDER_VIEWS, formatRupees, listOrdersForAdmin, type OrderView } from "@/lib/orders";
import { RESERVATION_TTL_MINUTES } from "@/lib/checkout-config";
import { PaymentBadge, StatusBadge } from "@/components/admin/OrderBadges";

function formatDate(iso: string) {
  return new Date(iso).toLocaleString("en-IN", { day: "numeric", month: "short", hour: "numeric", minute: "2-digit", timeZone: "Asia/Kolkata" });
}

export default async function AdminOrdersPage({
  searchParams,
}: {
  searchParams: Promise<{ view?: string; q?: string }>;
}) {
  const { view: rawView, q } = await searchParams;
  const view: OrderView = ORDER_VIEWS.some((v) => v.value === rawView) ? (rawView as OrderView) : "to-fulfil";
  const orders = await listOrdersForAdmin(view, q);

  const href = (v: OrderView) => `/admin/orders?view=${v}${q ? `&q=${encodeURIComponent(q)}` : ""}`;

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <h1 className="font-display text-h2 text-text-primary font-[600]">Orders</h1>
        <form action="/admin/orders" className="flex gap-2">
          <input type="hidden" name="view" value={view} />
          <input
            name="q"
            defaultValue={q ?? ""}
            placeholder="Search order no., name, email, phone"
            className="border-bg-border bg-bg-elevated text-text-primary placeholder:text-text-muted h-10 w-64 rounded-xl border px-3 text-sm outline-none focus:border-accent-purple/50"
          />
          <button className="glass text-text-secondary hover:text-text-primary h-10 rounded-xl px-4 text-sm">Search</button>
        </form>
      </div>

      <div className="flex flex-wrap gap-2">
        {ORDER_VIEWS.map((v) => (
          <Link
            key={v.value}
            href={href(v.value)}
            className={`rounded-full border px-3 py-1.5 text-sm transition-colors ${
              v.value === view
                ? "border-accent-purple bg-accent-purple/10 text-text-primary"
                : "border-bg-border text-text-secondary hover:text-text-primary"
            }`}
          >
            {v.label}
          </Link>
        ))}
      </div>

      {view === "unpaid" && (
        <p className="text-text-muted text-xs">
          Checkouts where the customer clicked Pay but didn&apos;t finish. They hold their profile link
          for {RESERVATION_TTL_MINUTES} minutes and are then deleted automatically.
        </p>
      )}
      {view === "to-fulfil" && (
        <p className="text-text-muted text-xs">Paid orders not shipped yet, oldest first.</p>
      )}

      <div className="surface-card divide-bg-border flex flex-col divide-y overflow-hidden rounded-2xl">
        {orders.length === 0 && <p className="text-text-muted p-6 text-sm">No orders here.</p>}
        {orders.map((o) => (
          <Link
            key={o.id}
            href={`/admin/orders/${o.id}`}
            className="hover:bg-white/[0.03] grid grid-cols-1 gap-2 px-5 py-4 text-sm transition-colors sm:grid-cols-[1.2fr_1.4fr_auto] sm:items-center"
          >
            <div>
              <p className="text-text-primary font-[600]">{o.orderNumber}</p>
              <p className="text-text-muted text-xs">{formatDate(o.createdAt)}</p>
            </div>
            <div className="min-w-0">
              <p className="text-text-primary truncate">{o.fullName}</p>
              <p className="text-text-muted truncate text-xs">
                {o.cardName} &times; {o.quantity} · {formatRupees(o.amountPaise)}
                {o.profile ? ` · /u/${o.profile.username}` : ""}
              </p>
            </div>
            <div className="flex flex-wrap gap-2 sm:justify-end">
              {o.emailBouncedAt && (
                <span className="rounded-full border border-red-500/30 bg-red-500/10 px-2.5 py-0.5 text-xs text-error">
                  Email bounced
                </span>
              )}
              <PaymentBadge status={o.paymentStatus} />
              {o.paymentStatus === "paid" && <StatusBadge status={o.orderStatus} />}
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}
