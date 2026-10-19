import { NextResponse } from "next/server";
import { verifyOrigin } from "@/lib/csrf";
import { getAdminUser } from "@/lib/admin";
import { profileWriteLimiter, rateLimitOrResponse } from "@/lib/rate-limit";
import { resendOrderConfirmation } from "@/lib/email";

/* Admin: email the order confirmation to the customer again ("I never got
   it"). Paid orders only, customer only; at most one send per order per
   minute (see resendOrderConfirmation). Awaited, not after(), so the admin
   sees whether it actually went out. */
export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }) {
  if (!verifyOrigin(request)) {
    return NextResponse.json({ error: "Invalid request origin." }, { status: 403 });
  }
  const admin = await getAdminUser();
  if (!admin) {
    return NextResponse.json({ error: "Your admin session expired. Please sign in again." }, { status: 401 });
  }
  const limited = await rateLimitOrResponse(profileWriteLimiter, admin.id);
  if (limited) return limited;

  const { id } = await params;
  const result = await resendOrderConfirmation(id);
  if (!result.ok) {
    return NextResponse.json({ error: result.error }, { status: 400 });
  }
  return NextResponse.json({ ok: true, sentTo: result.sentTo });
}
