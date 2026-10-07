"use client";

import IdentityFields, { type IdentityValues } from "./IdentityFields";

/* New order Step 1 — "Identity & Print Assets". Checkout is guest-only: no
   sign-in here. The customer types their email (twice) alongside account
   type, name, logo, and username; that email is stored on the order, and
   signing in with it later (email OTP) claims the profile for the studio. */
export default function OrderStepIdentity({
  defaultValues,
  logoFile,
  onLogoChange,
  onContinue,
}: {
  defaultValues?: Partial<IdentityValues>;
  logoFile: File | null;
  onLogoChange: (file: File | null) => void;
  onContinue: (values: IdentityValues) => void;
}) {
  return (
    <IdentityFields
      defaultValues={defaultValues}
      logoFile={logoFile}
      onLogoChange={onLogoChange}
      onContinue={onContinue}
    />
  );
}
