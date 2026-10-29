import Link from "next/link";
import { listAdminProfiles } from "@/lib/admin-profiles";
import { formatRupees, getAdminStats, listOrdersForAdmin } from "@/lib/orders";
import { PaymentBadge, StatusBadge } from "@/components/admin/OrderBadges";

function Stat({ label, value, hint, href }: { label: string; value: string | number; hint?: string; href?: string }) {
  const body = (
    <>
      <p className="text-text-muted text-xs">{label}</p>
      <p className="text-text-primary font-display mt-1 text-2xl font-[600]">{value}</p>
      {hint && <p className="text-text-muted mt-1 text-xs">{hint}</p>}
    </>
  );
  return href ? (
    <Link href={href} className="surface-card hover:border-accent/40 rounded-2xl p-5 transition-colors">
      {body}
    </Link>
  ) : (
    <div className="surface-card rounded-2xl p-5">{body}</div>
  );
}

export default async function AdminDashboardPage() {
  const [stats, queue, profiles] = await Promise.all([
    getAdminStats(),
    listOrdersForAdmin("to-fulfil"),
    listAdminProfiles(),
  ]);
  const published = profiles.filter((p) => p.status === "published").length;
  const waiting = profiles.filter((p) => p.status === "draft-paid").length;

  return (
    <div className="flex flex-col gap-10">
      <h1 className="font-display text-h2 text-text-primary font-[600]">Dashboard</h1>

      <section className="flex flex-col gap-4">
        <h2 className="text-text-primary font-[600]">Orders</h2>
        <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
          <Stat label="To fulfil" value={stats.toFulfil} hint="Paid, not shipped yet" href="/admin/orders?view=to-fulfil" />
          <Stat
            label="Paid in last 7 days"
            value={stats.paidLast7Days}
            hint={formatRupees(stats.revenueLast7DaysPaise)}
          />
          <Stat label="Revenue, all time" value={formatRupees(stats.revenueAllTimePaise)} hint={`${stats.paidAllTime} paid orders`} />
          <Stat label="Unpaid checkouts" value={stats.unpaidCheckouts} hint="Released automatically" href="/admin/orders?view=unpaid" />
        </div>
      </section>

      <section className="flex flex-col gap-4">
        <div className="flex items-center justify-between">
          <h2 className="text-text-primary font-[600]">Fulfilment queue</h2>
          <Link href="/admin/orders" className="text-accent text-sm hover:underline">
            All orders →
          </Link>
        </div>
        <div className="surface-card divide-bg-border flex flex-col divide-y overflow-hidden rounded-2xl">
          {queue.length === 0 && <p className="text-text-muted p-5 text-sm">Nothing to fulfil. All paid orders have shipped.</p>}
          {queue.slice(0, 8).map((o) => (
            <Link
              key={o.id}
              href={`/admin/orders/${o.id}`}
              className="hover:bg-bg-subtle flex items-center justify-between gap-4 px-5 py-4 text-sm transition-colors"
            >
              <div className="min-w-0">
                <p className="text-text-primary font-[500]">
                  {o.orderNumber} · {o.fullName}
                </p>
                <p className="text-text-muted truncate text-xs">
                  {o.cardName} &times; {o.quantity} · {formatRupees(o.amountPaise)}
                  {o.profile ? ` · /u/${o.profile.username}` : ""}
                </p>
              </div>
              <div className="flex shrink-0 gap-2">
                <PaymentBadge status={o.paymentStatus} />
                <StatusBadge status={o.orderStatus} />
              </div>
            </Link>
          ))}
        </div>
      </section>

      <section className="flex flex-col gap-4">
        <div className="flex items-center justify-between">
          <h2 className="text-text-primary font-[600]">Profiles</h2>
          <Link href="/admin/profiles" className="text-accent text-sm hover:underline">
            All profiles →
          </Link>
        </div>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
          <Stat label="Total profiles" value={profiles.length} />
          <Stat label="Published" value={published} />
          <Stat
            label="Paid, not published"
            value={waiting}
            hint="Reminded automatically on day 1, 3, 7"
            href="/admin/profiles"
          />
        </div>
      </section>
    </div>
  );
}
