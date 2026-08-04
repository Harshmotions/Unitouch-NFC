"use client";

import { Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import OtpSignIn from "@/components/auth/OtpSignIn";

/* Same email-OTP flow as the customer /login page — admin-ness is purely an
   authorization check (lib/admin.ts's requireAdmin), not a separate auth
   system. A non-admin who completes OTP here gets signed out and bounced
   back with ?error=unauthorized by the protected layout, not silently let
   in as a customer. */
function AdminLoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const unauthorized = searchParams.get("error") === "unauthorized";

  return (
    <div className="w-full max-w-sm">
      <h1 className="font-display text-h2 text-text-primary mb-2 font-[600]">Admin sign in</h1>
      <p className="text-text-secondary mb-6 text-sm">
        Enter your admin email and we&apos;ll send you a one-time code.
      </p>
      {unauthorized && (
        <p className="border-error/40 bg-error/10 text-error mb-6 rounded-xl border px-4 py-3 text-sm">
          That email isn&apos;t authorized for admin access.
        </p>
      )}
      <OtpSignIn onAuthenticated={() => router.push("/admin/dashboard")} />
    </div>
  );
}

export default function AdminLoginPage() {
  return (
    <main className="bg-bg-base flex min-h-screen flex-col items-center justify-center px-6 py-16">
      <Suspense fallback={null}>
        <AdminLoginForm />
      </Suspense>
    </main>
  );
}
