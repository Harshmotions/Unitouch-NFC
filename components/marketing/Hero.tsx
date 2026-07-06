"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import { ChevronDown, Zap, RefreshCw, BarChart3 } from "lucide-react";
import gsap from "gsap";
import Button from "@/components/ui/Button";
import { handleHashLinkClick } from "@/lib/scroll";

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

    const targets = [
      ".hero-badge",
      ".hero-headline",
      ".hero-sub",
      ".hero-ctas",
      ".hero-stat-badge",
      ".hero-visual-slot",
    ];

    let tl: gsap.core.Timeline | undefined;

    function playIntro() {
      tl?.kill();
      // Wipe any inline styles a previous, interrupted run left behind (e.g.
      // navigating away mid-animation) so this replay starts from a clean
      // state instead of resuming from a half-faded frame.
      gsap.set(targets, { clearProps: "all" });

      tl = gsap
        .timeline()
        .from(".hero-badge", { y: 14, opacity: 0, duration: 0.35, ease: "power2.out" })
        .from(".hero-headline", { y: 28, opacity: 0, duration: 0.55, ease: "expo.out" }, "-=0.15")
        .from(".hero-sub", { y: 14, opacity: 0, duration: 0.4, ease: "power2.out" }, "-=0.35")
        .from(".hero-ctas", { y: 14, opacity: 0, duration: 0.35, ease: "power2.out" }, "-=0.25")
        .from(".hero-stat-badge", { y: 10, opacity: 0, duration: 0.35, stagger: 0.06, ease: "power2.out" }, "-=0.15")
        .from(".hero-visual-slot", { opacity: 0, scale: 0.97, duration: 0.5, ease: "expo.out" }, "-=0.5");
    }

    playIntro();

    // Browsers can restore this exact page from the back/forward cache when
    // navigating back to it — JS state (including a mid-flight GSAP tween)
    // is frozen and resumed as-is, with no fresh mount/effect run. Detect
    // that restoration and replay the intro cleanly.
    function handlePageShow(e: PageTransitionEvent) {
      if (e.persisted) playIntro();
    }
    window.addEventListener("pageshow", handlePageShow);

    return () => {
      window.removeEventListener("pageshow", handlePageShow);
      tl?.kill();
    };
  }, []);

  return (
    <section className="relative isolate flex min-h-[100svh] flex-col overflow-hidden bg-bg-base px-6 pt-24 pb-16">
      {/* ambient page-wide wash */}
      <div
        className="pointer-events-none absolute inset-0"
        style={{
          background:
            "radial-gradient(ellipse 90% 70% at 65% 35%, var(--color-accent-purple-glow-soft), transparent 65%)",
        }}
      />

      {/* spotlight beam + starfield + corona, anchored over the right-side visual
         slot via the SAME bounded/centered container used for the image below
         (not the raw section/viewport) — otherwise on wide monitors the
         section's true edge sits far past this container's edge and the glow
         (and the image it's meant to track) drift apart from the text. */}
      <div className="pointer-events-none absolute inset-0 hidden md:block">
        <div className="relative mx-auto h-full w-full max-w-[1700px]">
          <div
            className="absolute inset-0"
            style={{ backgroundImage: STARFIELD, backgroundRepeat: "no-repeat" }}
          />
          {/* wide soft corona behind the card */}
          <div
            className="absolute top-[18%] h-[64%] w-[420px] -translate-x-1/2 blur-[80px]"
            style={{
              left: "82%",
              background:
                "radial-gradient(ellipse at center, var(--color-accent-purple-glow-soft), transparent 70%)",
            }}
          />
          {/* tighter bright glow directly behind the card */}
          <div
            className="absolute top-[22%] h-[44%] w-[260px] -translate-x-1/2 blur-3xl"
            style={{
              left: "82%",
              background:
                "radial-gradient(ellipse at center, var(--color-accent-purple-glow), transparent 70%)",
            }}
          />
          {/* light pooling beneath the card */}
          <div
            className="absolute bottom-[10%] h-32 w-[360px] -translate-x-1/2 blur-2xl"
            style={{ left: "82%", background: "var(--color-accent-purple-glow-soft)" }}
          />
        </div>
      </div>

      <div className="relative z-10 mx-auto flex w-full max-w-[1700px] flex-1 flex-col items-center justify-center gap-12 md:flex-row md:items-center md:justify-start">
        <div className="flex flex-col items-start gap-6 text-left md:max-w-xl">
          <span className="hero-badge text-accent-purple inline-flex items-center rounded-full border border-accent-purple/25 bg-accent-purple/[0.08] px-4 py-1.5 text-xs font-[500] tracking-wide backdrop-blur-sm">
            NFC Business Cards, Reinvented
          </span>
          <h1 className="hero-headline font-display text-hero from-text-primary to-text-secondary bg-gradient-to-b bg-clip-text font-[700] leading-[1.05] text-transparent">
            Tap. Connect.
            <br />
            <span className="md:whitespace-nowrap">Impress Instantly.</span>
          </h1>
          <p className="hero-sub text-text-secondary text-body-lg max-w-md">
            One NFC card. Your entire professional world. No app needed.
          </p>
          <div className="hero-ctas flex flex-wrap items-center gap-4">
            <Button variant="primary" size="lg" href="/order">
              Order Your Card →
            </Button>
            <Button
              variant="secondary"
              size="lg"
              href="#profile-demo"
              onClick={handleHashLinkClick("#profile-demo")}
              className="glass-stroke-2"
            >
              See a Live Profile
            </Button>
          </div>
          <div className="flex flex-wrap items-center gap-3">
            {BADGES.map(({ icon: Icon, label }, i) => (
              <span
                key={label}
                className={`hero-stat-badge glass glass-stroke-${(i % 4) + 1} text-text-secondary flex items-center gap-2 rounded-full px-3.5 py-1.5 text-xs`}
              >
                <Icon className="text-accent-purple size-3.5" />
                {label}
              </span>
            ))}
          </div>
        </div>
      </div>

      {/* desktop-only hero visual — positioned independently of the text
         column (not a flex sibling) so its size can't push the headline
         off-screen; untested on tablet/mobile, so hidden below md. Anchored
         to the right edge of the SAME bounded container as the text (not the
         section's true edge) so it stays visually tied to the headline
         instead of drifting toward the true screen edge on wide monitors. */}
      <div className="hero-visual-slot pointer-events-none absolute inset-0 z-0 hidden items-center md:flex">
        <div className="mx-auto flex h-full w-full max-w-[1700px] items-center justify-end">
          <Image
            src="/Card Hero Page Mockup.png"
            alt="A phone showing a live Unitouch profile page next to an NFC business card"
            width={1756}
            height={1705}
            priority
            className="h-auto w-[340px] max-w-none object-contain lg:w-[480px] xl:w-[650px] 2xl:w-[780px] min-[1920px]:w-[1000px]!"
          />
        </div>
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
