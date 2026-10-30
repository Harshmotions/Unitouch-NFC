"use client";

import { useEffect, useId, useRef, useState } from "react";
import Image from "next/image";
import Button from "@/components/ui/Button";
import GlassLens from "@/components/ui/GlassLens";
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

const SAMPLE_NAME = "Your Name";
const SAMPLE_TITLE = "What you do";
// Shorter, so the placeholder fits the field at every width.
const TITLE_PLACEHOLDER = "Photographer";

/* The QR code on the back, for phones without NFC: drawn as one SVG path,
   one square per dark module. The generator is loaded only when needed. */
function QR({ text }: { text: string }) {
  const [modules, setModules] = useState<boolean[][] | null>(null);
  useEffect(() => {
    let live = true;
    import("@/lib/qr").then(({ qrModules }) => live && setModules(qrModules(text)));
    return () => {
      live = false;
    };
  }, [text]);
  const n = modules?.length ?? 25;
  const d = modules
    ? modules.flatMap((row, y) => row.map((dark, x) => (dark ? `M${x} ${y}h1v1h-1z` : ""))).join("")
    : "";
  return (
    <svg viewBox={`0 0 ${n} ${n}`} aria-hidden className="h-full w-full" shapeRendering="crispEdges">
      <path d={d} fill="#161616" />
    </svg>
  );
}

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
   card's front, flip it to see the QR code on the back, and see the profile
   link both open.
   Purely in the browser; nothing is saved or sent. */
export default function MakeItYours() {
  const [name, setName] = useState("");
  const [title, setTitle] = useState("");
  const [side, setSide] = useState<"front" | "back">("front");
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
    <section id="make-it-yours" aria-labelledby="make-heading" className="py-16 md:py-32">
      <div className="container-page">
        {/* Three blocks: the heading, the card, the form. On a phone they
            stack in that order, so the card is right above the fields and
            your name lands on it as you type; on desktop the heading and
            form share the left column and the card spans both rows. */}
        <div className="bg-bg-elevated grid gap-8 rounded-[28px] p-5 sm:p-10 lg:grid-cols-2 lg:grid-rows-[auto_auto] lg:gap-x-16 lg:gap-y-6 lg:p-14">
          <Reveal className="flex flex-col gap-4 lg:col-start-1 lg:row-start-1 lg:gap-6 lg:self-end">
            <h2 id="make-heading" className="font-display text-[length:var(--text-h2)] font-[600]">
              Make it yours
            </h2>
            <p className="text-text-secondary max-w-[40ch] text-[1.0625rem] leading-relaxed">
              Type your name to see it on your card, with the link it opens. Our team finishes the design with you
              before anything is printed.
            </p>
          </Reveal>

          <div className="flex flex-col items-center gap-5 lg:col-start-2 lg:row-span-2 lg:row-start-1 lg:gap-6 lg:self-center">
            <div
              ref={stageRef}
              onPointerMove={onMove}
              onPointerLeave={() => setTilt({ x: 0, y: 0 })}
              className="w-full max-w-[30rem] [perspective:1400px]"
            >
              <div
                role="img"
                aria-label={
                  side === "front"
                    ? `Card preview, front: ${shownName}, ${shownTitle}`
                    : `Card preview, back: a QR code for unitouch.in/u/${slug}`
                }
                className="relative aspect-[85.6/54] w-full transition-transform duration-700 ease-[var(--ease-out)] [transform-style:preserve-3d]"
                style={{
                  transform: `rotateX(${tilt.x}deg) rotateY(${tilt.y + (side === "back" ? 180 : 0)}deg)`,
                }}
              >
                {/* Front: the owner's name and what they do, and the NFC mark. */}
                <div className="card-face absolute inset-0 overflow-hidden rounded-[5.5%/8.7%] [backface-visibility:hidden]">
                  <Waves className="absolute top-[9%] right-[7%] h-[17%] w-auto" />
                  <div className="absolute right-[7%] bottom-[13%] left-[7%]">
                    <p className="font-display truncate text-[clamp(1.375rem,0.8rem+2vw,2.125rem)] leading-tight font-[600]">
                      {shownName}
                    </p>
                    <p className="mt-1 truncate text-[clamp(0.8125rem,0.65rem+0.6vw,1rem)] opacity-75">{shownTitle}</p>
                  </div>
                </div>
                {/* Back: a QR code to the profile, for phones without NFC, and a
                    small Unitouch mark in the corner. Nothing else. */}
                <div className="card-face absolute inset-0 overflow-hidden rounded-[5.5%/8.7%] [backface-visibility:hidden] [transform:rotateY(180deg)]">
                  <div className="absolute top-1/2 left-[7%] aspect-square h-[60%] -translate-y-1/2 rounded-[10%] bg-white p-[3.5%]">
                    <QR text={`https://www.unitouch.in/u/${slug}`} />
                  </div>
                  <div className="absolute right-[7%] bottom-[11%] flex items-center gap-[0.4em] text-[clamp(0.6875rem,0.55rem+0.4vw,0.875rem)] opacity-80">
                    <Image src="/brand/u-mark-white.webp" alt="" width={56} height={64} className="h-[1.25em] w-auto" />
                    <span className="font-display font-[600]">Unitouch</span>
                  </div>
                </div>
              </div>
            </div>

            <div className="liquid-glass inline-flex rounded-full p-1 text-[0.875rem]" role="group" aria-label="Card side">
              <GlassLens />
              {(["front", "back"] as const).map((s) => (
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
          <Reveal className="flex flex-col gap-5 lg:col-start-1 lg:row-start-2 lg:gap-6 lg:self-start">
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
                    setSide("front");
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
                    setSide("front");
                  }}
                  placeholder={TITLE_PLACEHOLDER}
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
              <Button variant="primary" size="lg" href="/order" className="w-full sm:w-auto">
                Order your card
              </Button>
            </div>
          </Reveal>
        </div>
      </div>
    </section>
  );
}
