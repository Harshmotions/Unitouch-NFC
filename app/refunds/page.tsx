export default function RefundsPage() {
  return (
    <main className="mx-auto flex min-h-screen max-w-3xl flex-col gap-6 px-6 py-24">
      <div>
        <h1 className="font-display text-h2 text-text-primary font-[600]">Refund and Replacement Policy</h1>
        <p className="text-text-muted mt-2 text-sm">Last updated: September 27, 2026</p>
      </div>

      <p className="text-text-secondary">
        Every Unitouch card is personalized with your own name, details, and profile before it is
        printed and shipped, so it cannot be resold to anyone else. Because of this, our policy
        works a little differently from a standard return policy.
      </p>

      <section className="flex flex-col gap-2">
        <h2 className="font-display text-h3 text-text-primary font-[600]">1. Order cancellation</h2>
        <p className="text-text-secondary">
          You can cancel your order for a full refund at any point before it enters production.
          Once your card has moved to printing, it can no longer be cancelled, since it has already
          been personalized to your details.
        </p>
      </section>

      <section className="flex flex-col gap-2">
        <h2 className="font-display text-h3 text-text-primary font-[600]">2. Returns</h2>
        <p className="text-text-secondary">
          Because each card is custom printed with your own name and details, we are not able to
          accept returns simply for a change of mind once your card has shipped.
        </p>
      </section>

      <section className="flex flex-col gap-2">
        <h2 className="font-display text-h3 text-text-primary font-[600]">3. Defective or damaged cards</h2>
        <p className="text-text-secondary">
          If your card arrives defective, damaged, or with a printing error that is our fault, we
          will replace it free of charge. To request a replacement, email{" "}
          <a href="mailto:support@unitouch.in" className="text-accent-purple hover:underline">
            support@unitouch.in
          </a>{" "}
          within 7 days of delivery with your order number and a photo of the issue.
        </p>
        <p className="text-text-secondary">
          If a replacement is not possible, for example if your design is no longer available, we
          will issue a full refund to your original payment method instead.
        </p>
      </section>

      <section className="flex flex-col gap-2">
        <h2 className="font-display text-h3 text-text-primary font-[600]">4. Refund timelines</h2>
        <p className="text-text-secondary">
          Approved refunds are processed back to your original payment method and typically appear
          within 5 to 10 business days, depending on your bank or card provider.
        </p>
      </section>

      <section className="flex flex-col gap-2">
        <h2 className="font-display text-h3 text-text-primary font-[600]">5. Contact us</h2>
        <p className="text-text-secondary">
          For any question about an order, replacement, or refund, email{" "}
          <a href="mailto:support@unitouch.in" className="text-accent-purple hover:underline">
            support@unitouch.in
          </a>
          .
        </p>
      </section>
    </main>
  );
}
