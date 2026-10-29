/* The hero's 3D Unitouch card. Loaded with a dynamic import only after the
   page is interactive (Card3D.tsx), so none of this is in the first-load
   bundle. */
import { Group, PerspectiveCamera } from "three";
import { W, H, buildCard, contactShadow, createStudio } from "./parts";

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
    name = "Priya Anand",
    title = "Portrait & Brand Photographer",
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

  const card = buildCard(renderer, name, title);
  spin.add(card.group);

  const shadow = contactShadow(W * 1.7, H * 0.7);
  shadow.mesh.position.y = -H / 2 - 0.22;
  scene.add(shadow.mesh);

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

  function render() {
    const swayX = still ? 0 : 0.2 * Math.sin(t * 0.42);
    const swayZ = still ? 0 : 0.07 * Math.sin(t * 0.31);
    sway.rotation.set(tilt + swayX + dragY, 0, swayZ);
    const turn = eased(phase) + dragX;
    spin.rotation.y = turn;
    sway.position.y = still ? 0 : Math.sin(t * 0.8) * 0.04;
    // The shadow tightens when the card turns edge-on and as it lifts.
    const face = Math.abs(Math.cos(turn));
    shadow.mesh.scale.set(0.45 + 0.55 * face, 1, 1);
    shadow.mat.opacity = 0.7 + 0.3 * face - sway.position.y * 2;
    renderer.render(scene, camera);
  }

  function tick(now: number) {
    if (!running) return;
    const dt = Math.min((now - last) / 1000, 0.05);
    last = now;
    t += dt;
    phase += spinSpeed * dt;
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
      shadow.dispose();
      studio.dispose();
    },
  };
}
