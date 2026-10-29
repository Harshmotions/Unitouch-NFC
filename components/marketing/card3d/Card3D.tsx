"use client";

import { useEffect, useRef, useState } from "react";
import Image from "next/image";
import type { CardScene, CardSceneOptions } from "./scene";

interface Props extends CardSceneOptions {
  /** Pre-rendered still of the same scene, shown on first paint. */
  poster: string;
  posterAlt: string;
  posterWidth: number;
  posterHeight: number;
  priority?: boolean;
  className?: string;
}

/* The poster is the real first paint (and the reduced-motion and no-WebGL
   view). The 3D scene is fetched only once the browser is idle after load,
   then fades in over the poster. It stops rendering whenever it's off
   screen or the tab is hidden, and a drag turns the card by hand. */
export default function Card3D({
  poster,
  posterAlt,
  posterWidth,
  posterHeight,
  priority,
  className,
  ...sceneOptions
}: Props) {
  const wrapRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [live, setLive] = useState(false);
  const optionsRef = useRef(sceneOptions);

  useEffect(() => {
    const wrap = wrapRef.current;
    const canvas = canvasRef.current;
    if (!wrap || !canvas) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

    let scene: CardScene | undefined;
    let cancelled = false;
    let visible = true;
    const cleanups: (() => void)[] = [];

    const sync = () => {
      if (!scene) return;
      if (visible && !document.hidden) scene.start();
      else scene.stop();
    };

    const boot = async () => {
      try {
        const probe = document.createElement("canvas");
        if (!probe.getContext("webgl2") && !probe.getContext("webgl")) return;
        const { createCardScene } = await import("./scene");
        if (cancelled) return;
        scene = createCardScene(canvas, optionsRef.current);
        await scene.ready;
        if (cancelled) return;
        setLive(true);
        sync();
      } catch {
        // No 3D: the poster simply stays.
      }
    };

    // Wait for load, then for an idle moment, so the scene never competes
    // with the page's own first paint and hydration.
    const schedule = () => {
      const idle = window.requestIdleCallback ?? ((cb: () => void) => window.setTimeout(cb, 300));
      idle(() => void boot(), { timeout: 2500 });
    };
    if (document.readyState === "complete") schedule();
    else {
      window.addEventListener("load", schedule, { once: true });
      cleanups.push(() => window.removeEventListener("load", schedule));
    }

    const io = new IntersectionObserver(([entry]) => {
      visible = entry.isIntersecting;
      sync();
    });
    io.observe(wrap);
    cleanups.push(() => io.disconnect());

    const onVisibility = () => sync();
    document.addEventListener("visibilitychange", onVisibility);
    cleanups.push(() => document.removeEventListener("visibilitychange", onVisibility));

    const ro = new ResizeObserver(() => scene?.resize());
    ro.observe(canvas);
    cleanups.push(() => ro.disconnect());

    // Drag to turn. Horizontal drags only, so vertical swipes still scroll.
    let lastX: number | null = null;
    let lastT = 0;
    const down = (e: PointerEvent) => {
      lastX = e.clientX;
      lastT = e.timeStamp;
    };
    const move = (e: PointerEvent) => {
      if (lastX === null || !scene) return;
      const dx = e.clientX - lastX;
      const dt = Math.max(e.timeStamp - lastT, 8) / 1000;
      scene.nudge((dx / canvas.clientWidth) * 3 * (1 / dt) * 0.25);
      lastX = e.clientX;
      lastT = e.timeStamp;
    };
    const up = () => {
      lastX = null;
    };
    canvas.addEventListener("pointerdown", down);
    window.addEventListener("pointermove", move);
    window.addEventListener("pointerup", up);
    window.addEventListener("pointercancel", up);
    cleanups.push(() => {
      canvas.removeEventListener("pointerdown", down);
      window.removeEventListener("pointermove", move);
      window.removeEventListener("pointerup", up);
      window.removeEventListener("pointercancel", up);
    });

    return () => {
      cancelled = true;
      cleanups.forEach((fn) => fn());
      scene?.dispose();
    };
  }, []);

  return (
    <div ref={wrapRef} className={`relative ${className ?? ""}`}>
      <Image
        src={poster}
        alt={posterAlt}
        width={posterWidth}
        height={posterHeight}
        priority={priority}
        sizes="(min-width: 1024px) 60vw, 100vw"
        className={`pointer-events-none absolute inset-0 h-full w-full max-w-none object-contain transition-opacity duration-700 ${
          live ? "opacity-0" : "opacity-100"
        }`}
      />
      <canvas
        ref={canvasRef}
        aria-hidden
        className={`absolute inset-0 h-full w-full cursor-grab touch-pan-y transition-opacity duration-700 active:cursor-grabbing ${
          live ? "opacity-100" : "opacity-0"
        }`}
      />
    </div>
  );
}
