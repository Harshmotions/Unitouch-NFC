import Image from "next/image";

/* The first-visit intro on the homepage, covering the few seconds while
   the page boots its 3D: the U mark, the wordmark sliding out from behind
   it, and a hairline progress bar on the ink ground. When the hero is
   ready the mark drops out of view and the screen opens in four rows of
   vertical slats that thin away in a wave, alternating direction row by
   row, revealing the page (after a reference Harsh supplied).

   Everything runs on CSS (globals.css, "Page loader") and the small inline
   script below, which is in the HTML itself, so it starts on the first
   paint, before any JavaScript bundle. The script decides whether to show
   it at all (once per browser session, never with reduced motion), and
   when to open: when the hero card's 3D is live, or a second after the
   page has loaded, never before the intro has played and never later than
   five seconds. Without JavaScript, or on client-side navigation, it never
   shows. */
const ROWS = 4;
const COLS = 16;

const SCRIPT = `(function(){var d=document.documentElement;
try{if(sessionStorage.getItem('ut-intro')||matchMedia('(prefers-reduced-motion: reduce)').matches)return}catch(e){}
d.classList.add('loading');var t0=Date.now(),done=false,ready={};
function open(){d.classList.add('loader-done');try{sessionStorage.setItem('ut-intro','1')}catch(e){}
setTimeout(function(){d.classList.remove('loading');window.dispatchEvent(new Event('unitouch:loaded'))},450);
setTimeout(function(){d.classList.add('loader-gone')},1900)}
function finish(){if(done)return;done=true;setTimeout(function(){
requestAnimationFrame(function(){requestAnimationFrame(function(){
(window.requestIdleCallback||function(f){setTimeout(f,150)})(open,{timeout:400})})})},Math.max(0,1500-(Date.now()-t0)))}
addEventListener('unitouch:ready',function(e){ready[e.detail]=1;if(ready.hero&&ready.fabric&&ready.phone)finish()});
setTimeout(finish,6000)})();`;

export default function PageLoader() {
  return (
    <>
      <div className="page-loader" aria-hidden>
        <div className="page-loader-slats">
          {Array.from({ length: ROWS * COLS }, (_, i) => {
            const row = Math.floor(i / COLS);
            const col = i % COLS;
            // Even rows thin away from the right, odd rows from the left.
            const order = row % 2 === 0 ? COLS - 1 - col : col;
            return (
              <span
                key={i}
                className={row % 2 === 0 ? "origin-right" : "origin-left"}
                style={{ "--d": `${order * 26 + row * 70}ms` } as React.CSSProperties}
              />
            );
          })}
        </div>
        <div className="page-loader-brand">
          <span className="page-loader-mark">
            <Image src="/brand/u-mark-white.webp" alt="" width={56} height={64} priority className="h-full w-auto" />
          </span>
          <span className="page-loader-word">
            <span className="font-display">Unitouch</span>
          </span>
        </div>
        <span className="page-loader-bar">
          <span />
        </span>
      </div>
      <script dangerouslySetInnerHTML={{ __html: SCRIPT }} />
    </>
  );
}
