import { CARD_VARIANTS } from "@/lib/pricing";

export default function ProductShowcase() {
  return (
    <section className="px-6 py-24">
      <div className="mx-auto w-full max-w-6xl">
        <div className="mb-12 flex flex-col items-center gap-3 text-center">
          <span className="text-accent-amber border-accent-amber/30 rounded-full border px-3 py-1 text-xs">
            Card Tiers
          </span>
          <h2 className="font-display text-h2 text-text-primary font-[600]">
            Three finishes. One standard.
          </h2>
        </div>

        <div className="grid grid-cols-1 gap-6 sm:grid-cols-3">
          {CARD_VARIANTS.map((variant) => (
            <div
              key={variant.id}
              className={`rounded-2xl border p-8 ${
                variant.isPopular
                  ? "border-accent-amber/40 bg-accent-amber/[0.04]"
                  : "border-bg-border bg-bg-elevated"
              }`}
            >
              <div
                className="mb-6 aspect-[3.5/2] rounded-xl border border-white/10"
                style={{
                  background:
                    "linear-gradient(135deg, var(--color-bg-subtle), var(--color-bg-base))",
                }}
              />
              <h3 className="font-display text-text-primary mb-1 font-[600]">{variant.name}</h3>
              <p className="text-text-secondary mb-4 text-sm">₹{variant.price.toLocaleString("en-IN")}</p>
              <ul className="text-text-secondary flex flex-col gap-2 text-sm">
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
