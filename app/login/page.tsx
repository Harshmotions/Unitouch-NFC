"use client";

import { useRouter } from "next/navigation";
import OtpSignIn from "@/components/auth/OtpSignIn";

/* Sign-in page. On success (or if a session already exists) the customer is
   sent to the studio — their home base for editing their profile. */
export default function LoginPage() {
  const router = useRouter();

  return (
    <main className="bg-bg-base flex min-h-screen flex-col items-center justify-center px-6 py-16">
      <div className="w-full max-w-sm">
        <h1 className="font-display text-h2 text-text-primary mb-2 font-[600]">Welcome back</h1>
        <p className="text-text-secondary mb-8 text-sm">
          Enter your email and we&apos;ll send you a one-time code.
        </p>
        <OtpSignIn onAuthenticated={() => router.replace("/studio")} />
      </div>
    </main>
  );
}
