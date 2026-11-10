"use client";

import { useEffect, useRef, useState } from "react";
import Image from "next/image";
import type { CardColor } from "@/lib/card-colors";

/* The flat (2D) Unitouch card, shared by the homepage's "Make it yours" and
   the checkout's live preview. Front: the owner's name and what they do,
   and the NFC waves. Back: a QR code to the profile and a small Unitouch
   mark. Black or white card; Standard prints white on black / black on
   white, Premium prints gold on either. */

/* The QR code on the back, for phones without NFC: drawn as one SVG path,
   one square per dark module. The generator is loaded only when needed. */
export function QR({ text }: { text: string }) {
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
export function Waves({ className, style }: { className?: string; style?: React.CSSProperties }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" aria-hidden className={className} style={style}>
      <circle cx="15" cy="12" r="1.6" fill="currentColor" />
      <path d="M11.2 6.6a7 7 0 0 0 0 10.8" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" />
      <path d="M7.6 3.4a11.6 11.6 0 0 0 0 17.2" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" />
    </svg>
  );
}

// Solid gold for the small SVG marks (the gradient only works on text).
const GOLD = { black: "#e2c487", white: "#a8823d" } as const;

/* Live card preview with a front/back flip. On a mouse it leans toward the
   pointer and the gold catches the light; reduced motion keeps it still. */
export function CardPreview({
  name,
  title,
  link,
  color,
  finish,
  side,
}: {
  name: string;
  title: string;
  link: string;
  color: CardColor;
  finish: "standard" | "premium";
  side: "front" | "back";
}) {
  const stageRef = useRef<HTMLDivElement>(null);
  const [tilt, setTilt] = useState({ x: 0, y: 0, glare: 50 });
  const gold = finish === "premium";
  const ink = gold ? GOLD[color] : undefined;

  const onMove = (e: React.PointerEvent) => {
    if (e.pointerType !== "mouse" || !stageRef.current) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const r = stageRef.current.getBoundingClientRect();
    const px = (e.clientX - r.left) / r.width;
    const py = (e.clientY - r.top) / r.height;
    setTilt({ x: (py - 0.5) * -10, y: (px - 0.5) * 14, glare: 15 + px * 70 });
  };

  const face = `card-face absolute inset-0 overflow-hidden rounded-[5.5%/8.7%] [backface-visibility:hidden]${
    color === "white" ? " card-white" : ""
  }`;

  return (
    <div
      ref={stageRef}
      onPointerMove={onMove}
      onPointerLeave={() => setTilt({ x: 0, y: 0, glare: 50 })}
      className="w-full [perspective:1400px]"
    >
      <div
        role="img"
        aria-label={
          side === "front"
            ? `${color === "white" ? "White" : "Black"} card preview, front: ${name}, ${title}`
            : `${color === "white" ? "White" : "Black"} card preview, back: a QR code for ${link}`
        }
        className="relative aspect-[85.6/54] w-full transition-transform duration-700 ease-[var(--ease-out)] [transform-style:preserve-3d]"
        style={
          {
            transform: `rotateX(${tilt.x}deg) rotateY(${tilt.y + (side === "back" ? 180 : 0)}deg)`,
            "--glare": `${tilt.glare}%`,
          } as React.CSSProperties
        }
      >
        <div className={face}>
          <Waves className="absolute top-[9%] right-[7%] h-[17%] w-auto" style={ink ? { color: ink } : undefined} />
          <div className="absolute right-[7%] bottom-[13%] left-[7%]">
            <p
              className={`font-display truncate text-[clamp(1.25rem,0.8rem+2vw,2rem)] leading-tight font-[600] ${
                gold ? "card-gold" : ""
              }`}
            >
              {name}
            </p>
            <p
              className={`mt-1 truncate text-[clamp(0.8125rem,0.65rem+0.6vw,1rem)] ${gold ? "card-gold" : "opacity-75"}`}
            >
              {title}
            </p>
          </div>
        </div>
        <div className={`${face} [transform:rotateY(180deg)]`}>
          <div
            className={`absolute top-1/2 left-[7%] aspect-square h-[60%] -translate-y-1/2 rounded-[10%] bg-white p-[3.5%] ${
              color === "white" ? "shadow-[inset_0_0_0_1px_rgba(20,18,16,0.12)]" : ""
            }`}
          >
            <QR text={link} />
          </div>
          <div className="absolute right-[7%] bottom-[11%] flex items-center gap-[0.4em] text-[clamp(0.6875rem,0.55rem+0.4vw,0.875rem)] opacity-80">
            <Image
              src={color === "white" ? "/brand/u-mark-ink.png" : "/brand/u-mark-white.webp"}
              alt=""
              width={56}
              height={64}
              className="h-[1.25em] w-auto"
            />
            <span className={`font-display font-[600] ${gold ? "card-gold" : ""}`}>Unitouch</span>
          </div>
        </div>
      </div>
    </div>
  );
}
