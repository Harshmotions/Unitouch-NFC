"use client";

import { useEffect, useState } from "react";
import type { User } from "@supabase/supabase-js";
import { createSupabaseBrowserClient } from "@/lib/supabase/client";
import Input from "@/components/ui/Input";
import Label from "@/components/ui/Label";
import Button from "@/components/ui/Button";

/* Email one-time-code sign in. Two phases: enter email -> Supabase emails a
   6-digit code -> enter code to establish a session. Reusable: pass
   onAuthenticated to react to a successful sign in (the order wizard will use
   this to unlock the rest of Step 1). Renders a signed-in summary when a
   session already exists. */
export default function OtpSignIn({
  onAuthenticated,
}: {
  onAuthenticated?: (user: User) => void;
}) {
  const supabase = createSupabaseBrowserClient();

  const [user, setUser] = useState<User | null>(null);
  const [checkingSession, setCheckingSession] = useState(true);
  const [phase, setPhase] = useState<"email" | "code">("email");
  const [email, setEmail] = useState("");
  const [code, setCode] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);

  // Reflect any existing session, and keep in sync if it changes elsewhere.
  useEffect(() => {
    let active = true;
    supabase.auth.getUser().then(({ data }) => {
      if (!active) return;
      setUser(data.user ?? null);
      setCheckingSession(false);
      if (data.user) onAuthenticated?.(data.user);
    });
    const { data: sub } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
      if (session?.user) onAuthenticated?.(session.user);
    });
    return () => {
      active = false;
      sub.subscription.unsubscribe();
    };
    // supabase client is stable per mount; onAuthenticated intentionally omitted
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function sendCode(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setNotice(null);
    const trimmed = email.trim().toLowerCase();
    if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(trimmed)) {
      setError("Enter a valid email address.");
      return;
    }
    setBusy(true);
    const { error: otpError } = await supabase.auth.signInWithOtp({
      email: trimmed,
      options: { shouldCreateUser: true },
    });
    setBusy(false);
    if (otpError) {
      setError(otpError.message);
      return;
    }
    setEmail(trimmed);
    setPhase("code");
    setNotice(`We sent a 6-digit code to ${trimmed}. Enter it below.`);
  }

  async function verifyCode(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    const token = code.trim();
    if (!/^\d{6}$/.test(token)) {
      setError("Enter the 6-digit code from your email.");
      return;
    }
    setBusy(true);
    const { data, error: verifyError } = await supabase.auth.verifyOtp({
      email,
      token,
      type: "email",
    });
    setBusy(false);
    if (verifyError) {
      setError(verifyError.message);
      return;
    }
    if (data.user) {
      setUser(data.user);
      onAuthenticated?.(data.user);
    }
  }

  async function signOut() {
    setBusy(true);
    await supabase.auth.signOut();
    setBusy(false);
    setUser(null);
    setPhase("email");
    setEmail("");
    setCode("");
    setNotice(null);
  }

  if (checkingSession) {
    return <p className="text-text-muted text-sm">Checking sign-in status…</p>;
  }

  if (user) {
    return (
      <div className="surface-card flex flex-col gap-3 rounded-xl p-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p className="text-text-primary text-sm font-[600]">Signed in</p>
          <p className="text-text-muted text-sm">{user.email}</p>
        </div>
        <Button type="button" variant="ghost" size="sm" onClick={signOut} disabled={busy}>
          Sign out
        </Button>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-4">
      {phase === "email" && (
        <form onSubmit={sendCode} className="flex flex-col gap-3">
          <div>
            <Label htmlFor="auth-email">Email</Label>
            <Input
              id="auth-email"
              type="email"
              autoComplete="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@example.com"
            />
          </div>
          <Button variant="primary" size="lg" type="submit" loading={busy} disabled={busy}>
            Email me a code
          </Button>
        </form>
      )}

      {phase === "code" && (
        <form onSubmit={verifyCode} className="flex flex-col gap-3">
          <div>
            <Label htmlFor="auth-code">6-digit code</Label>
            <Input
              id="auth-code"
              inputMode="numeric"
              autoComplete="one-time-code"
              maxLength={6}
              value={code}
              onChange={(e) => setCode(e.target.value.replace(/\D/g, ""))}
              placeholder="123456"
            />
          </div>
          <Button variant="primary" size="lg" type="submit" loading={busy} disabled={busy}>
            Verify & continue
          </Button>
          <button
            type="button"
            onClick={() => {
              setPhase("email");
              setCode("");
              setError(null);
              setNotice(null);
            }}
            className="text-text-muted hover:text-text-primary text-xs underline underline-offset-2"
          >
            Use a different email
          </button>
        </form>
      )}

      {notice && <p className="text-text-secondary text-xs">{notice}</p>}
      {error && <p className="text-error text-xs">{error}</p>}
    </div>
  );
}
