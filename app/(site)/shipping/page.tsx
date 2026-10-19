import { pageMetadata } from "@/lib/seo";

export const metadata = pageMetadata({
  title: "Shipping and Delivery Policy",
  description: "Where Unitouch ships, how long delivery takes and what it costs.",
  path: "/shipping",
});

export default function ShippingPage() {
  return (
    <main className="mx-auto flex min-h-screen max-w-3xl flex-col gap-6 px-6 py-24">
      <div>
        <h1 className="font-display text-h2 text-text-primary font-[600]">Shipping and Delivery Policy</h1>
        <p className="text-text-muted mt-2 text-sm">Last updated: October 7, 2026</p>
      </div>

      <p className="text-text-secondary">
        Every Unitouch card is a physical NFC card, designed and printed for you after you order.
        This policy explains where we ship, how long it takes, and what it costs.
      </p>

      <section className="flex flex-col gap-2">
        <h2 className="font-display text-h3 text-text-primary font-[600]">1. Where we ship</h2>
        <p className="text-text-secondary">
          We ship to addresses across India. We do not currently ship outside India.
        </p>
      </section>

      <section className="flex flex-col gap-2">
        <h2 className="font-display text-h3 text-text-primary font-[600]">2. Shipping charges</h2>
        <p className="text-text-secondary">
          Shipping is free. The price shown at checkout already includes delivery to your address,
          and there are no extra charges added after payment.
        </p>
      </section>

      <section className="flex flex-col gap-2">
        <h2 className="font-display text-h3 text-text-primary font-[600]">3. Processing time</h2>
        <p className="text-text-secondary">
          After your payment is confirmed, we design your card (usually within 24 to 48 hours),
          print it (2 to 3 days), and program its NFC chip to your profile. Your order is
          typically dispatched within 3 to 5 business days of payment.
        </p>
      </section>

      <section className="flex flex-col gap-2">
        <h2 className="font-display text-h3 text-text-primary font-[600]">4. Delivery time</h2>
        <p className="text-text-secondary">
          Once dispatched, orders are shipped with tracking and usually arrive within 1 to 2
          business days. In total, most orders reach you within 5 to 7 days of payment. Deliveries
          to remote areas, or delays caused by the courier, weather, or public holidays, can take
          longer. These timelines are estimates, not guarantees.
        </p>
      </section>

      <section className="flex flex-col gap-2">
        <h2 className="font-display text-h3 text-text-primary font-[600]">5. Order tracking</h2>
        <p className="text-text-secondary">
          When your order ships, we share the tracking details with you on the email or phone
          number you used at checkout. If you have not received them, email{" "}
          <a href="mailto:support@unitouch.in" className="text-accent-purple hover:underline">
            support@unitouch.in
          </a>{" "}
          with your order number.
        </p>
      </section>

      <section className="flex flex-col gap-2">
        <h2 className="font-display text-h3 text-text-primary font-[600]">6. Address details</h2>
        <p className="text-text-secondary">
          Please check your shipping address carefully at checkout. If you notice a mistake, email
          us as soon as possible and we will update it if the order has not been dispatched yet.
          We are not responsible for delays or non-delivery caused by an incorrect address.
        </p>
      </section>

      <section className="flex flex-col gap-2">
        <h2 className="font-display text-h3 text-text-primary font-[600]">7. Damaged or lost shipments</h2>
        <p className="text-text-secondary">
          If your card arrives damaged, or your order does not arrive within the expected time,
          contact us and we will help. Replacements and refunds are handled under our{" "}
          <a href="/refunds" className="text-accent-purple hover:underline">
            Cancellation and Refund Policy
          </a>
          .
        </p>
      </section>

      <section className="flex flex-col gap-2">
        <h2 className="font-display text-h3 text-text-primary font-[600]">8. Contact us</h2>
        <p className="text-text-secondary">
          For any question about shipping or delivery, email{" "}
          <a href="mailto:support@unitouch.in" className="text-accent-purple hover:underline">
            support@unitouch.in
          </a>
          .
        </p>
      </section>
    </main>
  );
}
