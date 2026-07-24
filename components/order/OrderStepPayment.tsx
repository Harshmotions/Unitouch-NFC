"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { ShieldCheck } from "lucide-react";
import type { OrderDetailsValues, ProfileSetupValues } from "@/lib/validations";
import { CARD_VARIANTS } from "@/lib/pricing";
import Button from "@/components/ui/Button";

export default function OrderStepPayment({
  orderDetails,
  profileSetup,
  photoFile,
  onBack,
  onComplete,
}: {
  orderDetails: OrderDetailsValues;
  profileSetup: ProfileSetupValues;
  photoFile: File | null;
  onBack: () => void;
  onComplete?: () => void;
}) {
  const router = useRouter();
  const [paying, setPaying] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const variant = CARD_VARIANTS.find((v) => v.id === orderDetails.cardType)!;
  const quantity = Number(orderDetails.quantity) || 1;
  const total = variant.price * quantity;

  async function handleMockPay() {
    setError(null);
    setPaying(true);

    // Stand-in for the real Razorpay checkout — no gateway is wired up yet.
    // Simulates the round-trip delay, then "succeeds" every time.
    await new Promise((resolve) => setTimeout(resolve, 1200));
    console.log("[MOCK PAYMENT] success", {
      cardType: orderDetails.cardType,
      quantity,
      amount: total,
      username: profileSetup.username,
      paidAt: new Date().toISOString(),
    });

    const form = new FormData();
    form.set("orderDetails", JSON.stringify(orderDetails));
    form.set("profileSetup", JSON.stringify(profileSetup));
    if (photoFile) form.set("photo", photoFile);

    /* A network drop or a non-JSON error response (e.g. an HTML 502 from the
       host) both reject here. Without this catch the spinner stays on
       forever and the customer has to reload and refill all three steps. */
    try {
      const res = await fetch("/api/orders/checkout", { method: "POST", body: form });
      const data = await res.json().catch(() => null);

      if (!res.ok) {
        setPaying(false);
        setError(data?.error ?? "Something went wrong, please try again.");
        return;
      }

      // Only drop the saved draft once the order is safely persisted.
      onComplete?.();
      router.push(
        `/order/success?orderNumber=${encodeURIComponent(data.orderNumber)}&username=${encodeURIComponent(data.username)}`,
      );
    } catch {
      setPaying(false);
      setError("We couldn't reach the server. Check your connection and try again.");
    }
  }

  return (
    <div className="flex flex-col gap-8">
      <div className="surface-card rounded-2xl p-5">
        <p className="text-text-primary mb-4 font-[600]">Order summary</p>
        <div className="text-text-secondary flex justify-between text-sm">
          <span>
            {variant.name} × {quantity}
          </span>
          <span>₹{total.toLocaleString("en-IN")}</span>
        </div>
        <div className="mt-4 flex justify-between border-t border-white/10 pt-4">
          <span className="text-text-primary font-[600]">Total</span>
          <span className="text-text-primary font-[600]">₹{total.toLocaleString("en-IN")}</span>
        </div>
      </div>

      <div className="surface-card rounded-2xl p-5">
        <p className="text-text-muted text-sm">
          Razorpay checkout isn&apos;t wired up yet. This test button simulates a successful payment so
          the order and profile creation can be verified end to end.
        </p>
      </div>

      {error && <p className="text-error text-sm">{error}</p>}

      <div className="flex flex-col gap-3 sm:flex-row">
        <Button type="button" variant="ghost" size="lg" onClick={onBack} disabled={paying}>
          Back
        </Button>
        <Button
          variant="primary"
          size="lg"
          type="button"
          onClick={handleMockPay}
          loading={paying}
          disabled={paying}
          className="sm:ml-auto"
        >
          <ShieldCheck className="size-4" />
          {paying ? "Processing…" : `Pay ₹${total.toLocaleString("en-IN")} (Test Payment)`}
        </Button>
      </div>
    </div>
  );
}
