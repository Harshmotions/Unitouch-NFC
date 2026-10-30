"use client";

import { useEffect, useRef } from "react";
import { buildGlassMaps, supportsGlassLens } from "@/lib/liquid-glass";

let counter = 0;
let defs: SVGSVGElement | null = null;

/* One hidden <svg> holds every lens's filter. */
function filterHost() {
  if (!defs) {
    defs = document.createElementNS("http://www.w3.org/2000/svg", "svg");
    defs.setAttribute("aria-hidden", "true");
    defs.setAttribute("color-interpolation-filters", "sRGB");
    defs.style.cssText = "position:absolute;width:0;height:0;overflow:hidden;pointer-events:none";
    document.body.appendChild(defs);
  }
  return defs;
}

/* Turns the glass element it sits in (its parent) into a refracting lens,
   after github.com/mkj0kjay/vue-web-liquid-glass: an SVG filter, sized to
   the element, that blurs the backdrop a touch, bends it at the rim with a
   displacement map from the bevel's physics (lib/liquid-glass.ts), boosts
   its colour there, and lays a specular highlight on top, applied as the
   element's backdrop-filter. Rebuilt when the element changes size.

   Chromium only (the only engine that renders an SVG backdrop-filter);
   elsewhere it does nothing and the element keeps its CSS liquid glass.
   Drop <GlassLens /> inside any .liquid-glass / .liquid-glass-dark element. */
export default function GlassLens({ blur = 1, saturation = 6, specular = 0.25 }: { blur?: number; saturation?: number; specular?: number }) {
  const ref = useRef<HTMLSpanElement>(null);

  useEffect(() => {
    const el = ref.current?.parentElement;
    if (!el || !supportsGlassLens()) return;
    const id = `glass-lens-${++counter}`;
    const ns = "http://www.w3.org/2000/svg";
    const filter = document.createElementNS(ns, "filter");
    filter.setAttribute("id", id);
    filterHost().appendChild(filter);

    let raf = 0;
    let lastKey = "";
    const build = () => {
      const rect = el.getBoundingClientRect();
      const w = Math.round(el.offsetWidth || rect.width);
      const h = Math.round(el.offsetHeight || rect.height);
      if (!w || !h) return;
      const radius = parseFloat(getComputedStyle(el).borderTopLeftRadius) || h / 2;
      const key = `${w}x${h}r${radius}`;
      if (key === lastKey) return;
      lastKey = key;
      const maps = buildGlassMaps(w, h, radius);
      filter.innerHTML = `
        <feGaussianBlur in="SourceGraphic" stdDeviation="${blur}" result="blurred" />
        <feImage href="${maps.displacement}" x="0" y="0" width="${w}" height="${h}" result="disp" />
        <feDisplacementMap in="blurred" in2="disp" scale="${maps.scale}" xChannelSelector="R" yChannelSelector="G" result="displaced" />
        <feColorMatrix in="displaced" type="saturate" values="${saturation}" result="saturated" />
        <feImage href="${maps.specular}" x="0" y="0" width="${w}" height="${h}" result="spec" />
        <feComposite in="saturated" in2="spec" operator="in" result="rimColour" />
        <feComponentTransfer in="spec" result="specFaded"><feFuncA type="linear" slope="${specular}" /></feComponentTransfer>
        <feBlend in="rimColour" in2="displaced" mode="normal" result="withRim" />
        <feBlend in="specFaded" in2="withRim" mode="normal" />`;
      el.style.backdropFilter = `url(#${id})`;
      el.classList.add("has-lens");
    };
    const schedule = () => {
      cancelAnimationFrame(raf);
      raf = requestAnimationFrame(build);
    };
    // Build when the browser has a moment, so it never competes with load.
    const idle = window.requestIdleCallback ?? ((cb: () => void) => window.setTimeout(cb, 200));
    const handle = idle(schedule);
    const ro = new ResizeObserver(schedule);
    ro.observe(el);
    return () => {
      ro.disconnect();
      cancelAnimationFrame(raf);
      if (typeof handle === "number" && window.cancelIdleCallback) window.cancelIdleCallback(handle);
      filter.remove();
      el.style.backdropFilter = "";
      el.classList.remove("has-lens");
    };
  }, [blur, saturation, specular]);

  return <span ref={ref} hidden />;
}
