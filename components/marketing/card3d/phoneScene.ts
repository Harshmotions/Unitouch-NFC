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
  MeshPhysicalMaterial,
  PerspectiveCamera,
  RingGeometry,
  Shape,
  ShapeGeometry,
  SRGBColorSpace,
  TextureLoader,
  type BufferGeometry,
  type Material,
  type Texture,
} from "three";
import { buildCard, contactShadow, createStudio, roundedRect } from "./parts";

/* The phone is a real iPhone 14 Pro Max model (public/models, a GLB with
   meshopt compression, about 120 KB over the wire), modelled in millimetres
   with the screen facing +Z. Scaled into the card's units (1 = 4 cm). */
const MM = 1 / 40;
const PW = 78.47 * MM;
const PH = 161.2 * MM;
const FRONT_Z = 5.983 * MM;
const BACK_Z = -3.65 * MM;
// The display, from the model: 71.1 x 155 mm, corners about 9.5 mm.
const SW = 71.1 * MM;
const SH = 155 * MM;
const SR = 9.5 * MM;
// The screenshot on the screen: 780 x 1950 px, the screen shows 780 x 1688.
const SHOT_H = 1950;
const VIEW_H = 1688;
const BAR_H = 180;

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
const savedAt = track([[0.72, 0], [0.92, 1]]);

/* A rounded rectangle with separate top and bottom corner radii, for the
   Save Contact bar that sits flush with the screen's rounded bottom. */
function barShape(w: number, h: number, rBottom: number): Shape {
  const s = new Shape();
  const x = -w / 2;
  const y = -h / 2;
  s.moveTo(x + rBottom, y);
  s.lineTo(x + w - rBottom, y);
  s.quadraticCurveTo(x + w, y, x + w, y + rBottom);
  s.lineTo(x + w, y + h);
  s.lineTo(x, y + h);
  s.lineTo(x, y + rBottom);
  s.quadraticCurveTo(x, y, x + rBottom, y);
  return s;
}

/* Maps a shape's UVs (which three puts in shape units) onto 0..1. */
function fitUVs(geo: BufferGeometry, w: number, h: number) {
  const uv = geo.attributes.uv;
  for (let i = 0; i < uv.count; i++) uv.setXY(i, (uv.getX(i) + w / 2) / w, (uv.getY(i) + h / 2) / h);
  uv.needsUpdate = true;
}

/* The note that drops out of the Dynamic Island at the end. */
function toastTexture(): CanvasTexture {
  const c = document.createElement("canvas");
  c.width = 720;
  c.height = 150;
  const ctx = c.getContext("2d")!;
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
  const { renderer, scene } = studio;
  const camera = new PerspectiveCamera(22, 1, 0.1, 100);
  const disposables: { dispose(): void }[] = [];
  const track = <T extends { dispose(): void }>(x: T) => (disposables.push(x), x);

  // ── The phone ───────────────────────────────────────────────────────────
  const phone = new Group();
  const turn = new Group();
  turn.add(phone);
  scene.add(turn);

  const loader = new TextureLoader();
  const load = (src: string, flipY = true) =>
    new Promise<Texture>((resolve, reject) =>
      loader.load(
        src,
        (t) => {
          t.colorSpace = SRGBColorSpace;
          t.flipY = flipY;
          t.anisotropy = renderer.capabilities.getMaxAnisotropy();
          resolve(track(t));
        },
        undefined,
        reject
      )
    );

  /* Materials by part name (the model ships without its own). Space black
     stainless frame, matte back glass, glossy black lenses and bezel. */
  const mat = {
    frame: track(new MeshPhysicalMaterial({ color: 0x2e2d2f, metalness: 1, roughness: 0.24 })),
    back: track(new MeshPhysicalMaterial({ color: 0x3a3838, roughness: 0.62, metalness: 0.05, clearcoat: 0.25 })),
    black: track(new MeshPhysicalMaterial({ color: 0x050506, roughness: 0.12, metalness: 0, clearcoat: 1 })),
    lens: track(new MeshPhysicalMaterial({ color: 0x0b0b0e, roughness: 0.04, metalness: 0.3, clearcoat: 1 })),
    ring: track(new MeshPhysicalMaterial({ color: 0x5c5b5f, metalness: 1, roughness: 0.2 })),
    glass: track(new MeshPhysicalMaterial({ color: 0xffffff, roughness: 0.02, transparent: true, opacity: 0.18 })),
    flash: track(new MeshPhysicalMaterial({ color: 0xf2ead6, roughness: 0.3 })),
    grey: track(new MeshPhysicalMaterial({ color: 0x48474a, metalness: 0.8, roughness: 0.4 })),
  };
  const PART: Record<string, Material> = {
    body1: mat.frame,
    stripes: mat.grey,
    back: mat.back,
    back2: mat.back,
    body2: mat.black,
    blackparts: mat.black,
    screensides: mat.black,
    front1: mat.black,
    front2: mat.black,
    front3: mat.black,
    frontcam_grey: mat.black,
    speaker1: mat.black,
    speaker2: mat.black,
    lens: mat.lens,
    lens_back: mat.lens,
    cam_black: mat.lens,
    cam_inside: mat.black,
    back_sensor: mat.black,
    camgrey1: mat.ring,
    camgrey2: mat.ring,
    glass: mat.glass,
    flash: mat.flash,
    flash_glass: mat.glass,
    gold: mat.grey,
    screw: mat.grey,
    usb1: mat.grey,
  };

  // The screen: the profile, scrolled by moving the texture.
  const screenMat = track(new MeshBasicMaterial({ color: 0x000000, toneMapped: false }));

  const model = (async () => {
    const [{ GLTFLoader }, { MeshoptDecoder }] = await Promise.all([
      import("three/examples/jsm/loaders/GLTFLoader.js"),
      import("three/examples/jsm/libs/meshopt_decoder.module.js"),
    ]);
    const gltf = await new GLTFLoader().setMeshoptDecoder(MeshoptDecoder).loadAsync("/models/iphone-14-pro-max.glb");
    gltf.scene.traverse((o) => {
      const m = o as Mesh;
      if (!m.isMesh) return;
      const name = (m.material as Material).name;
      (m.material as Material).dispose();
      m.material = name === "screen1" ? screenMat : (PART[name] ?? mat.black);
      track(m.geometry);
    });
    gltf.scene.scale.setScalar(MM);
    phone.add(gltf.scene);
  })();

  const barH = (SW * BAR_H) / 780;
  const barGeo = track(new ShapeGeometry(barShape(SW, barH, SR), 32));
  fitUVs(barGeo, SW, barH);
  const barMat = track(new MeshBasicMaterial({ color: 0x000000, toneMapped: false, transparent: true }));
  const bar = new Mesh(barGeo, barMat);
  bar.position.set(0, -SH / 2 + barH / 2, FRONT_Z + 0.002);
  phone.add(bar);

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

  // glTF UVs start at the top of the image, so the screen texture isn't flipped.
  const ready = Promise.all([load("/home/phone-screen.webp", false), load("/home/phone-bar.webp"), card.ready, model]).then(
    ([shot, barTex]) => {
      shot.repeat.set(1, VIEW_H / SHOT_H);
      screenMat.map = shot;
      screenMat.needsUpdate = true;
      barMat.map = barTex;
      barMat.needsUpdate = true;
    }
  );

  // ── Motion ──────────────────────────────────────────────────────────────
  let target = opts.still ?? 0;
  let p = target;
  let v = 0; // how fast p is moving
  let t = 0;
  let running = false;
  let last = 0;
  let frame = 0;

  let baseDist = 10;

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
    camera.updateProjectionMatrix();
    render();
  }

  function render() {
    // Small breathing motions on top, so even at rest nothing is frozen.
    const sway = Math.sin(t * 0.5) * 0.04;
    camera.position.set(0, camY(p), baseDist * camDist(p));
    camera.lookAt(0, camY(p) - 0.15, 0);

    // The card (see the tracks above).
    card.group.position.set(cardX(p), cardY(p) + Math.sin(t * 1.1) * 0.025, cardZ(p));
    card.group.rotation.set(cardRX(p) + Math.sin(t * 0.7) * 0.03, cardRY(p), cardRZ(p));
    card.group.visible = p < 0.4;

    // The phone.
    turn.rotation.y = phoneYaw(p) + sway;
    turn.rotation.x = phoneTilt(p) + Math.sin(t * 0.4) * 0.02;
    turn.rotation.z = phoneRoll(p);
    turn.position.y = phoneRise(p) + Math.sin(t * 0.7) * 0.03;
    turn.position.z = phoneNear(p);

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
      target = clamp(v, -1, 1);
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
