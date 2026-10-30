/* The "What people see" section's 3D scene: an iPhone and the Unitouch card.
   The page's scroll drives one progress value from 0 to 1, and everything
   here is a smooth function of it: the card taps the back of the phone, the
   phone turns round as its screen wakes, the profile on the screen scrolls
   to the links, and a "saved to contacts" note drops in. Loaded with a
   dynamic import only when the section comes near (PhoneStory.tsx). */
import {
  CanvasTexture,
  Group,
  Mesh,
  MeshBasicMaterial,
  PerspectiveCamera,
  RingGeometry,
  ShapeGeometry,
  SRGBColorSpace,
  Vector3,
} from "three";
import { buildCard, contactShadow, createStudio, roundedRect } from "./parts";
import { STORY_END as END } from "./story";

import {
  BACK_Z,
  FRONT_Z,
  PH,
  PW,
  SH,
  SHOT_H,
  SW,
  VIEW_H,
  createPhoneModel,
  fitUVs,
} from "./phoneModel";

const clamp = (v: number, a = 0, b = 1) => Math.min(b, Math.max(a, v));
const mix = (a: number, b: number, t: number) => a + (b - a) * t;
// Smootherstep: starts and ends with zero speed and zero acceleration, so
// nothing ever lurches into or out of a move.
const soft = (a: number, b: number, v: number) => {
  const x = clamp((v - a) / (b - a));
  return x * x * x * (x * (x * 6 - 15) + 10);
};
// A small overshoot at the end, for things that drop into place.
const settle = (x: number) => {
  const c = 1.25;
  return x <= 0 ? 0 : x >= 1 ? 1 : 1 + (c + 1) * Math.pow(x - 1, 3) + c * Math.pow(x - 1, 2);
};

/* A smooth path through keyframes [progress, value]: a monotone cubic
   (Fritsch-Carlson), so it never overshoots a key, and its speed changes
   gradually from one key to the next instead of stopping at each one. The
   whole story is built from these, with keys that overlap, so one motion
   is still finishing while the next has already begun. */
function track(keys: [number, number][]) {
  const n = keys.length;
  const x = keys.map((k) => k[0]);
  const y = keys.map((k) => k[1]);
  const d = x.slice(0, -1).map((_, i) => (y[i + 1] - y[i]) / (x[i + 1] - x[i]));
  const m = y.map((_, i) => (i === 0 ? d[0] : i === n - 1 ? d[n - 2] : d[i - 1] * d[i] <= 0 ? 0 : (d[i - 1] + d[i]) / 2));
  for (let i = 0; i < n - 1; i++) {
    if (d[i] === 0) {
      m[i] = m[i + 1] = 0;
      continue;
    }
    const a = m[i] / d[i];
    const b = m[i + 1] / d[i];
    const s = a * a + b * b;
    if (s > 9) {
      const k = 3 / Math.sqrt(s);
      m[i] = k * a * d[i];
      m[i + 1] = k * b * d[i];
    }
  }
  return (v: number) => {
    if (v <= x[0]) return y[0];
    if (v >= x[n - 1]) return y[n - 1];
    let i = 0;
    while (v > x[i + 1]) i++;
    const h = x[i + 1] - x[i];
    const t = (v - x[i]) / h;
    const t2 = t * t;
    const t3 = t2 * t;
    return (
      (2 * t3 - 3 * t2 + 1) * y[i] + (t3 - 2 * t2 + t) * h * m[i] + (-2 * t3 + 3 * t2) * y[i + 1] + (t3 - t2) * h * m[i + 1]
    );
  };
}

/* The story, from -0.3 (the section still coming up the screen) to 1.
   The phone turns one way only, all the way through: already turning as
   it appears, its back to us while the card swoops in, touches it and
   carries on out of frame without stopping, then round to the screen,
   slowing gradually but never quite still until the end. The screen wakes
   as it comes round, the profile starts scrolling before the turn has
   finished, and the note drops in while the scroll is still easing out. */
const PI = Math.PI;
const phoneYaw = track([[-0.3, PI + 0.95], [0, PI + 0.3], [0.12, PI - 0.12], [0.3, PI / 2 + 0.15], [0.5, 0.12], [0.75, -0.16], [1, -0.3]]);
const phoneTilt = track([[-0.3, 0.26], [0.1, 0.12], [0.35, -0.12], [0.7, -0.05], [1, -0.08]]);
const phoneRoll = track([[-0.3, -0.12], [0.1, -0.05], [0.5, 0.04], [1, 0.02]]);
const phoneRise = track([[-0.3, -0.25], [0.1, 0], [0.35, 0.1], [0.7, 0.03], [1, 0]]);
const phoneNear = track([[-0.3, 0], [0.2, 0.1], [0.35, 0.25], [0.7, 0.06], [1, 0]]);
const camDist = track([[-0.3, 1.16], [0.3, 1.05], [1, 0.97]]);
const camY = track([[-0.3, -0.05], [0.2, 0.15], [1, 0.1]]);
// The card: in from the upper right, touching the phone's back at 0.12
// (the only key it slows for, and only towards the phone), out to the
// upper left.
const cardX = track([[-0.3, 3.6], [0, 1.6], [0.12, 0.1], [0.22, -1], [0.4, -3.4]]);
const cardY = track([[-0.3, 2.1], [0, 0.85], [0.12, 0.05], [0.22, 0.5], [0.4, 2.1]]);
const cardZ = track([[-0.3, 2.3], [0, 1.6], [0.12, 0.72], [0.22, 1.3], [0.4, 1.9]]);
const cardRX = track([[-0.3, -0.75], [0, -0.38], [0.12, -0.12], [0.22, -0.4], [0.4, -0.75]]);
const cardRY = track([[-0.3, -1.7], [0, -0.85], [0.12, -0.15], [0.22, -0.9], [0.4, -1.7]]);
const cardRZ = track([[-0.3, 0.75], [0, 0.32], [0.12, 0.06], [0.22, 0.35], [0.4, 0.65]]);
const wakeAt = track([[0.14, 0], [0.36, 1]]);
const scrollAt = track([[0.4, 0], [0.62, 0.55], [0.86, 1]]);
const savedAt = track([[0.76, 0], [0.93, 1]]);
/* The close-up: as the note drops, the camera pushes in on the Dynamic
   Island over the whole last stretch of the section, easing in and out,
   while the phone swings one way and flows back into its final pose,
   turned about 35 degrees and tipped back about 25 so the screen faces
   slightly up and to the left (y -0.61 and x -0.44 in total, with the
   story's own end pose), and the camera banks and levels out with it. */
// Past 1 the story keeps going through the short held stretch at the end
// of the section (story.ts): the close-up moves briskly once the note has
// landed and reaches about 95% soon after, then only the last 5% settles,
// slowly and smoothly, along with the swing, as the section leaves the
// screen. Each track starts with a near-flat key so nothing jolts into
// motion.
const zoomAt = track([[0.6, 0], [0.68, 0.04], [0.84, 0.5], [0.98, 0.88], [1.08, 0.95], [END, 1]]);
const swingYaw = track([[0.6, 0], [0.66, 0.02], [0.84, 0.3], [1.0, -0.14], [1.12, -0.27], [END, -0.31]]);
const swingTilt = track([[0.6, 0], [0.66, 0.01], [0.84, 0.14], [1.0, -0.22], [1.12, -0.33], [END, -0.36]]);
const swingRoll = track([[0.6, 0], [0.66, -0.01], [0.84, -0.18], [1.0, -0.08], [1.12, -0.05], [END, -0.04]]);
const camBank = track([[0.6, 0], [0.66, 0.01], [0.84, 0.1], [1.04, 0.02], [END, 0]]);


/* The note that drops out of the Dynamic Island at the end. */
function toastTexture(): CanvasTexture {
  const c = document.createElement("canvas");
  // Drawn at twice its layout size, so it stays sharp in the close-up.
  c.width = 1440;
  c.height = 300;
  const ctx = c.getContext("2d")!;
  ctx.scale(2, 2);
  const css = getComputedStyle(document.documentElement);
  const family = css.getPropertyValue("--font-inter").trim() || "sans-serif";
  ctx.fillStyle = "rgba(28,28,30,0.94)";
  ctx.beginPath();
  ctx.roundRect(0, 0, 720, 150, 44);
  ctx.fill();
  ctx.fillStyle = "#30B04F";
  ctx.beginPath();
  ctx.arc(80, 75, 34, 0, Math.PI * 2);
  ctx.fill();
  ctx.strokeStyle = "#fff";
  ctx.lineWidth = 7;
  ctx.lineCap = "round";
  ctx.beginPath();
  ctx.moveTo(64, 76);
  ctx.lineTo(76, 88);
  ctx.lineTo(98, 63);
  ctx.stroke();
  ctx.fillStyle = "#fff";
  ctx.font = `600 34px ${family}`;
  ctx.fillText("Contact saved", 140, 66);
  ctx.fillStyle = "rgba(255,255,255,0.7)";
  ctx.font = `400 29px ${family}`;
  ctx.fillText("Added to your contacts", 140, 108);
  const t = new CanvasTexture(c);
  t.colorSpace = SRGBColorSpace;
  return t;
}

export interface PhoneScene {
  /** Where the story is, 0 to 1. The scene eases toward it. */
  setProgress(p: number): void;
  start(): void;
  stop(): void;
  resize(): void;
  dispose(): void;
  readonly ready: Promise<void>;
}

export function createPhoneScene(canvas: HTMLCanvasElement, opts: { still?: number } = {}): PhoneScene {
  const studio = createStudio(canvas);
  // A touch above 1x even on standard screens, so the close-up isn't
  // jagged; never above 2x, so it stays quick.
  studio.renderer.setPixelRatio(Math.min(Math.max(window.devicePixelRatio || 1, 1.5), 2));
  const { renderer, scene } = studio;
  const camera = new PerspectiveCamera(22, 1, 0.1, 100);
  const disposables: { dispose(): void }[] = [];
  const track = <T extends { dispose(): void }>(x: T) => (disposables.push(x), x);

  // ── The phone ───────────────────────────────────────────────────────────
  const turn = new Group();
  scene.add(turn);

  const phoneModel = createPhoneModel(renderer);
  const { phone, screenMat, barMat } = phoneModel;
  turn.add(phone);
  disposables.push(phoneModel);

  /* The note is two layers: a dark pill that grows out of the island, and
     the words and tick, which fade in once it has room for them. */
  const toastW = SW * 0.92;
  const toastH = (toastW * 150) / 720;
  const toastGeo = track(new ShapeGeometry(roundedRect(toastW, toastH, 0.06), 16));
  fitUVs(toastGeo, toastW, toastH);
  const pillMat = track(new MeshBasicMaterial({ color: 0x1c1c1e, transparent: true, opacity: 0, toneMapped: false }));
  const toastMat = track(new MeshBasicMaterial({ map: toastTexture(), transparent: true, opacity: 0, toneMapped: false }));
  const toast = new Group();
  const pill = new Mesh(toastGeo, pillMat);
  const words = new Mesh(toastGeo, toastMat);
  words.position.z = 0.001;
  toast.add(pill, words);
  toast.position.z = FRONT_Z + 0.004;
  phone.add(toast);
  // The island sits about 12 mm below the top of the display; the note
  // settles just under it.
  const ISLAND_Y = SH / 2 - 0.3;
  const TOAST_Y = SH / 2 - 0.66;

  // ── The card, which taps the back of the phone ──────────────────────────
  const card = buildCard(renderer, {
    name: "Your Name",
    title: "What you do",
    url: "https://www.unitouch.in",
  });
  scene.add(card.group);
  disposables.push(card);

  // A ring that ripples out from the tap.
  const rippleMat = track(new MeshBasicMaterial({ color: 0x4f5e48, transparent: true, opacity: 0, depthWrite: false }));
  const ripple = new Mesh(track(new RingGeometry(0.3, 0.33, 64)), rippleMat);
  turn.add(ripple);

  const shadow = track(contactShadow(PW * 2.1, PW * 0.65));
  shadow.mesh.position.y = -PH / 2 - 0.35;
  scene.add(shadow.mesh);

  const ready = Promise.all([phoneModel.ready, card.ready]).then(() => undefined);

  // ── Motion ──────────────────────────────────────────────────────────────
  let target = opts.still ?? 0;
  let p = target;
  let v = 0; // how fast p is moving
  let t = 0;
  let running = false;
  let last = 0;
  let frame = 0;

  let baseDist = 10;
  // How far the close-up sits from the island: near enough that the note
  // fills most of the frame, at any canvas shape.
  let closeDist = 4;
  const focus = new Vector3();
  const aim = new Vector3();

  function resize() {
    const w = canvas.clientWidth;
    const h = canvas.clientHeight;
    if (!w || !h) return;
    renderer.setSize(w, h, false);
    camera.aspect = w / h;
    // Fit the phone's height (plus room for the card) in view.
    const half = Math.tan((camera.fov * Math.PI) / 360);
    const byHeight = (PH * 1.14) / (2 * half);
    const byWidth = (PH * 0.82) / (2 * half * camera.aspect);
    baseDist = Math.max(byHeight, byWidth);
    closeDist = Math.max((SW * 1.25) / (2 * half * camera.aspect), (SW * 0.85) / (2 * half));
    camera.updateProjectionMatrix();
    render();
  }

  function render() {
    // Small breathing motions on top, so even at rest nothing is frozen.
    const zoom = zoomAt(p);
    const sway = Math.sin(t * 0.5) * 0.04 * (1 - zoom * 0.7);

    // The card (see the tracks above).
    card.group.position.set(cardX(p), cardY(p) + Math.sin(t * 1.1) * 0.025, cardZ(p));
    card.group.rotation.set(cardRX(p) + Math.sin(t * 0.7) * 0.03, cardRY(p), cardRZ(p));
    card.group.visible = p < 0.4;

    // The phone.
    turn.rotation.y = phoneYaw(p) + sway + swingYaw(p);
    turn.rotation.x = phoneTilt(p) + Math.sin(t * 0.4) * 0.02 + swingTilt(p);
    turn.rotation.z = phoneRoll(p) + swingRoll(p);
    turn.position.y = phoneRise(p) + Math.sin(t * 0.7) * 0.03;
    turn.position.z = phoneNear(p);

    // The camera: the wide framing, blended into the close-up on the island
    // and the note under it (a point between them, found in world space
    // after the phone has moved, so the close-up follows the swing).
    turn.updateMatrixWorld();
    focus.set(0, (ISLAND_Y + TOAST_Y) / 2, FRONT_Z);
    turn.localToWorld(focus);
    const wideY = camY(p);
    const e = zoom;
    camera.position.set(
      mix(0, focus.x, e),
      mix(wideY, focus.y + 0.12, e),
      mix(baseDist * camDist(p), focus.z + closeDist, e)
    );
    aim.set(mix(0, focus.x, e), mix(wideY - 0.15, focus.y, e), mix(0, focus.z, e));
    const bank = camBank(p);
    camera.up.set(Math.sin(bank), Math.cos(bank), 0);
    camera.lookAt(aim);

    const wake = wakeAt(p);
    screenMat.color.setScalar(wake);
    barMat.color.copy(screenMat.color);

    // The tap ripple, on the back of the phone where the card touched.
    const r = clamp((p - 0.1) / 0.18);
    ripple.position.set(-0.1, 0.05, BACK_Z - 0.01);
    ripple.rotation.y = Math.PI;
    ripple.scale.setScalar(0.6 + r * 2.4);
    rippleMat.opacity = r > 0 && r < 1 ? Math.sin(Math.PI * Math.sqrt(r)) * 0.7 : 0;

    // The profile scrolls down to the links.
    const shot = screenMat.map;
    if (shot) shot.offset.y = mix(0, 1 - VIEW_H / SHOT_H, scrollAt(p));

    // "Contact saved" grows out of the Dynamic Island and drops just below
    // it, all inside the screen, like iOS does.
    const saved = savedAt(p);
    const drop = settle(saved);
    pillMat.opacity = clamp(saved * 25);
    toastMat.opacity = soft(0.45, 1, saved);
    // It starts the size of the island itself (about 31 x 9 mm), on top of it.
    toast.scale.set(mix(0.47, 1, drop), mix(0.66, 1, drop), 1);
    toast.position.y = mix(ISLAND_Y, TOAST_Y, Math.min(drop, soft(0, 0.7, saved) * 1.03));
    toast.visible = saved > 0.001;

    const facing = Math.abs(Math.cos(turn.rotation.y));
    const lift = phoneNear(p) * 4;
    shadow.mesh.scale.set((0.55 + 0.45 * facing) * (1 - lift * 0.08), 1, 1);
    shadow.mat.opacity = 0.75 - lift * 0.15;
    renderer.render(scene, camera);
  }

  function tick(now: number) {
    if (!running) return;
    const dt = Math.min((now - last) / 1000, 0.05);
    last = now;
    t += dt;
    /* Follow the scroll position on a critically damped spring: the story
       picks up speed gently, glides, and comes to rest without a bump, even
       when the page is scrolled in jumps (a mouse wheel's notches). */
    const W0 = 3.4;
    for (let i = 0; i < 2; i++) {
      const h = dt / 2;
      v += (W0 * W0 * (target - p) - 2 * W0 * v) * h;
      p += v * h;
    }
    render();
    frame = requestAnimationFrame(tick);
  }

  resize();

  return {
    ready: ready.then(() => render()),
    setProgress(v: number) {
      target = clamp(v, -1, END);
    },
    start() {
      if (running) return;
      running = true;
      last = performance.now();
      frame = requestAnimationFrame(tick);
    },
    stop() {
      running = false;
      cancelAnimationFrame(frame);
    },
    resize,
    dispose() {
      running = false;
      cancelAnimationFrame(frame);
      disposables.forEach((d) => d.dispose());
      studio.dispose();
    },
  };
}
