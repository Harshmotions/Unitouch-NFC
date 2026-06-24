const STEPS = [
  { title: "Order Your Card", duration: "5 minutes" },
  { title: "We Design It", duration: "24–48 hrs" },
  { title: "Card is Printed", duration: "2–3 days" },
  { title: "NFC Programmed", duration: "Same day" },
  { title: "Shipped to You", duration: "1–2 days" },
  { title: "Tap & Share", duration: "Forever" },
];

export default function HowItWorks() {
  return (
    <section id="how-it-works" className="bg-bg-subtle px-6 py-24 md:py-28">
      <div className="mx-auto w-full max-w-6xl">
        <div className="mb-16 flex flex-col items-center gap-4 text-center">
          <span className="eyebrow">The Process</span>
          <h2 className="font-display text-h2 text-text-primary font-[600]">
            From order to first tap in 5–7 days.
          </h2>
        </div>

        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {STEPS.map((step, i) => (
            <div
              key={step.title}
              className="surface-card relative rounded-2xl p-6 transition-transform duration-300 hover:-translate-y-1"
            >
              <span className="text-accent-purple font-display mb-3 block text-2xl font-[700]">
                {String(i + 1).padStart(2, "0")}
              </span>
              <h3 className="font-display text-text-primary mb-3 font-[600]">{step.title}</h3>
              <span className="bg-accent-purple/10 text-accent-purple inline-block rounded-full border border-accent-purple/15 px-3 py-1 text-xs">
                {step.duration}
              </span>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
