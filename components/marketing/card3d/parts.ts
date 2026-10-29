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
    ctx.font = `600 ${10.5 * u}px ${display}`;
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
    ctx.font = `600 ${7.4 * u}px ${display}`;
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
export function buildCard(renderer: WebGLRenderer, name: string, title: string) {
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

  const ready = paintFaces(name, title, renderer.capabilities.getMaxAnisotropy()).then((f) => {
    frontMat.map = f.front;
    frontMat.roughnessMap = f.frontRough;
    backMat.map = f.back;
    backMat.roughnessMap = f.backRough;
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
