/* Checkout timing, shared by the server (lib/reservations.ts) and the
   browser (Razorpay modal timeout). Kept import-free so client code can use
   it without pulling in server-only modules. */

// Unpaid (pending/failed) reservations older than this release their link.
export const RESERVATION_TTL_MINUTES = 30;

// Razorpay's modal closes itself after this, well inside the TTL, so an
// abandoned tab can't normally be paid after its reservation is released.
export const CHECKOUT_TIMEOUT_SECONDS = 15 * 60;
