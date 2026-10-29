/* The hero's 3D Unitouch card, drawn with three.js. Loaded with a dynamic
   import only after the page is interactive (Card3D.tsx), so none of this
   is in the first-load bundle. Everything is generated at runtime: the card
   faces are painted on canvases (no image files besides the logo mark), and
   the reflections come from three's procedural RoomEnvironment rather than
   a downloaded HDR. */
import {
  ACESFilmicToneMapping,
  CanvasTexture,
  Color,
  DirectionalLight,
  ExtrudeGeometry,
  Group,
  Mesh,
  MeshBasicMaterial,
  MeshPhysicalMaterial,
  PerspectiveCamera,
  PlaneGeometry,
  PMREMGenerator,
  Scene,
  Shape,
  ShapeGeometry,
  SRGBColorSpace,
  WebGLRenderer,
  type BufferGeometry,
} from "three";
import { RoomEnvironment } from "three/examples/jsm/environments/RoomEnvironment.js";

// ISO card, 85.6 x 54 mm, in scene units of 4 cm.
const W = 85.6 / 40;
const H = 54 / 40;
const DEPTH = 0.024;
const RADIUS = 3.2 / 40;
const TEX_W = 2048;
const TEX_H = Math.round((TEX_W * H) / W);

export interface CardSceneOptions {
  /** Radians per second of the turntable spin. 0 holds still. */
  spinSpeed?: number;
  /** Starting turn, in radians. */
  angle?: number;
  /** Forward tilt, in radians (shows the top edge a little). */
  tilt?: number;
  /** How much of the canvas width the card spans when it faces the camera. */
  fill?: number;
  name?: string;
  title?: string;
}

export interface CardScene {
  start(): void;
  stop(): void;
  resize(): void;
  /** Adds turning momentum (pointer drag), in radians per second. */
  nudge(velocity: number): void;
  dispose(): void;
  readonly ready: Promise<void>;
}

function roundedRect(w: number, h: number, r: number): Shape {
  const s = new Shape();
  const x = -w / 2;
  const y = -h / 2;
  s.moveTo(x + r, y);
  s.lineTo(x + w - r, y);
  s.quadraticCurveTo(x + w, y, x + w, y + r);
  s.lineTo(x + w, y + h - r);
  s.quadraticCurveTo(x + w, y + h, x + w - r, y + h);
  s.lineTo(x + r, y + h);
  s.quadraticCurveTo(x, y + h, x, y + h - r);
  s.lineTo(x, y + r);
  s.quadraticCurveTo(x, y, x + r, y);
  return s;
}

/* ShapeGeometry puts UVs in shape units; map them to 0..1 over the card.
   (The back face is the same geometry turned half a revolution, which
   already reads correctly from behind, so no flip is needed.) */
function normaliseUVs(geo: BufferGeometry) {
  const uv = geo.attributes.uv;
  for (let i = 0; i < uv.count; i++) {
    uv.setXY(i, (uv.getX(i) + W / 2) / W, (uv.getY(i) + H / 2) / H);
  }
  uv.needsUpdate = true;
}

function loadImage(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.decoding = "async";
    img.onload = () => resolve(img);
    img.onerror = reject;
    img.src = src;
  });
}

/* The NFC "waves" glyph from the printed card: a dot and two arcs. */
function drawWaves(ctx: CanvasRenderingContext2D, x: number, y: number, s: number) {
  ctx.lineCap = "round";
  ctx.lineWidth = s * 0.16;
  ctx.beginPath();
  ctx.arc(x + s * 0.62, y, s * 0.12, 0, Math.PI * 2);
  ctx.fill();
  for (const r of [0.42, 0.72]) {
    ctx.beginPath();
    ctx.arc(x + s * 0.62, y, s * r, Math.PI * 0.68, Math.PI * 1.32);
    ctx.stroke();
  }
}

interface Faces {
  front: CanvasTexture;
  frontRough: CanvasTexture;
  back: CanvasTexture;
  backRough: CanvasTexture;
}

/* Paints both faces. The colour maps carry the artwork; the roughness maps
   make the logo and type a glossy spot finish against the soft-touch matte
   card, which is what catches the light as it turns. */
async function paintFaces(name: string, title: string, maxAniso: number): Promise<Faces> {
  const mark = await loadImage("/brand/u-mark-white.webp");
  // next/font gives the face a generated family name; read it from the var.
  const family = getComputedStyle(document.documentElement).getPropertyValue("--font-tiktok").trim() || "sans-serif";
  await Promise.all([document.fonts.load(`600 100px ${family}`), document.fonts.load(`400 100px ${family}`)]).catch(
    () => undefined
  );

  const make = () => {
    const c = document.createElement("canvas");
    c.width = TEX_W;
    c.height = TEX_H;
    return [c, c.getContext("2d")!] as const;
  };

  const u = TEX_W / 100; // 1% of the card width

  // Front: NFC waves top left, the U mark and the wordmark bottom left.
  const front = (ink: string, ground: string) => {
    const [c, ctx] = make();
    ctx.fillStyle = ground;
    ctx.fillRect(0, 0, TEX_W, TEX_H);
    ctx.fillStyle = ink;
    ctx.strokeStyle = ink;
    drawWaves(ctx, 7 * u, 13 * u, 6 * u);
    const mh = 13 * u;
    const mw = (mark.width / mark.height) * mh;
    ctx.save();
    if (ink !== "#ffffff") ctx.filter = "brightness(0.3)";
    ctx.drawImage(mark, 7 * u, TEX_H - 9 * u - mh, mw, mh);
    ctx.restore();
    ctx.font = `600 ${10.5 * u}px ${family}`;
    ctx.textBaseline = "alphabetic";
    ctx.fillText("Unitouch", 7 * u + mw + 3 * u, TEX_H - 10.4 * u);
    return c;
  };

  // Back: the person. Name, title and the tap hint, set small and quiet.
  const back = (ink: string, ground: string) => {
    const [c, ctx] = make();
    ctx.fillStyle = ground;
    ctx.fillRect(0, 0, TEX_W, TEX_H);
    ctx.fillStyle = ink;
    ctx.strokeStyle = ink;
    ctx.textBaseline = "alphabetic";
    ctx.font = `600 ${7.4 * u}px ${family}`;
    ctx.fillText(name, 7 * u, 22 * u);
    ctx.globalAlpha = ink === "#ffffff" ? 0.72 : 1;
    ctx.font = `400 ${4 * u}px ${family}`;
    ctx.fillText(title, 7 * u, 29 * u);
    ctx.globalAlpha = 1;
    drawWaves(ctx, TEX_W - 16 * u, TEX_H - 11 * u, 5 * u);
    ctx.font = `500 ${3.4 * u}px ${family}`;
    ctx.fillText("Tap to connect", 7 * u, TEX_H - 9.4 * u);
    return c;
  };

  const tex = (c: HTMLCanvasElement, srgb: boolean) => {
    const t = new CanvasTexture(c);
    if (srgb) t.colorSpace = SRGBColorSpace;
    t.anisotropy = maxAniso;
    return t;
  };

  // Roughness: ground = matte (light grey), artwork = gloss (dark).
  return {
    front: tex(front("#ffffff", "#141414"), true),
    frontRough: tex(front("#2e2e2e", "#9a9a9a"), false),
    back: tex(back("#ffffff", "#141414"), true),
    backRough: tex(back("#2e2e2e", "#9a9a9a"), false),
  };
}

/* A soft contact shadow: a blurred ellipse on a plane under the card. */
function shadowTexture() {
  const c = document.createElement("canvas");
  c.width = 256;
  c.height = 64;
  const ctx = c.getContext("2d")!;
  ctx.filter = "blur(12px)";
  ctx.fillStyle = "rgba(43,42,41,0.55)";
  ctx.beginPath();
  ctx.ellipse(128, 32, 92, 9, 0, 0, Math.PI * 2);
  ctx.fill();
  return new CanvasTexture(c);
}

export function createCardScene(canvas: HTMLCanvasElement, opts: CardSceneOptions = {}): CardScene {
  const {
    spinSpeed = (Math.PI * 2) / 16,
    angle = -0.5,
    tilt = -0.14,
    fill = 0.78,
    name = "Priya Anand",
    title = "Portrait & Brand Photographer",
  } = opts;

  const renderer = new WebGLRenderer({ canvas, antialias: true, alpha: true, powerPreference: "high-performance" });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
  renderer.outputColorSpace = SRGBColorSpace;
  renderer.toneMapping = ACESFilmicToneMapping;
  renderer.toneMappingExposure = 1.05;
  renderer.setClearColor(new Color(0x000000), 0);

  const scene = new Scene();
  const pmrem = new PMREMGenerator(renderer);
  const envMap = pmrem.fromScene(new RoomEnvironment(), 0.035).texture;
  scene.environment = envMap;
  scene.environmentIntensity = 0.55;

  // A soft key from the upper left and a cool rim from behind on the right,
  // like a product table: they make the gloss print and the edge read.
  const key = new DirectionalLight(0xffffff, 1.6);
  key.position.set(-3, 4, 5);
  const rim = new DirectionalLight(0xdfe8ff, 2.2);
  rim.position.set(4, 2, -4);
  scene.add(key, rim);

  // A long lens: little perspective distortion, like a studio product shot.
  const camera = new PerspectiveCamera(16, 1, 0.1, 100);

  const card = new Group();
  card.rotation.x = tilt;
  scene.add(card);

  // Body: an extruded rounded rectangle. Its caps sit just behind the
  // printed faces; its sides are the visible edge.
  const bodyGeo = new ExtrudeGeometry(roundedRect(W, H, RADIUS), {
    depth: DEPTH,
    bevelEnabled: true,
    bevelThickness: 0.004,
    bevelSize: 0.004,
    bevelSegments: 3,
    curveSegments: 24,
  });
  bodyGeo.translate(0, 0, -DEPTH / 2);
  const edgeMat = new MeshPhysicalMaterial({ color: 0x1b1b1b, roughness: 0.38, metalness: 0, clearcoat: 0.4 });
  card.add(new Mesh(bodyGeo, edgeMat));

  const faceGeo = new ShapeGeometry(roundedRect(W, H, RADIUS), 24);
  // Clone before normalising: normaliseUVs works in place.
  const backGeo = faceGeo.clone();
  normaliseUVs(faceGeo);
  normaliseUVs(backGeo);

  const frontMat = new MeshPhysicalMaterial({ roughness: 1, metalness: 0, clearcoat: 0.25, clearcoatRoughness: 0.55, sheen: 0.3, sheenRoughness: 0.8 });
  const backMat = frontMat.clone();
  const frontMesh = new Mesh(faceGeo, frontMat);
  frontMesh.position.z = DEPTH / 2 + 0.0045;
  const backMesh = new Mesh(backGeo, backMat);
  backMesh.position.z = -DEPTH / 2 - 0.0045;
  backMesh.rotation.y = Math.PI;
  card.add(frontMesh, backMesh);

  const shadowMat = new MeshBasicMaterial({ map: shadowTexture(), transparent: true, depthWrite: false });
  const shadow = new Mesh(new PlaneGeometry(W * 1.15, H * 0.42), shadowMat); // taste-skill-ignore: 3D contact shadow under the object
  shadow.rotation.x = -Math.PI / 2;
  shadow.position.y = -H / 2 - 0.2;
  scene.add(shadow);

  const ready = paintFaces(name, title, renderer.capabilities.getMaxAnisotropy()).then((f) => {
    frontMat.map = f.front;
    frontMat.roughnessMap = f.frontRough;
    backMat.map = f.back;
    backMat.roughnessMap = f.backRough;
    frontMat.needsUpdate = true;
    backMat.needsUpdate = true;
    render();
  });

  /* The spin lingers on the faces and passes quickly through edge-on, like
     a product on a turntable that's paced for looking: the visible angle is
     phase - LINGER * sin(2 * phase), with the phase advancing steadily. */
  const LINGER = 0.3;
  const eased = (p: number) => p - LINGER * Math.sin(2 * p);
  // Start on the phase that shows the requested angle (a few Newton steps).
  let phase = angle;
  for (let i = 0; i < 6; i++) phase -= (eased(phase) - angle) / (1 - 2 * LINGER * Math.cos(2 * phase));
  let turn = angle;
  let extra = 0; // momentum from dragging
  let dragged = 0; // turn added by hand
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
    camera.position.set(0, 0.2, Math.max(byWidth, byHeight));
    camera.lookAt(0, -0.05, 0);
    camera.updateProjectionMatrix();
    render();
  }

  function render() {
    card.rotation.y = turn;
    card.position.y = Math.sin(t * 0.9) * 0.035;
    // The shadow tightens when the card turns edge-on. (taste-skill-ignore: 3D)
    const face = Math.abs(Math.cos(turn));
    shadow.scale.set(0.35 + 0.65 * face, 1, 1);
    shadowMat.opacity = 0.55 + 0.25 * face;
    renderer.render(scene, camera);
  }

  function tick(now: number) {
    if (!running) return;
    const dt = Math.min((now - last) / 1000, 0.05);
    last = now;
    t += dt;
    phase += spinSpeed * dt;
    turn = eased(phase) + dragged;
    dragged += extra * dt;
    extra *= Math.pow(0.08, dt); // momentum fades over about a second
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
    nudge(v: number) {
      extra = Math.max(-12, Math.min(12, extra + v));
    },
    dispose() {
      running = false;
      cancelAnimationFrame(frame);
      [bodyGeo, faceGeo, backGeo, shadow.geometry].forEach((g) => g.dispose());
      [edgeMat, frontMat, backMat, shadowMat].forEach((m) => {
        m.map?.dispose();
        if ("roughnessMap" in m) m.roughnessMap?.dispose();
        m.dispose();
      });
      envMap.dispose();
      pmrem.dispose();
      renderer.dispose();
    },
  };
}
