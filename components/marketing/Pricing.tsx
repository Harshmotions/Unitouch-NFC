import Button from "@/components/ui/Button";
import { CARD_VARIANTS } from "@/lib/pricing";

export default function Pricing() {
  return (
    <section id="pricing" className="bg-bg-subtle px-6 py-24 md:py-28">
      <div className="mx-auto w-full max-w-6xl">
        <div className="mb-16 flex flex-col items-center gap-4 text-center">
          <span className="eyebrow">Pricing</span>
          <h2 className="font-display text-h2 text-text-primary font-[600]">
            Simple pricing. No hidden fees.
          </h2>
        </div>

        <div className="grid grid-cols-1 gap-6 sm:grid-cols-3">
          {CARD_VARIANTS.map((variant) => (
            <div
              key={variant.id}
              className={`relative flex flex-col rounded-2xl p-8 transition-transform duration-300 hover:-translate-y-1 ${
                variant.isPopular ? "surface-card-accent" : "surface-card"
              }`}
            >
              {variant.isPopular && (
                <span className="bg-accent-purple text-bg-base absolute -top-3 left-8 rounded-full px-3 py-1 text-xs font-[600] tracking-wide shadow-[0_6px_18px_-4px_var(--color-accent-purple-glow)]">
                  MOST POPULAR
                </span>
              )}
              <h3 className="font-display text-text-primary mb-1.5 font-[600]">{variant.name}</h3>
              <p className="text-text-primary mb-5 text-3xl font-[700] tracking-tight">
                ₹{variant.price.toLocaleString("en-IN")}
              </p>
              <ul className="text-text-secondary mb-8 flex flex-1 flex-col gap-2.5 text-sm">
                {variant.features.map((feature) => (
                  <li key={feature}>{feature}</li>
                ))}
              </ul>
              <Button
                variant={variant.isPopular ? "primary" : "secondary"}
                size="md"
                href={`/order?card=${variant.id}`}
                className="w-full"
              >
                Order This Card →
              </Button>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
