export default function ContactPage() {
  return (
    <main className="mx-auto flex min-h-screen max-w-3xl flex-col gap-6 px-6 py-24">
      <h1 className="font-display text-h2 text-text-primary font-[600]">Contact Us</h1>

      <p className="text-text-secondary">
        Have a question about your order, your profile, or anything else? We are happy to help.
      </p>

      <div className="surface-card flex flex-col gap-1 rounded-2xl p-6">
        <p className="text-text-muted text-sm">Email</p>
        <a
          href="mailto:support@unitouch.in"
          className="font-display text-text-primary text-lg font-[600] hover:underline"
        >
          support@unitouch.in
        </a>
      </div>

      <p className="text-text-secondary text-sm">
        We aim to reply to every message within 1 to 2 business days.
      </p>
    </main>
  );
}
