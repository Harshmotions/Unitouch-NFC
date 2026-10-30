import Image from "next/image";
import { Check } from "lucide-react";
import Button from "@/components/ui/Button";
import Reveal from "@/components/motion/Reveal";
import { CARD_VARIANTS, CUSTOM_PACKAGE } from "@/lib/pricing";
import { CARD_IMAGES } from "@/lib/card-images";

const BLURBS: Record<string, string> = {
  standard: "The card and your live profile. Everything you need to share yourself in one tap.",
  premium: "A finer finish, faster design turnaround and a dashboard of who viewed and saved you.",
};

/* Two plans side by side in a centred column, the second one inverted so
   the step up reads at a glance. */
export default function Pricing() {
  return (
    <section id="pricing" aria-labelledby="pricing-heading" className="scroll-mt-16 py-24 md:py-32">
      <div className="container-page">
        <div className="mx-auto max-w-[40rem] text-center">
          <h2 id="pricing-heading" className="font-display text-[length:var(--text-h2)] font-[600]">
            Simple pricing
          </h2>
          <p className="text-text-secondary mt-4 text-[1.0625rem]">
            One payment, no subscription. Delivery anywhere in India is free.
          </p>
        </div>

        <Reveal className="mx-auto mt-14 grid max-w-[60rem] gap-6 md:grid-cols-2">
          {CARD_VARIANTS.map((variant, i) => {
            const dark = i === 1;
            const image = CARD_IMAGES[variant.id as "standard" | "premium"];
            return (
              <div
                key={variant.id}
                className={`flex flex-col rounded-[24px] p-7 md:p-9 ${dark ? "bg-bg-ink text-text-on-ink" : "bg-bg-elevated"}`}
              >
                <div className={`-mx-2 -mt-2 mb-6 rounded-[16px] ${dark ? "bg-white/[0.04]" : "bg-bg-base"}`}>
                  <Image
                    src={image.src}
                    alt={image.alt}
                    width={1600}
                    height={1100}
                    sizes="(min-width: 768px) 26rem, 90vw"
                    className="mx-auto w-[82%]"
                  />
                </div>
                <div className="flex items-baseline justify-between gap-4">
                  <h3 className="font-display text-[1.375rem] font-[600]">{variant.name}</h3>
                  <p className="font-display tabular text-[2.5rem] leading-none font-[600] tracking-[-0.03em]">
                    ₹{variant.price.toLocaleString("en-IN")}
                  </p>
                </div>
                <p className={`mt-3 text-[0.9375rem] leading-relaxed ${dark ? "text-text-on-ink/75" : "text-text-secondary"}`}>
                  {BLURBS[variant.id]}
                </p>

                <ul className="mt-6 flex flex-col gap-3 text-[0.9375rem]">
                  {variant.features.map((feature) => (
                    <li key={feature} className="flex items-center gap-3">
                      <Check aria-hidden className={`size-4 shrink-0 ${dark ? "text-text-on-ink" : "text-accent"}`} strokeWidth={2.25} />
                      {feature}
                    </li>
                  ))}
                </ul>

                <Button
                  variant={dark ? "glass-dark" : "primary"}
                  size="lg"
                  href={`/order?card=${variant.id}`}
                  className="mt-8 w-full"
                >
                  Order {variant.name}
                </Button>
              </div>
            );
          })}
        </Reveal>

        <p className="text-text-secondary mx-auto mt-10 max-w-[40rem] text-center text-[0.9375rem]">
          Ordering for a team? We put together packages with bulk pricing and setup for everyone.{" "}
          <a href={CUSTOM_PACKAGE.href} className="text-text-primary font-[500] underline underline-offset-4">
            Email us
          </a>
        </p>
      </div>
    </section>
  );
}
