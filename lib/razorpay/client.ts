import Razorpay from "razorpay";

/* Server-side Razorpay SDK client (audit #01 — real payment flow).

   Instantiated once and reused: the SDK holds no per-request state, only the
   API credentials, so a module-level singleton is safe across invocations.

   SERVER ONLY. This reads RZP_KEY_SECRET — never import it into a client
   component or anything bundled for the browser. The client-side checkout gets
   the public key id from the create-order API response, not from an env var.

   NOTE on the RZP_ prefix: these were originally RAZORPAY_KEY_ID/SECRET, but on
   this Vercel project those specific names would not deliver to the Production
   runtime (present in the dashboard, empty in process.env — every RAZORPAY_-
   prefixed var, while all other vars worked). Renaming to RZP_ sidesteps that
   platform quirk. */

let client: Razorpay | null = null;

export function getRazorpayClient(): Razorpay {
  if (client) return client;

  const key_id = process.env.RZP_KEY_ID;
  const key_secret = process.env.RZP_KEY_SECRET;
  if (!key_id || !key_secret) {
    // Fail loud and early rather than letting the SDK make an unauthenticated
    // call that surfaces as a confusing downstream error.
    throw new Error("Razorpay is not configured: RZP_KEY_ID / RZP_KEY_SECRET are missing.");
  }

  client = new Razorpay({ key_id, key_secret });
  return client;
}
