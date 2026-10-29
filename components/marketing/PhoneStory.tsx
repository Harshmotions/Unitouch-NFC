"use client";

import { Fragment, useEffect, useRef, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import type { PhoneScene } from "@/components/marketing/card3d/phoneScene";
import { loaderShowing, markReady } from "@/lib/loader";

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

// How far into its turn the phone starts, in story progress, before the
// section reaches the top of the screen.
const PRE_ROLL = 0.3;

/* Splits text into words, each in its own clipping mask, so a step's words
   can rise into view one after another (the mask-word rules in
   globals.css). The masks are for looks only: the words read as one line. */
function MaskedWords({ text, step }: { text: string; step: number }) {
  return text.split(" ").map((word, i) => (
    <Fragment key={i}>
      <span className="mask-word">
        <span style={{ "--w": i * step } as React.CSSProperties}>{word}</span>
      </span>{" "}
    </Fragment>
  ));
}

/* What people see when you tap: a 3D iPhone and the card, held on the left
   while the steps scroll past on the right. The section's scroll position
   is one continuous value that the scene follows on a spring, so there are
   no jumps: the card flies in and taps the phone, the phone turns round as
   it wakes, the profile scrolls, and the contact is saved. The 3D loads
   only when the section comes near; until then (and with reduced motion) a
   still shows. The canvas fades out at its edges, so the card flying in
   never looks cut off. */
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

    /* Progress: 0 when the section's top reaches the top of the screen,
       1 when its bottom reaches the bottom. While the section is still
       coming up the screen it runs from -PRE_ROLL to 0, so the phone is
       already turning the moment it appears and flows into the story
       without a start. */
    const progress = () => {
      const r = section.getBoundingClientRect();
      const span = r.height - window.innerHeight;
      if (span <= 0) return 0;
      const raw = -r.top / span;
      if (raw >= 0) return Math.min(1, raw);
      const entering = window.innerHeight / span;
      return -PRE_ROLL * Math.min(1, -raw / entering);
    };

    const onScroll = () => {
      cancelAnimationFrame(raf);
      raf = requestAnimationFrame(() => {
        const p = progress();
        scene?.setProgress(p);
        setActive(Math.min(STEPS.length - 1, Math.floor(Math.max(0, p) * STEPS.length * 0.999)));
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
      } finally {
        markReady("phone");
      }
    };

    // Load the scene a screen or so before the section arrives, but never
    // before the page itself has loaded and gone idle. While the first-visit
    // loader is up, load it straight away instead, so its download and
    // start-up happen behind the loader rather than mid-scroll.
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
    if (loaderShowing()) whenIdle(() => void boot());
    else near.observe(section);

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
      className="relative"
      style={{ height: `${STEPS.length * 90 + 20}svh` }}
    >
      <div className="sticky top-16 h-[calc(100svh-4rem)] md:top-[4.5rem] md:h-[calc(100svh-4.5rem)]">
        <div className="container-page grid h-full grid-rows-[minmax(0,1fr)_auto] gap-2 py-3 md:grid-cols-[1.1fr_1fr] md:grid-rows-1 md:items-center md:gap-10 md:py-4">
          {/* The phone. */}
          <div className="relative h-full min-h-0 md:-ml-[6%]">
            <div className="feather absolute inset-0">
              <Image
                src="/home/phone-poster.webp"
                alt=""
                width={900}
                height={1000}
                sizes="(min-width: 768px) 45vw, 90vw"
                className={`pointer-events-none absolute inset-0 h-full w-full max-w-none object-contain motion-reduce:hidden ${
                  live ? "opacity-0" : "opacity-100"
                }`}
              />
              <Image
                src="/home/phone-front.webp"
                alt="An example Unitouch profile open on an iPhone"
                width={900}
                height={1000}
                sizes="(min-width: 768px) 45vw, 90vw"
                className="pointer-events-none absolute inset-0 hidden h-full w-full max-w-none object-contain motion-reduce:block"
              />
              <canvas
                ref={canvasRef}
                aria-hidden
                className={`absolute inset-0 h-full w-full ${live ? "opacity-100" : "opacity-0"}`}
              />
            </div>
            {/* The screen shows the demo profile, not the card owner's. */}
            <p className="text-text-muted absolute inset-x-0 bottom-0 text-center text-[0.8125rem]">Example profile</p>
          </div>

          {/* The words: one step at a time, rising in word by word as you scroll. */}
          <div className="relative pb-4 md:pr-4 md:pb-0">
            <h2 id="profile-heading" className="font-display text-text-secondary mb-4 text-[1.0625rem] font-[500] md:mb-6">
              What people see when you tap
            </h2>
            <div className="relative grid">
              {STEPS.map((step, i) => (
                <div
                  key={step.title}
                  aria-hidden={i !== active}
                  data-state={i === active ? "active" : i < active ? "past" : "next"}
                  className="mask-step col-start-1 row-start-1"
                >
                  <p className="font-display text-[clamp(2rem,1.3rem+2.4vw,3.25rem)] leading-[1.08] font-[600]">
                    <MaskedWords text={step.title} step={1} />
                  </p>
                  <p className="text-text-secondary mt-5 max-w-[36ch] text-[1.125rem] leading-relaxed">
                    <MaskedWords text={step.text} step={0.25} />
                  </p>
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
              Open the example profile
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
}
