import { CARD_VARIANTS } from "@/lib/pricing";

export default function ProductShowcase() {
  return (
    <section className="px-6 py-24 md:py-28">
      <div className="mx-auto w-full max-w-6xl">
        <div className="mb-16 flex flex-col items-center gap-4 text-center">
          <span className="eyebrow">Card Tiers</span>
          <h2 className="font-display text-h2 text-text-primary font-[600]">
            Three finishes. One standard.
          </h2>
        </div>

        <div className="grid grid-cols-1 gap-6 sm:grid-cols-3">
          {CARD_VARIANTS.map((variant) => (
            <div
              key={variant.id}
              className={`rounded-2xl p-8 transition-transform duration-300 hover:-translate-y-1 ${
                variant.isPopular ? "surface-card-accent" : "surface-card"
              }`}
            >
              <div
                className="mb-6 aspect-[3.5/2] rounded-xl border border-white/[0.08] shadow-[inset_0_1px_0_rgba(255,255,255,0.05)]"
                style={{
                  background:
                    "linear-gradient(135deg, var(--color-bg-subtle), var(--color-bg-base))",
                }}
              />
              <h3 className="font-display text-text-primary mb-1.5 font-[600]">{variant.name}</h3>
              <p className="text-text-primary mb-5 text-sm font-[500]">
                ₹{variant.price.toLocaleString("en-IN")}
              </p>
              <ul className="text-text-secondary flex flex-col gap-2.5 text-sm">
                {variant.features.map((feature) => (
                  <li key={feature}>{feature}</li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
