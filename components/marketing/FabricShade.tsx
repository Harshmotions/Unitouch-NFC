"use client";

import { useEffect, useRef, useState } from "react";

/* Light through a sheer curtain, falling across the whole hero: soft folds
   of shadow that drift and billow slowly and never quite repeat. A still
   frame (public/home/fabric-shade.webp, rendered from this same shader at
   START) paints first and is the reduced-motion view; once the page is
   idle a tiny WebGL shader takes over and keeps it moving. It draws at a
   fraction of the screen's resolution (the shadows are soft, so upscaling
   costs nothing visible), at most 30 times a second, and only while the
   hero is on screen. No three.js: about 2 KB of plain WebGL. */

// Shader time the still was rendered at, so the swap is seamless.
const START = 40;

const VERT = `attribute vec2 p;void main(){gl_Position=vec4(p,0.,1.);}`;

const FRAG = `precision mediump float;
uniform vec2 r;
uniform float t;
float h(vec2 p){return fract(sin(dot(p,vec2(127.1,311.7)))*43758.5453);}
float n(vec2 p){vec2 i=floor(p),f=fract(p);f=f*f*(3.-2.*f);
return mix(mix(h(i),h(i+vec2(1,0)),f.x),mix(h(i+vec2(0,1)),h(i+vec2(1,1)),f.x),f.y);}
float fbm(vec2 p){float v=0.,a=.5;for(int i=0;i<4;i++){v+=a*n(p);p=p*2.03+vec2(1.7,9.2);a*=.5;}return v;}
void main(){
  vec2 uv=gl_FragCoord.xy/r.y;
  // The breeze: a slow warp that bends the folds and moves them about.
  float w=fbm(vec2(uv.x*.9-t*.035,uv.y*.45+t*.012));
  float w2=fbm(vec2(uv.x*.5+t*.02,uv.y*.3-t*.01)+w);
  // Folds: long, slightly slanted bands, like a hanging curtain.
  float x=uv.x+uv.y*.28+w2*1.15;
  float f=sin(x*6.5+t*.16)*.55+sin(x*11.3-t*.11+w*3.)*.3+sin(x*23.-t*.07+w2*5.)*.15;
  f=smoothstep(-.1,1.,f);
  // Broad patches of light and shade drifting over the folds.
  float l=smoothstep(.3,.75,fbm(uv*.75+vec2(t*.03,-t*.018)));
  // Mostly light, with the folds and patches going properly dark.
  float shade=smoothstep(.22,.95,f*.6+(1.-l)*.4);
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
        t += Math.min((now - last) / 1000, 0.1);
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
    <div aria-hidden className="fabric-shade pointer-events-none absolute inset-0">
      <canvas
        ref={canvasRef}
        className={`h-full w-full transition-opacity duration-1000 ${live ? "opacity-100" : "opacity-0"}`}
      />
    </div>
  );
}
