"use client";

import { useId, useRef, useState } from "react";
import Image from "next/image";
import Button from "@/components/ui/Button";
import Reveal from "@/components/motion/Reveal";

/* Same rule the checkout uses for profile links (lowercase letters, digits
   and hyphens, 3 to 30 characters), so the preview shows a link that could
   really exist. Availability is checked for real at checkout. */
function toSlug(name: string) {
  return name
    .toLowerCase()
    .normalize("NFKD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 30)
    .replace(/-+$/, "");
}

const SAMPLE_NAME = "Priya Anand";
const SAMPLE_TITLE = "Portrait & Brand Photographer";

/* The NFC waves printed on the card. */
function Waves({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" aria-hidden className={className}>
      <circle cx="15" cy="12" r="1.6" fill="currentColor" />
      <path d="M11.2 6.6a7 7 0 0 0 0 10.8" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" />
      <path d="M7.6 3.4a11.6 11.6 0 0 0 0 17.2" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" />
    </svg>
  );
}

const inputClass =
  "bg-bg-base placeholder:text-text-muted h-12 w-full rounded-[12px] px-4 text-[1rem] outline-none transition-shadow focus-visible:shadow-[0_0_0_2px_var(--color-accent)]";

/* The page's one live thing: type a name and a title and see them on the
   card, flip it to see the front, and see the profile link it would open.
   Purely in the browser; nothing is saved or sent. */
export default function MakeItYours() {
  const [name, setName] = useState("");
  const [title, setTitle] = useState("");
  const [side, setSide] = useState<"back" | "front">("back");
  const [tilt, setTilt] = useState({ x: 0, y: 0 });
  const stageRef = useRef<HTMLDivElement>(null);
  const nameId = useId();
  const titleId = useId();

  const shownName = name.trim() || SAMPLE_NAME;
  const shownTitle = title.trim() || SAMPLE_TITLE;
  const slug = toSlug(shownName) || "your-name";

  // The card leans toward the pointer, a few degrees at most.
  const onMove = (e: React.PointerEvent) => {
    if (e.pointerType !== "mouse" || !stageRef.current) return;
    const r = stageRef.current.getBoundingClientRect();
    setTilt({ x: ((e.clientY - r.top) / r.height - 0.5) * -10, y: ((e.clientX - r.left) / r.width - 0.5) * 14 });
  };

  return (
    <section id="make-it-yours" aria-labelledby="make-heading" className="py-24 md:py-32">
      <div className="container-page">
        <div className="bg-bg-elevated grid items-center gap-12 rounded-[28px] p-6 sm:p-10 lg:grid-cols-2 lg:gap-16 lg:p-14">
          <Reveal className="flex flex-col gap-6">
            <h2 id="make-heading" className="font-display text-[length:var(--text-h2)] font-[600]">
              Make it yours
            </h2>
            <p className="text-text-secondary max-w-[40ch] text-[1.0625rem] leading-relaxed">
              Type your name to see it on your card, with the link it opens. Our team finishes the design with you
              before anything is printed.
            </p>

            <div className="grid gap-4 sm:grid-cols-2">
              <div className="flex flex-col gap-1.5">
                <label htmlFor={nameId} className="text-[0.875rem] font-[500]">
                  Your name
                </label>
                <input
                  id={nameId}
                  value={name}
                  onChange={(e) => {
                    setName(e.target.value.slice(0, 32));
                    setSide("back");
                  }}
                  placeholder={SAMPLE_NAME}
                  autoComplete="name"
                  className={inputClass}
                />
              </div>
              <div className="flex flex-col gap-1.5">
                <label htmlFor={titleId} className="text-[0.875rem] font-[500]">
                  What you do
                </label>
                <input
                  id={titleId}
                  value={title}
                  onChange={(e) => {
                    setTitle(e.target.value.slice(0, 44));
                    setSide("back");
                  }}
                  placeholder={SAMPLE_TITLE}
                  autoComplete="organization-title"
                  className={inputClass}
                />
              </div>
            </div>

            <p className="bg-bg-base text-text-secondary rounded-[12px] px-4 py-3 text-[0.9375rem]" aria-live="polite">
              Your profile link{" "}
              <span className="text-text-primary block font-[500] break-all">unitouch.in/u/{slug}</span>
            </p>

            <div>
              <Button variant="primary" size="lg" href="/order">
                Order your card
              </Button>
            </div>
          </Reveal>

          <div className="flex flex-col items-center gap-6">
            <div
              ref={stageRef}
              onPointerMove={onMove}
              onPointerLeave={() => setTilt({ x: 0, y: 0 })}
              className="w-full max-w-[30rem] [perspective:1400px]"
            >
              <div
                role="img"
                aria-label={`Card preview, ${side}: ${shownName}, ${shownTitle}`}
                className="relative aspect-[85.6/54] w-full transition-transform duration-700 ease-[var(--ease-out)] [transform-style:preserve-3d]"
                style={{
                  transform: `rotateX(${tilt.x}deg) rotateY(${tilt.y + (side === "front" ? 180 : 0)}deg)`,
                }}
              >
                {/* Back: the person. */}
                <div className="card-face absolute inset-0 overflow-hidden rounded-[5.5%/8.7%] p-[7%] [backface-visibility:hidden]">
                  <p className="font-display truncate text-[clamp(1.375rem,0.8rem+2vw,2.125rem)] leading-tight font-[600]">
                    {shownName}
                  </p>
                  <p className="mt-1 truncate text-[clamp(0.8125rem,0.65rem+0.6vw,1rem)] opacity-70">{shownTitle}</p>
                  <p className="absolute bottom-[11%] left-[7%] text-[clamp(0.75rem,0.6rem+0.5vw,0.9375rem)] font-[500]">
                    Tap to connect
                  </p>
                  <Waves className="absolute right-[7%] bottom-[9%] h-[17%] w-auto" />
                </div>
                {/* Front: the Unitouch mark. */}
                <div className="card-face absolute inset-0 overflow-hidden rounded-[5.5%/8.7%] p-[7%] [backface-visibility:hidden] [transform:rotateY(180deg)]">
                  <Waves className="h-[15%] w-auto -scale-x-100" />
                  <div className="absolute bottom-[12%] left-[7%] flex items-center gap-[0.6em] text-[clamp(1.5rem,0.9rem+2.2vw,2.375rem)]">
                    <Image src="/brand/u-mark-white.webp" alt="" width={512} height={582} className="h-[1.2em] w-auto" />
                    <span className="font-display font-[600]">Unitouch</span>
                  </div>
                </div>
              </div>
            </div>

            <div className="bg-bg-base inline-flex rounded-full p-1 text-[0.875rem]" role="group" aria-label="Card side">
              {(["back", "front"] as const).map((s) => (
                <button
                  key={s}
                  type="button"
                  aria-pressed={side === s}
                  onClick={() => setSide(s)}
                  className={`rounded-full px-4 py-1.5 font-[500] capitalize transition-colors ${
                    side === s ? "bg-bg-ink text-text-on-ink" : "text-text-secondary hover:text-text-primary"
                  }`}
                >
                  {s}
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
