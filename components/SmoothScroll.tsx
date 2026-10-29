"use client";

import { useEffect } from "react";
import Lenis from "lenis";

export default function SmoothScroll() {
  useEffect(() => {
    const prefersReducedMotion = window.matchMedia(
      "(prefers-reduced-motion: reduce)"
    ).matches;
    if (prefersReducedMotion) return;

    const lenis = new Lenis({
      duration: 1.1,
      easing: (t) => 1 - Math.pow(1 - t, 3),
      smoothWheel: true,
    });

    // Lenis's own built-in `anchors` option never calls preventDefault, so
    // the native instant hash-jump still wins the race against its smooth
    // scroll. Exposing the instance lets lib/scroll.ts drive scrollTo
    // directly from explicit click handlers instead.
    window.lenisInstance = lenis;

    // Hold the page still while the first-visit loader covers it.
    const release = () => lenis.start();
    if (document.documentElement.classList.contains("loading")) {
      lenis.stop();
      window.addEventListener("unitouch:loaded", release, { once: true });
    }

    let frameId: number;
    function raf(time: number) {
      lenis.raf(time);
      frameId = requestAnimationFrame(raf);
    }
    frameId = requestAnimationFrame(raf);

    return () => {
      cancelAnimationFrame(frameId);
      window.removeEventListener("unitouch:loaded", release);
      lenis.destroy();
      window.lenisInstance = undefined;
    };
  }, []);

  return null;
}
