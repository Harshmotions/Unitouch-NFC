export default function PrivacyPage() {
  return (
    <main className="mx-auto flex min-h-screen max-w-3xl flex-col gap-6 px-6 py-24">
      <div>
        <h1 className="font-display text-h2 text-text-primary font-[600]">Privacy Policy</h1>
        <p className="text-text-muted mt-2 text-sm">Last updated: September 27, 2026</p>
      </div>

      <p className="text-text-secondary">
        This policy explains what information Unitouch collects when you order a card or use a
        Unitouch profile page, how that information is used, and the choices you have about it.
      </p>

      <section className="flex flex-col gap-2">
        <h2 className="font-display text-h3 text-text-primary font-[600]">1. Information we collect</h2>
        <p className="text-text-secondary">
          When you place an order, we collect your name, email address, phone number, and shipping
          address so we can produce and deliver your card. When you set up your profile, we collect
          whatever you choose to add to it, such as your designation, company, bio, photo, and any
          social or contact links. Payment details are handled directly by our payment provider; we
          do not store your card or bank information ourselves.
        </p>
        <p className="text-text-secondary">
          We also collect basic usage data about published profile pages, such as page views and
          which links are tapped, so profile owners can see how their card is performing.
        </p>
      </section>

      <section className="flex flex-col gap-2">
        <h2 className="font-display text-h3 text-text-primary font-[600]">2. How we use your information</h2>
        <p className="text-text-secondary">
          We use your information to process and ship your order, create and host your profile
          page, respond to support requests, and show you the view and save counts on your own
          profile. We do not sell your personal information to third parties.
        </p>
      </section>

      <section className="flex flex-col gap-2">
        <h2 className="font-display text-h3 text-text-primary font-[600]">3. Who we share it with</h2>
        <p className="text-text-secondary">
          We use trusted service providers to run Unitouch: Supabase for our database and login
          system, Vercel for hosting, and a payment processor for handling payments. These
          providers only receive the information needed to do their job and are not permitted to
          use it for their own purposes.
        </p>
      </section>

      <section className="flex flex-col gap-2">
        <h2 className="font-display text-h3 text-text-primary font-[600]">4. Your published profile</h2>
        <p className="text-text-secondary">
          A profile you publish at unitouch.in/u/yourname is public by design, since its purpose is
          to be shared with anyone who taps your card. Only include information on your profile
          that you are comfortable making public.
        </p>
      </section>

      <section className="flex flex-col gap-2">
        <h2 className="font-display text-h3 text-text-primary font-[600]">5. Data retention and deletion</h2>
        <p className="text-text-secondary">
          We keep your order and profile information for as long as your account is active. You can
          ask us to update, unpublish, or permanently delete your profile and account at any time by
          emailing support@unitouch.in.
        </p>
      </section>

      <section className="flex flex-col gap-2">
        <h2 className="font-display text-h3 text-text-primary font-[600]">6. Children&apos;s privacy</h2>
        <p className="text-text-secondary">
          Unitouch is intended for professional and business use and is not directed at children
          under 18.
        </p>
      </section>

      <section className="flex flex-col gap-2">
        <h2 className="font-display text-h3 text-text-primary font-[600]">7. Changes to this policy</h2>
        <p className="text-text-secondary">
          We may update this policy from time to time. If we make material changes, we will update
          the date at the top of this page.
        </p>
      </section>

      <section className="flex flex-col gap-2">
        <h2 className="font-display text-h3 text-text-primary font-[600]">8. Contact us</h2>
        <p className="text-text-secondary">
          Questions about this policy or your data can be sent to{" "}
          <a href="mailto:support@unitouch.in" className="text-accent-purple hover:underline">
            support@unitouch.in
          </a>
          .
        </p>
      </section>
    </main>
  );
}
