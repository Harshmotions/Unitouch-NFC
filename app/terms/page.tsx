export default function TermsPage() {
  return (
    <main className="mx-auto flex min-h-screen max-w-3xl flex-col gap-6 px-6 py-24">
      <div>
        <h1 className="font-display text-h2 text-text-primary font-[600]">Terms of Service</h1>
        <p className="text-text-muted mt-2 text-sm">Last updated: September 27, 2026</p>
      </div>

      <p className="text-text-secondary">
        These terms govern your use of Unitouch, the ordering of NFC business cards, and the
        digital profile page linked to each card. By placing an order or using a Unitouch profile,
        you agree to these terms.
      </p>

      <section className="flex flex-col gap-2">
        <h2 className="font-display text-h3 text-text-primary font-[600]">1. Our service</h2>
        <p className="text-text-secondary">
          Unitouch sells physical NFC business cards. Each card is linked to a personal digital
          profile page that you set up and can edit at unitouch.in/u/yourname, which shares your
          contact details and links with anyone who taps the card or scans it.
        </p>
      </section>

      <section className="flex flex-col gap-2">
        <h2 className="font-display text-h3 text-text-primary font-[600]">2. Orders and payment</h2>
        <p className="text-text-secondary">
          Orders are confirmed once payment is successfully processed. Prices shown at checkout are
          in Indian Rupees and include applicable taxes unless stated otherwise. Cards are
          personalized to the details you provide, so please review your order carefully before
          confirming payment.
        </p>
      </section>

      <section className="flex flex-col gap-2">
        <h2 className="font-display text-h3 text-text-primary font-[600]">3. Shipping</h2>
        <p className="text-text-secondary">
          We aim to dispatch orders promptly after your details are confirmed. Delivery timelines
          may vary depending on your location and are estimates, not guarantees.
        </p>
      </section>

      <section className="flex flex-col gap-2">
        <h2 className="font-display text-h3 text-text-primary font-[600]">4. Your profile content</h2>
        <p className="text-text-secondary">
          You are responsible for the accuracy and legality of everything you add to your profile
          page, including your name, links, photo, and any other content. Do not use Unitouch to
          publish content that is unlawful, misleading, or infringes on someone else&apos;s rights. We
          may suspend a profile that violates this section.
        </p>
      </section>

      <section className="flex flex-col gap-2">
        <h2 className="font-display text-h3 text-text-primary font-[600]">5. Acceptable use</h2>
        <p className="text-text-secondary">
          You agree not to misuse Unitouch, including attempting to access another user&apos;s account,
          disrupting the service, or using it for any unlawful purpose.
        </p>
      </section>

      <section className="flex flex-col gap-2">
        <h2 className="font-display text-h3 text-text-primary font-[600]">6. Cancellations, returns, and refunds</h2>
        <p className="text-text-secondary">
          Details on cancelling an order, returns, and refunds are covered in our{" "}
          <a href="/refunds" className="text-accent-purple hover:underline">
            Refund and Replacement Policy
          </a>
          .
        </p>
      </section>

      <section className="flex flex-col gap-2">
        <h2 className="font-display text-h3 text-text-primary font-[600]">7. Intellectual property</h2>
        <p className="text-text-secondary">
          The Unitouch name, logo, and website design belong to Unitouch. Content you add to your
          own profile remains yours.
        </p>
      </section>

      <section className="flex flex-col gap-2">
        <h2 className="font-display text-h3 text-text-primary font-[600]">8. Limitation of liability</h2>
        <p className="text-text-secondary">
          Unitouch is provided on an as is basis. To the extent permitted by law, we are not liable
          for indirect or consequential losses arising from your use of the service.
        </p>
      </section>

      <section className="flex flex-col gap-2">
        <h2 className="font-display text-h3 text-text-primary font-[600]">9. Governing law</h2>
        <p className="text-text-secondary">
          These terms are governed by the laws of India, and any disputes will be subject to the
          jurisdiction of the courts in India.
        </p>
      </section>

      <section className="flex flex-col gap-2">
        <h2 className="font-display text-h3 text-text-primary font-[600]">10. Changes to these terms</h2>
        <p className="text-text-secondary">
          We may update these terms from time to time. Continued use of Unitouch after a change
          means you accept the updated terms.
        </p>
      </section>

      <section className="flex flex-col gap-2">
        <h2 className="font-display text-h3 text-text-primary font-[600]">11. Contact us</h2>
        <p className="text-text-secondary">
          Questions about these terms can be sent to{" "}
          <a href="mailto:support@unitouch.in" className="text-accent-purple hover:underline">
            support@unitouch.in
          </a>
          .
        </p>
      </section>
    </main>
  );
}
