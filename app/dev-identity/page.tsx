"use client";

import { useState } from "react";
import IdentityFields, { type IdentityValues } from "@/components/order/IdentityFields";

/* Dev-only harness for verifying the Step 1 identity form on its own, without
   needing a live signed-in session. Not linked from anywhere in the app. */
export default function DevIdentityPage() {
  const [logoFile, setLogoFile] = useState<File | null>(null);
  const [result, setResult] = useState<IdentityValues | null>(null);

  // Dev-only tool — never expose the harness in a production build.
  if (process.env.NEXT_PUBLIC_APP_ENV === "production") {
    return (
      <main className="bg-bg-base text-text-muted flex min-h-screen items-center justify-center">
        Not available.
      </main>
    );
  }

  return (
    <main className="bg-bg-base min-h-screen px-6 py-16">
      <div className="mx-auto w-full max-w-2xl">
        <h1 className="font-display text-h2 text-text-primary mb-8 font-[600]">Dev: Identity form</h1>
        <IdentityFields logoFile={logoFile} onLogoChange={setLogoFile} onContinue={setResult} />
        {result && (
          <pre className="text-text-secondary mt-8 text-xs" data-testid="result">
            {JSON.stringify(result, null, 2)}
          </pre>
        )}
      </div>
    </main>
  );
}
