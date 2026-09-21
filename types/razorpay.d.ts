/* Ambient types for Razorpay's hosted checkout.js (audit #01). checkout.js is
   loaded from Razorpay's CDN at runtime and attaches `Razorpay` to window;
   these declarations describe the slice of its API we use. */

export interface RazorpayCheckoutResponse {
  razorpay_payment_id: string;
  razorpay_order_id: string;
  razorpay_signature: string;
}

export interface RazorpayCheckoutOptions {
  /** Public key id (rzp_live_… / rzp_test_…). */
  key: string;
  /** Amount in paise — echoed from the server-created order. */
  amount: number | string;
  currency: string;
  /** The server-created Razorpay order id (order_…). */
  order_id: string;
  name: string;
  description?: string;
  image?: string;
  prefill?: { name?: string; email?: string; contact?: string };
  notes?: Record<string, string>;
  theme?: { color?: string };
  /** Called after a successful payment with the ids + signature to verify. */
  handler: (response: RazorpayCheckoutResponse) => void;
  modal?: { ondismiss?: () => void };
}

export interface RazorpayInstance {
  open(): void;
  on(event: "payment.failed", handler: (response: unknown) => void): void;
}

declare global {
  interface Window {
    Razorpay: new (options: RazorpayCheckoutOptions) => RazorpayInstance;
  }
}
