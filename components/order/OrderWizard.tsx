"use client";

import { useEffect, useState } from "react";
import type { OrderDetailsValues, ProfileSetupValues } from "@/lib/validations";
import OrderStepDetails from "./OrderStepDetails";
import OrderStepProfile from "./OrderStepProfile";
import OrderStepPayment from "./OrderStepPayment";

const STEPS = ["Order details", "Profile setup", "Payment"] as const;

const DRAFT_KEY = "unitouch:order-draft";

type OrderDraft = {
  step: 1 | 2 | 3;
  orderDetails: OrderDetailsValues | null;
  profileSetup: ProfileSetupValues | null;
};

export default function OrderWizard({ defaultCardType }: { defaultCardType?: string }) {
  const [step, setStep] = useState<1 | 2 | 3>(1);
  const [orderDetails, setOrderDetails] = useState<OrderDetailsValues | null>(null);
  const [profileSetup, setProfileSetup] = useState<ProfileSetupValues | null>(null);
  /* Deliberately not persisted — a File can't be serialized, and inlining a
     photo of up to 5MB as base64 would blow the sessionStorage quota. On a
     restored draft the customer re-picks the photo; everything else survives. */
  const [photoFile, setPhotoFile] = useState<File | null>(null);
  const [hydrated, setHydrated] = useState(false);

  /* Restore after mount rather than in a lazy useState initializer — reading
     sessionStorage during render would desync the server and client HTML. */
  useEffect(() => {
    try {
      const saved = sessionStorage.getItem(DRAFT_KEY);
      if (saved) {
        const draft = JSON.parse(saved) as OrderDraft;
        if (draft.orderDetails) setOrderDetails(draft.orderDetails);
        if (draft.profileSetup) setProfileSetup(draft.profileSetup);

        /* Land on whichever is lower: the step they left off on, and the
           furthest step the restored data can actually support. A later step
           rendered without its prerequisite data would crash, and dropping
           straight back to step 1 would needlessly discard progress. */
        const supported: 1 | 2 | 3 = draft.orderDetails ? (draft.profileSetup ? 3 : 2) : 1;
        const wanted = draft.step === 2 || draft.step === 3 ? draft.step : 1;
        setStep(Math.min(wanted, supported) as 1 | 2 | 3);
      }
    } catch {
      // Corrupt or unavailable storage (private mode, quota) — start fresh.
    }
    setHydrated(true);
  }, []);

  /* Guarded on `hydrated` so the initial empty state can't overwrite a saved
     draft before the restore effect above has run. */
  useEffect(() => {
    if (!hydrated) return;
    try {
      sessionStorage.setItem(DRAFT_KEY, JSON.stringify({ step, orderDetails, profileSetup }));
    } catch {
      // Storage full or blocked — persistence is a convenience, not required.
    }
  }, [hydrated, step, orderDetails, profileSetup]);

  function clearDraft() {
    try {
      sessionStorage.removeItem(DRAFT_KEY);
    } catch {
      // Nothing to do — the draft expires with the tab session anyway.
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
                    active || done
                      ? "bg-accent-purple text-bg-base"
                      : "bg-bg-elevated text-text-muted"
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
        <OrderStepDetails
          defaultCardType={defaultCardType}
          defaultValues={orderDetails ?? undefined}
          onContinue={(values) => {
            setOrderDetails(values);
            setStep(2);
          }}
        />
      )}

      {step === 2 && (
        <OrderStepProfile
          defaultValues={{ fullName: orderDetails?.fullName, ...(profileSetup ?? {}) }}
          contactEmail={orderDetails?.email}
          contactPhone={orderDetails?.phone}
          photoFile={photoFile}
          onPhotoChange={setPhotoFile}
          onBack={() => setStep(1)}
          onContinue={(values) => {
            setProfileSetup(values);
            setStep(3);
          }}
        />
      )}

      {step === 3 && orderDetails && profileSetup && (
        <OrderStepPayment
          orderDetails={orderDetails}
          profileSetup={profileSetup}
          photoFile={photoFile}
          onBack={() => setStep(2)}
          onComplete={clearDraft}
        />
      )}
    </div>
  );
}
