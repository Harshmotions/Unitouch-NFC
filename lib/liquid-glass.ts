/* The maths behind the refracting liquid glass (components/ui/GlassLens.tsx),
   ported from github.com/mkj0kjay/vue-web-liquid-glass (src/lib), which
   models Apple's material physically:

   - The glass edge is a convex "squircle" bevel. For each point across the
     bevel, Snell's law (refractive index ~1.4) gives how far a straight-down
     ray is bent sideways before it reaches the back of the glass.
   - That 1D profile is swept around a rounded rectangle into a displacement
     map (red = x shift, green = y shift, 128 = none), so the backdrop bends
     only at the rim, toward the centre, the way a thick lens does.
   - A matching specular map lights the rim where it faces a light from the
     upper left.

   An SVG filter combines them over the element's backdrop. Import-free, so
   it runs in the browser with no extra code shipped to the server. */

// The bevel's height across its width (0 at the outer edge, 1 inside).
const squircle = (x: number) => Math.pow(1 - Math.pow(1 - x, 4), 1 / 4);

/* How far a vertical ray is displaced at each point across the bevel. */
function bevelProfile(glassThickness: number, bezelWidth: number, ior: number, samples = 128): number[] {
  const eta = 1 / ior;
  return Array.from({ length: samples }, (_, i) => {
    const x = i / samples;
    const y = squircle(x);
    const dx = x < 1 ? 0.0001 : -0.0001;
    const derivative = (squircle(x + dx) - y) / dx;
    const magnitude = Math.sqrt(derivative * derivative + 1);
    const nx = -derivative / magnitude;
    const ny = -1 / magnitude;
    const dot = ny;
    const k = 1 - eta * eta * (1 - dot * dot);
    if (k < 0) return 0; // total internal reflection
    const kSqrt = Math.sqrt(k);
    const rx = -(eta * dot + kSqrt) * nx;
    const ry = eta - (eta * dot + kSqrt) * ny;
    return rx * ((y * bezelWidth + glassThickness) / ry);
  });
}

/* Walks every pixel of a w x h rounded rectangle (radius r) and calls `fn`
   for those inside the bevel, with the outward direction and the depth into
   the bevel. Shared by both maps. */
function forEachBevelPixel(
  w: number,
  h: number,
  r: number,
  bezel: number,
  fn: (idx: number, cos: number, sin: number, fromSide: number, opacity: number) => void
) {
  const rSq = r * r;
  const rPlusSq = (r + 1) * (r + 1);
  const rMinusSq = Math.max(0, r - bezel) ** 2;
  const midW = w - r * 2;
  const midH = h - r * 2;
  for (let y1 = 0; y1 < h; y1++) {
    for (let x1 = 0; x1 < w; x1++) {
      const x = x1 < r ? x1 - r : x1 >= w - r ? x1 - r - midW : 0;
      const y = y1 < r ? y1 - r : y1 >= h - r ? y1 - r - midH : 0;
      const dSq = x * x + y * y;
      if (dSq > rPlusSq || dSq < rMinusSq) continue;
      const d = Math.sqrt(dSq) || 1;
      const opacity = dSq < rSq ? 1 : 1 - (d - r) / (Math.sqrt(rPlusSq) - r);
      fn((y1 * w + x1) * 4, x / d, y / d, r - d, opacity);
    }
  }
}

export interface GlassMaps {
  displacement: string;
  specular: string;
  /** feDisplacementMap scale, in CSS pixels. */
  scale: number;
}

/* Builds both maps for an element of the given CSS size and corner radius,
   at up to 2x density, as PNG data URLs for the filter's feImage. */
export function buildGlassMaps(width: number, height: number, radius: number): GlassMaps {
  const dpr = Math.min(window.devicePixelRatio || 1, 2);
  const w = Math.max(1, Math.round(width * dpr));
  const h = Math.max(1, Math.round(height * dpr));
  const r = Math.min(radius, width / 2, height / 2) * dpr;
  // Bevel and thickness scale with the control's height, as in the
  // reference's presets (a 52 px pill: 12 px bevel, 80 px thick).
  const bezelCss = Math.max(6, Math.min(height * 0.25, 22));
  const bezel = bezelCss * dpr;
  const profile = bevelProfile(height * 1.5, bezelCss, 1.4);
  const maxDisp = Math.max(...profile.map((v) => Math.abs(v))) || 1;

  const canvas = document.createElement("canvas");
  canvas.width = w;
  canvas.height = h;
  const ctx = canvas.getContext("2d")!;

  // Displacement: neutral (128, 128) everywhere, bent toward the centre in
  // the bevel.
  const disp = ctx.createImageData(w, h);
  new Uint32Array(disp.data.buffer).fill(0xff008080);
  forEachBevelPixel(w, h, r, bezel, (idx, cos, sin, fromSide, opacity) => {
    const i = ((fromSide / bezel) * profile.length) | 0;
    const dist = profile[i] ?? 0;
    disp.data[idx] = 128 + ((-cos * dist) / maxDisp) * 127 * opacity;
    disp.data[idx + 1] = 128 + ((-sin * dist) / maxDisp) * 127 * opacity;
    disp.data[idx + 2] = 0;
    disp.data[idx + 3] = 255;
  });
  ctx.putImageData(disp, 0, 0);
  const displacement = canvas.toDataURL("image/png");

  // Specular: white where the rim faces the light (60 degrees, from the
  // upper left and, mirrored, the lower right), a 0.5 px line to match the
  // CSS rim.
  const spec = ctx.createImageData(w, h);
  const lx = Math.cos(Math.PI / 3);
  const ly = Math.sin(Math.PI / 3);
  forEachBevelPixel(w, h, r, bezel, (idx, cos, sin, fromSide, opacity) => {
    const facing = Math.abs(cos * lx - sin * ly);
    const edge = Math.sqrt(Math.max(0, 1 - (1 - fromSide / (dpr * 0.5)) ** 2));
    const c = facing * edge;
    const v = 255 * c;
    spec.data[idx] = v;
    spec.data[idx + 1] = v;
    spec.data[idx + 2] = v;
    spec.data[idx + 3] = v * c * opacity;
  });
  ctx.putImageData(spec, 0, 0);
  const specular = canvas.toDataURL("image/png");

  return { displacement, specular, scale: maxDisp * 0.45 };
}

/* The refraction needs an SVG filter as a backdrop-filter, which only
   Chromium browsers render (Chrome, Edge, Samsung Internet, Chrome on
   Android). Safari, every iPhone browser and Firefox keep the CSS glass. */
export function supportsGlassLens(): boolean {
  if (typeof navigator === "undefined") return false;
  // Reduce Transparency / Increase Contrast get solid controls instead.
  if (window.matchMedia("(prefers-reduced-transparency: reduce), (prefers-contrast: more)").matches) return false;
  const brands = (navigator as Navigator & { userAgentData?: { brands?: { brand: string }[] } }).userAgentData?.brands;
  return !!brands?.some((b) => /Chromium/i.test(b.brand));
}
