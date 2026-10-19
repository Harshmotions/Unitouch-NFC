"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { ImagePlus, X, Check, Loader2 } from "lucide-react";
import Input from "@/components/ui/Input";
import Label from "@/components/ui/Label";
import Button from "@/components/ui/Button";
import { fetchEmailDomainError } from "@/lib/email-check-client";

export type AccountType = "personal" | "business";

export interface IdentityValues {
  accountType: AccountType;
  displayName: string;
  email: string;
  username: string;
}

type UsernameStatus = "idle" | "invalid" | "checking" | "available" | "taken" | "error";

const MAX_LOGO_BYTES = 5 * 1024 * 1024;

// Loose client-side check; the server re-validates with zod (identitySchema).
const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

/* Name -> profile link: "Harsh Powar" -> "harsh-powar", "Café Ünïcode & Co."
   -> "cafe-unicode-co". Accents are stripped, anything else outside a-z0-9
   becomes a hyphen; capped at the 30-char username limit. */
function slugify(name: string): string {
  return name
    .normalize("NFKD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 30)
    .replace(/-+$/, "");
}

/* The identity form for the new order Step 1 — account type, display name,
   email (typed twice), logo/photo, and username, with a simplified live
   preview. Checkout is guest-only: the email is stored on the order and is
   what the customer signs in with later to manage their profile, so the
   confirm field guards against a typo locking them out. Layout constraint:
   on mobile the preview sits below the inputs but above Continue; on desktop
   it's side-by-side. */
export default function IdentityFields({
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
  const [accountType, setAccountType] = useState<AccountType>(defaultValues?.accountType ?? "personal");
  const [displayName, setDisplayName] = useState(defaultValues?.displayName ?? "");
  const [email, setEmail] = useState(defaultValues?.email ?? "");
  const [confirmEmail, setConfirmEmail] = useState(defaultValues?.email ?? "");
  const [username, setUsername] = useState(defaultValues?.username ?? "");
  /* The link auto-fills from the name until the customer edits it by hand.
     A restored draft whose link differs from its name's slug was hand-edited
     (or auto-suggested); either way, don't overwrite it. */
  const [usernameTouched, setUsernameTouched] = useState(
    Boolean(defaultValues?.username) && defaultValues?.username !== slugify(defaultValues?.displayName ?? ""),
  );
  // Read inside the availability effect without re-running it.
  const usernameTouchedRef = useRef(usernameTouched);
  usernameTouchedRef.current = usernameTouched;
  // Set when an auto-filled link was taken and we swapped in a free variant.
  const [swappedFrom, setSwappedFrom] = useState<string | null>(null);
  // A free variant offered (not applied) when a hand-typed link is taken.
  const [suggestion, setSuggestion] = useState<string | null>(null);
  const [usernameStatus, setUsernameStatusState] = useState<UsernameStatus>("idle");
  /* The latest status together with the link it describes, updated in the
     same call. A Continue click can land before a just-edited link is
     re-checked; reading this (not state) keeps it from acting on the
     previous link's answer. */
  const linkStatusRef = useRef<{ link: string; status: UsernameStatus }>({ link: "", status: "idle" });
  function setUsernameStatus(status: UsernameStatus, link: string) {
    linkStatusRef.current = { link, status };
    setUsernameStatusState(status);
  }
  const [logoError, setLogoError] = useState<string | null>(null);
  const [submitAttempted, setSubmitAttempted] = useState(false);
  /* Email domain check (lib/email-domain.ts via /api/email/check): runs on
     blur and, if the current email hasn't been checked yet, on Continue.
     Only a definite "this domain can't receive mail" blocks. */
  const [domainError, setDomainError] = useState<string | null>(null);
  const [domainCheckedFor, setDomainCheckedFor] = useState<string | null>(null);
  const [checkingDomain, setCheckingDomain] = useState(false);
  // The latest check; older answers are ignored, and Continue awaits it.
  const domainCheckRef = useRef<{ email: string; result: Promise<string | null> } | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const isBusiness = accountType === "business";

  // Sent with the availability check once it looks like a real address.
  const checkEmail = EMAIL_PATTERN.test(email.trim().toLowerCase()) ? email.trim().toLowerCase() : "";

  /* Live username availability. When the link is still auto-filled and
     taken, swap in the server's suggested free variant (which re-runs this
     check); when it was typed by hand, only offer the suggestion. */
  useEffect(() => {
    const trimmed = username.trim().toLowerCase();
    setSuggestion(null);
    if (!trimmed || trimmed.length < 3 || !/^[a-z0-9-]+$/.test(trimmed)) {
      setUsernameStatus(trimmed ? "invalid" : "idle", trimmed);
      return;
    }
    setUsernameStatus("checking", trimmed);
    // Ignore a response that lands after the link has changed again.
    let stale = false;
    const timer = setTimeout(() => {
      fetch("/api/profiles/check-username", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        // The email lets the server treat this person's own abandoned
        // checkout for the same link as available (lib/reservations.ts).
        body: JSON.stringify({ username: trimmed, suggest: true, ...(checkEmail ? { email: checkEmail } : {}) }),
      })
        .then((res) => res.json())
        .then((data: { available?: boolean; suggestion?: string | null }) => {
          if (stale) return;
          if (data.available === undefined) {
            setUsernameStatus("error", trimmed);
          } else if (data.available) {
            setUsernameStatus("available", trimmed);
          } else if (data.suggestion && !usernameTouchedRef.current) {
            setSwappedFrom(trimmed);
            setUsername(data.suggestion);
          } else {
            setUsernameStatus("taken", trimmed);
            setSuggestion(data.suggestion ?? null);
          }
        })
        .catch(() => {
          if (!stale) setUsernameStatus("error", trimmed);
        });
    }, 450);
    return () => {
      stale = true;
      clearTimeout(timer);
    };
  }, [username, checkEmail]);

  function handleNameChange(value: string) {
    setDisplayName(value);
    if (!usernameTouched) {
      setSwappedFrom(null);
      setUsername(slugify(value));
    }
  }

  function handleUsernameChange(value: string) {
    const next = value.toLowerCase();
    setSwappedFrom(null);
    setUsername(next);
    // Clearing the field hands it back to auto-fill.
    setUsernameTouched(next.trim() !== "");
  }

  function resetUsernameToName() {
    setSwappedFrom(null);
    setUsernameTouched(false);
    setUsername(slugify(displayName));
  }

  const nameSlug = slugify(displayName);

  // Local blob URL for the logo preview; revoked on change/unmount.
  const logoUrl = useMemo(() => (logoFile ? URL.createObjectURL(logoFile) : null), [logoFile]);
  useEffect(() => {
    return () => {
      if (logoUrl) URL.revokeObjectURL(logoUrl);
    };
  }, [logoUrl]);

  function handleLogoPick(file: File | undefined) {
    if (!file) return;
    if (!file.type.startsWith("image/")) {
      setLogoError("Please choose an image file.");
      return;
    }
    if (file.size > MAX_LOGO_BYTES) {
      setLogoError("Image must be under 5MB.");
      return;
    }
    setLogoError(null);
    onLogoChange(file);
  }

  const logoRequiredMissing = isBusiness && !logoFile;

  const normalizedEmail = email.trim().toLowerCase();
  const emailInvalid = !EMAIL_PATTERN.test(normalizedEmail);
  const emailMismatch = normalizedEmail !== confirmEmail.trim().toLowerCase();

  function handleEmailChange(value: string) {
    setEmail(value);
    setDomainError(null);
    setDomainCheckedFor(null);
  }

  function checkDomain(target: string): Promise<string | null> {
    // Reuse the request for this email if there is one (blur, then Continue).
    const current = domainCheckRef.current;
    const result = current?.email === target ? current.result : fetchEmailDomainError(target);
    domainCheckRef.current = { email: target, result };
    setCheckingDomain(true);
    return result.then((message) => {
      if (domainCheckRef.current?.email === target) {
        setCheckingDomain(false);
        setDomainCheckedFor(target);
        setDomainError(message);
      }
      return message;
    });
  }

  function handleEmailBlur() {
    if (emailInvalid || domainCheckedFor === normalizedEmail) return;
    void checkDomain(normalizedEmail);
  }

  /* Continue clicked while the link availability check is still running
     (it re-runs whenever the email changes): remember the click and carry
     on once the check lands, instead of silently ignoring it. Holds the
     link the click was for; if the check swaps in a different link, the
     customer should see that before moving on, so the click is dropped. */
  const [continuePendingFor, setContinuePendingFor] = useState<string | null>(null);

  useEffect(() => {
    if (continuePendingFor === null) return;
    if (continuePendingFor !== username.trim().toLowerCase()) {
      setContinuePendingFor(null);
      return;
    }
    const latest = linkStatusRef.current;
    if (latest.link !== continuePendingFor || latest.status === "checking") return;
    setContinuePendingFor(null);
    if (latest.status === "available") void attemptContinue();
    // attemptContinue is recreated every render; this only reacts to the check finishing.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [continuePendingFor, usernameStatus, username]);

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    void attemptContinue();
  }

  async function attemptContinue() {
    setSubmitAttempted(true);
    if (displayName.trim().length < 2) return;
    if (emailInvalid || emailMismatch) return;
    const link = username.trim().toLowerCase();
    const latest = linkStatusRef.current;
    if (latest.link !== link || latest.status === "checking") {
      setContinuePendingFor(link);
      return;
    }
    if (latest.status !== "available") return;
    if (logoRequiredMissing) {
      setLogoError("A logo is required for business cards.");
      return;
    }
    const domainProblem = domainCheckedFor === normalizedEmail ? domainError : await checkDomain(normalizedEmail);
    if (domainProblem) return;
    onContinue({
      accountType,
      displayName: displayName.trim(),
      email: normalizedEmail,
      username: username.trim().toLowerCase(),
    });
  }

  const nameLabel = isBusiness ? "Business name" : "Name on card";
  const namePlaceholder = isBusiness ? "Acme Inc." : "Your name";
  const previewName = displayName.trim() || (isBusiness ? "Business name" : "Your name");
  const previewHandle = username.trim().toLowerCase() || "username";
  const previewInitial = (displayName.trim()[0] || "U").toUpperCase();

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-8">
      <div className="flex flex-col gap-8 lg:flex-row lg:gap-10">
        {/* Inputs */}
        <div className="flex flex-1 flex-col gap-6">
          {/* Account type toggle */}
          <div>
            <Label>Account type</Label>
            <div className="grid grid-cols-2 gap-3">
              {(["personal", "business"] as const).map((type) => (
                <button
                  key={type}
                  type="button"
                  onClick={() => setAccountType(type)}
                  className={`rounded-xl p-4 text-left transition-colors ${
                    accountType === type ? "surface-card-accent" : "surface-card"
                  }`}
                >
                  <p className="text-text-primary font-[600] capitalize">{type}</p>
                  <p className="text-text-muted text-xs">
                    {type === "personal" ? "For yourself" : "For a company or brand"}
                  </p>
                </button>
              ))}
            </div>
          </div>

          {/* Display name */}
          <div>
            <Label htmlFor="displayName">{nameLabel}</Label>
            <Input
              id="displayName"
              value={displayName}
              onChange={(e) => handleNameChange(e.target.value)}
              placeholder={namePlaceholder}
            />
            {submitAttempted && displayName.trim().length < 2 && (
              <p className="text-error mt-1.5 text-xs">Enter your {nameLabel.toLowerCase()}.</p>
            )}
          </div>

          {/* Email — the key for managing the profile after checkout */}
          <div>
            <Label htmlFor="email">Email</Label>
            <Input
              id="email"
              type="email"
              autoComplete="email"
              value={email}
              onChange={(e) => handleEmailChange(e.target.value)}
              onBlur={handleEmailBlur}
              placeholder="you@example.com"
            />
            {submitAttempted && emailInvalid ? (
              <p className="text-error mt-1.5 text-xs">Enter a valid email address.</p>
            ) : domainError ? (
              <p className="text-error mt-1.5 text-xs">{domainError}</p>
            ) : (
              <p className="text-text-muted mt-1.5 text-xs">
                You&apos;ll use this email to manage your profile later, so double-check it.
                Ordering more than one card? Use the same email for all of them and switch
                between your profiles after you sign in.
              </p>
            )}
          </div>

          <div>
            <Label htmlFor="confirmEmail">Confirm email</Label>
            <Input
              id="confirmEmail"
              type="email"
              autoComplete="email"
              value={confirmEmail}
              onChange={(e) => setConfirmEmail(e.target.value)}
              placeholder="Type your email again"
            />
            {(submitAttempted || confirmEmail.trim().length >= email.trim().length) &&
              confirmEmail.trim().length > 0 &&
              !emailInvalid &&
              emailMismatch && (
              <p className="text-error mt-1.5 text-xs">Emails don&apos;t match.</p>
            )}
          </div>

          {/* Logo / photo */}
          <div>
            <Label>
              {isBusiness ? "Logo" : "Profile picture"}{" "}
              <span className="text-text-muted">{isBusiness ? "(required)" : "(optional)"}</span>
            </Label>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              className="hidden"
              onChange={(e) => handleLogoPick(e.target.files?.[0])}
            />
            {logoFile && logoUrl ? (
              <div className="surface-card flex items-center gap-3 rounded-xl p-3">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={logoUrl} alt="Logo preview" className="size-12 rounded-lg object-cover" />
                <span className="text-text-secondary flex-1 truncate text-sm">{logoFile.name}</span>
                <button
                  type="button"
                  onClick={() => onLogoChange(null)}
                  className="text-text-muted hover:text-text-primary"
                  aria-label="Remove image"
                >
                  <X className="size-4" />
                </button>
              </div>
            ) : (
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="border-bg-border text-text-muted hover:text-text-primary hover:border-accent-purple/40 flex w-full items-center justify-center gap-2 rounded-xl border border-dashed px-4 py-6 text-sm transition-colors"
              >
                <ImagePlus className="size-4" />
                Upload an image
              </button>
            )}
            {(logoError || (submitAttempted && logoRequiredMissing)) && (
              <p className="text-error mt-1.5 text-xs">
                {logoError ?? "A logo is required for business cards."}
              </p>
            )}
          </div>

          {/* Username */}
          <div>
            <Label htmlFor="username">Profile link</Label>
            <div className="border-bg-border bg-bg-elevated focus-within:border-accent-purple/50 flex h-11 items-center gap-1 rounded-xl border px-4 transition-colors">
              <span className="text-text-muted text-sm">unitouch.in/u/</span>
              <input
                id="username"
                value={username}
                onChange={(e) => handleUsernameChange(e.target.value)}
                placeholder="yourname"
                className="text-text-primary placeholder:text-text-muted h-full min-w-0 flex-1 bg-transparent text-sm outline-none"
              />
              {usernameStatus === "checking" && <Loader2 className="text-text-muted size-4 animate-spin" />}
              {usernameStatus === "available" && <Check className="text-success size-4" />}
            </div>
            {usernameStatus === "invalid" && (
              <p className="text-text-muted mt-1.5 text-xs">
                3+ characters, lowercase letters, numbers and hyphens only.
              </p>
            )}
            {usernameStatus === "available" && (
              <p className="text-success mt-1.5 text-xs">
                @{previewHandle} is available
                {swappedFrom && (
                  <span className="text-text-muted"> (@{swappedFrom} was taken, so we picked this one)</span>
                )}
              </p>
            )}
            {usernameStatus === "taken" && (
              <p className="text-error mt-1.5 text-xs">
                That username is already taken.
                {suggestion && (
                  <>
                    {" "}
                    <button
                      type="button"
                      onClick={() => handleUsernameChange(suggestion)}
                      className="text-accent-purple font-[600] underline-offset-2 hover:underline"
                    >
                      Use @{suggestion}
                    </button>
                  </>
                )}
              </p>
            )}
            {usernameStatus === "error" && (
              <p className="text-error mt-1.5 text-xs">Couldn&apos;t check availability. Try again.</p>
            )}
            {!usernameTouched && username ? (
              <p className="text-text-muted mt-1 text-xs">Filled in from your name. You can edit it.</p>
            ) : (
              usernameTouched &&
              nameSlug.length >= 3 &&
              nameSlug !== username.trim() && (
                <button
                  type="button"
                  onClick={resetUsernameToName}
                  className="text-text-muted hover:text-text-primary mt-1 text-xs underline underline-offset-2"
                >
                  Use my name instead
                </button>
              )
            )}
          </div>
        </div>

        {/* Simplified preview — below inputs on mobile, beside them on desktop */}
        <div className="lg:w-72 lg:shrink-0">
          <Label>Preview</Label>
          <div className="surface-card flex flex-col items-center gap-3 rounded-2xl p-6 text-center">
            {logoUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={logoUrl} alt="" className="size-20 rounded-full object-cover" />
            ) : (
              <div className="bg-bg-elevated text-text-muted flex size-20 items-center justify-center rounded-full text-2xl font-[600]">
                {previewInitial}
              </div>
            )}
            <div>
              <p className="text-text-primary font-[600]">{previewName}</p>
              <p className="text-text-muted text-sm">@{previewHandle}</p>
            </div>
          </div>
        </div>
      </div>

      <Button variant="primary" size="lg" className="w-full">
        {continuePendingFor !== null ? (
          "Checking your profile link…"
        ) : checkingDomain && submitAttempted ? (
          "Checking your email…"
        ) : (
          <>Continue to shipping &amp; payment</>
        )}
      </Button>
    </form>
  );
}
