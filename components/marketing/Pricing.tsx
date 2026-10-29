import Image from "next/image";
import Button from "@/components/ui/Button";
import Reveal from "@/components/motion/Reveal";
import { CARD_VARIANTS, CUSTOM_PACKAGE } from "@/lib/pricing";
import { CARD_IMAGES } from "@/lib/card-images";

const BLURBS: Record<string, string> = {
  standard: "The card and your live profile. Everything you need to share yourself in one tap.",
  premium: "A finer finish, a faster design turnaround and a dashboard of who viewed and saved you.",
};

/* Two plans, two fields: they meet edge to edge at a hard line, the second
   one inverted so the step up reads at a glance. The price is the biggest
   thing in each, with the card itself tucked over its corner. */
export default function Pricing() {
  return (
    <section id="pricing" aria-labelledby="pricing-heading" className="scroll-mt-16">
      <div className="px-[var(--margin)] pt-8 pb-12 md:pt-12 md:pb-16">
        <h2 id="pricing-heading" className="font-display text-[clamp(2rem,1.3rem+3.2vw,3.75rem)] font-[650]">
          Pricing
        </h2>
        <p className="text-text-secondary mt-4 max-w-[46ch]">
          One payment, no subscription. Delivery anywhere in India is free.
        </p>
      </div>

      <div className="grid md:grid-cols-12">
        {CARD_VARIANTS.map((variant, i) => {
          const dark = i === 1;
          const image = CARD_IMAGES[variant.id as "standard" | "premium"];
          return (
            <Reveal
              key={variant.id}
              className={`flex flex-col px-[var(--margin)] py-14 md:min-h-[88svh] md:py-20 ${
                dark ? "bg-bg-ink text-text-on-ink md:col-span-7" : "bg-bg-subtle md:col-span-5"
              }`}
            >
              <h3 className="text-[1.5rem] font-[600]">{variant.name}</h3>
              <p className={`mt-2 max-w-[38ch] ${dark ? "text-text-on-ink/80" : "text-text-secondary"}`}>
                {BLURBS[variant.id]}
              </p>

              <div className="relative mt-10 mb-10 md:mt-auto">
                <p className="font-display tabular flex items-start text-[clamp(5.5rem,2rem+11vw,13rem)] leading-[0.85] font-[700] tracking-[-0.04em]">
                  <span className="mt-[0.08em] text-[0.45em]">₹</span>
                  {variant.price.toLocaleString("en-IN")}
                </p>
                <Image
                  src={image.src}
                  alt={image.alt}
                  width={1600}
                  height={915}
                  sizes="(min-width: 768px) 22vw, 50vw"
                  className="pointer-events-none absolute -top-[30%] right-0 w-[48%] max-w-[18rem] md:-top-[45%]"
                />
              </div>

              <ul className="flex flex-col gap-1.5 text-[1.25rem]">
                {variant.features.map((feature) => (
                  <li key={feature}>{feature}</li>
                ))}
              </ul>

              <div className="mt-10">
                <Button variant={dark ? "secondary" : "ink"} size="lg" href={`/order?card=${variant.id}`}>
                  Order {variant.name}
                </Button>
              </div>
            </Reveal>
          );
        })}
      </div>

      <p className="px-[var(--margin)] pt-10">
        Ordering for a team? We put together packages with bulk pricing and setup for everyone.{" "}
        <a href={CUSTOM_PACKAGE.href} className="font-[550] underline underline-offset-4">
          Email us about a team order
        </a>
      </p>
    </section>
  );
}
