import { preload } from "react-dom";
import { Check } from "lucide-react";
import Button from "@/components/ui/Button";
import Card3D from "@/components/marketing/card3d/Card3D";
import FabricShade from "@/components/marketing/FabricShade";
import { CARD_VARIANTS } from "@/lib/pricing";

const FROM_PRICE = Math.min(...CARD_VARIANTS.map((v) => v.price)).toLocaleString("en-IN");

const FACTS = [`From ₹${FROM_PRICE}, one payment`, "Free delivery in 5 to 7 days", "Works with iPhone and Android"];

/* First screen: what it is and the one action on the left; the card itself
   on the right, turning slowly and casting a soft shadow on the wall
   behind it, while light through a sheer curtain drifts across the whole
   hero (it runs up behind the see-through navigation bar too). On load the
   card floats up into place out of a blur (CSS, on its still, so it plays
   on the first paint); the live 3D scene takes over once the page is idle.
   The hero stops short of the fold so the next section's band peeks in. */
export default function Hero() {
  // The fabric shadow's still is a CSS background, which the browser would
  // otherwise find only after the stylesheet; it covers the hero, so it
  // counts as the page's largest paint. It's 4 KB.
  preload("/home/fabric-shade.webp", { as: "image", fetchPriority: "high" });
  return (
    <section id="hero" className="relative -mt-16 overflow-clip pt-16 md:-mt-[4.5rem] md:pt-[4.5rem]">
      <FabricShade />
      <div className="container-page relative grid items-center gap-y-4 pt-10 pb-12 md:pt-14 lg:min-h-[calc(100svh-4.5rem-clamp(7rem,20svh,12rem))] lg:grid-cols-12 lg:gap-x-8 lg:py-8">
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

        {/* The card's canvas runs out to the edge of the screen on the right,
            so the turning card has room and is never cut off. */}
        <div className="relative lg:col-span-6 lg:-mr-10 xl:-mr-[min(12rem,max(2.5rem,calc(50vw-35.5rem)))]">
          <div className="hero-card feather relative">
            <Card3D
              poster="/cards/hero-card.webp"
              posterAlt="A matte black Unitouch NFC business card printed with the owner's name, Priya Anand, and her title"
              posterWidth={1500}
              posterHeight={1200}
              priority
              className="aspect-[5/4] w-full"
              fill={0.7}
            />
          </div>
        </div>
      </div>
    </section>
  );
}
