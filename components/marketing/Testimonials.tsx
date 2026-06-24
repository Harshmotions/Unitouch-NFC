import { User } from "lucide-react";

const TESTIMONIALS = [
  {
    name: "Aanya Sharma",
    role: "Founder, Loomstudio",
    quote: "I stopped carrying paper cards the day mine arrived. People just tap and save my number — no typos, no app.",
  },
  {
    name: "Vikram Nair",
    role: "Sales Lead, Northbridge",
    quote: "Conversations at events end with a tap now instead of a fumble for a pen. It's a small thing that makes a big first impression.",
  },
  {
    name: "Priya Iyer",
    role: "Independent Consultant",
    quote: "I update my profile whenever my offerings change and the card never needs reprinting. That alone paid for itself.",
  },
  {
    name: "Karan Bhatia",
    role: "Co-founder, Driftwork",
    quote: "Our whole team ordered the Team Pack. Onboarding new hires with a card now takes minutes instead of a design request.",
  },
];

export default function Testimonials() {
  return (
    <section className="px-6 py-24 md:py-28">
      <div className="mx-auto w-full max-w-6xl">
        <div className="mb-16 flex flex-col items-center gap-4 text-center">
          <span className="eyebrow">Placeholder Testimonials</span>
          <h2 className="font-display text-h2 text-text-primary font-[600]">
            What people say about Unitouch.
          </h2>
        </div>

        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
          {TESTIMONIALS.map((t) => (
            <div key={t.name} className="surface-card rounded-2xl p-7">
              <p className="text-text-primary/90 mb-6 text-[15px] leading-relaxed">“{t.quote}”</p>
              <div className="flex items-center gap-3">
                <div className="bg-accent-purple/10 text-accent-purple flex size-10 items-center justify-center rounded-full border border-accent-purple/15">
                  <User className="size-5" />
                </div>
                <div>
                  <p className="font-display text-text-primary text-sm font-[600]">{t.name}</p>
                  <p className="text-text-muted text-xs">{t.role}</p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
