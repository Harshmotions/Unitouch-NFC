"use client";

import { useEffect, useRef, useState } from "react";
import Image from "next/image";
import type { TapScene } from "@/components/marketing/card3d/tapScene";
import { loaderShowing } from "@/lib/loader";

/* The three looping demos in "How it works": a form typing itself in, the
   card printing the name once the form is sent, and the real 3D iPhone
   being tapped by the card (card3d/tapScene.ts). Each is a pure function
   of a clock and every loop ends exactly where it began (the typing erases
   back to empty, the phone turns a full 360), so nothing ever jumps back
   to a first frame. The form and the card share one clock, so the card
   prints what the form sent. Each demo runs only while on screen; with
   reduced motion it shows one still moment. */

// ── The clock ─────────────────────────────────────────────────────────────

// Shared by every demo, started the first time any of them comes on
// screen, so the typing begins from an empty form.
let clockStart: number | null = null;
const now = () => {
  const t = performance.now();
  if (clockStart === null) clockStart = t;
  return (t - clockStart) / 1000;
};


/* Runs `frame` on every animation frame while `ref` is on screen. Under
   reduced motion it calls it once, with `still`, and stops. */
function useFrames(ref: React.RefObject<HTMLElement | null>, frame: (t: number) => void, still: number) {
  const frameRef = useRef(frame);
  frameRef.current = frame;
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      frameRef.current(still);
      return;
    }
    let raf = 0;
    let visible = false;
    const tick = () => {
      frameRef.current(now());
      raf = requestAnimationFrame(tick);
    };
    const io = new IntersectionObserver(([e]) => {
      visible = e.isIntersecting;
      cancelAnimationFrame(raf);
      if (visible && !document.hidden) raf = requestAnimationFrame(tick);
    });
    io.observe(el);
    const onVis = () => {
      cancelAnimationFrame(raf);
      if (visible && !document.hidden) raf = requestAnimationFrame(tick);
    };
    document.addEventListener("visibilitychange", onVis);
    return () => {
      io.disconnect();
      document.removeEventListener("visibilitychange", onVis);
      cancelAnimationFrame(raf);
    };
  }, [ref, still]);
}

// ── The typing script ─────────────────────────────────────────────────────

const PEOPLE = [
  { name: "Aarav Shah", title: "Product Designer", email: "aarav@shahstudio.in" },
  { name: "Meera Iyer", title: "Architect", email: "meera@iyerworks.com" },
  { name: "Kabir Sethi", title: "Founder, Kite Labs", email: "kabir@kitelabs.in" },
];
const FIELDS = ["name", "title", "email"] as const;
type Field = (typeof FIELDS)[number];
// Seconds per character, typing and erasing, and the pauses between.
const TYPE: Record<Field, number> = { name: 0.11, title: 0.075, email: 0.055 };
const ERASE = 0.028;
const GAP = 0.35;
const HOLD = 2.2;
const REST = 0.6;

interface Beat {
  field: Field;
  start: number; // when this field starts typing
  typed: number; // when it's fully typed
  eraseStart: number;
  erased: number;
  text: string;
}

/* One person's turn: each field types in after the one before, the whole
   form holds, then they erase in reverse (email, title, name) back to an
   empty form. Returns the beats and the turn's length. */
function plan(p: (typeof PEOPLE)[number]) {
  let t = 0.3;
  const beats: Beat[] = [];
  for (const field of FIELDS) {
    const text = p[field];
    const start = t;
    t += text.length * TYPE[field];
    beats.push({ field, start, typed: t, eraseStart: 0, erased: 0, text });
    t += GAP;
  }
  const pressAt = t;
  t += HOLD;
  for (const b of [...beats].reverse()) {
    b.eraseStart = t;
    t += b.text.length * ERASE;
    b.erased = t;
    t += 0.12;
  }
  return { beats, pressAt, length: t + REST };
}
const TURNS = PEOPLE.map(plan);
const CYCLE = TURNS.reduce((s, x) => s + x.length, 0);

type Print = "blank" | "printed" | "clearing";

/* Where the typing is at time t: whose turn, how many characters of each
   field are showing, which field has the caret, and when the button is
   pressed. */
function typingAt(t: number) {
  let local = ((t % CYCLE) + CYCLE) % CYCLE;
  let i = 0;
  while (local >= TURNS[i].length) {
    local -= TURNS[i].length;
    i++;
  }
  const turn = TURNS[i];
  const shown: Record<Field, number> = { name: 0, title: 0, email: 0 };
  let caret: Field | null = null;
  for (const b of turn.beats) {
    const len = b.text.length;
    if (local < b.start) shown[b.field] = 0;
    else if (local < b.typed) shown[b.field] = Math.floor(((local - b.start) / (b.typed - b.start)) * len);
    else if (local < b.eraseStart) shown[b.field] = len;
    else if (local < b.erased) shown[b.field] = len - Math.ceil(((local - b.eraseStart) / (b.erased - b.eraseStart)) * len);
    else shown[b.field] = 0;
    if ((local >= b.start && local < b.typed + GAP) || (local >= b.eraseStart && local < b.erased)) caret = b.field;
  }
  const pressed = local >= turn.pressAt && local < turn.pressAt + 0.35;
  // The card: blank, printed once the form is sent, cleared as the form
  // starts erasing (the email goes first).
  const clearAt = turn.beats[2].eraseStart;
  const print: Print =
    local < turn.pressAt + 0.25 ? "blank" : local < clearAt ? "printed" : local < clearAt + 0.6 ? "clearing" : "blank";
  return { person: i, shown, caret, pressed, print };
}

/* Re-renders only when something visible changes (a character, the caret,
   the button), not every frame. */
function useTyping(ref: React.RefObject<HTMLElement | null>) {
  const [state, setState] = useState(() => typingAt(0));
  const keyRef = useRef("");
  // A still moment for reduced motion: the first person, fully typed in.
  const stillAt = TURNS[0].pressAt + 0.5;
  useFrames(
    ref,
    (t) => {
      const s = typingAt(t);
      const key = `${s.person}|${s.shown.name}|${s.shown.title}|${s.shown.email}|${s.caret}|${s.pressed}|${s.print}`;
      if (key !== keyRef.current) {
        keyRef.current = key;
        setState(s);
      }
    },
    stillAt
  );
  return state;
}

// ── 1. The form ───────────────────────────────────────────────────────────

const LABELS: Record<Field, string> = { name: "Name on card", title: "What you do", email: "Email" };

export function FormDemo() {
  const ref = useRef<HTMLDivElement>(null);
  const { person, shown, caret, pressed } = useTyping(ref);
  const p = PEOPLE[person];
  return (
    // Sized in container units (the tile is a container), so the whole form
    // fits its tile at any width.
    <div ref={ref} aria-hidden className="flex w-[78%] flex-col gap-[0.5em] text-left text-[4.4cqw]">
      {FIELDS.map((f) => (
        <div key={f}>
          <p className="text-text-secondary mb-[0.3em] text-[0.72em] leading-none font-[500]">{LABELS[f]}</p>
          <div
            className={`flex h-[2.3em] items-center rounded-full px-[0.9em] text-[0.86em] transition-shadow duration-300 ${
              caret === f ? "bg-white shadow-[0_0_0_1.5px_var(--color-accent)]" : "bg-white/70"
            }`}
          >
            <span className="truncate whitespace-pre">{p[f].slice(0, shown[f])}</span>
            {caret === f && <span className="type-caret bg-text-primary ml-px h-[1.1em] w-px shrink-0" />}
          </div>
        </div>
      ))}
      <div
        className={`bg-accent text-accent-ink mt-[0.3em] flex h-[2.3em] items-center justify-center rounded-full text-[0.86em] font-[600] transition-transform duration-200 ${
          pressed ? "scale-[0.96]" : ""
        }`}
      >
        Continue
      </div>
    </div>
  );
}

// ── 2. The card, printed once the form is sent ────────────────────────────

/* A plain, light print: when the form is sent, a print head wipes across
   the card once and leaves the name and title behind it (a clip-path
   reveal and one moving line, both CSS transitions, so it costs three
   state changes a loop). When the form starts erasing, the print fades
   away, and the card is blank again for the next name. */
export function CardDemo() {
  const ref = useRef<HTMLDivElement>(null);
  const { person, print } = useTyping(ref);
  const p = PEOPLE[person];
  return (
    <div ref={ref} aria-hidden className="card-float w-[84%] [perspective:900px]">
      <div className="card-face relative aspect-[85.6/54] w-full rounded-[5.5%/8.7%] text-left">
        <svg viewBox="0 0 24 24" fill="none" className="absolute top-[11%] right-[7%] h-[16%] w-auto">
          <circle cx="15" cy="12" r="1.6" fill="currentColor" />
          <path d="M11.2 6.6a7 7 0 0 0 0 10.8" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" />
          <path d="M7.6 3.4a11.6 11.6 0 0 0 0 17.2" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" />
        </svg>
        <div className={`print-area absolute right-[7%] bottom-[14%] left-[7%] is-${print}`}>
          <div className="print-ink">
            <p className="font-display text-[7cqw] leading-tight font-[600]">{p.name}</p>
            <p className="mt-[0.3em] text-[3.6cqw] opacity-75">{p.title}</p>
          </div>
          <span className="print-sweep" />
        </div>
      </div>
    </div>
  );
}

// ── 3. The tap, on the real 3D iPhone ─────────────────────────────────────

/* The still is the scene's own first frame, so the live scene replaces it
   in one frame with no crossfade. The scene loads once the page has gone
   idle and the tile is near, and only renders while it's on screen. */
export function TapDemo() {
  const ref = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [live, setLive] = useState(false);

  useEffect(() => {
    const wrap = ref.current;
    const canvas = canvasRef.current;
    if (!wrap || !canvas) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    let scene: TapScene | undefined;
    let cancelled = false;
    let visible = false;
    const sync = () => {
      if (!scene) return;
      if (visible && !document.hidden) scene.start();
      else scene.stop();
    };
    const boot = async () => {
      if (scene || cancelled) return;
      try {
        const { createTapScene } = await import("@/components/marketing/card3d/tapScene");
        if (cancelled) return;
        scene = createTapScene(canvas);
        await scene.ready;
        if (cancelled) return;
        setLive(true);
        sync();
      } catch {
        // No 3D: the still stays.
      }
    };
    const whenIdle = () => {
      const go = () => (window.requestIdleCallback ?? ((cb: () => void) => window.setTimeout(cb, 300)))(() => void boot(), { timeout: 3000 });
      // Never while the first-visit loader is up: its reveal must stay smooth.
      const afterLoad = () => (loaderShowing() ? window.addEventListener("unitouch:loaded", go, { once: true }) : go());
      if (document.readyState === "complete") afterLoad();
      else window.addEventListener("load", afterLoad, { once: true });
    };
    const near = new IntersectionObserver(
      ([e]) => {
        if (e.isIntersecting) {
          near.disconnect();
          whenIdle();
        }
      },
      { rootMargin: "100% 0px" }
    );
    // Watch the whole section, not this tile: on a phone the tile sits off
    // to the side in a swipe row, which would otherwise delay loading the
    // scene until it's swiped into view.
    near.observe(wrap.closest("section") ?? wrap);
    const onScreen = new IntersectionObserver(([e]) => {
      visible = e.isIntersecting;
      sync();
    });
    onScreen.observe(wrap);
    const ro = new ResizeObserver(() => scene?.resize());
    ro.observe(canvas);
    document.addEventListener("visibilitychange", sync);
    return () => {
      cancelled = true;
      near.disconnect();
      onScreen.disconnect();
      ro.disconnect();
      document.removeEventListener("visibilitychange", sync);
      scene?.dispose();
    };
  }, []);

  return (
    <div ref={ref} aria-hidden className="relative h-full w-full">
      <Image
        src="/home/tap-demo.webp"
        alt=""
        fill
        sizes="(min-width: 768px) 30vw, 80vw"
        className={`object-contain ${live ? "opacity-0" : "opacity-100"}`}
      />
      <canvas ref={canvasRef} className={`absolute inset-0 h-full w-full ${live ? "opacity-100" : "opacity-0"}`} />
    </div>
  );
}
