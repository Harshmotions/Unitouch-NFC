"use client";

import { useEffect, useRef, useState } from "react";
import Image from "next/image";

/* The three looping demos in "How it works": a form typing itself in, the
   same name printing onto a card, and a card tapping a phone that spins
   round to the profile. Everything is a pure function of one clock, and
   every loop ends exactly where it began (the typing erases back to empty,
   the phone turns a full 360), so nothing ever jumps back to a first
   frame. The form and the card share the clock, so the card prints what
   the form types. Each demo runs only while on screen; with reduced motion
   it shows one still moment. HTML and CSS only, no 3D library. */

// ── The clock ─────────────────────────────────────────────────────────────

// Shared by every demo, started the first time any of them comes on
// screen, so the typing begins from an empty form.
let clockStart: number | null = null;
const now = () => {
  const t = performance.now();
  if (clockStart === null) clockStart = t;
  return (t - clockStart) / 1000;
};

const clamp = (v: number, a = 0, b = 1) => Math.min(b, Math.max(a, v));
const mix = (a: number, b: number, t: number) => a + (b - a) * t;
// Smootherstep: zero speed and acceleration at both ends, so every move
// eases out of rest and settles slowly back into it.
const ease = (a: number, b: number, v: number) => {
  const x = clamp((v - a) / (b - a));
  return x * x * x * (x * (x * 6 - 15) + 10);
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
  return { person: i, shown, caret, pressed };
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
      const key = `${s.person}|${s.shown.name}|${s.shown.title}|${s.shown.email}|${s.caret}|${s.pressed}`;
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

// ── 2. The card, printing what the form types ─────────────────────────────

/* Each character sits in its own span, all of the person's name always
   rendered (so nothing reflows), switched on as it's typed: it inks in
   from a soft blur, a touch large and raised, and settles; a thin print
   head runs just ahead of the last letter. Erased letters lift off. */
function Printed({ text, count, head, className }: { text: string; count: number; head: boolean; className: string }) {
  return (
    <p className={`relative whitespace-pre ${className}`}>
      {text.split("").map((ch, i) => (
        <span key={i} className={`print-char ${i < count ? "is-on" : ""}`}>
          {ch}
        </span>
      ))}
      {head && (
        <span
          className="print-head"
          style={{ left: `${(count / Math.max(1, text.length)) * 100}%` }}
        />
      )}
    </p>
  );
}

export function CardDemo() {
  const ref = useRef<HTMLDivElement>(null);
  const { person, shown, caret } = useTyping(ref);
  const p = PEOPLE[person];
  return (
    <div ref={ref} aria-hidden className="card-float w-[84%] [perspective:900px]">
      <div className="card-face relative aspect-[85.6/54] w-full rounded-[5.5%/8.7%] text-left">
        <svg viewBox="0 0 24 24" fill="none" className="absolute top-[11%] right-[7%] h-[16%] w-auto">
          <circle cx="15" cy="12" r="1.6" fill="currentColor" />
          <path d="M11.2 6.6a7 7 0 0 0 0 10.8" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" />
          <path d="M7.6 3.4a11.6 11.6 0 0 0 0 17.2" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" />
        </svg>
        <div className="absolute right-[7%] bottom-[14%] left-[7%]" key={person}>
          <Printed
            text={p.name}
            count={shown.name}
            head={caret === "name"}
            className="font-display w-fit text-[7cqw] leading-tight font-[600]"
          />
          <Printed
            text={p.title}
            count={shown.title}
            head={caret === "title"}
            className="mt-[0.3em] w-fit text-[3.6cqw] opacity-75"
          />
        </div>
      </div>
    </div>
  );
}

// ── 3. The tap ────────────────────────────────────────────────────────────

const TAP_CYCLE = 7.6;

export function TapDemo() {
  const ref = useRef<HTMLDivElement>(null);
  const phoneRef = useRef<HTMLDivElement>(null);
  const cardRef = useRef<HTMLDivElement>(null);
  const rippleRef = useRef<HTMLSpanElement>(null);
  const screenRef = useRef<HTMLDivElement>(null);

  useFrames(
    ref,
    (t) => {
      const k = ((t % TAP_CYCLE) + TAP_CYCLE) % TAP_CYCLE;
      // The card glides in, touches the phone's back, and drifts away while
      // the phone is already turning; it fades back in, at its starting
      // spot, only once the phone has turned all the way round again.
      const come = ease(0.2, 1.3, k);
      const press = Math.sin(Math.PI * clamp((k - 1.3) / 0.45));
      const go = ease(1.75, 3.0, k);
      const back = ease(6.6, 7.5, k);
      const x = mix(mix(58, 8, come), 62, go);
      const y = mix(mix(-18, 6, come), -30, go);
      const rot = mix(mix(-16, -6, come), -22, go);
      const opacity = clamp(1 - go + back);
      const cx = go >= 1 ? mix(62, 58, back) : x;
      const cy = go >= 1 ? mix(-30, -18, back) : y;
      const cr = go >= 1 ? mix(-22, -16, back) : rot;
      if (cardRef.current) {
        cardRef.current.style.transform = `translate(${cx}%, ${cy}%) translateZ(${40 - press * 14}px) rotate(${cr}deg)`;
        cardRef.current.style.opacity = String(opacity);
      }
      // The tap: a ring spreading over the phone's back.
      const r = clamp((k - 1.4) / 1.0);
      if (rippleRef.current) {
        rippleRef.current.style.transform = `translate(-50%, -50%) scale(${0.3 + r * 1.6})`;
        rippleRef.current.style.opacity = String(r > 0 && r < 1 ? (1 - r) * 0.8 : 0);
      }
      // The phone turns once round, in two half turns with a rest between:
      // to the profile, then on round to its back again (360 = 0).
      const turn = 180 * ease(2.0, 3.4, k) + 180 * ease(5.4, 6.8, k);
      const sway = Math.sin((k / TAP_CYCLE) * Math.PI * 2) * 4;
      if (phoneRef.current) {
        phoneRef.current.style.transform = `rotateX(8deg) rotateY(${-turn + sway - 14}deg)`;
      }
      // The profile scrolls a little while it's facing us, and back.
      const scroll = ease(3.6, 4.6, k) - ease(5.4, 6.4, k);
      if (screenRef.current) screenRef.current.style.transform = `translateY(${-scroll * 18}%)`;
    },
    3.9
  );

  return (
    <div ref={ref} aria-hidden className="relative flex h-full w-full items-center justify-center [perspective:1100px]">
      <div ref={phoneRef} className="tap-phone relative aspect-[78.5/161.2] h-[84%] [transform-style:preserve-3d]">
        {/* Thickness: a few stacked layers of the frame between the faces. */}
        {[-4, -2, 0, 2, 4].map((z) => (
          <div key={z} className="absolute inset-0 rounded-[17%/8.3%] bg-[#2d2c2e]" style={{ transform: `translateZ(${z}px)` }} />
        ))}
        {/* Back: matte glass, the camera block, and the tap ring. */}
        <div className="absolute inset-0 overflow-hidden rounded-[17%/8.3%] bg-[#3a3838] [backface-visibility:hidden] [transform:translateZ(6px)]">
          <div className="absolute top-[3.5%] left-[7%] grid aspect-square w-[46%] grid-cols-2 gap-[6%] rounded-[24%] bg-[#333132] p-[7%] shadow-[inset_0_0_0_1px_rgba(255,255,255,0.06)]">
            {[0, 1, 2].map((i) => (
              <span
                key={i}
                className={`aspect-square rounded-full bg-[#0c0c0e] shadow-[inset_0_0_0_2px_#5c5b5f] ${i === 2 ? "col-start-1" : ""}`}
              />
            ))}
            <span className="m-auto aspect-square w-[34%] rounded-full bg-[#efe7d2]" />
          </div>
          <span
            ref={rippleRef}
            className="border-accent absolute top-[46%] left-1/2 aspect-square w-[70%] rounded-full border-2 opacity-0"
          />
        </div>
        {/* Front: the bezel, the screen with the profile, the island. */}
        <div className="absolute inset-0 rounded-[17%/8.3%] bg-[#0b0b0c] p-[4.5%] [backface-visibility:hidden] [transform:rotateY(180deg)_translateZ(6px)]">
          <div className="relative h-full w-full overflow-hidden rounded-[13%/6.2%] bg-white">
            <div ref={screenRef} className="absolute inset-x-0 top-0">
              <Image src="/home/phone-screen.webp" alt="" width={1170} height={2925} sizes="160px" className="w-full max-w-none" />
            </div>
            <span className="absolute top-[2.4%] left-1/2 h-[3.6%] w-[33%] -translate-x-1/2 rounded-full bg-black" />
          </div>
        </div>
      </div>
      {/* The card, in front of the phone (closer to us). */}
      <div
        ref={cardRef}
        className="card-face absolute top-[40%] left-[24%] aspect-[85.6/54] w-[46%] rounded-[5.5%/8.7%]"
        style={{ transform: "translate(58%, -18%) translateZ(40px) rotate(-16deg)" }}
      >
        <svg viewBox="0 0 24 24" fill="none" className="absolute top-[12%] right-[8%] h-[18%] w-auto text-[#f4f2ee]">
          <circle cx="15" cy="12" r="1.6" fill="currentColor" />
          <path d="M11.2 6.6a7 7 0 0 0 0 10.8" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" />
          <path d="M7.6 3.4a11.6 11.6 0 0 0 0 17.2" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" />
        </svg>
        <p className="font-display absolute bottom-[16%] left-[8%] text-[3.4cqw] font-[600] text-[#f4f2ee]">Your Name</p>
      </div>
    </div>
  );
}
