"use client";

import { useState } from "react";
import type { OrderDetailsValues, ProfileSetupValues } from "@/lib/validations";
import OrderStepDetails from "./OrderStepDetails";
import OrderStepProfile from "./OrderStepProfile";
import OrderStepPayment from "./OrderStepPayment";

const STEPS = ["Order details", "Profile setup", "Payment"] as const;

export default function OrderWizard({ defaultCardType }: { defaultCardType?: string }) {
  const [step, setStep] = useState<1 | 2 | 3>(1);
  const [orderDetails, setOrderDetails] = useState<OrderDetailsValues | null>(null);
  const [profileSetup, setProfileSetup] = useState<ProfileSetupValues | null>(null);
  const [photoFile, setPhotoFile] = useState<File | null>(null);

  return (
    <div>
      <div className="mb-10 flex items-center gap-3">
        {STEPS.map((label, i) => {
          const stepNumber = i + 1;
          const active = stepNumber === step;
          const done = stepNumber < step;
          return (
            <div key={label} className="flex flex-1 items-center gap-3">
              <div className="flex items-center gap-2">
                <span
                  className={`flex size-7 shrink-0 items-center justify-center rounded-full text-xs font-[600] ${
                    active || done
                      ? "bg-accent-purple text-bg-base"
                      : "bg-bg-elevated text-text-muted"
                  }`}
                >
                  {stepNumber}
                </span>
                <span className={`text-sm whitespace-nowrap ${active ? "text-text-primary" : "text-text-muted"}`}>
                  {label}
                </span>
              </div>
              {stepNumber < STEPS.length && <div className="bg-bg-border h-px flex-1" />}
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
        />
      )}
    </div>
  );
}
