"use client";

import type { MouseEvent } from "react";
import type Lenis from "lenis";

declare global {
  interface Window {
    // Named distinctly from `window.lenis` — the lenis package itself
    // ambiently declares that property (a fixed devtools-detection shape),
    // which collides with storing the live instance there.
    lenisInstance?: Lenis;
  }
}

const NAV_OFFSET = -90;

/* Smooth-scrolls to an in-page hash target via the global Lenis instance
   (set up in SmoothScroll.tsx). Falls back to the native smooth scroll if
   Lenis hasn't mounted yet (e.g. reduced-motion users, where Lenis never
   initializes) or hasn't loaded. */
export function smoothScrollToHash(hash: string) {
  if (window.lenisInstance) {
    window.lenisInstance.scrollTo(hash, { offset: NAV_OFFSET });
    return;
  }
  document.querySelector(hash)?.scrollIntoView({ behavior: "smooth" });
}

/* Native browser hash navigation jumps instantly (or fights Lenis's
   animation if not prevented), so every in-page anchor link needs this
   handler instead of relying on default click behaviour. */
export function handleHashLinkClick(hash: string) {
  return (e: MouseEvent) => {
    e.preventDefault();
    smoothScrollToHash(hash);
  };
}

/* Smooth-scrolls to the very top of the page via Lenis, falling back to
   native smooth scroll the same way smoothScrollToHash does. */
export function smoothScrollToTop() {
  if (window.lenisInstance) {
    window.lenisInstance.scrollTo(0, { offset: 0 });
    return;
  }
  window.scrollTo({ top: 0, behavior: "smooth" });
}
