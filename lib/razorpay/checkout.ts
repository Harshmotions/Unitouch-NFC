import type { RazorpayCheckoutOptions } from "@/types/razorpay";

/* Client-side helper (audit #01): load Razorpay's hosted checkout.js and open
   the payment modal. checkout.js can't be bundled — it must be served from
   Razorpay's own CDN — so we inject the script tag on demand and resolve once
   window.Razorpay is available. */

const CHECKOUT_SRC = "https://checkout.razorpay.com/v1/checkout.js";

export function loadRazorpayCheckout(): Promise<void> {
  return new Promise((resolve, reject) => {
    if (typeof window === "undefined") {
      reject(new Error("Razorpay checkout can only load in the browser."));
      return;
    }
    // Already loaded (script ran on a previous attempt in this session).
    if (window.Razorpay) {
      resolve();
      return;
    }

    const fail = () => reject(new Error("Could not load the payment gateway. Check your connection and try again."));

    // Script tag already present but not finished loading — attach to it
    // rather than injecting a duplicate.
    const existing = document.querySelector<HTMLScriptElement>(`script[src="${CHECKOUT_SRC}"]`);
    if (existing) {
      existing.addEventListener("load", () => resolve(), { once: true });
      existing.addEventListener("error", fail, { once: true });
      return;
    }

    const script = document.createElement("script");
    script.src = CHECKOUT_SRC;
    script.async = true;
    script.onload = () => resolve();
    script.onerror = fail;
    document.body.appendChild(script);
  });
}

/* Convenience wrapper — assumes loadRazorpayCheckout() has already resolved. */
export function openRazorpayCheckout(options: RazorpayCheckoutOptions): void {
  const rzp = new window.Razorpay(options);
  rzp.open();
}
