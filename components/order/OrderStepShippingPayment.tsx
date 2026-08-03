"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { ShieldCheck } from "lucide-react";
import { shippingPaymentSchema, type ShippingPaymentValues } from "@/lib/validations";
import { CARD_VARIANTS } from "@/lib/pricing";
import Input from "@/components/ui/Input";
import Label from "@/components/ui/Label";
import Button from "@/components/ui/Button";

export interface IdentityData {
  accountType: "personal" | "business";
  displayName: string;
  username: string;
  userId: string;
  email: string;
}

/* Step 2 — the transaction commitment phase. Card + quantity, contact phone,
   shipping address, then a (mock) payment that POSTs to the checkout route,
   which writes the order + placeholder profile atomically. */
export default function OrderStepShippingPayment({
  identity,
  logoFile,
  defaultCardType,
  defaultValues,
  onBack,
  onDraftChange,
  onComplete,
}: {
  identity: IdentityData;
  logoFile: File | null;
  defaultCardType?: string;
  defaultValues?: Partial<ShippingPaymentValues>;
  onBack: () => void;
  onDraftChange?: (values: Partial<ShippingPaymentValues>) => void;
  onComplete?: () => void;
}) {
  const router = useRouter();
  const [paying, setPaying] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const initialCardType = CARD_VARIANTS.some((v) => v.id === (defaultValues?.cardType ?? defaultCardType))
    ? ((defaultValues?.cardType ?? defaultCardType) as ShippingPaymentValues["cardType"])
    : "standard";

  const {
    register,
    handleSubmit,
    watch,
    setValue,
    formState: { errors },
  } = useForm<ShippingPaymentValues>({
    resolver: zodResolver(shippingPaymentSchema),
    defaultValues: { ...defaultValues, cardType: initialCardType, quantity: defaultValues?.quantity ?? 1 },
  });

  // Keep the wizard's draft in sync so a refresh mid-step doesn't lose input.
  useEffect(() => {
    if (!onDraftChange) return;
    const sub = watch((values) => onDraftChange(values as Partial<ShippingPaymentValues>));
    return () => sub.unsubscribe();
  }, [watch, onDraftChange]);

  const selectedCardType = watch("cardType");
  const quantity = Number(watch("quantity")) || 1;
  const variant = CARD_VARIANTS.find((v) => v.id === selectedCardType) ?? CARD_VARIANTS[0];
  const total = variant.price * quantity;

  async function handlePay(values: ShippingPaymentValues) {
    setError(null);
    setPaying(true);

    // Stand-in for the real Razorpay checkout — simulates a successful charge.
    await new Promise((resolve) => setTimeout(resolve, 1200));

    const form = new FormData();
    form.set(
      "identity",
      JSON.stringify({
        accountType: identity.accountType,
        displayName: identity.displayName,
        username: identity.username,
      }),
    );
    form.set("shippingPayment", JSON.stringify(values));
    if (logoFile) form.set("logo", logoFile);

    try {
      const res = await fetch("/api/orders/checkout", { method: "POST", body: form });
      const data = await res.json().catch(() => null);
      if (!res.ok) {
        setPaying(false);
        setError(data?.error ?? "Something went wrong, please try again.");
        return;
      }
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
    <form onSubmit={handleSubmit(handlePay)} className="flex flex-col gap-8">
      {/* Card selection */}
      <div>
        <Label>Choose your card</Label>
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          {CARD_VARIANTS.map((v) => (
            <button
              key={v.id}
              type="button"
              onClick={() => setValue("cardType", v.id)}
              className={`flex flex-col rounded-xl p-4 text-left transition-colors ${
                selectedCardType === v.id ? "surface-card-accent" : "surface-card"
              }`}
            >
              <p className="text-text-primary font-[600]">{v.name}</p>
              <p className="text-text-secondary text-sm">₹{v.price.toLocaleString("en-IN")}</p>
              <ul className="text-text-muted mt-3 flex flex-col gap-1 text-xs">
                {v.features.map((f) => (
                  <li key={f}>{f}</li>
                ))}
              </ul>
            </button>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
        <div>
          <Label htmlFor="phone">Phone</Label>
          <Input id="phone" {...register("phone")} placeholder="+91 98765 43210" />
          {errors.phone && <p className="text-error mt-1.5 text-xs">{errors.phone.message}</p>}
        </div>
        <div>
          <Label htmlFor="quantity">Quantity</Label>
          <Input id="quantity" type="number" min={1} max={50} {...register("quantity")} />
          {errors.quantity && <p className="text-error mt-1.5 text-xs">{errors.quantity.message}</p>}
        </div>
      </div>

      {/* Shipping */}
      <div>
        <p className="text-text-primary mb-4 font-[600]">Shipping address</p>
        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
          <div className="sm:col-span-2">
            <Label htmlFor="line1">Address line 1</Label>
            <Input id="line1" {...register("line1")} placeholder="House no., street" />
            {errors.line1 && <p className="text-error mt-1.5 text-xs">{errors.line1.message}</p>}
          </div>
          <div className="sm:col-span-2">
            <Label htmlFor="line2">Address line 2 (optional)</Label>
            <Input id="line2" {...register("line2")} placeholder="Landmark, area" />
          </div>
          <div>
            <Label htmlFor="city">City</Label>
            <Input id="city" {...register("city")} placeholder="Mumbai" />
            {errors.city && <p className="text-error mt-1.5 text-xs">{errors.city.message}</p>}
          </div>
          <div>
            <Label htmlFor="state">State</Label>
            <Input id="state" {...register("state")} placeholder="Maharashtra" />
            {errors.state && <p className="text-error mt-1.5 text-xs">{errors.state.message}</p>}
          </div>
          <div>
            <Label htmlFor="pincode">Pincode</Label>
            <Input id="pincode" {...register("pincode")} placeholder="400001" />
            {errors.pincode && <p className="text-error mt-1.5 text-xs">{errors.pincode.message}</p>}
          </div>
        </div>
      </div>

      <div>
        <Label htmlFor="additionalNotes">Notes (optional)</Label>
        <textarea
          id="additionalNotes"
          {...register("additionalNotes")}
          rows={3}
          placeholder="Anything else we should know?"
          className="border-bg-border bg-bg-elevated text-text-primary placeholder:text-text-muted w-full resize-none rounded-xl border px-4 py-3 text-sm outline-none transition-colors focus:border-accent-purple/50"
        />
      </div>

      {/* Summary */}
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
        <Button variant="primary" size="lg" type="submit" loading={paying} disabled={paying} className="sm:ml-auto">
          <ShieldCheck className="size-4" />
          {paying ? "Processing…" : `Pay ₹${total.toLocaleString("en-IN")} (Test Payment)`}
        </Button>
      </div>
    </form>
  );
}
