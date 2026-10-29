import { Check } from "lucide-react";
import Button from "@/components/ui/Button";
import Card3D from "@/components/marketing/card3d/Card3D";
import { CARD_VARIANTS } from "@/lib/pricing";

const FROM_PRICE = Math.min(...CARD_VARIANTS.map((v) => v.price)).toLocaleString("en-IN");

const FACTS = [`From ₹${FROM_PRICE}, one payment`, "Free delivery in 5 to 7 days", "Works with iPhone and Android"];

/* First screen: what it is and the one action on the left; the card itself
   on the right, turning slowly under a soft studio light. On load the card
   floats up into place out of a blur (CSS, on its still, so it plays on the
   first paint); the live 3D scene takes over once the page is idle. */
export default function Hero() {
  return (
    <section id="hero" className="relative overflow-clip">
      <div className="container-page grid items-center gap-y-6 pt-10 pb-16 md:pt-14 lg:min-h-[calc(100svh-4.5rem)] lg:grid-cols-12 lg:gap-x-8 lg:py-12">
        <div className="lg:col-span-6">
          <p className="fade-in text-text-secondary mb-5 text-[0.9375rem] font-[500]" style={{ "--i": 0 } as React.CSSProperties}>
            NFC business cards, made in India
          </p>
          <h1 className="font-display text-[clamp(2.375rem,1.5rem+2.3vw,3.5rem)] leading-[1.03] font-[600]">
            <span className="rise-line">
              <span className="lg:whitespace-nowrap" style={{ "--i": 0 } as React.CSSProperties}>Your business card,</span>
            </span>
            <span className="rise-line">
              <span style={{ "--i": 1 } as React.CSSProperties}>in one tap</span>
            </span>
          </h1>
          <p
            className="fade-in text-text-secondary mt-6 max-w-[34ch] text-[1.125rem] leading-relaxed md:text-[1.1875rem]"
            style={{ "--i": 1 } as React.CSSProperties}
          >
            Unitouch is an NFC card that opens your live profile on any phone and saves your contact. No app needed.
          </p>
          <div className="fade-in mt-8 flex flex-wrap gap-3" style={{ "--i": 2 } as React.CSSProperties}>
            <Button variant="primary" size="lg" href="/order">
              Order your card
            </Button>
            <Button variant="secondary" size="lg" href="/u/priya">
              See a demo profile
            </Button>
          </div>
          <ul
            className="fade-in text-text-secondary mt-8 flex flex-col gap-2 text-[0.9375rem]"
            style={{ "--i": 3 } as React.CSSProperties}
          >
            {FACTS.map((fact) => (
              <li key={fact} className="flex items-center gap-2.5">
                <Check aria-hidden className="text-accent size-4 shrink-0" strokeWidth={2.25} />
                {fact}
              </li>
            ))}
          </ul>
        </div>

        <div className="relative lg:col-span-6 lg:-mr-[18%] lg:-ml-[2%]">
          {/* Soft studio light behind the card: a pale pool, no colour. */}
          <div aria-hidden className="hero-light pointer-events-none absolute inset-[-10%]" />
          <div className="hero-card relative">
            <Card3D
              poster="/cards/hero-card.webp"
              posterAlt="The Unitouch NFC business card in matte black, with the fingerprint U logo and wordmark in gloss"
              posterWidth={1600}
              posterHeight={1000}
              priority
              className="aspect-[16/10] w-full"
              fill={0.72}
            />
          </div>
        </div>
      </div>
    </section>
  );
}
