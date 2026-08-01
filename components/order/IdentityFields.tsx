"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { ImagePlus, X, Check, Loader2 } from "lucide-react";
import Input from "@/components/ui/Input";
import Label from "@/components/ui/Label";
import Button from "@/components/ui/Button";

export type AccountType = "personal" | "business";

export interface IdentityValues {
  accountType: AccountType;
  displayName: string;
  username: string;
}

type UsernameStatus = "idle" | "invalid" | "checking" | "available" | "taken" | "error";

const MAX_LOGO_BYTES = 5 * 1024 * 1024;

/* The identity form for the new order Step 1 — account type, display name,
   logo/photo, and username, with a simplified live preview. Auth-agnostic on
   purpose so it can be rendered and verified on its own; OrderStepIdentity
   wraps it behind the email-OTP gate. Layout constraint: on mobile the
   preview sits below the inputs but above Continue; on desktop it's
   side-by-side. */
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
  const [username, setUsername] = useState(defaultValues?.username ?? "");
  const [usernameStatus, setUsernameStatus] = useState<UsernameStatus>("idle");
  const [logoError, setLogoError] = useState<string | null>(null);
  const [submitAttempted, setSubmitAttempted] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const isBusiness = accountType === "business";

  // Live username availability — same contract as the old profile step.
  useEffect(() => {
    const trimmed = username.trim().toLowerCase();
    if (!trimmed || trimmed.length < 3 || !/^[a-z0-9-]+$/.test(trimmed)) {
      setUsernameStatus(trimmed ? "invalid" : "idle");
      return;
    }
    setUsernameStatus("checking");
    const timer = setTimeout(() => {
      fetch("/api/profiles/check-username", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username: trimmed }),
      })
        .then((res) => res.json())
        .then((data) => setUsernameStatus(data.available ? "available" : "taken"))
        .catch(() => setUsernameStatus("error"));
    }, 450);
    return () => clearTimeout(timer);
  }, [username]);

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

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSubmitAttempted(true);
    if (displayName.trim().length < 2) return;
    if (usernameStatus !== "available") return;
    if (logoRequiredMissing) {
      setLogoError("A logo is required for business cards.");
      return;
    }
    onContinue({
      accountType,
      displayName: displayName.trim(),
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
              onChange={(e) => setDisplayName(e.target.value)}
              placeholder={namePlaceholder}
            />
            {submitAttempted && displayName.trim().length < 2 && (
              <p className="text-error mt-1.5 text-xs">Enter your {nameLabel.toLowerCase()}.</p>
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
                onChange={(e) => setUsername(e.target.value.toLowerCase())}
                placeholder="yourname"
                className="text-text-primary placeholder:text-text-muted h-full flex-1 bg-transparent text-sm outline-none"
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
              <p className="text-success mt-1.5 text-xs">@{previewHandle} is available</p>
            )}
            {usernameStatus === "taken" && (
              <p className="text-error mt-1.5 text-xs">That username is already taken.</p>
            )}
            {usernameStatus === "error" && (
              <p className="text-error mt-1.5 text-xs">Couldn&apos;t check availability. Try again.</p>
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
        Continue to shipping &amp; payment
      </Button>
    </form>
  );
}
