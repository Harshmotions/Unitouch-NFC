import { Nfc, RefreshCw, MessageCircle, Download, BarChart3, CreditCard } from "lucide-react";

const FEATURES = [
  {
    icon: Nfc,
    title: "Instant NFC Tap",
    description: "No QR, no fumbling, no app download.",
  },
  {
    icon: RefreshCw,
    title: "Live Digital Profile",
    description: "Update anytime, card stays the same.",
  },
  {
    icon: MessageCircle,
    title: "WhatsApp Direct Link",
    description: "One tap opens a chat.",
  },
  {
    icon: Download,
    title: "vCard Download",
    description: "Contacts saved in 2 seconds.",
  },
  {
    icon: BarChart3,
    title: "Full Analytics",
    description: "See who viewed your profile.",
  },
  {
    icon: CreditCard,
    title: "Premium Physical Card",
    description: "Matte dark finish, built to last.",
  },
];

export default function Features() {
  return (
    <section id="features" className="px-6 py-24 md:py-28">
      <div className="mx-auto w-full max-w-6xl">
        <div className="mb-16 flex flex-col items-center gap-4 text-center">
          <span className="eyebrow">Features</span>
          <h2 className="font-display text-h2 text-text-primary font-[600]">
            Everything in one tap.
          </h2>
        </div>

        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {FEATURES.map(({ icon: Icon, title, description }) => (
            <div
              key={title}
              className="surface-card rounded-2xl p-6 transition-all duration-300 hover:-translate-y-1 hover:border-accent-purple/25"
            >
              <div className="bg-accent-purple/10 text-accent-purple mb-5 flex size-10 items-center justify-center rounded-xl border border-accent-purple/15 shadow-[inset_0_1px_0_rgba(255,255,255,0.08)]">
                <Icon className="size-5" />
              </div>
              <h3 className="font-display text-text-primary mb-1.5 font-[600]">{title}</h3>
              <p className="text-text-secondary text-sm leading-relaxed">{description}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
