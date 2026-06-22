"use client";

import { useRef, useState } from "react";
import Image from "next/image";

function NfcSymbol() {
  return (
    <svg viewBox="0 0 24 24" className="size-3.5" fill="none" stroke="currentColor" strokeWidth="1.5">
      <path d="M7 9a5 5 0 0 1 0 6" strokeLinecap="round" />
      <path d="M10 6a8.5 8.5 0 0 1 0 12" strokeLinecap="round" />
      <path d="M13 3a12 12 0 0 1 0 18" strokeLinecap="round" />
    </svg>
  );
}

export default function HeroCard() {
  const ref = useRef<HTMLDivElement>(null);
  const [rotate, setRotate] = useState({ x: 0, y: 0 });

  function handleMouseMove(e: React.MouseEvent<HTMLDivElement>) {
    const rect = ref.current?.getBoundingClientRect();
    if (!rect) return;
    const px = (e.clientX - rect.left) / rect.width - 0.5;
    const py = (e.clientY - rect.top) / rect.height - 0.5;
    setRotate({ x: py * -8, y: px * 10 });
  }

  function handleMouseLeave() {
    setRotate({ x: 0, y: 0 });
  }

  return (
    <div ref={ref} onMouseMove={handleMouseMove} onMouseLeave={handleMouseLeave} className="[perspective:1200px]">
      <div
        className="relative aspect-[3.5/2] w-[280px] rounded-xl border border-bg-border bg-gradient-to-br from-bg-elevated to-bg-base shadow-2xl transition-transform duration-200 ease-out [transform-style:preserve-3d] sm:w-[340px]"
        style={{ transform: `rotateX(${rotate.x}deg) rotateY(${rotate.y}deg)` }}
      >
        <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 rounded-xl bg-[radial-gradient(circle_at_30%_20%,rgba(255,255,255,0.06),transparent_60%)]">
          <Image src="/logo.png" alt="Unitouch" width={36} height={36} />
          <span className="font-display text-text-primary text-lg font-[600]">Unitouch</span>
          <div className="text-text-muted flex items-center gap-1.5 text-xs">
            <NfcSymbol />
            <span>Tap.</span>
          </div>
        </div>
      </div>
    </div>
  );
}
