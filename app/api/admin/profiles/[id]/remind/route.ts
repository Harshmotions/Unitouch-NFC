import { NextResponse } from "next/server";
import { verifyOrigin } from "@/lib/csrf";
import { getAdminUser } from "@/lib/admin";
import { profileWriteLimiter, rateLimitOrResponse } from "@/lib/rate-limit";
import { sendDraftReminderNow } from "@/lib/draft-reminders";

/* Admin: email the customer now that their paid profile is still a draft. */
export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }) {
  if (!verifyOrigin(request)) {
    return NextResponse.json({ error: "Invalid request origin." }, { status: 403 });
  }
  const user = await getAdminUser();
  if (!user) {
    return NextResponse.json({ error: "Your admin session expired. Please sign in again." }, { status: 401 });
  }
  const limited = await rateLimitOrResponse(profileWriteLimiter, user.id);
  if (limited) return limited;

  const { id } = await params;
  const result = await sendDraftReminderNow(id);
  if (!result.ok) return NextResponse.json({ error: result.error }, { status: 400 });
  return NextResponse.json(result);
}
