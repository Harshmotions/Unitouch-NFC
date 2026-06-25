const STEPS = [
  {
    title: "Order Your Card",
    duration: "5 minutes",
    description: "Pick a card type and enter your details. Takes about 5 minutes, no design skills needed.",
  },
  {
    title: "We Design It",
    duration: "24–48 hrs",
    description: "Our team builds your card layout and live profile, ready for a quick approval from you.",
  },
  {
    title: "Card is Printed",
    duration: "2–3 days",
    description: "Your approved design goes to print in a premium matte finish, built to last daily use.",
  },
  {
    title: "NFC Programmed",
    duration: "Same day",
    description: "We program the embedded chip to link straight to your live profile before it ships.",
  },
  {
    title: "Shipped to You",
    duration: "1–2 days",
    description: "Tracked shipping straight to your door, anywhere in India.",
  },
  {
    title: "Tap & Share",
    duration: "Forever",
    description: "Tap on the back of any phone to share everything instantly. No app, no battery, ever.",
  },
];

function StepNumber({ index, align }: { index: number; align: "start" | "end" }) {
  return (
    <div className={`flex items-center gap-3 ${align === "end" ? "justify-end" : ""}`}>
      {align === "end" && (
        <>
          <span className="text-accent-purple font-display text-3xl font-[700]">
            {String(index + 1).padStart(2, "0")}
          </span>
          <span className="bg-accent-purple size-2 shrink-0 rounded-full" />
          <span className="bg-accent-purple/50 hidden h-px w-8 md:block" />
        </>
      )}
      {align === "start" && (
        <>
          <span className="bg-accent-purple/50 hidden h-px w-8 md:block" />
          <span className="bg-accent-purple size-2 shrink-0 rounded-full" />
          <span className="text-accent-purple font-display text-3xl font-[700]">
            {String(index + 1).padStart(2, "0")}
          </span>
        </>
      )}
    </div>
  );
}

function StepContent({ title, duration, description }: { title: string; duration: string; description: string }) {
  return (
    <div className="mt-3">
      <div className="mb-2 flex items-center gap-2">
        <h3 className="font-display text-text-primary font-[600]">{title}</h3>
        <span className="bg-accent-purple/10 text-accent-purple inline-block rounded-full border border-accent-purple/15 px-2.5 py-0.5 text-xs">
          {duration}
        </span>
      </div>
      <p className="text-text-secondary max-w-sm text-sm leading-relaxed">{description}</p>
    </div>
  );
}

export default function HowItWorks() {
  return (
    <section id="how-it-works" className="bg-bg-subtle px-6 py-24 md:py-28">
      <div className="mx-auto w-full max-w-5xl">
        <div className="mb-20 flex flex-col items-center gap-4 text-center">
          <span className="eyebrow">The Process</span>
          <h2 className="font-display text-h2 text-text-primary font-[600]">
            From order to first tap in 5–7 days.
          </h2>
        </div>

        {/* Desktop / tablet — alternating sides along a central vertical line */}
        <div className="relative hidden md:block">
          <div className="absolute inset-y-0 left-1/2 w-px -translate-x-1/2 bg-white/25" />

          <div className="flex flex-col gap-14">
            {STEPS.map((step, i) => {
              const isRight = i % 2 === 0;
              return (
                <div key={step.title} className="relative grid grid-cols-2 items-start gap-x-10">
                  <div className={isRight ? "text-right" : ""}>
                    {!isRight && (
                      <>
                        <StepNumber index={i} align="end" />
                        <div className="flex justify-end">
                          <StepContent {...step} />
                        </div>
                      </>
                    )}
                  </div>
                  <div className={isRight ? "" : "text-right"}>
                    {isRight && (
                      <>
                        <StepNumber index={i} align="start" />
                        <StepContent {...step} />
                      </>
                    )}
                  </div>

                  <span className="border-accent-purple bg-bg-subtle absolute top-[18px] left-1/2 size-3 -translate-x-1/2 -translate-y-1/2 rounded-full border-2" />
                </div>
              );
            })}
          </div>
        </div>

        {/* Mobile — single left-rail timeline */}
        <div className="flex flex-col gap-10 md:hidden">
          {STEPS.map((step, i) => (
            <div key={step.title} className="relative flex gap-4">
              {i < STEPS.length - 1 && (
                <span className="absolute top-7 left-[7px] h-[calc(100%+1.5rem)] w-px bg-white/15" />
              )}
              <span className="border-accent-purple bg-bg-subtle relative z-10 mt-1.5 size-4 shrink-0 rounded-full border-2" />
              <div>
                <span className="text-accent-purple font-display text-2xl font-[700]">
                  {String(i + 1).padStart(2, "0")}
                </span>
                <StepContent {...step} />
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
