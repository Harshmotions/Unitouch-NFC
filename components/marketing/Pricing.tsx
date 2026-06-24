import Button from "@/components/ui/Button";
import { CARD_VARIANTS } from "@/lib/pricing";

export default function Pricing() {
  return (
    <section id="pricing" className="bg-bg-subtle px-6 py-24">
      <div className="mx-auto w-full max-w-6xl">
        <div className="mb-12 flex flex-col items-center gap-3 text-center">
          <span className="text-accent-purple border-accent-purple/30 rounded-full border px-3 py-1 text-xs">
            Pricing
          </span>
          <h2 className="font-display text-h2 text-text-primary font-[600]">
            Simple pricing. No hidden fees.
          </h2>
        </div>

        <div className="grid grid-cols-1 gap-6 sm:grid-cols-3">
          {CARD_VARIANTS.map((variant) => (
            <div
              key={variant.id}
              className={`relative flex flex-col rounded-2xl border p-8 ${
                variant.isPopular
                  ? "border-accent-purple/40 bg-accent-purple/[0.04]"
                  : "border-bg-border bg-bg-elevated"
              }`}
            >
              {variant.isPopular && (
                <span className="bg-accent-purple text-bg-base absolute -top-3 left-8 rounded-full px-3 py-1 text-xs font-[600]">
                  MOST POPULAR
                </span>
              )}
              <h3 className="font-display text-text-primary mb-1 font-[600]">{variant.name}</h3>
              <p className="text-text-primary mb-4 text-3xl font-[700]">
                ₹{variant.price.toLocaleString("en-IN")}
              </p>
              <ul className="text-text-secondary mb-8 flex flex-1 flex-col gap-2 text-sm">
                {variant.features.map((feature) => (
                  <li key={feature}>{feature}</li>
                ))}
              </ul>
              <Button
                variant={variant.isPopular ? "primary" : "secondary"}
                size="md"
                href="/order"
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
