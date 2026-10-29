"use client";

import { useEffect, useRef } from "react";
import type { ComponentType } from "react";
import { Phone, Mail, Globe, UserRoundPlus, Eye, MapPin } from "lucide-react";
import { WhatsAppIcon, InstagramIcon, LinkedInIcon, YouTubeIcon } from "@/components/profile/PlatformIcons";

type Item = { label: string; Icon: ComponentType<{ className?: string }> };

/* What a tap can lead to. Each column cycles through the list. */
const LEFT: Item[] = [
  { label: "Contact saved", Icon: UserRoundPlus },
  { label: "WhatsApp chat", Icon: WhatsAppIcon },
  { label: "Instagram", Icon: InstagramIcon },
  { label: "Website visit", Icon: Globe },
  { label: "Call", Icon: Phone },
  { label: "LinkedIn", Icon: LinkedInIcon },
  { label: "Email", Icon: Mail },
];
const RIGHT: Item[] = [
  { label: "Profile opened", Icon: Eye },
  { label: "Email", Icon: Mail },
  { label: "YouTube", Icon: YouTubeIcon },
  { label: "Contact saved", Icon: UserRoundPlus },
  { label: "Office location", Icon: MapPin },
  { label: "WhatsApp chat", Icon: WhatsAppIcon },
  { label: "Website visit", Icon: Globe },
];

const POINTS = ["No app needed", "Works on iPhone and Android", "Edit your details any time"];

// Rows on the drum per column; they repeat the column's list.
const ROWS = 14;

/* Two columns of what a tap leads to, turning on drums on either side of
   the heading: one rolls up, the other down. Rows swell and sharpen as they
   pass the middle and thin out toward the ends, and each column bows in
   toward the centre, as if printed on a cylinder seen side-on. Scrolling
   nudges the drums along. Paused off screen; still under reduced motion. */
export default function TapDrum() {
  const sectionRef = useRef<HTMLElement>(null);
  const colRefs = useRef<(HTMLDivElement | null)[]>([]);

  useEffect(() => {
    const section = sectionRef.current;
    if (!section) return;
    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    let offset = 0;
    let boost = 0;
    let lastScroll = window.scrollY;
    let last = performance.now();
    let frame = 0;
    let running = false;

    const place = () => {
      const h = section.clientHeight;
      const radius = h * 0.46;
      colRefs.current.forEach((col, c) => {
        if (!col) return;
        const dir = c === 0 ? -1 : 1;
        const rows = Array.from(col.children) as HTMLElement[];
        const step = 1 / ROWS;
        rows.forEach((row, i) => {
          // u: where this row is around the drum, 0..1, then -1..1 top to bottom.
          let u = (i * step + dir * offset) % 1;
          if (u < 0) u += 1;
          const s = u * 2 - 1;
          const a = s * (Math.PI / 2) * 0.92;
          const depth = Math.cos(a);
          const y = Math.sin(a) * radius;
          const bow = depth * (c === 0 ? 1 : -1) * Math.min(90, col.clientWidth * 0.35);
          row.style.transform = `translate3d(${bow}px, ${y}px, 0) scale(${0.62 + 0.38 * depth})`;
          row.style.opacity = String(Math.max(0, Math.pow(depth, 2.2)));
        });
      });
    };

    const tick = (now: number) => {
      if (!running) return;
      const dt = Math.min((now - last) / 1000, 0.05);
      last = now;
      const sy = window.scrollY;
      boost += (sy - lastScroll) * 0.00012;
      lastScroll = sy;
      boost *= Math.pow(0.04, dt);
      offset += dt * 0.018 + boost;
      place();
      frame = requestAnimationFrame(tick);
    };

    place();
    if (reduced) return;

    const io = new IntersectionObserver(([e]) => {
      if (e.isIntersecting && !running) {
        running = true;
        last = performance.now();
        lastScroll = window.scrollY;
        frame = requestAnimationFrame(tick);
      } else if (!e.isIntersecting) {
        running = false;
        cancelAnimationFrame(frame);
      }
    });
    io.observe(section);
    const onResize = () => place();
    window.addEventListener("resize", onResize);
    return () => {
      io.disconnect();
      cancelAnimationFrame(frame);
      window.removeEventListener("resize", onResize);
    };
  }, []);

  const column = (items: Item[], c: number) => (
    <div
      ref={(el) => {
        colRefs.current[c] = el;
      }}
      aria-hidden
      className={`relative h-full ${c === 0 ? "justify-self-start" : "justify-self-end"}`}
    >
      {Array.from({ length: ROWS }, (_, i) => items[i % items.length]).map(({ label, Icon }, i) => (
        <div
          key={i}
          className={`absolute top-1/2 flex -translate-y-1/2 items-center gap-3 whitespace-nowrap will-change-transform ${
            c === 0 ? "left-0" : "right-0 flex-row-reverse"
          }`}
          style={{ opacity: 0 }}
        >
          <span className="bg-bg-elevated text-text-primary flex size-10 items-center justify-center rounded-full md:size-12">
            <Icon className="size-[1.1rem] md:size-5" />
          </span>
          <span className="font-display hidden text-[1.25rem] font-[500] sm:inline md:text-[1.75rem]">{label}</span>
        </div>
      ))}
    </div>
  );

  return (
    <section
      ref={sectionRef}
      id="features"
      aria-labelledby="features-heading"
      className="bg-bg-subtle relative h-[min(100svh,56rem)] min-h-[38rem] overflow-hidden"
    >
      <div className="container-page grid h-full grid-cols-[1fr_auto_1fr] items-center gap-4">
        {column(LEFT, 0)}
        <div className="relative z-10 flex max-w-[22rem] flex-col items-center text-center md:max-w-[28rem]">
          <h2 id="features-heading" className="font-display text-[length:var(--text-h2)] leading-[1.08] font-[600]">
            Everything you share, in one tap
          </h2>
          <ul className="text-text-secondary mt-6 flex flex-col gap-1.5 text-[1rem] md:text-[1.0625rem]">
            {POINTS.map((p) => (
              <li key={p}>{p}</li>
            ))}
          </ul>
        </div>
        {column(RIGHT, 1)}
      </div>
    </section>
  );
}
