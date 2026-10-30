/* The "You tap" demo in How it works: the real iPhone (phoneModel.ts) and
   the card, on a loop. The card rests at a far point, falls in faster and
   faster and strikes the phone's back at full speed, then bounces off with
   a knock of rotation on all three axes, slowing to rest at the far point
   again, like something dropped and bounced; meanwhile the phone turns
   round to the profile and on round to its back, a full turn. Everything
   is a function of one looping clock and the loop ends where it began.
   Loaded with a dynamic import when the tile comes near (Demos.tsx). */
import { Euler, Group, Mesh, MeshBasicMaterial, Object3D, PerspectiveCamera, Quaternion, RingGeometry, Vector3 } from "three";
import { buildCard, contactShadow, createStudio } from "./parts";
import { BACK_Z, PH, PW, SHOT_H, VIEW_H, createPhoneModel } from "./phoneModel";

export const TAP_CYCLE = 8;

const clamp = (v: number, a = 0, b = 1) => Math.min(b, Math.max(a, v));
const mix = (a: number, b: number, t: number) => a + (b - a) * t;
const soft = (a: number, b: number, v: number) => {
  const x = clamp((v - a) / (b - a));
  return x * x * x * (x * (x * 6 - 15) + 10);
};

// When the card strikes, and how long the fall and the bounce take. The
// fall starts with a wind-up: for the first WIND_UP of it the card draws
// back (toward us and up a little, tipping back like a hand about to tap),
// then it snaps in over the rest, about 0.4 s.
const HIT = 1.7;
const FALL = 1.5;
const WIND_UP = 0.72;
const BOUNCE = 2.4;

// Where the card rests (world units; the phone's back faces us at the
// start). Far enough out that the phone's corners, sweeping round in its
// full turn, never reach the card, whatever its angle (checked by sampling
// the loop with a box-overlap test).
const FAR = { x: 2.0, y: 1.05, z: 1.55, rx: -0.5, ry: -0.75, rz: 0.38 };
// The wind-up: how far back from FAR the card draws, and how it tips.
const WIND = { x: -0.4, y: -0.12, z: 1.0, rx: -0.2, ry: -0.15, rz: 0.1 };

// The phone's pose (before the strike's nudge) at time k in the loop.
const SPIN_1 = [HIT + 0.55, HIT + 2.1] as const;
const SPIN_2 = [5.6, 7.2] as const;
function phonePose(k: number) {
  const spin = Math.PI * soft(SPIN_1[0], SPIN_1[1], k) + Math.PI * soft(SPIN_2[0], SPIN_2[1], k);
  const sway = Math.sin((k / TAP_CYCLE) * Math.PI * 2) * 0.05;
  return { x: 0.1, y: Math.PI - 0.35 + spin + sway, z: -0.04 };
}

// Where the card meets the phone, worked out in the phone's own frame so it
// lies flat on the back whatever angle the phone is at: over the upper back
// (where the NFC antenna is), standing just proud of the camera bump so it
// never cuts into the body, with its front to us.
const ON_BACK = { x: -0.15, y: 0.32, z: BACK_Z - 0.16, tilt: 0.07 };
const TOUCH = (() => {
  const p = phonePose(HIT);
  const phone = new Object3D();
  phone.rotation.set(p.x, p.y, p.z);
  const spot = new Object3D();
  spot.position.set(ON_BACK.x, ON_BACK.y, ON_BACK.z);
  spot.rotation.set(0, Math.PI, ON_BACK.tilt);
  phone.add(spot);
  phone.updateMatrixWorld(true);
  const pos = spot.getWorldPosition(new Vector3());
  const rot = new Euler().setFromQuaternion(spot.getWorldQuaternion(new Quaternion()));
  return { x: pos.x, y: pos.y, z: pos.z, rx: rot.x, ry: rot.y, rz: rot.z };
})();

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
  ripple.position.set(ON_BACK.x, ON_BACK.y, BACK_Z - 0.01);
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

    // The card. Winding up: it eases back from its rest to the wind-up pose
    // and comes to a stop there (anticipation). Striking: from that stop the
    // gap closes faster and faster (a cubic ease in), so it meets the phone
    // at full speed, while its angle settles early (a cubic ease out), so
    // it's already flat to the back before it gets close and no edge can cut
    // into the phone. Each phase starts and ends at zero speed where they
    // join, so nothing jolts. Bouncing off: it leaves at full speed and
    // glides to rest on a quartic ease out (no speed left at rest, so it
    // never stops dead); its angle stays flat at first and turns away once
    // it's clear.
    const fall = clamp((k - (HIT - FALL)) / FALL);
    const bounce = clamp((k - HIT) / BOUNCE);
    let near: number;
    let turnT: number;
    let wind = 0;
    if (k < HIT) {
      wind = soft(0, WIND_UP, fall);
      const strike = clamp((fall - WIND_UP) / (1 - WIND_UP));
      near = strike * strike * strike;
      turnT = 1 - Math.pow(1 - strike, 3);
    } else {
      near = Math.pow(1 - bounce, 4);
      turnT = 1 - bounce * bounce * (3 - 2 * bounce);
    }
    // A little arc on the way back up, like a bounce under gravity, flat
    // again as it comes to rest.
    const arc = k >= HIT ? Math.sin(Math.PI * bounce) * (1 - bounce) * 0.55 : 0;
    // The knock: the strike sets it spinning a little about every axis once
    // it has pulled clear of the phone, dying away smoothly as it comes to
    // rest (zero, with no speed, at the strike and at rest, so the loop
    // joins up).
    const knock = k >= HIT ? Math.sin(Math.PI * bounce) * Math.pow(1 - bounce, 2) * 1.6 * soft(0.03, 0.2, bounce) : 0;
    // While it rests at the far point it hovers, just perceptibly.
    const hover = Math.sin((k / TAP_CYCLE) * Math.PI * 4) * 0.04 * (1 - near);
    card.group.position.set(
      mix(FAR.x + WIND.x * wind, TOUCH.x, near),
      mix(FAR.y + WIND.y * wind, TOUCH.y, near) + arc + hover,
      mix(FAR.z + WIND.z * wind, TOUCH.z, near)
    );
    card.group.rotation.set(
      mix(FAR.rx + WIND.rx * wind, TOUCH.rx, turnT) - knock * 0.7,
      mix(FAR.ry + WIND.ry * wind, TOUCH.ry, turnT) + knock * 0.9,
      mix(FAR.rz + WIND.rz * wind, TOUCH.rz, turnT) + knock * 0.5
    );

    const r = clamp((k - HIT) / 1.1);
    ripple.scale.setScalar(0.5 + r * 2.4);
    rippleMat.opacity = r > 0 && r < 1 ? Math.sin(Math.PI * Math.sqrt(r)) * 0.7 : 0;

    // The phone: its back to us, nudged by the strike, then a full turn in
    // two halves with a rest on the profile between (3 pi is pi again).
    const nudge = k >= HIT ? Math.sin(Math.PI * clamp((k - HIT) / 0.5)) * 0.06 : 0;
    const pose = phonePose(k);
    turn.rotation.set(pose.x + nudge, pose.y, pose.z);
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
