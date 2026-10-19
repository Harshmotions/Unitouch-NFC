"use client";

import { useEffect, useState } from "react";
import type { User } from "@supabase/supabase-js";
import { createSupabaseBrowserClient } from "@/lib/supabase/client";
import Input from "@/components/ui/Input";
import Label from "@/components/ui/Label";
import Button from "@/components/ui/Button";
import ProgressNotice from "@/components/ui/ProgressNotice";
import EmailTypoHint from "@/components/ui/EmailTypoHint";
import { fetchEmailDomainError } from "@/lib/email-check-client";
import { Loader2 } from "lucide-react";

/* Pull a human-readable string out of whatever an auth call rejects with —
   a Supabase AuthError, a plain fetch failure, or something with no usable
   message at all — so the UI never renders a raw object (which showed up as
   a stray "{}"). Falls back to the provided default. */
function messageFrom(err: unknown, fallback: string): string {
  if (err && typeof err === "object" && "message" in err) {
    const m = (err as { message?: unknown }).message;
    if (typeof m === "string") {
      const trimmed = m.trim();
      /* Some auth errors (e.g. AuthRetryableFetchError on a 500/network fail)
         carry a non-human message like "{}" — ignore anything that's only
         braces/brackets/quotes/whitespace and use the friendly fallback. */
      if (trimmed && trimmed !== "null" && !/^[{}[\]"'\s]*$/.test(trimmed)) {
        return trimmed;
      }
    }
  }
  return fallback;
}

/* Email one-time-code sign in. Two phases: enter email -> Supabase emails a
   numeric code (6-8 digits, per the project's Supabase OTP-length setting) ->
   enter code to establish a session. Reusable: pass
   onAuthenticated to react to a successful sign in (/login uses it to go to
   the studio). Renders a signed-in summary when a
   session already exists.

   Pass redirectMessage when onAuthenticated navigates away (e.g. /login ->
   /studio): instead of the static "Signed in / Sign out" card, which looked
   frozen while the next page loaded, it shows a spinner with that message. */
export default function OtpSignIn({
  onAuthenticated,
  redirectMessage,
}: {
  onAuthenticated?: (user: User) => void;
  redirectMessage?: string;
}) {
  const supabase = createSupabaseBrowserClient();

  const [user, setUser] = useState<User | null>(null);
  const [checkingSession, setCheckingSession] = useState(true);
  const [phase, setPhase] = useState<"email" | "code">("email");
  const [email, setEmail] = useState("");
  const [emailFocused, setEmailFocused] = useState(false);
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
    try {
      /* Catch typo'd or made-up domains before Supabase creates an account
         for an inbox that can't receive the code. Client-side only (the
         code request goes straight to Supabase), and any check failure lets
         the sign-in continue. */
      const domainError = await fetchEmailDomainError(trimmed);
      if (domainError) {
        setError(domainError);
        return;
      }
      const { error: otpError } = await supabase.auth.signInWithOtp({
        email: trimmed,
        options: { shouldCreateUser: true },
      });
      if (otpError) {
        console.error("signInWithOtp failed:", otpError);
        setError(messageFrom(otpError, "We couldn't send the code. Please try again in a moment."));
        return;
      }
      setEmail(trimmed);
      setPhase("code");
      setNotice(`We sent a code to ${trimmed}. Enter it below.`);
    } catch (err) {
      console.error("signInWithOtp threw:", err);
      setError("We couldn't reach the server. Check your connection and try again.");
    } finally {
      setBusy(false);
    }
  }

  async function verifyCode(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    const token = code.trim();
    if (!/^\d{6,8}$/.test(token)) {
      setError("Enter the code from your email.");
      return;
    }
    setBusy(true);
    try {
      const { data, error: verifyError } = await supabase.auth.verifyOtp({
        email,
        token,
        type: "email",
      });
      if (verifyError) {
        console.error("verifyOtp failed:", verifyError);
        setError(messageFrom(verifyError, "That code didn't work. Request a new one and try again."));
        return;
      }
      if (data.user) {
        setUser(data.user);
        onAuthenticated?.(data.user);
      }
    } catch (err) {
      console.error("verifyOtp threw:", err);
      setError("We couldn't reach the server. Check your connection and try again.");
    } finally {
      setBusy(false);
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
    return (
      <p className="text-text-muted flex items-center gap-2 text-sm">
        <Loader2 className="size-4 animate-spin" />
        Checking sign-in status…
      </p>
    );
  }

  if (user && redirectMessage) {
    return (
      <ProgressNotice
        title={redirectMessage}
        hint={`Signed in as ${user.email}. This can take a few seconds.`}
      />
    );
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
              onFocus={() => setEmailFocused(true)}
              onBlur={() => setEmailFocused(false)}
              placeholder="you@example.com"
            />
            <EmailTypoHint
              email={email}
              focused={emailFocused}
              onAccept={(fixed) => {
                setEmail(fixed);
                setError(null);
              }}
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
            <Label htmlFor="auth-code">Verification code</Label>
            <Input
              id="auth-code"
              inputMode="numeric"
              autoComplete="one-time-code"
              maxLength={8}
              value={code}
              onChange={(e) => setCode(e.target.value.replace(/\D/g, ""))}
              placeholder="Code from your email"
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
