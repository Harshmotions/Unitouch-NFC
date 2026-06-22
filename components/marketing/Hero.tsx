"use client";

import { useEffect, useRef, useState } from "react";
import { ChevronDown } from "lucide-react";
import gsap from "gsap";
import Button from "@/components/ui/Button";
import HeroCard from "@/components/three/HeroCard";

export default function Hero() {
  const beamRef = useRef<HTMLDivElement>(null);
  const [scrolledPast, setScrolledPast] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolledPast(window.scrollY > 50);
    window.addEventListener("scroll", onScroll);
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  useEffect(() => {
    const prefersReducedMotion = window.matchMedia(
      "(prefers-reduced-motion: reduce)"
    ).matches;

    if (prefersReducedMotion) return;

    const tl = gsap.timeline();
    tl.from(".hero-headline", { y: 40, opacity: 0, duration: 1.2, ease: "expo.out" })
      .from(".hero-sub", { y: 20, opacity: 0, duration: 0.75, ease: "power2.out" }, "-=0.6")
      .from(".hero-ctas", { y: 20, opacity: 0, duration: 0.6, ease: "power2.out" }, "-=0.4")
      .from(".hero-stat", { opacity: 0, duration: 0.5, ease: "power2.out" }, "-=0.2")
      .from(".hero-card", { y: 30, opacity: 0, scale: 0.96, duration: 1.0, ease: "expo.out" }, "-=0.8");

    if (beamRef.current) {
      gsap.to(beamRef.current, {
        opacity: 0.7,
        duration: 0.05,
        repeat: -1,
        yoyo: true,
        repeatDelay: 3,
        ease: "power1.inOut",
      });
    }
  }, []);

  return (
    <section className="relative flex min-h-[100svh] flex-col items-center justify-center overflow-hidden bg-bg-base px-6 pt-24">
      <div
        className="pointer-events-none absolute inset-0"
        style={{
          background:
            "radial-gradient(circle at 50% 0%, var(--color-accent-glow), transparent 60%)",
        }}
      />

      <div
        ref={beamRef}
        className="pointer-events-none absolute top-0 left-1/2 h-[420px] w-px -translate-x-1/2"
        style={{
          background:
            "linear-gradient(to bottom, rgba(255,255,255,0.6), rgba(158,245,192,0.2), transparent)",
        }}
      />
      <div
        className="pointer-events-none absolute top-0 left-1/2 h-[420px] w-40 -translate-x-1/2 blur-3xl"
        style={{
          background:
            "radial-gradient(ellipse at top, rgba(158,245,192,0.15), transparent 70%)",
        }}
      />

      <div className="relative z-10 mx-auto flex w-full max-w-6xl flex-col items-center gap-12 text-center md:flex-row md:items-center md:justify-between md:text-left">
        <div className="flex flex-col items-center gap-6 md:items-start">
          <h1 className="hero-headline font-display text-hero text-text-primary font-[700] leading-[1.05]">
            Tap. Connect.
            <br />
            Impress Instantly.
          </h1>
          <p className="hero-sub text-text-secondary text-body-lg max-w-md">
            One NFC card. Your entire professional world. No app needed.
          </p>
          <div className="hero-ctas flex flex-wrap items-center justify-center gap-4 md:justify-start">
            <Button variant="primary" size="lg" href="/order">
              Order Your Card →
            </Button>
            <Button variant="ghost" size="lg" href="#profile-demo">
              See a Live Profile
            </Button>
          </div>
          <p className="hero-stat text-text-muted text-sm">
            One-time purchase. No subscriptions, ever.
          </p>
        </div>

        <div className="hero-card">
          <HeroCard />
        </div>
      </div>

      <div
        className={`absolute bottom-8 flex flex-col items-center gap-1 transition-opacity duration-300 ${
          scrolledPast ? "opacity-0" : "opacity-100"
        }`}
      >
        <span className="text-text-muted text-xs">Scroll</span>
        <ChevronDown className="text-text-muted size-4 animate-bounce" />
      </div>
    </section>
  );
}
