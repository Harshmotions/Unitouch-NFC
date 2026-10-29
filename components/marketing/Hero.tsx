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
   card floats up and tilts into place (CSS, on its still, so it plays
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
      {/* Three blocks: the words, the card, the actions. On a phone they
          stack in that order, so the card sits between the promise and the
          buttons and the whole first screen (words, card, both actions)
          fits without scrolling. On desktop the words and actions share the
          left column and the card spans both rows on the right. */}
      <div className="container-page relative grid pt-5 pb-10 md:pt-14 lg:min-h-[calc(100svh-4.5rem-clamp(7rem,20svh,12rem))] lg:grid-cols-12 lg:grid-rows-[auto_auto] lg:content-center lg:gap-x-8 lg:py-8">
        <div className="lg:col-span-6 lg:row-start-1 lg:self-end">
          <p className="fade-in text-text-secondary mb-3 text-[0.875rem] font-[500] md:mb-5 md:text-[0.9375rem]" style={{ "--i": 0 } as React.CSSProperties}>
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
            className="fade-in text-text-secondary mt-4 max-w-[34ch] text-[1.0625rem] leading-relaxed md:mt-6 md:text-[1.1875rem]"
            style={{ "--i": 1 } as React.CSSProperties}
          >
            Unitouch is an NFC card that opens your live profile on any phone and saves your contact. No app needed.
          </p>
        </div>

        {/* The card's canvas runs out to the edges of the screen (on a phone
            both sides, on desktop the right), so the turning card has room
            and is never cut off. On a phone its empty top and bottom margins
            tuck under the words and buttons. */}
        <div className="relative -mx-5 -my-5 sm:mx-0 lg:col-span-6 lg:col-start-7 lg:row-span-2 lg:row-start-1 lg:-mr-10 lg:my-0 lg:self-center xl:-mr-[min(12rem,max(2.5rem,calc(50vw-35.5rem)))]">
          <div className="hero-card feather relative">
            <Card3D
              poster="/cards/hero-card.webp"
              posterAlt="A matte black Unitouch NFC business card printed with a name and title"
              posterWidth={1500}
              posterHeight={1200}
              priority
              className="aspect-[5/4] w-full"
              fill={0.7}
            />
          </div>
        </div>

        <div className="lg:col-span-6 lg:row-start-2 lg:self-start">
          <div className="fade-in mt-0 grid grid-cols-2 gap-3 sm:flex sm:flex-wrap lg:mt-8" style={{ "--i": 2 } as React.CSSProperties}>
            <Button variant="primary" size="lg" href="/order" className="max-sm:h-13 max-sm:px-4">
              Order your card
            </Button>
            <Button variant="secondary" size="lg" href="/u/priya" className="max-sm:h-13 max-sm:px-4">
              <span className="sm:hidden">Demo profile</span>
              <span className="hidden sm:inline">See a demo profile</span>
            </Button>
          </div>
          <ul
            className="fade-in text-text-secondary mt-5 flex flex-wrap gap-x-4 gap-y-1.5 text-[0.875rem] md:mt-8 md:flex-col md:gap-2 md:text-[0.9375rem]"
            style={{ "--i": 3 } as React.CSSProperties}
          >
            {FACTS.map((fact) => (
              <li key={fact} className="flex items-center gap-2 md:gap-2.5">
                <Check aria-hidden className="text-accent size-4 shrink-0" strokeWidth={2.25} />
                {fact}
              </li>
            ))}
          </ul>
        </div>
      </div>
    </section>
  );
}
