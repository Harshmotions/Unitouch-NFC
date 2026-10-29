/* The hero's 3D Unitouch card. Loaded with a dynamic import only after the
   page is interactive (Card3D.tsx), so none of this is in the first-load
   bundle. */
import {
  DirectionalLight,
  Group,
  Mesh,
  PerspectiveCamera,
  PlaneGeometry,
  ShadowMaterial,
  VSMShadowMap,
} from "three";
import { W, buildCard, createStudio, type CardFinish } from "./parts";

export interface CardSceneOptions {
  /** Radians per second of the spin. Negative turns the other way. */
  spinSpeed?: number;
  /** Starting turn, in radians. */
  angle?: number;
  /** Resting forward tilt, in radians (shows the top edge a little). */
  tilt?: number;
  /** How much of the canvas width the card spans when it faces the camera. */
  fill?: number;
  /** Turn off the slow sway on the other two axes (for stills). */
  still?: boolean;
  name?: string;
  title?: string;
  finish?: CardFinish;
}

export interface CardScene {
  start(): void;
  stop(): void;
  resize(): void;
  /** Adds turning momentum (pointer drag), in radians per second. */
  nudge(vx: number, vy?: number): void;
  dispose(): void;
  readonly ready: Promise<void>;
}

export function createCardScene(canvas: HTMLCanvasElement, opts: CardSceneOptions = {}): CardScene {
  const {
    spinSpeed = (-Math.PI * 2) / 15,
    angle = -0.5,
    tilt = -0.14,
    fill = 0.72,
    still = false,
    name = "Your Name",
    title = "What you do",
    finish = "standard",
  } = opts;

  const studio = createStudio(canvas);
  const { renderer, scene } = studio;

  // A long lens: little perspective distortion, like a studio product shot.
  const camera = new PerspectiveCamera(16, 1, 0.1, 100);

  /* Two nested groups: the outer one sways slowly on X and Z, the inner one
     spins on Y. So the card turns on all three axes, with the spin axis
     itself drifting a little, rather than on a fixed turntable. */
  const sway = new Group();
  const spin = new Group();
  sway.add(spin);
  scene.add(sway);

  const card = buildCard(renderer, { name, title, finish, url: "https://www.unitouch.in" });
  spin.add(card.group);

  /* The card's shadow, cast onto a wall a little behind it (an invisible
     plane that shows only the shadow), from a soft light up and to the
     left. It turns, narrows and stretches with the card, like a real
     object in front of a wall. Variance shadow maps at low resolution keep
     it very soft; the light adds no brightness, only the shadow. */
  renderer.shadowMap.enabled = true;
  renderer.shadowMap.type = VSMShadowMap;
  card.group.traverse((o) => {
    if ((o as Mesh).isMesh) o.castShadow = true;
  });
  const sun = new DirectionalLight(0xffffff, 0);
  sun.position.set(-1.1, 1.5, 5);
  sun.castShadow = true;
  sun.shadow.mapSize.set(256, 256);
  sun.shadow.radius = 14;
  sun.shadow.blurSamples = 20;
  Object.assign(sun.shadow.camera, { left: -3, right: 3, top: 3, bottom: -3, near: 0.5, far: 12 });
  scene.add(sun);
  const wallGeo = new PlaneGeometry(40, 40);
  const wallMat = new ShadowMaterial({ color: 0x1c1712, opacity: 0.3 });
  const wall = new Mesh(wallGeo, wallMat);
  wall.position.z = -1.4;
  wall.receiveShadow = true;
  scene.add(wall);

  const ready = card.ready.then(() => render());

  /* The spin lingers on the faces and passes quickly through edge-on, like
     a product on a stand that's paced for looking: the visible angle is
     phase - LINGER * sin(2 * phase), with the phase advancing steadily. */
  const LINGER = 0.3;
  const eased = (p: number) => p - LINGER * Math.sin(2 * p);
  // Start on the phase that shows the requested angle (a few Newton steps).
  let phase = angle;
  for (let i = 0; i < 6; i++) phase -= (eased(phase) - angle) / (1 - 2 * LINGER * Math.cos(2 * phase));

  let dragX = 0; // turn added by hand, around Y
  let dragY = 0; // tilt added by hand, around X (springs back)
  let velX = 0;
  let velY = 0;
  let running = false;
  let last = 0;
  let frame = 0;
  let t = 0;

  function resize() {
    const w = canvas.clientWidth;
    const h = canvas.clientHeight;
    if (!w || !h) return;
    renderer.setSize(w, h, false);
    camera.aspect = w / h;
    // Distance that makes the card span `fill` of the width (or of the
    // height, on a tall canvas), whichever is tighter.
    const half = Math.tan((camera.fov * Math.PI) / 360);
    const byWidth = W / fill / (2 * half * camera.aspect);
    const byHeight = (W * 0.62) / fill / (2 * half);
    camera.position.set(0, 0.22, Math.max(byWidth, byHeight));
    camera.lookAt(0, -0.05, 0);
    camera.updateProjectionMatrix();
    render();
  }

  /* The scene's first frame is exactly the poster still, which it replaces
     without a crossfade; from there the spin and sway build up gently over
     the first second and a half, so the hand-over is invisible and the
     card starts moving like something set in motion, not switched on. */
  const ease = () => {
    const x = Math.min(1, t / 1.6);
    return x * x * (3 - 2 * x);
  };

  function render() {
    const k = still ? 0 : ease();
    const swayX = 0.2 * Math.sin(t * 0.42) * k;
    const swayZ = 0.07 * Math.sin(t * 0.31) * k;
    sway.rotation.set(tilt + swayX + dragY, 0, swayZ);
    const turn = eased(phase) + dragX;
    spin.rotation.y = turn;
    sway.position.y = Math.sin(t * 0.8) * 0.04 * k;
    renderer.render(scene, camera);
  }

  function tick(now: number) {
    if (!running) return;
    const dt = Math.min((now - last) / 1000, 0.05);
    last = now;
    t += dt;
    phase += spinSpeed * dt * ease();
    dragX += velX * dt;
    dragY += velY * dt;
    // Momentum fades over about a second; the hand tilt eases back to rest.
    velX *= Math.pow(0.08, dt);
    velY *= Math.pow(0.08, dt);
    dragY *= Math.pow(0.15, dt);
    render();
    frame = requestAnimationFrame(tick);
  }

  resize();

  return {
    ready,
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
    nudge(vx: number, vy = 0) {
      velX = Math.max(-12, Math.min(12, velX + vx));
      velY = Math.max(-4, Math.min(4, velY + vy));
    },
    dispose() {
      running = false;
      cancelAnimationFrame(frame);
      card.dispose();
      sun.shadow.dispose();
      wallGeo.dispose();
      wallMat.dispose();
      studio.dispose();
    },
  };
}
