import { createServiceRoleClient } from "@/lib/supabase/server";
import { sendEmailProblemAlert } from "@/lib/email";
import { BUSINESS } from "@/lib/business";

/* What to do with a verified Resend webhook event (app/api/webhook/resend).

   - email.bounced, PERMANENT (address doesn't exist, domain rejects it):
     flag every paid order placed with that address (orders.email_bounced_at
     + reason; admin shows "Email bounced, contact by phone") and alert the
     admin inbox.
   - email.bounced, temporary (inbox full, server busy): Resend already
     retried; just log it, the next email may well arrive.
   - email.complained (customer marked us as spam): alert the admin inbox,
     no flag (the address works).
   Emails to our own inboxes are ignored, and so are addresses with no paid
   order (e.g. a login code to a mistyped address): nothing to contact. */

export interface ResendEmailEvent {
  type: string;
  data?: {
    email_id?: string;
    to?: string[];
    subject?: string;
    bounce?: { type?: string; subType?: string; message?: string };
  };
}

type OrderContact = { id: string; orderNumber: string; fullName: string; phone: string };

export async function handleResendEvent(event: ResendEmailEvent): Promise<{ handled: boolean; note: string }> {
  const kind = event.type === "email.bounced" ? "bounced" : event.type === "email.complained" ? "complained" : null;
  if (!kind || !event.data) return { handled: false, note: `ignored ${event.type}` };

  const bounce = event.data.bounce;
  if (kind === "bounced" && bounce?.type !== "Permanent") {
    console.log("Resend: temporary bounce, not flagged", event.data.email_id, bounce?.type, bounce?.subType);
    return { handled: false, note: "temporary bounce" };
  }

  const ours = new Set([BUSINESS.adminEmail, BUSINESS.email].map((e) => e.toLowerCase()));
  const recipients = (event.data.to ?? []).map((e) => e.trim().toLowerCase()).filter((e) => e && !ours.has(e));
  const reason = [bounce?.subType, bounce?.message].filter(Boolean).join(": ") || undefined;
  const supabase = createServiceRoleClient();

  for (const recipient of recipients) {
    const { data, error } = await supabase
      .from("orders")
      .select("id, order_number, full_name, phone")
      .eq("email", recipient)
      .eq("payment_status", "paid");
    if (error) {
      // Throwing makes the route answer 500, so Resend retries later.
      throw new Error(`orders lookup failed: ${error.message}`);
    }
    const orders: OrderContact[] = (data ?? []).map((o) => ({
      id: o.id as string,
      orderNumber: o.order_number as string,
      fullName: o.full_name as string,
      phone: o.phone as string,
    }));
    if (!orders.length) {
      console.log(`Resend: ${kind} for an address with no paid order, ignored`, event.data.email_id);
      continue;
    }

    if (kind === "bounced") {
      const { error: flagError } = await supabase
        .from("orders")
        .update({ email_bounced_at: new Date().toISOString(), email_bounce_reason: reason?.slice(0, 500) ?? null })
        .in("id", orders.map((o) => o.id))
        .is("email_bounced_at", null);
      // Most likely the column isn't there yet (supabase/schema.sql upgrade
      // not run): still alert the admin inbox below.
      if (flagError) console.error("Resend: could not flag bounced orders", flagError.message);
    }

    await sendEmailProblemAlert({
      emailId: event.data.email_id ?? "unknown",
      kind,
      recipient,
      emailSubject: event.data.subject ?? "(no subject)",
      reason,
      orders,
    });
  }
  return { handled: true, note: `${kind} for ${recipients.length} recipient(s)` };
}
