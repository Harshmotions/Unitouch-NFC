"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Lock } from "lucide-react";
import { createAdminBrowserClient } from "@/lib/supabase/client";
import Input from "@/components/ui/Input";
import Label from "@/components/ui/Label";
import Button from "@/components/ui/Button";
import ProgressNotice from "@/components/ui/ProgressNotice";

type Step = "password" | "code" | "done";

/* Step 1: admin email + shared password (/api/admin/auth/password, which
   also emails a one-time code). Step 2: the code, verified in the browser so
   Supabase sets the session, then /api/admin/auth/complete issues the admin
   2FA cookie. */
export default function AdminLoginForm() {
  const router = useRouter();
  const [step, setStep] = useState<Step>("password");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [code, setCode] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function submitPassword(e?: React.FormEvent) {
    e?.preventDefault();
    setError(null);
    setBusy(true);
    try {
      const res = await fetch("/api/admin/auth/password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: email.trim().toLowerCase(), password }),
      });
      const data = await res.json().catch(() => null);
      if (!res.ok) {
        setError(data?.error ?? "Couldn't sign in. Please try again.");
        return;
      }
      setStep("code");
      setCode("");
    } catch {
      setError("We couldn't reach the server. Check your connection and try again.");
    } finally {
      setBusy(false);
    }
  }

  async function submitCode(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    const token = code.trim();
    if (!/^\d{6,8}$/.test(token)) {
      setError("Enter the code from the email.");
      return;
    }
    setBusy(true);
    try {
      // Admin-only cookie, so this never signs the browser in as a customer.
      const supabase = createAdminBrowserClient();
      const { error: otpError } = await supabase.auth.verifyOtp({
        email: email.trim().toLowerCase(),
        token,
        type: "email",
      });
      if (otpError) {
        setError("That code didn't work. Check the latest email, or resend the code.");
        setBusy(false);
        return;
      }
      const res = await fetch("/api/admin/auth/complete", { method: "POST" });
      const data = await res.json().catch(() => null);
      if (!res.ok) {
        await supabase.auth.signOut({ scope: "local" });
        setStep("password");
        setPassword("");
        setError(data?.error ?? "Your sign-in expired. Please start again.");
        setBusy(false);
        return;
      }
      setStep("done");
      router.replace("/admin/dashboard");
      router.refresh();
    } catch {
      setError("We couldn't reach the server. Check your connection and try again.");
      setBusy(false);
    }
  }

  return (
    <div className="w-full max-w-sm">
      <div className="bg-accent/10 text-accent mb-5 flex size-11 items-center justify-center rounded-xl">
        <Lock className="size-5" />
      </div>
      <h1 className="font-display text-h2 text-text-primary mb-2 font-[600]">Admin sign in</h1>
      <p className="text-text-secondary mb-8 text-sm">
        {step === "password"
          ? "Unitouch team only. Enter the admin email and password."
          : `We emailed a one-time code to ${email.trim().toLowerCase()}. Enter it to finish signing in.`}
      </p>

      {step === "password" && (
        <form onSubmit={submitPassword} className="flex flex-col gap-4">
          <div>
            <Label htmlFor="admin-email">Admin email</Label>
            <Input
              id="admin-email"
              type="email"
              autoComplete="username"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </div>
          <div>
            <Label htmlFor="admin-password">Password</Label>
            <Input
              id="admin-password"
              type="password"
              autoComplete="current-password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
          </div>
          <Button variant="primary" size="lg" type="submit" loading={busy} disabled={busy}>
            Continue
          </Button>
          {busy && <ProgressNotice title="Checking password and sending your code…" hint="This takes a few seconds." />}
        </form>
      )}

      {step === "code" && (
        <form onSubmit={submitCode} className="flex flex-col gap-4">
          <div>
            <Label htmlFor="admin-code">One-time code</Label>
            <Input
              id="admin-code"
              inputMode="numeric"
              autoComplete="one-time-code"
              maxLength={8}
              value={code}
              onChange={(e) => setCode(e.target.value.replace(/\D/g, ""))}
              placeholder="Code from the email"
              autoFocus
            />
          </div>
          <Button variant="primary" size="lg" type="submit" loading={busy} disabled={busy}>
            Verify &amp; sign in
          </Button>
          {busy && <ProgressNotice title="Verifying the code…" />}
          <div className="flex justify-between text-xs">
            <button
              type="button"
              disabled={busy}
              onClick={() => submitPassword()}
              className="text-text-muted hover:text-text-primary underline underline-offset-2"
            >
              Resend code
            </button>
            <button
              type="button"
              disabled={busy}
              onClick={() => {
                setStep("password");
                setPassword("");
                setError(null);
              }}
              className="text-text-muted hover:text-text-primary underline underline-offset-2"
            >
              Start over
            </button>
          </div>
        </form>
      )}

      {step === "done" && <ProgressNotice title="Signed in. Opening the dashboard…" />}

      {error && <p className="text-error mt-4 text-sm">{error}</p>}
    </div>
  );
}
