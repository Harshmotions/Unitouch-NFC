"use client";

import { useEffect, useRef, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import type { PhoneScene } from "@/components/marketing/card3d/phoneScene";

const STEPS = [
  {
    title: "Tap the card on their phone",
    text: "Hold your Unitouch card to the back of any phone. No app to install, nothing to pair.",
  },
  {
    title: "Your profile opens instantly",
    text: "Your photo, your name and what you do open right in their browser, on iPhone and Android.",
  },
  {
    title: "Every way to reach you",
    text: "WhatsApp, call, email, your website and socials, one tap each. Change them any time.",
  },
  {
    title: "Saved in one tap",
    text: "Save Contact adds you to their phone with everything filled in. No typing, no lost cards.",
  },
];

/* What people see when you tap: a 3D iPhone and the card, held on the left
   while the steps scroll past on the right. The section's scroll position
   is one continuous value that the scene eases toward, so there are no
   jumps: the card taps the phone, the phone turns round as it wakes, the
   profile scrolls, and the contact is saved. The 3D loads only when the
   section comes near; until then (and with reduced motion) a still shows. */
export default function PhoneStory() {
  const sectionRef = useRef<HTMLElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [active, setActive] = useState(0);
  const [live, setLive] = useState(false);

  useEffect(() => {
    const section = sectionRef.current;
    const canvas = canvasRef.current;
    if (!section || !canvas) return;
    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    let scene: PhoneScene | undefined;
    let cancelled = false;
    let visible = false;
    let raf = 0;

    // Progress: 0 when the section's top reaches the top of the screen,
    // 1 when its bottom reaches the bottom.
    const progress = () => {
      const r = section.getBoundingClientRect();
      const span = r.height - window.innerHeight;
      return span > 0 ? Math.min(1, Math.max(0, -r.top / span)) : 0;
    };

    const onScroll = () => {
      cancelAnimationFrame(raf);
      raf = requestAnimationFrame(() => {
        const p = progress();
        scene?.setProgress(p);
        setActive(Math.min(STEPS.length - 1, Math.floor(p * STEPS.length * 0.999)));
      });
    };

    const sync = () => {
      if (!scene) return;
      if (visible && !document.hidden) scene.start();
      else scene.stop();
    };

    const boot = async () => {
      if (reduced || scene) return;
      try {
        const probe = document.createElement("canvas");
        if (!probe.getContext("webgl2") && !probe.getContext("webgl")) return;
        const { createPhoneScene } = await import("@/components/marketing/card3d/phoneScene");
        if (cancelled) return;
        scene = createPhoneScene(canvas, { still: progress() });
        await scene.ready;
        if (cancelled) return;
        setLive(true);
        sync();
      } catch {
        // No 3D: the still stays.
      }
    };

    // Load the scene a screen or so before the section arrives, but never
    // before the page itself has loaded and gone idle.
    const whenIdle = (fn: () => void) => {
      const go = () => (window.requestIdleCallback ?? ((cb: () => void) => window.setTimeout(cb, 300)))(fn, { timeout: 3000 });
      if (document.readyState === "complete") go();
      else window.addEventListener("load", go, { once: true });
    };
    const near = new IntersectionObserver(
      ([e]) => {
        if (e.isIntersecting) {
          near.disconnect();
          whenIdle(() => void boot());
        }
      },
      { rootMargin: "120% 0px" }
    );
    near.observe(section);

    const onScreen = new IntersectionObserver(([e]) => {
      visible = e.isIntersecting;
      sync();
    });
    onScreen.observe(section);

    const ro = new ResizeObserver(() => scene?.resize());
    ro.observe(canvas);

    window.addEventListener("scroll", onScroll, { passive: true });
    document.addEventListener("visibilitychange", sync);
    onScroll();

    return () => {
      cancelled = true;
      cancelAnimationFrame(raf);
      near.disconnect();
      onScreen.disconnect();
      ro.disconnect();
      window.removeEventListener("scroll", onScroll);
      document.removeEventListener("visibilitychange", sync);
      scene?.dispose();
    };
  }, []);

  return (
    <section
      ref={sectionRef}
      id="profile"
      aria-labelledby="profile-heading"
      className="bg-bg-subtle relative"
      style={{ height: `${STEPS.length * 85 + 15}svh` }}
    >
      <div className="sticky top-16 h-[calc(100svh-4rem)] md:top-[4.5rem] md:h-[calc(100svh-4.5rem)]">
        <div className="container-page grid h-full grid-rows-[minmax(0,1fr)_auto] gap-4 py-6 md:grid-cols-2 md:grid-rows-1 md:items-center md:gap-12 md:py-10">
          {/* The phone. */}
          <div className="relative h-full min-h-0">
            <Image
              src="/home/phone-poster.webp"
              alt=""
              width={900}
              height={1000}
              sizes="(min-width: 768px) 45vw, 90vw"
              className={`pointer-events-none absolute inset-0 h-full w-full max-w-none object-contain transition-opacity duration-700 motion-reduce:hidden ${
                live ? "opacity-0" : "opacity-100"
              }`}
            />
            <Image
              src="/home/phone-front.webp"
              alt="Priya Anand's Unitouch profile open on an iPhone"
              width={900}
              height={1000}
              sizes="(min-width: 768px) 45vw, 90vw"
              className="pointer-events-none absolute inset-0 hidden h-full w-full max-w-none object-contain motion-reduce:block"
            />
            <canvas
              ref={canvasRef}
              aria-hidden
              className={`absolute inset-0 h-full w-full transition-opacity duration-700 ${live ? "opacity-100" : "opacity-0"}`}
            />
          </div>

          {/* The words: one step at a time, cross-fading as you scroll. */}
          <div className="relative md:pr-4">
            <h2 id="profile-heading" className="font-display text-text-secondary mb-4 text-[1rem] font-[500] md:mb-6">
              What people see when you tap
            </h2>
            <div className="relative grid">
              {STEPS.map((step, i) => (
                <div
                  key={step.title}
                  aria-hidden={i !== active}
                  className={`col-start-1 row-start-1 transition-[opacity,transform] duration-700 ease-[var(--ease-out)] ${
                    i === active ? "translate-y-0 opacity-100" : i < active ? "-translate-y-4 opacity-0" : "translate-y-4 opacity-0"
                  }`}
                >
                  <p className="font-display text-[clamp(1.75rem,1.2rem+2vw,2.75rem)] leading-[1.1] font-[600]">
                    {step.title}
                  </p>
                  <p className="text-text-secondary mt-4 max-w-[38ch] text-[1.0625rem] leading-relaxed">{step.text}</p>
                </div>
              ))}
            </div>

            {/* Where you are in the story. */}
            <div className="mt-8 flex items-center gap-2" aria-hidden>
              {STEPS.map((step, i) => (
                <span
                  key={step.title}
                  className={`h-1 rounded-full transition-all duration-500 ${i === active ? "bg-text-primary w-8" : "bg-bg-border w-4"}`}
                />
              ))}
            </div>
            <Link href="/u/priya" className="link-draw mt-8 hidden font-[500] md:inline-block">
              Open the demo profile
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
}
