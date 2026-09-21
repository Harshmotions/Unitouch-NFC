import crypto from "crypto";

/* Razorpay signature verification (audit #01 — real payment flow).

   Two independent trust boundaries, both HMAC-SHA256:
     - the checkout-return signature (client hands it back after paying), and
     - the webhook signature (Razorpay signs each server-to-server callback).

   Both comparisons are constant-time (crypto.timingSafeEqual) so a caller
   can't reconstruct the expected signature byte-by-byte by measuring how long
   a mismatch takes to reject. The razorpay SDK ships equivalents, but its
   webhook check compares with a plain `===` string equality (not constant
   time), so we verify ourselves. */

/* Constant-time comparison of two hex-encoded strings. timingSafeEqual throws
   if the two buffers differ in length, so we length-check first — a
   wrong-length signature is a mismatch regardless. Decoding as hex means a
   signature containing non-hex characters yields a short/empty buffer, which
   the length check then rejects. */
function safeEqualHex(expected: string, actual: string): boolean {
  const a = Buffer.from(expected, "hex");
  const b = Buffer.from(actual, "hex");
  if (a.length === 0 || a.length !== b.length) return false;
  return crypto.timingSafeEqual(a, b);
}

/* Checkout-return signature: HMAC-SHA256 of "<order_id>|<payment_id>" keyed
   with the Razorpay KEY SECRET (deliberately NOT the webhook secret — the two
   flows use different keys). This is the razorpay_signature that checkout.js
   returns to the browser on a successful payment; the /verify route confirms
   it before marking the order paid. */
export function verifyPaymentSignature(params: {
  orderId: string;
  paymentId: string;
  signature: string;
}): boolean {
  const secret = process.env.RAZORPAY_KEY_SECRET;
  if (!secret) throw new Error("RAZORPAY_KEY_SECRET is not configured.");

  const { orderId, paymentId, signature } = params;
  if (!orderId || !paymentId || !signature) return false;

  const expected = crypto
    .createHmac("sha256", secret)
    .update(`${orderId}|${paymentId}`)
    .digest("hex");

  return safeEqualHex(expected, signature);
}

/* Webhook signature: HMAC-SHA256 of the RAW request body keyed with the
   webhook secret (the value set when the webhook was created in the Razorpay
   dashboard). The body must be the exact bytes as received — re-serializing
   parsed JSON reorders/reformats it and breaks the signature — so the webhook
   route reads request.text() and passes it here unmodified. */
export function verifyWebhookSignature(rawBody: string, signature: string | null): boolean {
  const secret = process.env.RAZORPAY_WEBHOOK_SECRET;
  if (!secret) throw new Error("RAZORPAY_WEBHOOK_SECRET is not configured.");
  if (!signature) return false;

  const expected = crypto
    .createHmac("sha256", secret)
    .update(rawBody)
    .digest("hex");

  return safeEqualHex(expected, signature);
}
