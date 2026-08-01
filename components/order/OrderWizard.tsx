"use client";

import { useEffect, useState } from "react";
import type { ShippingPaymentValues } from "@/lib/validations";
import OrderStepIdentity from "./OrderStepIdentity";
import OrderStepShippingPayment, { type IdentityData } from "./OrderStepShippingPayment";

const STEPS = ["Your identity", "Shipping & payment"] as const;

const DRAFT_KEY = "unitouch:order-draft";

type OrderDraft = {
  step: 1 | 2;
  identity: IdentityData | null;
  shipping: Partial<ShippingPaymentValues> | null;
};

export default function OrderWizard({ defaultCardType }: { defaultCardType?: string }) {
  const [step, setStep] = useState<1 | 2>(1);
  const [identity, setIdentity] = useState<IdentityData | null>(null);
  const [shipping, setShipping] = useState<Partial<ShippingPaymentValues> | null>(null);
  /* Not persisted — a File can't be serialized and a 5MB base64 blob would
     blow the sessionStorage quota. On a restored draft the customer re-picks
     the image; everything else survives. */
  const [logoFile, setLogoFile] = useState<File | null>(null);
  const [hydrated, setHydrated] = useState(false);

  /* Restore after mount, not in a lazy initializer — reading sessionStorage
     during render would desync server/client HTML. */
  useEffect(() => {
    try {
      const saved = sessionStorage.getItem(DRAFT_KEY);
      if (saved) {
        const draft = JSON.parse(saved) as OrderDraft;
        if (draft.identity) setIdentity(draft.identity);
        if (draft.shipping) setShipping(draft.shipping);
        // Step 2 needs identity; without it, fall back to step 1.
        if (draft.step === 2 && draft.identity) setStep(2);
      }
    } catch {
      // Corrupt or unavailable storage — start fresh.
    }
    setHydrated(true);
  }, []);

  /* Guarded on `hydrated` so initial empty state can't clobber a saved draft
     before the restore effect runs. */
  useEffect(() => {
    if (!hydrated) return;
    try {
      sessionStorage.setItem(DRAFT_KEY, JSON.stringify({ step, identity, shipping }));
    } catch {
      // Persistence is a convenience, not required.
    }
  }, [hydrated, step, identity, shipping]);

  function clearDraft() {
    try {
      sessionStorage.removeItem(DRAFT_KEY);
    } catch {
      // The draft expires with the tab session anyway.
    }
  }

  return (
    <div>
      <div className="mb-10 flex w-full max-w-full items-center gap-2 overflow-hidden sm:gap-3">
        {STEPS.map((label, i) => {
          const stepNumber = i + 1;
          const active = stepNumber === step;
          const done = stepNumber < step;
          return (
            <div key={label} className="flex min-w-0 flex-1 items-center gap-2 sm:gap-3">
              <div className="flex min-w-0 items-center gap-2">
                <span
                  className={`flex size-7 shrink-0 items-center justify-center rounded-full text-xs font-[600] ${
                    active || done ? "bg-accent-purple text-bg-base" : "bg-bg-elevated text-text-muted"
                  }`}
                >
                  {stepNumber}
                </span>
                <span
                  className={`hidden truncate text-sm sm:inline sm:whitespace-nowrap ${active ? "text-text-primary" : "text-text-muted"}`}
                >
                  {label}
                </span>
              </div>
              {stepNumber < STEPS.length && <div className="bg-bg-border h-px min-w-4 flex-1" />}
            </div>
          );
        })}
      </div>

      {step === 1 && (
        <OrderStepIdentity
          defaultValues={identity ?? undefined}
          logoFile={logoFile}
          onLogoChange={setLogoFile}
          onContinue={(values) => {
            setIdentity(values);
            setStep(2);
          }}
        />
      )}

      {step === 2 && identity && (
        <OrderStepShippingPayment
          identity={identity}
          logoFile={logoFile}
          defaultCardType={defaultCardType}
          defaultValues={shipping ?? undefined}
          onBack={() => setStep(1)}
          onDraftChange={setShipping}
          onComplete={clearDraft}
        />
      )}
    </div>
  );
}
