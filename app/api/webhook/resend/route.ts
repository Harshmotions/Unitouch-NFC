import { NextResponse } from "next/server";
import { Resend } from "resend";
import { handleResendEvent, type ResendEmailEvent } from "@/lib/email-bounces";

/* Resend webhook: email.bounced / email.complained (configured in the Resend
   dashboard -> Webhooks, pointing at https://www.unitouch.in/api/webhook/resend).

   Server-to-server, so NOT lib/csrf.ts (there's no browser Origin); it's
   authenticated by the signature over the raw body instead, checked with
   RESEND_WEBHOOK_SECRET (the "whsec_..." signing secret Resend shows for the
   webhook). Without that env var every call is refused. What each event
   does lives in lib/email-bounces.ts. */
export async function POST(request: Request) {
  const secret = process.env.RESEND_WEBHOOK_SECRET;
  if (!secret) {
    console.error("Resend webhook: RESEND_WEBHOOK_SECRET is not set");
    return NextResponse.json({ error: "Not configured" }, { status: 503 });
  }

  const payload = await request.text();
  let event: ResendEmailEvent;
  try {
    // verify() is offline (signature check only); the API key isn't used.
    const resend = new Resend(process.env.RESEND_API_KEY || "re_unused");
    event = resend.webhooks.verify({
      payload,
      headers: {
        id: request.headers.get("svix-id") ?? "",
        timestamp: request.headers.get("svix-timestamp") ?? "",
        signature: request.headers.get("svix-signature") ?? "",
      },
      webhookSecret: secret,
    }) as ResendEmailEvent;
  } catch {
    return NextResponse.json({ error: "Invalid signature" }, { status: 400 });
  }

  try {
    const result = await handleResendEvent(event);
    return NextResponse.json({ ok: true, ...result });
  } catch (err) {
    console.error("Resend webhook: handling failed", err);
    // 500 so Resend retries.
    return NextResponse.json({ error: "Handling failed" }, { status: 500 });
  }
}
