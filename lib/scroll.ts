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

// Lenis already honours each section's scroll-margin (scroll-mt-16, the
// header's height), so this is just the breathing room below the header.
const NAV_OFFSET = -24;

/* Smooth-scrolls to an in-page hash target via the global Lenis instance
   (set up in SmoothScroll.tsx). Falls back to the native smooth scroll if
   Lenis hasn't mounted yet (e.g. reduced-motion users, where Lenis never
   initializes) or hasn't loaded. */
export function smoothScrollToHash(hash: string) {
  if (window.lenisInstance) {
    // force: scroll even if Lenis was just stopped (the mobile menu stops it
    // while open, and a link in it closes the menu and scrolls at once).
    window.lenisInstance.start();
    window.lenisInstance.scrollTo(hash, { offset: NAV_OFFSET, force: true });
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

/* Arriving on the homepage from another page with a section link (/#faq):
   scroll to that section once the page (and the first-visit loader) is
   ready, then drop the hash from the address bar, since every section is
   on this one page. */
export function settleArrivalHash() {
  const hash = window.location.hash;
  if (!hash || !document.querySelector(hash)) return;
  const go = () =>
    requestAnimationFrame(() => {
      smoothScrollToHash(hash);
      history.replaceState(history.state, "", window.location.pathname + window.location.search);
    });
  if (document.documentElement.classList.contains("loading")) {
    window.addEventListener("unitouch:loaded", go, { once: true });
  } else go();
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
