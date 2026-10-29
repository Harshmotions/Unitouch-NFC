import Link from "next/link";
import Button from "@/components/ui/Button";
import Card3D from "@/components/marketing/card3d/Card3D";
import { CARD_VARIANTS } from "@/lib/pricing";

const FROM_PRICE = Math.min(...CARD_VARIANTS.map((v) => v.price)).toLocaleString("en-IN");

/* First screen: the card itself, large and turning, in front of the name
   set wide across the whole page. The words that say what this is, the
   price and the one action sit along the bottom edge. The 3D scene loads
   after the page (Card3D); its still is the first paint. */
export default function Hero() {
  return (
    <section id="hero" className="relative overflow-clip px-[var(--margin)] pb-10 md:pb-12">
      {/* The wordmark, fitted to the full width by SVG textLength so it ends
          exactly on both margins at every width. Decorative: the h1 below
          carries the meaning. */}
      <svg
        aria-hidden
        viewBox="0 0 1000 148"
        className="hero-wordmark fill-bg-border block w-full overflow-visible pt-4 md:pt-6"
      >
        <text
          x="0"
          y="136"
          textLength="1000"
          lengthAdjust="spacingAndGlyphs"
          fontSize="176"
          className="font-wide"
        >
          UNITOUCH
        </text>
      </svg>

      <div className="hero-card relative -mx-[var(--margin)] -mt-[12vw] md:mx-auto md:-mt-[12.5vw] md:w-full md:max-w-[min(50rem,104svh)]">
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

      <div className="relative -mt-[2vw] grid gap-6 md:grid-cols-12 md:items-end md:gap-x-6 lg:-mt-[2vw]">
        <h1 className="font-display text-[clamp(2.125rem,0.9rem+3.8vw,4.25rem)] font-[650] md:col-span-12 lg:col-span-7">
          {/* Authored breaks: "Your business / card, in one tap" on a phone,
              "Your business card, / in one tap" from tablet up. */}
          <span className="rise-line">
            <span style={{ "--i": 0 } as React.CSSProperties}>
              Your business<span className="hidden md:inline"> card,</span>
            </span>
          </span>
          <span className="rise-line">
            <span style={{ "--i": 1 } as React.CSSProperties}>
              <span className="md:hidden">card, </span>in one tap
            </span>
          </span>
        </h1>

        <div className="flex flex-col gap-6 md:col-span-9 lg:col-span-5 lg:col-start-8 lg:pb-1">
          <p className="fade-in text-text-primary max-w-[36ch] text-[1.25rem] leading-[1.45]" style={{ "--i": 1 } as React.CSSProperties}>
            Unitouch is an NFC card that opens your live profile on any phone and saves your contact. No app
            needed.
          </p>
          <div className="fade-in flex flex-wrap items-center gap-x-6 gap-y-4" style={{ "--i": 2 } as React.CSSProperties}>
            <Button variant="primary" size="lg" href="/order" className="w-full sm:w-auto">
              Order your card, from ₹{FROM_PRICE}
            </Button>
            <Link href="/u/priya" className="link-draw font-[550]">
              See a demo profile
            </Link>
          </div>
          <p className="fade-in text-text-secondary text-[0.9375rem]" style={{ "--i": 3 } as React.CSSProperties}>
            Ships across India in 5 to 7 days. Works with iPhone and Android.
          </p>
        </div>
      </div>
    </section>
  );
}
