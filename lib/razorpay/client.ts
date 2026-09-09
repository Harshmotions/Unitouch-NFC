import Razorpay from "razorpay";

/* Server-side Razorpay SDK client (audit #01 — real payment flow).

   Instantiated once and reused: the SDK holds no per-request state, only the
   API credentials, so a module-level singleton is safe across invocations.

   SERVER ONLY. This reads RAZORPAY_KEY_SECRET — never import it into a client
   component or anything bundled for the browser. The client-side checkout only
   ever needs NEXT_PUBLIC_RAZORPAY_KEY_ID, which is the public key id. */

let client: Razorpay | null = null;

export function getRazorpayClient(): Razorpay {
  if (client) return client;

  const key_id = process.env.RAZORPAY_KEY_ID;
  const key_secret = process.env.RAZORPAY_KEY_SECRET;
  if (!key_id || !key_secret) {
    // Fail loud and early rather than letting the SDK make an unauthenticated
    // call that surfaces as a confusing downstream error.
    throw new Error("Razorpay is not configured: RAZORPAY_KEY_ID / RAZORPAY_KEY_SECRET are missing.");
  }

  client = new Razorpay({ key_id, key_secret });
  return client;
}
