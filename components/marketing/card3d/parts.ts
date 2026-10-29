/* Shared three.js pieces for the homepage's 3D scenes (the hero card and the
   phone section): the studio lighting, the Unitouch card and a soft contact
   shadow. Only ever loaded through a dynamic import, so three.js stays out
   of the first-load bundle. Everything is generated at runtime: the card
   faces are painted on canvases and the reflections come from three's
   procedural RoomEnvironment rather than a downloaded HDR. */
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
export const W = 85.6 / 40;
export const H = 54 / 40;
const DEPTH = 0.024;
const RADIUS = 3.2 / 40;
const TEX_W = 2048;
const TEX_H = Math.round((TEX_W * H) / W);

export function roundedRect(w: number, h: number, r: number): Shape {
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

/* The white logo mark recoloured to the print colour (or a grey, for the
   roughness and metalness maps). */
function tint(img: HTMLImageElement, color: string): HTMLCanvasElement {
  const c = document.createElement("canvas");
  c.width = img.width;
  c.height = img.height;
  const ctx = c.getContext("2d")!;
  ctx.drawImage(img, 0, 0);
  ctx.globalCompositeOperation = "source-in";
  ctx.fillStyle = color;
  ctx.fillRect(0, 0, c.width, c.height);
  return c;
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
  frontMetal?: CanvasTexture;
  backMetal?: CanvasTexture;
}

export type CardFinish = "standard" | "premium";

export interface CardDesign {
  name: string;
  title: string;
  /** The link the QR on the back opens. */
  url: string;
  /** Standard prints in white; Premium in gold foil. */
  finish?: CardFinish;
}

/* Paints both faces, as the card is printed:
   - front: the owner's name and title, with the NFC mark;
   - back: a QR code (for phones without NFC) on a white tile, and the small
     Unitouch mark in the bottom-right corner.
   The colour maps carry the artwork; the roughness maps make the print a
   glossy finish against the soft-touch matte card, which is what catches
   the light as it turns. Premium's print is metallic gold foil. */
async function paintFaces(design: CardDesign, maxAniso: number): Promise<Faces> {
  const { name, title, url, finish = "standard" } = design;
  const [mark, { qrModules }] = await Promise.all([loadImage("/brand/u-mark-white.webp"), import("@/lib/qr")]);
  // next/font gives the faces generated family names; read them from the vars.
  const css = getComputedStyle(document.documentElement);
  const display = css.getPropertyValue("--font-space-grotesk").trim() || "sans-serif";
  const family = css.getPropertyValue("--font-inter").trim() || "sans-serif";
  await Promise.all([
    document.fonts.load(`600 100px ${display}`),
    document.fonts.load(`400 100px ${family}`),
    document.fonts.load(`500 100px ${family}`),
  ]).catch(() => undefined);

  const make = () => {
    const c = document.createElement("canvas");
    c.width = TEX_W;
    c.height = TEX_H;
    return [c, c.getContext("2d")!] as const;
  };

  const u = TEX_W / 100; // 1% of the card width
  const PRINT = finish === "premium" ? "#ecd29a" : "#f4f2ee";
  const modules = qrModules(url);

  // `ink` is the print colour, `ground` the card; for the roughness and
  // metalness maps the same artwork is drawn in greys.
  const front = (ink: string, ground: string) => {
    const [c, ctx] = make();
    ctx.fillStyle = ground;
    ctx.fillRect(0, 0, TEX_W, TEX_H);
    ctx.fillStyle = ink;
    ctx.strokeStyle = ink;
    ctx.textBaseline = "alphabetic";
    ctx.font = `600 ${8.4 * u}px ${display}`;
    ctx.fillText(name, 7 * u, TEX_H - 21 * u, 80 * u);
    ctx.font = `400 ${3.9 * u}px ${family}`;
    ctx.fillText(title, 7.2 * u, TEX_H - 14 * u, 80 * u);
    drawWaves(ctx, TEX_W - 15 * u, 12 * u, 5.5 * u);
    return c;
  };

  const back = (ink: string, ground: string, tile: string, dot: string) => {
    const [c, ctx] = make();
    ctx.fillStyle = ground;
    ctx.fillRect(0, 0, TEX_W, TEX_H);
    // The QR tile: white, rounded, vertically centred on the left.
    const size = TEX_H * 0.6;
    const x = 7 * u;
    const y = (TEX_H - size) / 2;
    ctx.fillStyle = tile;
    ctx.beginPath();
    ctx.roundRect(x, y, size, size, size * 0.08);
    ctx.fill();
    const pad = size * 0.09;
    const cell = (size - pad * 2) / modules.length;
    ctx.fillStyle = dot;
    modules.forEach((row, r) =>
      row.forEach((on, col) => {
        if (on) ctx.fillRect(x + pad + col * cell, y + pad + r * cell, cell + 0.6, cell + 0.6);
      })
    );
    // Small Unitouch mark, bottom right.
    const mh = 5.2 * u;
    const mw = (mark.width / mark.height) * mh;
    ctx.font = `600 ${3.6 * u}px ${display}`;
    const word = ctx.measureText("Unitouch").width;
    const right = TEX_W - 7 * u;
    const baseline = TEX_H - 8.6 * u;
    ctx.drawImage(tint(mark, ink), right - word - 1.6 * u - mw, baseline - mh + 0.6 * u, mw, mh);
    ctx.fillStyle = ink;
    ctx.fillText("Unitouch", right - word, baseline);
    return c;
  };

  const tex = (c: HTMLCanvasElement, srgb: boolean) => {
    const t = new CanvasTexture(c);
    if (srgb) t.colorSpace = SRGBColorSpace;
    t.anisotropy = maxAniso;
    return t;
  };

  // Roughness: ground = matte (light grey), print = gloss (dark).
  const faces: Faces = {
    front: tex(front(PRINT, "#141414"), true),
    frontRough: tex(front("#2e2e2e", "#9a9a9a"), false),
    back: tex(back(PRINT, "#141414", "#f4f2ee", "#141414"), true),
    backRough: tex(back("#2e2e2e", "#9a9a9a", "#5a5a5a", "#5a5a5a"), false),
  };
  if (finish === "premium") {
    // Metalness: the gold print is metal; the card and the QR tile aren't.
    faces.frontMetal = tex(front("#8c8c8c", "#000000"), false);
    faces.backMetal = tex(back("#8c8c8c", "#000000", "#000000", "#000000"), false);
  }
  return faces;
}

/* A soft contact shadow, in two layers like a real studio shot: a wide,
   very soft ambient pool and a tighter, darker core right under the object. */
function shadowTexture() {
  const c = document.createElement("canvas");
  c.width = 512;
  c.height = 128;
  const ctx = c.getContext("2d")!;
  ctx.filter = "blur(26px)";
  ctx.fillStyle = "rgba(60,52,44,0.32)";
  ctx.beginPath();
  ctx.ellipse(256, 64, 200, 26, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.filter = "blur(9px)";
  ctx.fillStyle = "rgba(43,38,34,0.42)";
  ctx.beginPath();
  ctx.ellipse(256, 64, 150, 10, 0, 0, Math.PI * 2);
  ctx.fill();
  return new CanvasTexture(c);
}

/* Renderer, scene, environment light and a key + rim light, like a product
   table: they make the gloss print and the edges read. */
export function createStudio(canvas: HTMLCanvasElement) {
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

  const key = new DirectionalLight(0xfff6ec, 1.7);
  key.position.set(-3, 4, 5);
  const rim = new DirectionalLight(0xdfe8ff, 2.2);
  rim.position.set(4, 2, -4);
  scene.add(key, rim);

  return {
    renderer,
    scene,
    dispose() {
      envMap.dispose();
      pmrem.dispose();
      renderer.dispose();
    },
  };
}

/* The card: an extruded rounded body (its sides are the visible edge) with
   the two printed faces just in front of its caps. */
export function buildCard(renderer: WebGLRenderer, design: CardDesign) {
  const group = new Group();
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
  group.add(new Mesh(bodyGeo, edgeMat));

  const faceGeo = new ShapeGeometry(roundedRect(W, H, RADIUS), 24);
  // Clone before normalising: normaliseUVs works in place.
  const backGeo = faceGeo.clone();
  normaliseUVs(faceGeo);
  normaliseUVs(backGeo);

  const frontMat = new MeshPhysicalMaterial({
    roughness: 1,
    metalness: 0,
    clearcoat: 0.25,
    clearcoatRoughness: 0.55,
    sheen: 0.3,
    sheenRoughness: 0.8,
  });
  const backMat = frontMat.clone();
  const frontMesh = new Mesh(faceGeo, frontMat);
  frontMesh.position.z = DEPTH / 2 + 0.0045;
  const backMesh = new Mesh(backGeo, backMat);
  backMesh.position.z = -DEPTH / 2 - 0.0045;
  backMesh.rotation.y = Math.PI;
  group.add(frontMesh, backMesh);

  const ready = paintFaces(design, renderer.capabilities.getMaxAnisotropy()).then((f) => {
    frontMat.map = f.front;
    frontMat.roughnessMap = f.frontRough;
    backMat.map = f.back;
    backMat.roughnessMap = f.backRough;
    if (f.frontMetal && f.backMetal) {
      frontMat.metalness = backMat.metalness = 1;
      frontMat.metalnessMap = f.frontMetal;
      backMat.metalnessMap = f.backMetal;
    }
    frontMat.needsUpdate = true;
    backMat.needsUpdate = true;
  });

  return {
    group,
    ready,
    dispose() {
      [bodyGeo, faceGeo, backGeo].forEach((g) => g.dispose());
      [edgeMat, frontMat, backMat].forEach((m) => {
        m.map?.dispose();
        m.roughnessMap?.dispose();
        m.metalnessMap?.dispose();
        m.dispose();
      });
    },
  };
}

/* A soft contact shadow on the floor under an object. */
export function contactShadow(width: number, depth: number) {
  const mat = new MeshBasicMaterial({ map: shadowTexture(), transparent: true, depthWrite: false });
  const mesh = new Mesh(new PlaneGeometry(width, depth), mat); // taste-skill-ignore: 3D contact shadow
  mesh.rotation.x = -Math.PI / 2;
  return {
    mesh,
    mat,
    dispose() {
      mesh.geometry.dispose();
      mat.map?.dispose();
      mat.dispose();
    },
  };
}
