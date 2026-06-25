"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { orderFormSchema, type OrderFormValues } from "@/lib/validations";
import { CARD_VARIANTS } from "@/lib/pricing";
import Input from "@/components/ui/Input";
import Label from "@/components/ui/Label";
import Button from "@/components/ui/Button";

export default function OrderForm({ defaultCardType }: { defaultCardType?: string }) {
  const router = useRouter();
  const [submitError, setSubmitError] = useState<string | null>(null);

  const initialCardType = CARD_VARIANTS.some((v) => v.id === defaultCardType)
    ? (defaultCardType as OrderFormValues["cardType"])
    : "standard";

  const {
    register,
    handleSubmit,
    watch,
    setValue,
    formState: { errors, isSubmitting },
  } = useForm<OrderFormValues>({
    resolver: zodResolver(orderFormSchema),
    defaultValues: { cardType: initialCardType, quantity: 1 },
  });

  const selectedCardType = watch("cardType");

  async function onSubmit(values: OrderFormValues) {
    setSubmitError(null);
    const res = await fetch("/api/orders", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(values),
    });
    const data = await res.json();

    if (!res.ok) {
      setSubmitError(data.error ?? "Something went wrong, please try again.");
      return;
    }

    router.push(`/order/success?orderNumber=${data.orderNumber}`);
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-8">
      <div>
        <Label>Choose your card</Label>
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
          {CARD_VARIANTS.map((variant) => (
            <button
              key={variant.id}
              type="button"
              onClick={() => setValue("cardType", variant.id)}
              className={`rounded-xl p-4 text-left transition-colors ${
                selectedCardType === variant.id ? "surface-card-accent" : "surface-card"
              }`}
            >
              <p className="text-text-primary font-[600]">{variant.name}</p>
              <p className="text-text-secondary text-sm">₹{variant.price.toLocaleString("en-IN")}</p>
            </button>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
        <div>
          <Label htmlFor="fullName">Full name</Label>
          <Input id="fullName" {...register("fullName")} placeholder="Your name" />
          {errors.fullName && <p className="text-error mt-1.5 text-xs">{errors.fullName.message}</p>}
        </div>
        <div>
          <Label htmlFor="phone">Phone</Label>
          <Input id="phone" {...register("phone")} placeholder="+91 98765 43210" />
          {errors.phone && <p className="text-error mt-1.5 text-xs">{errors.phone.message}</p>}
        </div>
        <div className="sm:col-span-2">
          <Label htmlFor="email">Email</Label>
          <Input id="email" type="email" {...register("email")} placeholder="you@example.com" />
          {errors.email && <p className="text-error mt-1.5 text-xs">{errors.email.message}</p>}
        </div>
        <div>
          <Label htmlFor="quantity">Quantity</Label>
          <Input id="quantity" type="number" min={1} max={50} {...register("quantity")} />
          {errors.quantity && <p className="text-error mt-1.5 text-xs">{errors.quantity.message}</p>}
        </div>
      </div>

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

      {submitError && <p className="text-error text-sm">{submitError}</p>}

      <Button variant="primary" size="lg" disabled={isSubmitting} loading={isSubmitting} className="w-full">
        {isSubmitting ? "Placing your order…" : "Place Order"}
      </Button>
      <p className="text-text-muted -mt-4 text-center text-xs">
        Online payment isn&apos;t live yet. After you submit, our team will reach out to arrange payment.
      </p>
    </form>
  );
}
