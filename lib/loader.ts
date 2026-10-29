/* The first-visit loader (components/marketing/PageLoader.tsx) stays up
   until each heavy piece of the homepage has finished starting (or given
   up), so their downloads, decoding and shader compiling happen behind it
   rather than while it opens. Import-free so client components can use it. */
export type LoaderPart = "hero" | "fabric" | "phone";

export function markReady(part: LoaderPart) {
  window.dispatchEvent(new CustomEvent("unitouch:ready", { detail: part }));
}

/** True while the loader is covering the page. */
export function loaderShowing() {
  return document.documentElement.classList.contains("loading");
}
