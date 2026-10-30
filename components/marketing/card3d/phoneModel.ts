/* The iPhone used by the homepage's 3D: the phone story (phoneScene.ts) and
   the tap demo in How it works (tapScene.ts). The model, its materials (it
   ships without its own), the profile on its screen and the Save Contact
   bar over it, in one group, in the card's units. */
import {
  Group,
  Mesh,
  MeshBasicMaterial,
  MeshPhysicalMaterial,
  Shape,
  ShapeGeometry,
  SRGBColorSpace,
  TextureLoader,
  type BufferGeometry,
  type Material,
  type Texture,
  type WebGLRenderer,
} from "three";

/* The phone is a real iPhone 14 Pro Max model (public/models, a GLB with
   meshopt compression, about 120 KB over the wire), modelled in millimetres
   with the screen facing +Z. Scaled into the card's units (1 = 4 cm). */
export const MM = 1 / 40;
export const PW = 78.47 * MM;
export const PH = 161.2 * MM;
export const FRONT_Z = 5.983 * MM;
export const BACK_Z = -3.65 * MM;
// The display, from the model: 71.1 x 155 mm, corners about 9.5 mm.
export const SW = 71.1 * MM;
export const SH = 155 * MM;
export const SR = 9.5 * MM;
// The screenshot on the screen: 1170 x 2925 px (the demo profile at 3x, so
// it stays crisp when the camera closes in), the screen shows 1170 x 2532.
export const SHOT_W = 1170;
export const SHOT_H = 2925;
export const VIEW_H = 2532;
export const BAR_H = 270;

/* A rounded rectangle with separate top and bottom corner radii, for the
   Save Contact bar that sits flush with the screen's rounded bottom. */
export function barShape(w: number, h: number, rBottom: number): Shape {
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
export function fitUVs(geo: BufferGeometry, w: number, h: number) {
  const uv = geo.attributes.uv;
  for (let i = 0; i < uv.count; i++) uv.setXY(i, (uv.getX(i) + w / 2) / w, (uv.getY(i) + h / 2) / h);
  uv.needsUpdate = true;
}

export interface PhoneModel {
  /** The phone, screen facing +Z, centred on the origin. */
  phone: Group;
  /** The screen (its map is the profile, scrolled by moving its offset). */
  screenMat: MeshBasicMaterial;
  barMat: MeshBasicMaterial;
  ready: Promise<void>;
  dispose(): void;
}

export function createPhoneModel(renderer: WebGLRenderer): PhoneModel {
  const disposables: { dispose(): void }[] = [];
  const track = <T extends { dispose(): void }>(x: T) => (disposables.push(x), x);
  const phone = new Group();

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

  const barH = (SW * BAR_H) / SHOT_W;
  const barGeo = track(new ShapeGeometry(barShape(SW, barH, SR), 32));
  fitUVs(barGeo, SW, barH);
  const barMat = track(new MeshBasicMaterial({ color: 0x000000, toneMapped: false, transparent: true }));
  const bar = new Mesh(barGeo, barMat);
  bar.position.set(0, -SH / 2 + barH / 2, FRONT_Z + 0.002);
  phone.add(bar);

  // glTF UVs start at the top of the image, so the screen texture isn't flipped.
  const ready = Promise.all([load("/home/phone-screen.webp", false), load("/home/phone-bar.webp"), model]).then(
    ([shot, barTex]) => {
      shot.repeat.set(1, VIEW_H / SHOT_H);
      screenMat.map = shot;
      screenMat.needsUpdate = true;
      barMat.map = barTex;
      barMat.needsUpdate = true;
    }
  );

  return {
    phone,
    screenMat,
    barMat,
    ready,
    dispose() {
      disposables.forEach((d) => d.dispose());
    },
  };
}
