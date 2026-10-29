"use client";

import { useEffect, useRef, useState } from "react";
import Image from "next/image";
import Link from "next/link";

/* One frame, three distances. A held stage shows the demo profile as it
   opens on a phone; scrolling moves the camera closer twice: first to the
   row of links, then to the Save contact button. The heading is delivered
   in two halves around the frame. With reduced motion the stage isn't held
   and everything shows at once. */
const STAGES = [
  { scale: 1, origin: "50% 0%" },
  { scale: 1.9, origin: "50% 54%" },
  { scale: 2.3, origin: "50% 96%" },
];

export default function ProfileShowcase() {
  const markers = useRef<(HTMLDivElement | null)[]>([]);
  const [stage, setStage] = useState(0);
  const [held, setHeld] = useState(false);

  useEffect(() => {
    if (!window.matchMedia("(prefers-reduced-motion: reduce)").matches) setHeld(true);
  }, []);

  // The markers only exist once the stage is held, so observe after that.
  useEffect(() => {
    if (!held) return;
    const io = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (!entry.isIntersecting) continue;
          const i = markers.current.indexOf(entry.target as HTMLDivElement);
          if (i >= 0) setStage(i);
        }
      },
      { rootMargin: "-50% 0px -50% 0px" }
    );
    markers.current.forEach((m) => m && io.observe(m));
    return () => io.disconnect();
  }, [held]);

  const s = STAGES[stage];
  const show = (from: number) => !held || stage >= from;

  return (
    <section id="profile" aria-labelledby="profile-heading" className={`bg-bg-subtle relative ${held ? "h-[280vh]" : ""}`}>
      {/* Invisible scroll markers, one per stage. */}
      {held &&
        [0, 1, 2].map((i) => (
          <div
            key={i}
            ref={(el) => {
              markers.current[i] = el;
            }}
            aria-hidden
            className="absolute inset-x-0 h-[80vh]"
            style={{ top: `${10 + i * 80}vh` }}
          />
        ))}

      <div
        className={`${held ? "sticky top-16 h-[calc(100svh-4rem)] md:top-[4.5rem] md:h-[calc(100svh-4.5rem)]" : "py-28"} flex flex-col items-center justify-center overflow-clip px-[var(--margin)]`}
      >
        <h2 id="profile-heading" className="font-display relative z-10 text-center text-[clamp(2rem,0.6rem+6vw,5.5rem)] leading-[0.95] font-[700]">
          What people see
        </h2>

        <div className="relative mt-6 flex w-full items-start justify-center md:mt-8">
          <div className="relative aspect-[390/844] h-[min(54svh,38rem)] overflow-hidden rounded-[2rem]">
            <Image
              src="/home/profile-priya.webp"
              alt="Priya Anand's Unitouch profile on a phone: her photo, name, a Save contact button and her links"
              width={780}
              height={1688}
              sizes="(min-width: 768px) 20rem, 60vw"
              className="h-full w-full max-w-none object-cover object-top transition-transform duration-[900ms] ease-[var(--ease-expo)]"
              style={{ transform: `scale(${s.scale})`, transformOrigin: s.origin }}
            />
          </div>

          {/* Third distance: the caption arrives beside the frame. */}
          <p
            className={`text-text-primary absolute top-0 left-[calc(50%+min(16svh,11rem)+2rem)] hidden max-w-[28ch] text-[1.0625rem] transition-[opacity,transform] duration-700 ease-[var(--ease-out)] lg:block ${
              show(2) ? "translate-y-0 opacity-100" : "translate-y-4 opacity-0"
            }`}
          >
            Your photo, your links and a Save contact button that adds you to their phone in one tap. Change any
            of it whenever you like.{" "}
            <Link href="/u/priya" className="link-draw font-[550] underline">
              Open the demo profile
            </Link>
          </p>
        </div>

        <p
          aria-hidden
          className={`font-display relative z-10 -mt-[0.3em] text-center text-[clamp(2rem,0.6rem+6vw,5.5rem)] leading-[0.95] font-[700] transition-[opacity,transform] duration-700 ease-[var(--ease-out)] ${
            show(1) ? "translate-y-0 opacity-100" : "translate-y-6 opacity-0"
          }`}
        >
          when you tap
        </p>

        <p className="text-text-primary mt-6 max-w-[34ch] text-center text-[1.0625rem] lg:hidden">
          Your photo, your links and a Save contact button that adds you to their phone in one tap.{" "}
          <Link href="/u/priya" className="font-[550] underline underline-offset-4">
            Open the demo profile
          </Link>
        </p>
      </div>
    </section>
  );
}
