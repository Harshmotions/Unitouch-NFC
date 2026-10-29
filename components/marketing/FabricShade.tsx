"use client";

import { useEffect, useRef, useState } from "react";
import { markReady } from "@/lib/loader";

/* Light falling across a fabric-like ground over the whole hero, the way
   Cartier's pages look: long, soft, slightly slanted shadows, each one
   different, drifting slowly in different directions so the pattern never
   repeats, over a fine still grain (fabric-grain.webp). A still
   frame (public/home/fabric-shade.webp, rendered from this same shader at
   START) paints first and is the reduced-motion view; once the page is
   idle a tiny WebGL shader takes over and keeps it moving. It draws at a
   fraction of the screen's resolution (the shadows are soft, so upscaling
   costs nothing visible), at most 30 times a second, and only while the
   hero is on screen. No three.js: about 2 KB of plain WebGL. */

// Shader time the still was rendered at, so the swap is seamless.
const START = 40;
// How fast the shadows drift: quick enough to notice, slow enough to calm.
const SPEED = 2.2;

const VERT = `attribute vec2 p;void main(){gl_Position=vec4(p,0.,1.);}`;

const FRAG = `precision mediump float;
uniform vec2 r;
uniform float t;
float h(vec2 p){return fract(sin(dot(p,vec2(127.1,311.7)))*43758.5453);}
float n(vec2 p){vec2 i=floor(p),f=fract(p);f=f*f*(3.-2.*f);
return mix(mix(h(i),h(i+vec2(1,0)),f.x),mix(h(i+vec2(0,1)),h(i+vec2(1,1)),f.x),f.y);}
float fbs(vec2 p){float v=0.,a=.5;for(int i=0;i<3;i++){v+=a*n(p);p=mat2(1.6,1.2,-1.2,1.6)*p+vec2(3.1,7.7);a*=.5;}return v/.875;}
void main(){
  vec2 uv=gl_FragCoord.xy/r.y;
  // Shadows fall in long, soft streaks, a little off horizontal.
  vec2 p=mat2(.985,-.17,.17,.985)*uv;
  // The breeze: the streaks are bent and pushed about by slow, wandering
  // noise, so no two are alike and the pattern never repeats.
  vec2 w=vec2(fbs(p*.45+vec2(t*.018,-t*.011)),fbs(p*.45+vec2(5.2-t*.014,1.3+t*.009)));
  vec2 q=p+(w-.5)*vec2(.9,.35);
  // Broad soft shadows, stretched along the streak direction.
  float s1=fbs(vec2(q.x*.28-t*.024,q.y*1.5+t*.005));
  // Narrower streaks drifting the other way, at a different pace.
  float s2=fbs(vec2(q.x*.4+t*.016,q.y*3.2-t*.007)+3.7);
  // Soft folds in the fabric: gentle ridges, never hard lines.
  float c=1.-abs(2.*fbs(vec2(q.x*.35-t*.008,q.y*5.)+w)-1.);
  float shade=smoothstep(.4,.82,s1)*.6+smoothstep(.47,.83,s2)*.32+smoothstep(.75,1.,c)*.18;
  shade=smoothstep(.04,.9,shade);
  gl_FragColor=vec4(vec3(1.-shade),1.);
}`;

export default function FabricShade() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [live, setLive] = useState(false);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

    let cancelled = false;
    let raf = 0;
    let visible = true;
    const cleanups: (() => void)[] = [];

    const boot = () => {
      try {
        start();
      } finally {
        markReady("fabric");
      }
    };

    const start = () => {
      if (cancelled) return;
      const gl = canvas.getContext("webgl", { alpha: false, antialias: false, depth: false, powerPreference: "low-power" });
      if (!gl) return;
      const shader = (type: number, src: string) => {
        const s = gl.createShader(type)!;
        gl.shaderSource(s, src);
        gl.compileShader(s);
        return s;
      };
      const prog = gl.createProgram()!;
      gl.attachShader(prog, shader(gl.VERTEX_SHADER, VERT));
      gl.attachShader(prog, shader(gl.FRAGMENT_SHADER, FRAG));
      gl.linkProgram(prog);
      if (!gl.getProgramParameter(prog, gl.LINK_STATUS)) return;
      gl.useProgram(prog);
      gl.bindBuffer(gl.ARRAY_BUFFER, gl.createBuffer());
      gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 3, -1, -1, 3]), gl.STATIC_DRAW);
      const loc = gl.getAttribLocation(prog, "p");
      gl.enableVertexAttribArray(loc);
      gl.vertexAttribPointer(loc, 2, gl.FLOAT, false, 0, 0);
      const uR = gl.getUniformLocation(prog, "r");
      const uT = gl.getUniformLocation(prog, "t");

      // A quarter of the CSS size is plenty for shadows this soft.
      const resize = () => {
        canvas.width = Math.max(1, Math.round(canvas.clientWidth * 0.25));
        canvas.height = Math.max(1, Math.round(canvas.clientHeight * 0.25));
        gl.viewport(0, 0, canvas.width, canvas.height);
      };
      resize();
      const ro = new ResizeObserver(resize);
      ro.observe(canvas);
      cleanups.push(() => ro.disconnect());

      let t = START;
      let last = performance.now();
      let lastDraw = 0;
      const draw = () => {
        gl.uniform2f(uR, canvas.width, canvas.height);
        gl.uniform1f(uT, t);
        gl.drawArrays(gl.TRIANGLES, 0, 3);
      };
      const tick = (now: number) => {
        raf = requestAnimationFrame(tick);
        t += Math.min((now - last) / 1000, 0.1) * SPEED;
        last = now;
        if (now - lastDraw < 33) return;
        lastDraw = now;
        draw();
      };
      const sync = () => {
        cancelAnimationFrame(raf);
        if (visible && !document.hidden) {
          last = performance.now();
          raf = requestAnimationFrame(tick);
        }
      };
      draw();
      setLive(true);
      sync();

      const io = new IntersectionObserver(([e]) => {
        visible = e.isIntersecting;
        sync();
      });
      io.observe(canvas);
      document.addEventListener("visibilitychange", sync);
      cleanups.push(() => {
        io.disconnect();
        document.removeEventListener("visibilitychange", sync);
        cancelAnimationFrame(raf);
      });
    };

    const go = () => (window.requestIdleCallback ?? ((cb: () => void) => window.setTimeout(cb, 300)))(boot, { timeout: 3000 });
    if (document.readyState === "complete") go();
    else window.addEventListener("load", go, { once: true });

    return () => {
      cancelled = true;
      window.removeEventListener("load", go);
      cleanups.forEach((c) => c());
    };
  }, []);

  return (
    <div aria-hidden className="pointer-events-none absolute inset-0">
      <div className="fabric-shade absolute inset-0">
        <canvas
          ref={canvasRef}
          className={`h-full w-full transition-opacity duration-1000 ${live ? "opacity-100" : "opacity-0"}`}
        />
      </div>
      {/* The weave: a fine, still grain over everything, so the ground reads
          as a material rather than a flat colour. */}
      <div className="fabric-grain absolute inset-0" />
    </div>
  );
}
