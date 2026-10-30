/* The "You tap" demo in How it works: the real iPhone (phoneModel.ts) and
   the card, on a loop. The card rests at a far point, falls in faster and
   faster and strikes the phone's back at full speed, then bounces off with
   a knock of rotation on all three axes, slowing to rest at the far point
   again, like something dropped and bounced; meanwhile the phone turns
   round to the profile and on round to its back, a full turn. Everything
   is a function of one looping clock and the loop ends where it began.
   Loaded with a dynamic import when the tile comes near (Demos.tsx). */
import { Group, Mesh, MeshBasicMaterial, PerspectiveCamera, RingGeometry } from "three";
import { buildCard, contactShadow, createStudio } from "./parts";
import { BACK_Z, PH, PW, SHOT_H, VIEW_H, createPhoneModel } from "./phoneModel";

export const TAP_CYCLE = 8;

const clamp = (v: number, a = 0, b = 1) => Math.min(b, Math.max(a, v));
const mix = (a: number, b: number, t: number) => a + (b - a) * t;
const soft = (a: number, b: number, v: number) => {
  const x = clamp((v - a) / (b - a));
  return x * x * x * (x * (x * 6 - 15) + 10);
};

// When the card strikes, and how long the fall and the bounce take.
const HIT = 1.7;
const FALL = 1.3;
const BOUNCE = 1.6;

// Where the card rests, and where it meets the phone (world units; the
// phone's back faces us at the start).
const FAR = { x: 1.55, y: 0.95, z: 1.25, rx: -0.55, ry: -0.95, rz: 0.42 };
const TOUCH = { x: 0.06, y: 0.3, z: -BACK_Z + 0.06, rx: -0.04, ry: -0.08, rz: 0.04 };

export interface TapScene {
  start(): void;
  stop(): void;
  resize(): void;
  dispose(): void;
  readonly ready: Promise<void>;
}

export function createTapScene(canvas: HTMLCanvasElement, opts: { still?: boolean; at?: number } = {}): TapScene {
  const studio = createStudio(canvas);
  const { renderer, scene } = studio;
  const camera = new PerspectiveCamera(22, 1, 0.1, 100);

  const turn = new Group();
  scene.add(turn);
  const phoneModel = createPhoneModel(renderer);
  turn.add(phoneModel.phone);
  // The screen is awake throughout (the model starts it dark).
  phoneModel.screenMat.color.setScalar(1);
  phoneModel.barMat.color.setScalar(1);

  const card = buildCard(renderer, { name: "Your Name", title: "What you do", url: "https://www.unitouch.in" });
  scene.add(card.group);

  // The tap: a ring spreading over the phone's back.
  const rippleGeo = new RingGeometry(0.3, 0.33, 64);
  const rippleMat = new MeshBasicMaterial({ color: 0x4f5e48, transparent: true, opacity: 0, depthWrite: false });
  const ripple = new Mesh(rippleGeo, rippleMat);
  ripple.position.set(-0.06, 0.3, BACK_Z - 0.01);
  ripple.rotation.y = Math.PI;
  turn.add(ripple);

  const shadow = contactShadow(PW * 2.1, PW * 0.65);
  shadow.mesh.position.y = -PH / 2 - 0.3;
  scene.add(shadow.mesh);

  const ready = Promise.all([phoneModel.ready, card.ready]).then(() => render());

  // Where in the loop to begin (0 for the page; other moments for stills).
  let t = opts.at ?? 0;
  let last = 0;
  let frame = 0;
  let running = false;

  function resize() {
    const w = canvas.clientWidth;
    const h = canvas.clientHeight;
    if (!w || !h) return;
    renderer.setSize(w, h, false);
    camera.aspect = w / h;
    const half = Math.tan((camera.fov * Math.PI) / 360);
    // Frame the phone with room on the right for the card's far point.
    const byHeight = (PH * 1.3) / (2 * half);
    const byWidth = (PW * 3.2) / (2 * half * camera.aspect);
    camera.position.set(0.45, 0.25, Math.max(byHeight, byWidth));
    camera.lookAt(0.45, 0.05, 0);
    camera.updateProjectionMatrix();
    render();
  }

  function render() {
    const k = ((t % TAP_CYCLE) + TAP_CYCLE) % TAP_CYCLE;

    // The card. Falling in: the gap closes faster and faster (a cubic ease
    // in), so it meets the phone at full speed. Bouncing off: it leaves at
    // full speed and slows to rest (a cubic ease out). Together that's the
    // cusp curve: slow at both far points, fastest at the strike.
    const fall = clamp((k - (HIT - FALL)) / FALL);
    const bounce = clamp((k - HIT) / BOUNCE);
    let near: number;
    if (k < HIT) near = fall * fall * fall;
    else near = 1 - (1 - Math.pow(1 - bounce, 3));
    // A little arc on the way back up, like a bounce under gravity.
    const arc = k >= HIT ? Math.sin(Math.PI * bounce) * 0.35 : 0;
    // The knock: the strike sets it spinning a little about every axis,
    // dying away as it comes to rest (zero at the strike and at rest, so
    // the loop joins up).
    const knock = k >= HIT ? Math.sin(Math.PI * bounce) * Math.pow(1 - bounce, 0.6) : 0;
    // While it rests at the far point it hovers, just perceptibly.
    const hover = Math.sin((k / TAP_CYCLE) * Math.PI * 4) * 0.04 * (1 - near);
    card.group.position.set(mix(FAR.x, TOUCH.x, near), mix(FAR.y, TOUCH.y, near) + arc + hover, mix(FAR.z, TOUCH.z, near));
    card.group.rotation.set(
      mix(FAR.rx, TOUCH.rx, near) - knock * 0.7,
      mix(FAR.ry, TOUCH.ry, near) + knock * 0.9,
      mix(FAR.rz, TOUCH.rz, near) + knock * 0.5
    );

    const r = clamp((k - HIT) / 1.1);
    ripple.scale.setScalar(0.5 + r * 2.4);
    rippleMat.opacity = r > 0 && r < 1 ? Math.sin(Math.PI * Math.sqrt(r)) * 0.7 : 0;

    // The phone: its back to us, nudged by the strike, then a full turn in
    // two halves with a rest on the profile between (3 pi is pi again).
    const nudge = k >= HIT ? Math.sin(Math.PI * clamp((k - HIT) / 0.5)) * 0.06 : 0;
    const spin = Math.PI * soft(HIT + 0.3, HIT + 1.9, k) + Math.PI * soft(5.6, 7.2, k);
    const sway = Math.sin((k / TAP_CYCLE) * Math.PI * 2) * 0.05;
    turn.rotation.set(0.1 + nudge, Math.PI - 0.35 + spin + sway, -0.04);
    turn.position.z = -nudge * 0.6;

    // The profile scrolls a little while it faces us, and back.
    const shot = phoneModel.screenMat.map;
    const scroll = soft(4.0, 5.0, k) - soft(5.6, 6.6, k);
    if (shot) shot.offset.y = mix(0, (1 - VIEW_H / SHOT_H) * 0.5, scroll);

    const facing = Math.abs(Math.cos(turn.rotation.y));
    shadow.mesh.scale.set(0.55 + 0.45 * facing, 1, 1);
    renderer.render(scene, camera);
  }

  function tick(nowMs: number) {
    if (!running) return;
    t += Math.min((nowMs - last) / 1000, 0.05);
    last = nowMs;
    render();
    frame = requestAnimationFrame(tick);
  }

  resize();

  return {
    ready,
    start() {
      if (running || opts.still) return;
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
      phoneModel.dispose();
      card.dispose();
      shadow.dispose();
      rippleGeo.dispose();
      rippleMat.dispose();
      studio.dispose();
    },
  };
}
