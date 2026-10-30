/* The "You tap" demo in How it works: the real iPhone (phoneModel.ts) and
   the card, on a loop. The card rests at a far point, falls in faster and
   faster and strikes the phone's back at full speed, then bounces off with
   a knock of rotation on all three axes, slowing to rest at the far point
   again, like something dropped and bounced; meanwhile the phone turns
   round to the profile and on round to its back, a full turn. Everything
   is a function of one looping clock and the loop ends where it began.
   Loaded with a dynamic import when the tile comes near (Demos.tsx). */
import { Euler, Group, Mesh, MeshBasicMaterial, Object3D, PerspectiveCamera, Quaternion, RingGeometry, Vector3 } from "three";
import { W as CARD_W, buildCard, contactShadow, createStudio } from "./parts";
import { BACK_Z, PH, PW, SHOT_H, VIEW_H, createPhoneModel } from "./phoneModel";

export const TAP_CYCLE = 8;

const clamp = (v: number, a = 0, b = 1) => Math.min(b, Math.max(a, v));
const mix = (a: number, b: number, t: number) => a + (b - a) * t;
const soft = (a: number, b: number, v: number) => {
  const x = clamp((v - a) / (b - a));
  return x * x * x * (x * (x * 6 - 15) + 10);
};

/* An After Effects ease between two keyframes with zero speed at both ends
   (influence out `a`, influence in `b`, as fractions): the curve
   cubic-bezier(a, 0, 1 - b, 1), solved for the value at time fraction u. */
function aeEase(a: number, b: number) {
  const x1 = a;
  const x2 = 1 - b;
  const bez = (s: number, p1: number, p2: number) => 3 * (1 - s) * (1 - s) * s * p1 + 3 * (1 - s) * s * s * p2 + s * s * s;
  return (u: number) => {
    if (u <= 0) return 0;
    if (u >= 1) return 1;
    let lo = 0;
    let hi = 1;
    let s = u;
    for (let i = 0; i < 30; i++) {
      s = (lo + hi) / 2;
      if (bez(s, x1, x2) < u) lo = s;
      else hi = s;
    }
    return bez(s, 0, 1);
  };
}

/* The tap, keyed from Harsh's After Effects animation (24 fps; times are
   from the strike back):
   - Pull back: from 0.75 s before the strike, over 0.583 s, on an easy ease
     (33/33): the card draws away from the phone, hinging on its right edge.
   - Strike: from 0.583 s before, starting slow (61% influence out) and
     arriving at full speed (0.1% in), so it hits the phone's back hard.
   - Bounce: it leaves at full speed (0.1% out) and settles over 1.167 s on
     a long 87.5% ease in. */
const HIT = 1.7;
const PULL_START = HIT - 0.75;
const PULL = 0.5833;
const STRIKE_START = HIT - 0.5833;
const BOUNCE = 1.1667;
const pullEase = aeEase(0.3333, 0.3333);
const strikeEase = aeEase(0.6142, 0.001);
const bounceEase = aeEase(0.001, 0.8754);
// In the After Effects comp the strike travels 1211 px and the pull back
// 360 px against it, so the pull back is 360 / 851 of the rest-to-phone
// distance.
const PULL_BACK = 360 / 851;

// Where the card rests (world units; the phone's back faces us at the
// start). Far enough out that the phone's corners, sweeping round in its
// full turn, never reach the card, whatever its angle (checked by sampling
// the loop with a box-overlap test).
const FAR = { x: 2.0, y: 1.05, z: 1.55, rx: -0.5, ry: -0.75, rz: 0.38 };
// The pull back's hinge: the card's anchor is its right edge (the edge away
// from the phone), so its left side, the one nearest the phone, swings away
// (radians about the card's own axes).
const SWING = { y: -0.6, z: 0.16 };

// The phone's pose (before the strike's nudge) at time k in the loop.
const SPIN_1 = [HIT + 0.75, HIT + 2.3] as const;
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
  // The card's rig: `rig` carries its pose; `hinge` sits on the card's right
  // edge and carries the wind-up swing, so the card pivots on that edge.
  const rig = new Group();
  const hinge = new Group();
  hinge.position.x = CARD_W / 2;
  card.group.position.x = -CARD_W / 2;
  hinge.add(card.group);
  rig.add(hinge);
  scene.add(rig);

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

    // The card, on the After Effects curves above. `near` runs from 0 at
    // rest to 1 on the phone's back (below 0 is pulled back, past rest).
    // Before the strike: the pull back (against) plus the strike (toward),
    // as in the comp, where they overlap; the hinge swing follows the pull
    // back and is released as the strike lands, and the angle settles flat
    // early (an ease out on the strike), so no edge can cut into the phone.
    // After: the bounce leaves at full speed and settles on the long ease;
    // the angle stays flat at first and turns away once it's clear.
    let near: number;
    let turnT: number;
    let swing = 0;
    let bounce = 0;
    if (k < HIT) {
      const pull = pullEase(clamp((k - PULL_START) / PULL));
      const strike = strikeEase(clamp((k - STRIKE_START) / (HIT - STRIKE_START)));
      near = strike * (1 + PULL_BACK) - pull * PULL_BACK;
      turnT = 1 - Math.pow(1 - strike, 3);
      swing = pull * Math.pow(1 - strike, 4);
    } else {
      bounce = bounceEase(clamp((k - HIT) / BOUNCE));
      near = 1 - bounce;
      // Stays flat until it has pulled clear (the bounce covers distance fast).
      const away = clamp((bounce - 0.55) / 0.45);
      turnT = 1 - away * away * (3 - 2 * away);
    }
    // A little arc on the way back up, like a bounce under gravity, flat
    // again as it comes to rest.
    const arc = k >= HIT ? Math.sin(Math.PI * bounce) * (1 - bounce) * 0.55 : 0;
    // The knock: the strike sets it spinning a little about every axis once
    // it has pulled clear of the phone, dying away smoothly as it comes to
    // rest (zero, with no speed, at the strike and at rest, so the loop
    // joins up).
    const knock = k >= HIT ? Math.sin(Math.PI * bounce) * Math.pow(1 - bounce, 2) * 1.6 * soft(0.35, 0.6, bounce) : 0;
    // While it rests at the far point it hovers, just perceptibly.
    const hover = Math.sin((k / TAP_CYCLE) * Math.PI * 4) * 0.04 * (1 - clamp(near));
    rig.position.set(mix(FAR.x, TOUCH.x, near), mix(FAR.y, TOUCH.y, near) + arc + hover, mix(FAR.z, TOUCH.z, near));
    rig.rotation.set(
      mix(FAR.rx, TOUCH.rx, turnT) - knock * 0.7,
      mix(FAR.ry, TOUCH.ry, turnT) + knock * 0.9,
      mix(FAR.rz, TOUCH.rz, turnT) + knock * 0.5
    );
    hinge.rotation.set(0, SWING.y * swing, SWING.z * swing);

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
