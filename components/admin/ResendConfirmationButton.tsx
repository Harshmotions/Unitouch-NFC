"use client";

import { useState } from "react";
import Button from "@/components/ui/Button";

/* Admin order page: send the order confirmation email to the customer again.
   Asks first; warns when this address already bounced (calling is better). */
export default function ResendConfirmationButton({
  orderId,
  email,
  bounced,
}: {
  orderId: string;
  email: string;
  bounced: boolean;
}) {
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState<{ kind: "ok" | "error"; text: string } | null>(null);

  async function resend() {
    const question = bounced
      ? `An earlier email to ${email} bounced, so this one probably won't arrive either. Calling the customer is better. Send anyway?`
      : `Email the order confirmation to ${email} again?`;
    if (!window.confirm(question)) return;

    setBusy(true);
    setMessage(null);
    try {
      const res = await fetch(`/api/admin/orders/${orderId}/resend-confirmation`, { method: "POST" });
      const data = await res.json().catch(() => null);
      setMessage(
        res.ok
          ? { kind: "ok", text: `Sent to ${data?.sentTo ?? email}.` }
          : { kind: "error", text: data?.error ?? "Couldn't send. Please try again." },
      );
    } catch {
      setMessage({ kind: "error", text: "We couldn't reach the server. Check your connection and try again." });
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="flex flex-col gap-2">
      <Button variant="ghost" size="md" type="button" onClick={resend} loading={busy} disabled={busy}>
        Resend confirmation email
      </Button>
      <p className="text-text-muted text-xs">
        Sends the customer their order confirmation again. Only the customer gets it.
      </p>
      {message && <p className={`text-sm ${message.kind === "ok" ? "text-success" : "text-error"}`}>{message.text}</p>}
    </div>
  );
}
