import Link from "next/link";
import { notFound } from "next/navigation";
import { ChevronLeft } from "lucide-react";
import { formatRupees, getOrderForAdmin } from "@/lib/orders";
import { PaymentBadge, StatusBadge } from "@/components/admin/OrderBadges";
import OrderStatusForm from "@/components/admin/OrderStatusForm";

function Row({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="grid grid-cols-[120px_1fr] gap-3 py-2 text-sm">
      <span className="text-text-muted">{label}</span>
      <span className="text-text-primary break-words">{children}</span>
    </div>
  );
}

export default async function AdminOrderDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const order = await getOrderForAdmin(id);
  if (!order) notFound();

  const a = order.shippingAddress;
  const created = new Date(order.createdAt).toLocaleString("en-IN", {
    dateStyle: "medium",
    timeStyle: "short",
    timeZone: "Asia/Kolkata",
  });

  return (
    <div className="flex flex-col gap-6">
      <Link href="/admin/orders" className="text-text-muted hover:text-text-primary flex items-center gap-1 text-sm">
        <ChevronLeft className="size-4" />
        All orders
      </Link>

      <div className="flex flex-wrap items-center gap-3">
        <h1 className="font-display text-h2 text-text-primary font-[600]">{order.orderNumber}</h1>
        <PaymentBadge status={order.paymentStatus} />
        {order.paymentStatus === "paid" && <StatusBadge status={order.orderStatus} />}
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <div className="flex flex-col gap-6">
          <section className="surface-card divide-bg-border divide-y rounded-2xl px-5 py-2">
            <Row label="Placed">{created}</Row>
            <Row label="Card">
              {order.cardName} &times; {order.quantity}
            </Row>
            <Row label="Amount">{formatRupees(order.amountPaise)}</Row>
            <Row label="Customer">{order.fullName}</Row>
            <Row label="Email">
              <a href={`mailto:${order.email}`} className="hover:underline">
                {order.email}
              </a>
            </Row>
            <Row label="Phone">
              <a href={`tel:${order.phone}`} className="hover:underline">
                {order.phone}
              </a>
            </Row>
            <Row label="Ship to">
              {[a.line1, a.line2, `${a.city}, ${a.state} ${a.pincode}`].filter(Boolean).map((l) => (
                <span key={l} className="block">
                  {l}
                </span>
              ))}
            </Row>
            {order.additionalNotes && <Row label="Customer notes">{order.additionalNotes}</Row>}
          </section>

          <section className="surface-card divide-bg-border divide-y rounded-2xl px-5 py-2">
            <Row label="Profile">
              {order.profile ? (
                <>
                  <a
                    href={`/u/${order.profile.username}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="hover:underline"
                  >
                    unitouch.in/u/{order.profile.username}
                  </a>{" "}
                  <span className="text-text-muted">({order.profile.isPublished ? "live" : "not published yet"})</span>
                  <Link href={`/admin/profiles/${order.profile.id}`} className="text-accent-purple ml-2 hover:underline">
                    Edit
                  </Link>
                </>
              ) : (
                "None"
              )}
            </Row>
            <Row label="Razorpay order">{order.razorpayOrderId ?? "-"}</Row>
            <Row label="Payment ID">{order.razorpayPaymentId ?? "-"}</Row>
          </section>
        </div>

        <section className="surface-card h-fit rounded-2xl p-5">
          <h2 className="text-text-primary mb-4 font-[600]">Fulfilment</h2>
          {order.paymentStatus === "paid" ? (
            <OrderStatusForm
              orderId={order.id}
              initialStatus={order.orderStatus}
              initialTracking={order.trackingNumber ?? ""}
              initialNotes={order.adminNotes ?? ""}
            />
          ) : (
            <p className="text-text-muted text-sm">
              This checkout hasn&apos;t been paid, so there&apos;s nothing to fulfil. It will be released
              automatically.
            </p>
          )}
        </section>
      </div>
    </div>
  );
}
