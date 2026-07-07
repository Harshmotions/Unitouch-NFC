"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
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

    const targets = [
      ".hero-badge",
      ".hero-headline",
      ".hero-sub",
      ".hero-ctas",
      ".hero-stat-badge",
      ".hero-visual-slot",
      ".hero-visual-mobile",
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
        .from(".hero-visual-slot, .hero-visual-mobile", { opacity: 0, scale: 0.97, duration: 0.5, ease: "expo.out" }, "-=0.5");
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
    <section className="relative isolate flex flex-col overflow-hidden bg-bg-base px-6 pt-24 pb-4 md:min-h-[100svh] md:pb-16">
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
        <div className="flex flex-col items-center gap-6 text-center md:items-start md:text-left md:max-w-xl">
          <span className="hero-badge text-accent-purple inline-flex items-center rounded-full border border-accent-purple/25 bg-accent-purple/[0.08] px-4 py-1.5 text-xs font-[500] tracking-wide backdrop-blur-sm">
            NFC Business Cards, Reinvented
          </span>
          <h1 className="hero-headline font-display from-text-primary to-text-secondary bg-gradient-to-b bg-clip-text text-[35px] font-[700] leading-[1.05] text-transparent md:text-hero">
            <span className="whitespace-nowrap">Tap. Connect.</span>
            <br />
            <span className="whitespace-nowrap">Impress Instantly.</span>
          </h1>
          <p className="hero-sub text-text-secondary text-body-lg max-w-md">
            One NFC card. Your entire professional world. No app needed.
          </p>
          <div className="hero-ctas flex items-center gap-2 sm:gap-4">
            <Button
              variant="primary"
              size="lg"
              href="/order"
              className="h-[33px] shrink-0 px-3 text-[11px] sm:h-12 sm:px-7 sm:text-base"
            >
              Order Your Card →
            </Button>
            <Button
              variant="secondary"
              size="lg"
              href="/u/priya"
              className="glass-stroke-2 h-[33px] shrink-0 px-3 text-[11px] sm:h-12 sm:px-7 sm:text-base"
            >
              See a Live Profile
            </Button>
          </div>
          <div className="flex items-center gap-1.5 sm:flex-wrap sm:gap-3">
            {BADGES.map(({ icon: Icon, label }, i) => (
              <span
                key={label}
                className={`hero-stat-badge glass glass-stroke-${(i % 4) + 1} text-text-secondary flex shrink-0 items-center gap-1 rounded-full px-2 py-1 text-[10px] sm:gap-2 sm:px-3.5 sm:py-1.5 sm:text-xs`}
              >
                <Icon className="text-accent-purple size-3 sm:size-3.5" />
                {label}
              </span>
            ))}
          </div>
        </div>
      </div>

      {/* mobile-only hero visual — full-bleed edge-to-edge, breaking out of
         the section's own px-6 via matching negative margins (this is a
         direct child of the section, not the padded/centered text column
         above, so -mx-6 has exactly the section's padding to cancel). The
         desktop version below is absolutely positioned/sized against the
         full section in a way that doesn't translate to a narrow single
         column, hence the separate mobile-only block. */}
      <div className="hero-visual-mobile relative z-10 -mx-6 mt-2 aspect-[3/4] w-[calc(100%+3rem)] overflow-hidden md:hidden">
        <Image
          src="/Card Hero Page Mockup.png"
          alt="A phone showing a live Unitouch profile page next to an NFC business card"
          fill
          className="object-cover object-[90%_30%]"
        />
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
        className={`absolute bottom-8 left-1/2 hidden -translate-x-1/2 flex-col items-center gap-1 transition-opacity duration-300 md:flex ${
          scrolledPast ? "opacity-0" : "opacity-100"
        }`}
      >
        <span className="text-text-muted text-xs">Scroll</span>
        <ChevronDown className="text-text-muted size-4 animate-bounce" />
      </div>
    </section>
  );
}
