"use client";

import { useState } from "react";
import type { User } from "@supabase/supabase-js";
import OtpSignIn from "@/components/auth/OtpSignIn";
import IdentityFields, { type IdentityValues } from "./IdentityFields";

/* New order Step 1 — "Account, Identity & Print Assets". Inline email-OTP sign
   in gates the identity form: the customer must establish a session first
   (so they can return to the studio later), then fill in account type, name,
   logo, and username. The authenticated user's email is surfaced to callers
   via onContinue for use as the order contact. */
export default function OrderStepIdentity({
  defaultValues,
  logoFile,
  onLogoChange,
  onContinue,
}: {
  defaultValues?: Partial<IdentityValues>;
  logoFile: File | null;
  onLogoChange: (file: File | null) => void;
  onContinue: (values: IdentityValues & { userId: string; email: string }) => void;
}) {
  const [user, setUser] = useState<User | null>(null);

  return (
    <div className="flex flex-col gap-8">
      <div>
        <p className="text-text-primary mb-1 font-[600]">Sign in to start your order</p>
        <p className="text-text-muted text-sm">
          We&apos;ll link your card to this account so you can finish and edit your profile anytime.
        </p>
        <div className="mt-4">
          <OtpSignIn onAuthenticated={setUser} />
        </div>
      </div>

      {user && (
        <div className="border-bg-border border-t pt-8">
          <IdentityFields
            defaultValues={defaultValues}
            logoFile={logoFile}
            onLogoChange={onLogoChange}
            onContinue={(values) => onContinue({ ...values, userId: user.id, email: user.email ?? "" })}
          />
        </div>
      )}
    </div>
  );
}
