"use client";

import { useEffect, useState } from "react";
import Button from "@/components/ui/Button";

/* Thumb-reach order CTA that slides up from the bottom just after the hero
   (first screen) has been scrolled through, and hides again when the footer
   comes into view (so it doesn't stack on top of the footer's own CTA).
   Homepage only — mounted in the marketing layout. Reads #hero and
   #site-footer positions on scroll.

   Uses a scroll listener (like the navbar) rather than IntersectionObserver
   so it behaves predictably with Lenis smooth scroll. */

// Fraction of the hero (first screen) that must be scrolled past before the
// bar shows. 1 = exactly when the hero fully leaves the top; lower = earlier.
const SHOW_AFTER = 0.85;

export default function StickyOrderBar() {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const update = () => {
      const hero = document.getElementById("hero");
      const footer = document.getElementById("site-footer");
      // Show once the hero has been scrolled ~past the first screen.
      let scrolledPastHero = false;
      if (hero) {
        const r = hero.getBoundingClientRect();
        scrolledPastHero = r.height > 0 && -r.top >= r.height * SHOW_AFTER;
      }
      // At the footer once any part of it has entered the viewport.
      const atFooter = footer ? footer.getBoundingClientRect().top <= window.innerHeight : false;
      setVisible(scrolledPastHero && !atFooter);
    };

    update();
    window.addEventListener("scroll", update, { passive: true });
    window.addEventListener("resize", update);
    return () => {
      window.removeEventListener("scroll", update);
      window.removeEventListener("resize", update);
    };
  }, []);

  return (
    <div
      aria-hidden={!visible}
      // Inline transform (not Tailwind's translate-* utilities) so it animates
      // via transition-transform — in Tailwind v4 translate-* uses the separate
      // `translate` property, which transition-transform doesn't cover.
      style={{ transform: visible ? "translateY(0)" : "translateY(100%)" }}
      className={`fixed inset-x-0 bottom-0 z-40 transition-transform duration-300 ease-out motion-reduce:transition-none ${
        visible ? "" : "pointer-events-none"
      }`}
    >
      <div className="border-t border-white/[0.07] bg-bg-base/80 backdrop-blur-xl">
        <div className="mx-auto flex max-w-6xl items-center justify-between gap-4 px-6 py-3 pb-[calc(0.75rem+env(safe-area-inset-bottom))]">
          <p className="text-text-secondary text-sm font-[500] sm:text-base">Upgrade your first impression.</p>
          <Button variant="primary" size="sm" href="/order">
            Order your card
          </Button>
        </div>
      </div>
    </div>
  );
}
