import OtpSignIn from "@/components/auth/OtpSignIn";

/* Standalone sign-in page — primarily a proving ground for the email-OTP
   auth foundation. The same OtpSignIn component will later be embedded at the
   top of order Step 1. */
export default function LoginPage() {
  return (
    <main className="bg-bg-base flex min-h-screen flex-col items-center justify-center px-6 py-16">
      <div className="w-full max-w-sm">
        <h1 className="font-display text-h2 text-text-primary mb-2 font-[600]">Sign in</h1>
        <p className="text-text-secondary mb-8 text-sm">
          Enter your email and we&apos;ll send you a one-time code.
        </p>
        <OtpSignIn />
      </div>
    </main>
  );
}
