import { BUSINESS } from "@/lib/business";
import { pageMetadata } from "@/lib/seo";

export const metadata = pageMetadata({
  title: "Contact us",
  description: "Questions about your Unitouch card, order or profile? Reach us by email or phone.",
  path: "/contact",
});

export default function ContactPage() {
  return (
    <main className="mx-auto flex min-h-screen max-w-3xl flex-col gap-6 px-6 py-24">
      <h1 className="font-display text-h2 text-text-primary font-[600]">Contact Us</h1>

      <p className="text-text-secondary">
        Have a question about your order, your profile, or anything else? We are happy to help.
      </p>

      <div className="surface-card flex flex-col gap-5 rounded-2xl p-6">
        <div className="flex flex-col gap-1">
          <p className="text-text-muted text-sm">Business name</p>
          <p className="font-display text-text-primary text-lg font-[600]">{BUSINESS.legalName}</p>
        </div>

        <div className="flex flex-col gap-1">
          <p className="text-text-muted text-sm">Email</p>
          <a
            href={`mailto:${BUSINESS.email}`}
            className="font-display text-text-primary text-lg font-[600] hover:underline"
          >
            {BUSINESS.email}
          </a>
        </div>

        <div className="flex flex-col gap-1">
          <p className="text-text-muted text-sm">Phone</p>
          <a
            href={`tel:${BUSINESS.phone}`}
            className="font-display text-text-primary text-lg font-[600] hover:underline"
          >
            {BUSINESS.phoneDisplay}
          </a>
        </div>

        <div className="flex flex-col gap-1">
          <p className="text-text-muted text-sm">Address</p>
          <address className="font-display text-text-primary text-lg font-[600] not-italic">
            {BUSINESS.addressLines.map((line) => (
              <span key={line} className="block">
                {line}
              </span>
            ))}
          </address>
        </div>
      </div>

      <p className="text-text-secondary text-sm">
        We aim to reply to every message within 1 to 2 business days.
      </p>
    </main>
  );
}
