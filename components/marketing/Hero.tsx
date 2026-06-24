"use client";

import { useEffect, useState } from "react";
import { ChevronDown, Zap, RefreshCw, BarChart3 } from "lucide-react";
import gsap from "gsap";
import Button from "@/components/ui/Button";

const BADGES = [
  { icon: Zap, label: "Instant NFC Tap" },
  { icon: RefreshCw, label: "Always Editable" },
  { icon: BarChart3, label: "Profile Analytics" },
];

const STARFIELD = [
  "radial-gradient(1px 1px at 78% 12%, rgba(255,255,255,0.5) 1px, transparent 0)",
  "radial-gradient(1px 1px at 85% 30%, rgba(255,255,255,0.35) 1px, transparent 0)",
  "radial-gradient(1px 1px at 70% 22%, rgba(255,255,255,0.3) 1px, transparent 0)",
  "radial-gradient(1px 1px at 92% 45%, rgba(255,255,255,0.4) 1px, transparent 0)",
  "radial-gradient(1px 1px at 65% 55%, rgba(255,255,255,0.25) 1px, transparent 0)",
  "radial-gradient(1px 1px at 80% 65%, rgba(255,255,255,0.3) 1px, transparent 0)",
].join(", ");

export default function Hero() {
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

    gsap
      .timeline()
      .from(".hero-badge", { y: 16, opacity: 0, duration: 0.6, ease: "power2.out" })
      .from(".hero-headline", { y: 40, opacity: 0, duration: 1.2, ease: "expo.out" }, "-=0.2")
      .from(".hero-sub", { y: 20, opacity: 0, duration: 0.75, ease: "power2.out" }, "-=0.6")
      .from(".hero-ctas", { y: 20, opacity: 0, duration: 0.6, ease: "power2.out" }, "-=0.4")
      .from(".hero-stat-badge", { y: 12, opacity: 0, duration: 0.5, stagger: 0.1, ease: "power2.out" }, "-=0.2")
      .from(".hero-visual-slot", { opacity: 0, scale: 0.96, duration: 1.0, ease: "expo.out" }, "-=0.8");
  }, []);

  return (
    <section className="relative isolate flex min-h-[100svh] flex-col overflow-hidden bg-bg-base px-6 pt-24 pb-16">
      {/* ambient page-wide wash */}
      <div
        className="pointer-events-none absolute inset-0"
        style={{
          background:
            "radial-gradient(ellipse 90% 70% at 65% 35%, var(--color-accent-amber-glow-soft), transparent 65%)",
        }}
      />

      {/* spotlight beam + starfield + corona, anchored over the right-side visual slot */}
      <div className="pointer-events-none absolute inset-0 hidden md:block">
        <div
          className="absolute inset-0"
          style={{ backgroundImage: STARFIELD, backgroundRepeat: "no-repeat" }}
        />
        {/* wide soft corona behind the card */}
        <div
          className="absolute top-[8%] h-[80%] w-[520px] -translate-x-1/2 blur-[80px]"
          style={{
            left: "76%",
            background:
              "radial-gradient(ellipse at center, var(--color-accent-amber-glow-soft), transparent 70%)",
          }}
        />
        {/* tighter bright glow directly behind the card */}
        <div
          className="absolute top-[12%] h-[60%] w-[320px] -translate-x-1/2 blur-3xl"
          style={{
            left: "76%",
            background:
              "radial-gradient(ellipse at center, var(--color-accent-amber-glow), transparent 70%)",
          }}
        />
        {/* light pooling beneath the card */}
        <div
          className="absolute bottom-[10%] h-32 w-[360px] -translate-x-1/2 blur-2xl"
          style={{ left: "76%", background: "var(--color-accent-amber-glow-soft)" }}
        />
        {/* vertical beam */}
        <div
          className="absolute top-0 h-[65%] w-px -translate-x-1/2"
          style={{
            left: "76%",
            background:
              "linear-gradient(to bottom, rgba(255,255,255,0.9), var(--color-accent-amber) 30%, transparent 85%)",
          }}
        />
        <div
          className="absolute top-0 size-16 -translate-x-1/2 -translate-y-1/2 rounded-full blur-2xl"
          style={{ left: "76%", background: "rgba(255,255,255,0.8)" }}
        />
      </div>

      <div className="relative z-10 mx-auto flex w-full max-w-6xl flex-1 flex-col items-center justify-center gap-12 md:flex-row md:items-center md:justify-between">
        <div className="flex flex-col items-start gap-6 text-left">
          <span className="hero-badge border-accent-amber/30 bg-accent-amber/10 text-accent-amber rounded-full border px-4 py-1.5 text-xs font-[500]">
            NFC Business Cards, Reinvented
          </span>
          <h1 className="hero-headline font-display text-hero from-text-primary to-text-secondary bg-gradient-to-b bg-clip-text font-[700] leading-[1.05] text-transparent">
            Tap. Connect.
            <br />
            Impress Instantly.
          </h1>
          <p className="hero-sub text-text-secondary text-body-lg max-w-md">
            One NFC card. Your entire professional world. No app needed.
          </p>
          <div className="hero-ctas flex flex-wrap items-center gap-4">
            <Button variant="primary" size="lg" href="/order">
              Order Your Card →
            </Button>
            <Button variant="secondary" size="lg" href="#profile-demo">
              See a Live Profile
            </Button>
          </div>
          <div className="flex flex-wrap items-center gap-3">
            {BADGES.map(({ icon: Icon, label }) => (
              <span
                key={label}
                className="hero-stat-badge border-bg-border bg-bg-elevated/60 text-text-secondary flex items-center gap-2 rounded-full border px-3 py-1.5 text-xs"
              >
                <Icon className="text-accent-amber size-3.5" />
                {label}
              </span>
            ))}
          </div>
        </div>

        <div className="hero-visual-slot border-accent-amber/20 bg-bg-elevated/40 relative h-[460px] w-full max-w-[380px] shrink-0 rounded-[2rem] border shadow-[0_0_80px_var(--color-accent-amber-glow-soft)] md:h-[560px]" />
      </div>

      <div
        className={`absolute bottom-8 left-1/2 flex -translate-x-1/2 flex-col items-center gap-1 transition-opacity duration-300 ${
          scrolledPast ? "opacity-0" : "opacity-100"
        }`}
      >
        <span className="text-text-muted text-xs">Scroll</span>
        <ChevronDown className="text-text-muted size-4 animate-bounce" />
      </div>
    </section>
  );
}
