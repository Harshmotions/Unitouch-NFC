"use client";

import { useState } from "react";
import Reveal from "@/components/motion/Reveal";

const FEATURES = [
  {
    title: "Opens without an app",
    description: "Most phones from the last several years read it in the browser. Older ones can scan the QR code.",
  },
  {
    title: "Saves your contact",
    description: "One button adds your name, number, email and links to their phone's contacts.",
  },
  {
    title: "Starts a WhatsApp chat",
    description: "A tap on your number opens a WhatsApp chat with you, ready to type.",
  },
  {
    title: "Changes when you do",
    description: "Edit your details, photo and links any time. The card itself never needs reprinting.",
  },
  {
    title: "Counts every view",
    description: "See how many people opened and saved your profile. Premium adds a full dashboard.",
  },
  {
    title: "Never needs charging",
    description: "No battery and no pairing. The chip draws its power from the phone that taps it.",
  },
];

/* Capabilities at poster scale: one per line, very large, with the plain
   description beside it. The heading is the list's first line, set in the
   softer ink. Hovering a row darkens it; the others stay readable. */
export default function Features() {
  const [active, setActive] = useState<number | null>(null);

  return (
    <section id="features" aria-labelledby="features-heading" className="px-[var(--margin)] py-28 md:py-40">
      <Reveal as="ul" className="flex flex-col gap-7 md:gap-[0.35em] md:text-[clamp(2.75rem,0.4rem+5.1vw,5.5rem)]" onMouseLeave={() => setActive(null)}>
        <li className="list-none">
          <h2
            id="features-heading"
            className="font-display text-text-muted text-[clamp(2.25rem,1rem+5vw,3rem)] leading-[1] font-[650] md:text-[length:inherit]"
          >
            What your card does
          </h2>
        </li>
        {FEATURES.map((f, i) => (
          <li
            key={f.title}
            onMouseEnter={() => setActive(i)}
            className="grid list-none gap-2 md:grid-cols-12 md:items-baseline md:gap-x-6"
          >
            <h3
              className={`font-display text-[clamp(2.25rem,1rem+5vw,3rem)] leading-[1] font-[650] transition-colors duration-[240ms] md:col-span-8 md:text-[length:inherit] ${
                active !== null && active !== i ? "text-text-secondary" : "text-text-primary"
              }`}
            >
              {f.title}
            </h3>
            <p className="text-text-primary max-w-[36ch] pl-4 text-[1.0625rem] md:col-span-4 md:pl-0">
              {f.description}
            </p>
          </li>
        ))}
      </Reveal>
    </section>
  );
}
