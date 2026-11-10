"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { shippingPaymentSchema, type ShippingPaymentValues } from "@/lib/validations";
import { CARD_VARIANTS } from "@/lib/pricing";
import { CARD_COLORS, DEFAULT_CARD_COLOR, cardColorLabel, isCardColor, type CardColor } from "@/lib/card-colors";
import { CardPreview } from "@/components/card/CardArt";
import { CHECKOUT_TIMEOUT_SECONDS } from "@/lib/checkout-config";
import { loadRazorpayCheckout, openRazorpayCheckout } from "@/lib/razorpay/checkout";
import Input from "@/components/ui/Input";
import Label from "@/components/ui/Label";
import Button from "@/components/ui/Button";
import ProgressNotice from "@/components/ui/ProgressNotice";
import PaymentButton from "./PaymentButton";

const POLICY_LINKS = [
  { href: "/terms", label: "Terms of Service" },
  { href: "/refunds", label: "Cancellation and Refund Policy" },
  { href: "/shipping", label: "Shipping and Delivery Policy" },
  { href: "/privacy", label: "Privacy Policy" },
];

export interface IdentityData {
  accountType: "personal" | "business";
  displayName: string;
  username: string;
  // Typed at checkout (guest-only); the key for claiming the profile later.
  email: string;
}

/* Where the pay flow is, so every slow step tells the customer what's
   happening instead of sitting on a bare spinner:
     creating  — create-order: reserve username, upload image, Razorpay order
     opening   — loading/opening Razorpay's modal
     checkout  — the Razorpay modal is open (its own UI takes over)
     verifying — payment done; confirming the signature, then navigating to
                 the success page. Full-screen and never reset on success, so
                 nothing looks frozen until the next page replaces it. */
type PayStage = "idle" | "creating" | "opening" | "checkout" | "verifying";

/* Step 2 — the transaction commitment phase. Card + quantity, contact phone,
   shipping address, then a Razorpay payment (create-order -> modal ->
   verify). */
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
  const [stage, setStage] = useState<PayStage>("idle");
  const paying = stage !== "idle";
  const [error, setError] = useState<string | null>(null);

  /* Warm up the slow parts before the customer clicks Pay: Razorpay's
     checkout.js (~100KB from their CDN, previously only fetched after the
     order was created) and the success page. Failures here are harmless;
     handlePay loads checkout.js again and reports a real error. */
  useEffect(() => {
    loadRazorpayCheckout().catch(() => {});
    router.prefetch("/order/success");
  }, [router]);

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
    defaultValues: {
      ...defaultValues,
      cardType: initialCardType,
      cardColor: isCardColor(defaultValues?.cardColor) ? defaultValues.cardColor : DEFAULT_CARD_COLOR,
      quantity: defaultValues?.quantity ?? 1,
    },
  });
  const [previewSide, setPreviewSide] = useState<"front" | "back">("front");

  // Keep the wizard's draft in sync so a refresh mid-step doesn't lose input.
  useEffect(() => {
    if (!onDraftChange) return;
    const sub = watch((values) => onDraftChange(values as Partial<ShippingPaymentValues>));
    return () => sub.unsubscribe();
  }, [watch, onDraftChange]);

  const selectedCardType = watch("cardType");
  const selectedColor = (isCardColor(watch("cardColor")) ? watch("cardColor") : DEFAULT_CARD_COLOR) as CardColor;
  const quantity = Number(watch("quantity")) || 1;
  const variant = CARD_VARIANTS.find((v) => v.id === selectedCardType) ?? CARD_VARIANTS[0];
  const total = variant.price * quantity;

  async function handlePay(values: ShippingPaymentValues) {
    setError(null);
    setStage("creating");

    const form = new FormData();
    form.set(
      "identity",
      JSON.stringify({
        accountType: identity.accountType,
        displayName: identity.displayName,
        email: identity.email,
        username: identity.username,
      }),
    );
    form.set("shippingPayment", JSON.stringify(values));
    if (logoFile) form.set("logo", logoFile);

    try {
      // 1. Create the order server-side. This reserves the username, uploads
      //    the image, and creates the (pending) Razorpay order. Nothing is
      //    charged yet and no order is marked paid.
      const res = await fetch("/api/razorpay/create-order", { method: "POST", body: form });
      const data = await res.json().catch(() => null);
      if (!res.ok) {
        setStage("idle");
        setError(data?.error ?? "Something went wrong, please try again.");
        return;
      }

      // 2. Load Razorpay's hosted checkout (usually already preloaded) and
      //    open the payment modal.
      setStage("opening");
      await loadRazorpayCheckout();
      setStage("checkout");

      openRazorpayCheckout({
        key: data.keyId,
        amount: data.amount,
        currency: data.currency,
        order_id: data.razorpayOrderId,
        name: "Unitouch",
        description: `${variant.name} NFC card, ${cardColorLabel(selectedColor).toLowerCase()} × ${quantity}`,
        prefill: data.prefill,
        theme: { color: "#8b5cff" },
        // Close the window well before the unpaid reservation is released
        // (lib/reservations.ts), so an abandoned tab can't pay late.
        timeout: CHECKOUT_TIMEOUT_SECONDS,
        // 3. On a successful payment, verify the signature server-side before
        //    trusting it. The order is only marked paid once /verify (or the
        //    webhook) confirms the HMAC.
        handler: async (response) => {
          setStage("verifying");
          try {
            const verifyRes = await fetch("/api/razorpay/verify", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({
                razorpay_order_id: response.razorpay_order_id,
                razorpay_payment_id: response.razorpay_payment_id,
                razorpay_signature: response.razorpay_signature,
              }),
            });
            const verifyData = await verifyRes.json().catch(() => null);
            if (!verifyRes.ok) {
              setStage("idle");
              setError(
                verifyData?.error ??
                  "We couldn't confirm your payment. If you were charged, please contact support.",
              );
              return;
            }
            onComplete?.();
            router.push(
              `/order/success?orderNumber=${encodeURIComponent(data.orderNumber)}&username=${encodeURIComponent(data.username)}`,
            );
          } catch {
            setStage("idle");
            setError("We couldn't confirm your payment. If you were charged, please contact support.");
          }
        },
        // Customer closed the modal without paying — re-enable the button. The
        // pending order simply expires; nothing was charged.
        modal: {
          // Never undo the verifying overlay if a close event arrives late.
          ondismiss: () => setStage((current) => (current === "verifying" ? current : "idle")),
        },
      });
    } catch (err) {
      setStage("idle");
      setError(
        err instanceof Error ? err.message : "We couldn't reach the server. Check your connection and try again.",
      );
    }
  }

  return (
    <form onSubmit={handleSubmit(handlePay)} className="flex flex-col gap-8">
      {/* Card selection */}
      <div>
        <Label>Choose your card</Label>
        {/* Live preview: their name on the chosen colour and finish, and the
            real QR code to their profile link on the back. */}
        <div className="mx-auto mb-3 flex w-full max-w-md flex-col items-center gap-3 px-2 pt-2 pb-4">
          <CardPreview
            name={identity.displayName}
            title="What you do"
            link={`https://www.unitouch.in/u/${identity.username}`}
            color={selectedColor}
            finish={variant.id}
            side={previewSide}
          />
          <div className="bg-bg-elevated inline-flex rounded-full p-1 text-[0.8125rem]" role="group" aria-label="Card side">
            {(["front", "back"] as const).map((s) => (
              <button
                key={s}
                type="button"
                aria-pressed={previewSide === s}
                onClick={() => setPreviewSide(s)}
                className={`rounded-full px-3.5 py-1 font-[500] capitalize transition-colors ${
                  previewSide === s ? "bg-bg-ink text-text-on-ink" : "text-text-secondary hover:text-text-primary"
                }`}
              >
                {s}
              </button>
            ))}
          </div>
          <p className="text-text-muted text-center text-xs">
            A preview. Our team finishes your design with you before anything is printed.
          </p>
        </div>

        <div className="mb-4">
          <p className="text-text-primary mb-2 text-sm font-[600]">Card colour</p>
          <div className="grid grid-cols-2 gap-3" role="radiogroup" aria-label="Card colour">
            {CARD_COLORS.map((c) => (
              <button
                key={c.id}
                type="button"
                role="radio"
                aria-checked={selectedColor === c.id}
                onClick={() => setValue("cardColor", c.id)}
                className={`flex items-center gap-3 rounded-xl p-3 text-left transition-colors ${
                  selectedColor === c.id ? "surface-card-accent" : "surface-card"
                }`}
              >
                <span
                  aria-hidden
                  className={`h-7 w-11 shrink-0 rounded-[5px] ${
                    c.id === "white"
                      ? "bg-[#f7f5f1] shadow-[inset_0_0_0_1px_rgba(20,18,16,0.18)]"
                      : "bg-[#161616]"
                  }`}
                />
                <span>
                  <span className="text-text-primary block text-sm font-[600]">{c.label}</span>
                  <span className="text-text-muted block text-xs">{c.description}</span>
                </span>
              </button>
            ))}
          </div>
        </div>
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
          className="border-bg-border bg-bg-elevated text-text-primary placeholder:text-text-muted w-full resize-none rounded-xl border px-4 py-3 text-sm outline-none transition-colors focus:border-accent/50"
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
        <div className="text-text-secondary mt-2 flex justify-between text-sm">
          <span>Shipping (India)</span>
          <span>Free</span>
        </div>
        <div className="mt-4 flex justify-between border-t border-bg-border pt-4">
          <span className="text-text-primary font-[600]">Total</span>
          <span className="text-text-primary font-[600]">₹{total.toLocaleString("en-IN")}</span>
        </div>
      </div>

      <div className="surface-card rounded-2xl p-5">
        <p className="text-text-muted text-sm">
          Payments are processed securely by Razorpay. Your card and profile are created only after
          your payment is confirmed.
        </p>
      </div>

      {/* Policies open in a new tab so the half-filled form (and the picked
          logo, which isn't persisted) survives. */}
      <p className="text-text-muted text-xs leading-relaxed">
        By placing this order, you agree to our{" "}
        {POLICY_LINKS.map(({ href, label }, i) => (
          <span key={href}>
            <a href={href} target="_blank" rel="noopener noreferrer" className="text-accent hover:underline">
              {label}
            </a>
            {i < POLICY_LINKS.length - 2 ? ", " : i === POLICY_LINKS.length - 2 ? ", and " : "."}
          </span>
        ))}
      </p>

      {error && <p className="text-error text-sm">{error}</p>}

      <div className="flex flex-col gap-3 sm:flex-row">
        <Button type="button" variant="ghost" size="lg" onClick={onBack} disabled={paying}>
          Back
        </Button>
        <PaymentButton total={total} paying={paying} />
      </div>

      {stage === "creating" && (
        <ProgressNotice
          title="Reserving your profile link and preparing secure payment…"
          hint="This usually takes a few seconds, a little longer if you added a photo. Please keep this tab open."
        />
      )}
      {(stage === "opening" || stage === "checkout") && (
        <ProgressNotice
          title="Opening Razorpay secure checkout…"
          hint="Complete the payment in the Razorpay window. Closing it cancels the payment and nothing is charged."
        />
      )}
      {stage === "verifying" && (
        <ProgressNotice
          overlay
          title="Confirming your payment…"
          hint="Your payment went through. We're verifying it with Razorpay and preparing your order. Please don't close or refresh this tab."
        />
      )}
    </form>
  );
}
