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
    <section id="features" className="px-6 py-24">
      <div className="mx-auto w-full max-w-6xl">
        <div className="mb-12 flex flex-col items-center gap-3 text-center">
          <span className="text-accent-purple border-accent-purple/30 rounded-full border px-3 py-1 text-xs">
            Features
          </span>
          <h2 className="font-display text-h2 text-text-primary font-[600]">
            Everything in one tap.
          </h2>
        </div>

        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {FEATURES.map(({ icon: Icon, title, description }) => (
            <div
              key={title}
              className="group bg-bg-elevated border-bg-border hover:border-accent-purple/30 rounded-2xl border p-6 transition-colors"
            >
              <div className="bg-accent-purple/10 text-accent-purple mb-4 flex size-10 items-center justify-center rounded-xl">
                <Icon className="size-5" />
              </div>
              <h3 className="font-display text-text-primary mb-1 font-[600]">{title}</h3>
              <p className="text-text-secondary text-sm">{description}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
