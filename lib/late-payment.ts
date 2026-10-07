import { getRazorpayClient } from "@/lib/razorpay/client";
import { sendLatePaymentAlert } from "@/lib/email";

/* Safety net for lib/reservations.ts: a verified payment whose order no
   longer exists (the unpaid reservation was released, e.g. a very slow UPI
   payment in an old tab). The customer must never be charged without an
   order, so refund it in full and tell the admin inbox.

   Both /razorpay/verify and the webhook can land here for the same payment;
   Razorpay rejects the second full refund and the alert is idempotent per
   payment id, so running twice is harmless. Never throws. */
export async function refundOrphanPayment(razorpayOrderId: string, paymentId: string): Promise<boolean> {
  let refunded = false;
  let refundError: string | undefined;
  try {
    await getRazorpayClient().payments.refund(paymentId, {
      notes: { reason: "Checkout expired before payment completed", razorpay_order_id: razorpayOrderId },
    });
    refunded = true;
  } catch (err) {
    const e = err as { error?: { description?: string }; message?: string };
    refundError = e?.error?.description ?? e?.message ?? "Unknown error";
    // Already fully refunded by the other path: that's a success, not a failure.
    if (/fully refunded|already been refunded|exceeds/i.test(refundError)) {
      return true;
    }
    console.error("Orphan payment refund failed", paymentId, err);
  }
  await sendLatePaymentAlert({ razorpayOrderId, paymentId, refunded, refundError });
  return refunded;
}
