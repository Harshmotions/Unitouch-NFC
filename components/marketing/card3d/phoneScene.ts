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
const smooth = (a: number, b: number, v: number) => {
  const x = clamp((v - a) / (b - a));
  return x * x * (3 - 2 * x);
};
const mix = (a: number, b: number, t: number) => a + (b - a) * t;

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

/* The note that drops in from the top of the screen at the end. */
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
  ctx.fillText("Priya Anand was added to Contacts", 140, 108);
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

  const toastW = SW * 0.92;
  const toastMat = track(new MeshBasicMaterial({ map: toastTexture(), transparent: true, opacity: 0, toneMapped: false }));
  const toast = new Mesh(track(new ShapeGeometry(roundedRect(toastW, (toastW * 150) / 720, 0.06), 16)), toastMat);
  fitUVs(toast.geometry, toastW, (toastW * 150) / 720);
  toast.position.z = FRONT_Z + 0.004;
  phone.add(toast);

  // ── The card, which taps the back of the phone ──────────────────────────
  const card = buildCard(renderer, "Priya Anand", "Portrait & Brand Photographer");
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
  let t = 0;
  let running = false;
  let last = 0;
  let frame = 0;

  function resize() {
    const w = canvas.clientWidth;
    const h = canvas.clientHeight;
    if (!w || !h) return;
    renderer.setSize(w, h, false);
    camera.aspect = w / h;
    // Fit the phone's height (plus room for the card) in view.
    const half = Math.tan((camera.fov * Math.PI) / 360);
    const byHeight = (PH * 1.32) / (2 * half);
    const byWidth = (PH * 0.9) / (2 * half * camera.aspect);
    camera.position.set(0, 0.15, Math.max(byHeight, byWidth));
    camera.lookAt(0, 0, 0);
    camera.updateProjectionMatrix();
    render();
  }

  function render() {
    // 1. The card comes in and taps the back of the phone (0 to 0.24).
    const approach = smooth(0.02, 0.18, p);
    const leave = smooth(0.2, 0.36, p);
    // The phone starts turned with its back to us, so the tap happens on
    // our side of it: the card glides in and touches the upper back.
    const cardX = mix(mix(2.6, 0.1, approach), -3.4, leave);
    const cardY = mix(mix(1.3, 0.05, approach), 2.2, leave);
    const cardZ = mix(mix(1.4, 0.72, approach), 1.5, leave);
    card.group.position.set(cardX, cardY, cardZ);
    card.group.rotation.set(mix(-0.35, -0.12, approach), mix(-0.9, -0.35, approach) - leave * 0.6, mix(0.35, 0.06, approach));
    card.group.visible = leave < 0.999;

    // 2. The phone turns round from its back to its front as the screen
    //    wakes (0.16 to 0.44), then settles with a slow sway.
    const reveal = smooth(0.16, 0.44, p);
    const sway = Math.sin(t * 0.6) * 0.05;
    turn.rotation.y = mix(Math.PI - 0.55, -0.22, reveal) + sway;
    turn.rotation.x = mix(0.12, -0.06, reveal) + Math.sin(t * 0.45) * 0.025;
    turn.rotation.z = mix(-0.05, 0.03, reveal);
    turn.position.y = Math.sin(t * 0.8) * 0.03;

    const wake = smooth(0.14, 0.3, p);
    screenMat.color.setScalar(wake);
    barMat.color.copy(screenMat.color);

    // The tap ripple, on the back of the phone where the card touched.
    const r = smooth(0.13, 0.26, p);
    ripple.position.set(-0.1, 0.05, BACK_Z - 0.01);
    ripple.rotation.y = Math.PI;
    ripple.scale.setScalar(0.6 + r * 2.4);
    rippleMat.opacity = r > 0 && r < 1 ? (1 - r) * 0.8 : 0;

    // 3. The profile scrolls down to the links (0.5 to 0.72).
    const scroll = smooth(0.5, 0.72, p);
    const shot = screenMat.map;
    if (shot) shot.offset.y = mix(0, 1 - VIEW_H / SHOT_H, scroll);

    // 4. "Contact saved" drops in from the top (0.78 to 0.9).
    const saved = smooth(0.78, 0.9, p);
    toastMat.opacity = saved;
    toast.position.y = mix(SH / 2 + 0.1, SH / 2 - 0.62, saved);
    toast.visible = saved > 0.001;

    const facing = Math.abs(Math.cos(turn.rotation.y));
    shadow.mesh.scale.set(0.55 + 0.45 * facing, 1, 1);
    shadow.mat.opacity = 0.75;
    renderer.render(scene, camera);
  }

  function tick(now: number) {
    if (!running) return;
    const dt = Math.min((now - last) / 1000, 0.05);
    last = now;
    t += dt;
    // Ease toward the scroll position, so fast scrolling still glides.
    p += (target - p) * (1 - Math.pow(0.0008, dt));
    render();
    frame = requestAnimationFrame(tick);
  }

  resize();

  return {
    ready: ready.then(() => render()),
    setProgress(v: number) {
      target = clamp(v);
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
