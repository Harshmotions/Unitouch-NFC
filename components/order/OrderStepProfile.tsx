"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { X, Eye, ImagePlus, Plus, Sparkles, ChevronLeft, ChevronRight } from "lucide-react";
import { useForm, useFieldArray } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { profileSetupSchema, type ProfileSetupValues } from "@/lib/validations";
import type { Profile } from "@/types";
import Input from "@/components/ui/Input";
import Label from "@/components/ui/Label";
import Button from "@/components/ui/Button";
import PersonalProfile from "@/components/profile/PersonalProfile";

type UsernameStatus = "idle" | "checking" | "available" | "taken" | "invalid" | "error";

const MAX_EXTRA_LINKS = 8;
const MAX_INTERESTS = 6;

const REPRESENTS_OPTIONS = [
  {
    value: "me" as const,
    icon: "👤",
    title: "Me",
    description: "This profile represents me as an individual.",
  },
  {
    value: "company" as const,
    icon: "🏢",
    title: "My Company",
    description: "This profile represents my business or organization.",
  },
  {
    value: "both" as const,
    icon: "🤝",
    title: "Both",
    description: "I want to represent both myself and my company.",
  },
];

// Lightweight, client-side keyword matcher that stands in for a real AI call
// (no AI provider is configured for this project) — scans the free-text
// "professional interests" description and proposes tags the user can accept,
// reorder, or discard, rather than writing them from scratch.
const INTEREST_KEYWORDS: { keywords: string[]; tag: string }[] = [
  { keywords: ["ui design", "ux design", "ui/ux"], tag: "💻 UI Design" },
  { keywords: ["public speaking"], tag: "🎤 Public Speaking" },
  { keywords: ["real estate"], tag: "🏠 Real Estate" },
  { keywords: ["branding", "brand"], tag: "🎨 Branding" },
  { keywords: ["photography", "photographer", "photo"], tag: "📷 Photography" },
  { keywords: ["coffee"], tag: "☕ Coffee" },
  { keywords: ["travel", "travelling", "traveling"], tag: "✈️ Travel" },
  { keywords: ["startup", "startups"], tag: "🚀 Startups" },
  { keywords: ["marketing"], tag: "📈 Marketing" },
  { keywords: ["fitness", "gym", "workout"], tag: "💪 Fitness" },
  { keywords: ["music"], tag: "🎵 Music" },
  { keywords: ["writing", "copywriting"], tag: "✍️ Writing" },
  { keywords: ["coding", "developer", "engineering", "software"], tag: "💻 Engineering" },
  { keywords: ["finance", "investing"], tag: "💰 Finance" },
  { keywords: ["fashion"], tag: "👗 Fashion" },
  { keywords: ["food", "cooking", "chef"], tag: "🍳 Food" },
  { keywords: ["yoga"], tag: "🧘 Yoga" },
  { keywords: ["film", "filmmaking", "video"], tag: "🎬 Film" },
  { keywords: ["consulting"], tag: "📊 Consulting" },
  { keywords: ["sales"], tag: "🤝 Sales" },
  { keywords: ["law", "legal"], tag: "⚖️ Law" },
  { keywords: ["education", "teaching"], tag: "📚 Education" },
  { keywords: ["health", "wellness"], tag: "🩺 Health" },
  { keywords: ["architecture"], tag: "🏛️ Architecture" },
  { keywords: ["art", "illustration"], tag: "🎨 Art" },
  { keywords: ["gaming"], tag: "🎮 Gaming" },
  { keywords: ["agency"], tag: "🏢 Agency" },
  { keywords: ["design"], tag: "🎨 Design" },
];

function escapeRegExp(input: string): string {
  return input.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

function suggestTagsFromText(text: string): string[] {
  const lower = text.toLowerCase();
  if (!lower.trim()) return [];
  const matched: string[] = [];
  for (const { keywords, tag } of INTEREST_KEYWORDS) {
    if (matched.includes(tag)) continue;
    // Leading word-boundary only (not trailing) — a plain substring check
    // would let "art" match inside "startups"; requiring just the start of
    // a word still allows suffixes like "brand" -> "brands"/"branding".
    const hasMatch = keywords.some((kw) => new RegExp(`\\b${escapeRegExp(kw)}`).test(lower));
    if (hasMatch) matched.push(tag);
  }
  return matched;
}

function labelFromUrl(url: string): string {
  try {
    const hostname = new URL(/^https?:\/\//.test(url) ? url : `https://${url}`).hostname.replace(/^www\./, "");
    const name = hostname.split(".")[0];
    return name ? name.charAt(0).toUpperCase() + name.slice(1) : "";
  } catch {
    return "";
  }
}

function slugifyName(input: string): string {
  return input
    .toLowerCase()
    .normalize("NFKD")
    .replace(/\p{Diacritic}/gu, "")
    .replace(/[^a-z0-9]/g, "");
}

function usernameCandidates(fullName: string, company?: string): string[] {
  const first = slugifyName(fullName.trim().split(/\s+/)[0] ?? "");
  if (first.length < 2) return [];

  const candidates = [first];
  const companySlug = company ? slugifyName(company) : "";
  if (companySlug) candidates.push(`${first}-${companySlug}`.slice(0, 30));
  // Last resort: short numeric suffix, not a long spammy-looking string.
  for (let i = 0; i < 4; i++) candidates.push(`${first}${Math.floor(10 + Math.random() * 90)}`);
  return candidates;
}

async function findAvailableUsername(candidates: string[]): Promise<string | null> {
  for (const candidate of candidates) {
    if (candidate.length < 3) continue;
    try {
      const res = await fetch("/api/profiles/check-username", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username: candidate }),
      });
      const data = await res.json();
      if (data.available) return candidate;
    } catch {
      // try the next candidate
    }
  }
  return candidates[0] ?? null;
}

export default function OrderStepProfile({
  defaultValues,
  contactEmail,
  contactPhone,
  photoFile,
  onPhotoChange,
  onBack,
  onContinue,
}: {
  defaultValues?: Partial<ProfileSetupValues>;
  contactEmail?: string;
  contactPhone?: string;
  photoFile: File | null;
  onPhotoChange: (file: File | null) => void;
  onBack: () => void;
  onContinue: (values: ProfileSetupValues) => void;
}) {
  const {
    register,
    handleSubmit,
    watch,
    setValue,
    control,
    formState: { errors },
  } = useForm<ProfileSetupValues>({
    resolver: zodResolver(profileSetupSchema),
    // The profile design itself (which layout renders) is no longer a
    // customer decision — every new profile ships on the same premium
    // layout, and the Unitouch team reviews/adjusts it manually before it
    // goes live.
    defaultValues: { profileStyle: "personal", extraLinks: [], ...defaultValues },
  });

  const { fields: extraLinkFields, append: appendExtraLink, remove: removeExtraLink } = useFieldArray({
    control,
    name: "extraLinks",
  });
  // Mutated synchronously on every add/remove so rapid clicks (faster than a
  // re-render) can't push the array past the cap via a stale closure value.
  const extraLinksCountRef = useRef(extraLinkFields.length);

  const username = watch("username");
  const fullNameValue = watch("fullName");
  const companyValue = watch("company");
  const represents = watch("represents");
  const [usernameStatus, setUsernameStatus] = useState<UsernameStatus>("idle");
  const [usernameTouched, setUsernameTouched] = useState(false);
  const [previewOpen, setPreviewOpen] = useState(false);
  const [photoError, setPhotoError] = useState<string | null>(null);
  const usernameField = register("username");

  const [interests, setInterests] = useState<string[]>(defaultValues?.interests ?? []);
  const [interestsText, setInterestsText] = useState("");
  const [suggestedTags, setSuggestedTags] = useState<string[]>([]);
  const [customTagInput, setCustomTagInput] = useState("");

  // Regenerate suggestions a beat after the user stops typing, rather than
  // on every keystroke.
  useEffect(() => {
    const timer = setTimeout(() => {
      const matched = suggestTagsFromText(interestsText).filter((tag) => !interests.includes(tag));
      setSuggestedTags(matched);
    }, 600);
    return () => clearTimeout(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [interestsText]);

  function addInterestTag(tag: string) {
    if (!tag || interests.includes(tag) || interests.length >= MAX_INTERESTS) return;
    setInterests((prev) => [...prev, tag]);
    setSuggestedTags((prev) => prev.filter((t) => t !== tag));
  }

  function removeInterest(index: number) {
    setInterests((prev) => prev.filter((_, i) => i !== index));
  }

  function moveInterest(index: number, direction: -1 | 1) {
    setInterests((prev) => {
      const target = index + direction;
      if (target < 0 || target >= prev.length) return prev;
      const next = [...prev];
      [next[index], next[target]] = [next[target], next[index]];
      return next;
    });
  }

  function addCustomTag() {
    const trimmed = customTagInput.trim();
    if (!trimmed || interests.length >= MAX_INTERESTS || interests.includes(trimmed)) return;
    setInterests((prev) => [...prev, trimmed]);
    setCustomTagInput("");
  }

  // Auto-generate the profile URL from the customer's name (+ company) so
  // they don't have to think about it — it's just the link, not a big
  // decision. Stops the moment they edit it themselves.
  useEffect(() => {
    if (usernameTouched) return;
    const candidates = usernameCandidates(fullNameValue ?? "", companyValue);
    if (candidates.length === 0) return;
    let cancelled = false;
    const timer = setTimeout(() => {
      findAvailableUsername(candidates).then((found) => {
        if (!cancelled && found) setValue("username", found, { shouldValidate: true });
      });
    }, 500);
    return () => {
      cancelled = true;
      clearTimeout(timer);
    };
  }, [fullNameValue, companyValue, usernameTouched, setValue]);

  const photoUrl = useMemo(() => (photoFile ? URL.createObjectURL(photoFile) : null), [photoFile]);
  useEffect(() => {
    return () => {
      if (photoUrl) URL.revokeObjectURL(photoUrl);
    };
  }, [photoUrl]);

  useEffect(() => {
    const trimmed = (username ?? "").trim().toLowerCase();
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

  function handlePhotoPick(file: File | undefined) {
    if (!file) return;
    if (!file.type.startsWith("image/")) {
      setPhotoError("Please choose an image file");
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      setPhotoError("Photo must be under 5MB");
      return;
    }
    setPhotoError(null);
    onPhotoChange(file);
  }

  const formValues = watch();
  const draftProfile: Profile = {
    id: "preview",
    username: formValues.username || "preview",
    fullName: formValues.fullName || "Your name",
    designation: formValues.designation,
    company: formValues.company,
    phone: contactPhone,
    email: contactEmail,
    whatsapp: formValues.whatsapp,
    website: formValues.website,
    instagram: formValues.instagram,
    linkedin: formValues.linkedin,
    twitter: formValues.twitter,
    youtube: formValues.youtube,
    portfolio: formValues.portfolio,
    location: formValues.location,
    bio: formValues.bio,
    avatarUrl: photoUrl ?? undefined,
    interests: interests.length > 0 ? interests : undefined,
    extraLinks: (formValues.extraLinks ?? []).filter((l) => l?.label && l?.url) as { label: string; url: string }[],
    isPublished: true,
    profileStyle: "personal",
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };

  function handleFormSubmit(e: React.FormEvent) {
    e.preventDefault();
    // Drop rows the user added but never filled in, so an empty "+ Add
    // another link" row doesn't block submission with a validation error.
    const cleaned = (watch("extraLinks") ?? []).filter((l) => l?.label?.trim() && l?.url?.trim());
    setValue("extraLinks", cleaned);
    handleSubmit((values) => onContinue({ ...values, extraLinks: cleaned, interests }))(e);
  }

  return (
    <>
      <form onSubmit={handleFormSubmit} className="flex flex-col gap-8">
        <div>
          <Label htmlFor="username">Your profile link</Label>
          <p className="text-text-muted mb-2 -mt-1 text-xs">
            We&apos;ve picked one based on your name. Change it if you&apos;d like.
          </p>
          <div className="text-text-secondary bg-bg-elevated border-bg-border flex items-center rounded-xl border focus-within:border-accent-purple/50">
            <span className="pl-4 text-sm">unitouch.in/u/</span>
            <input
              id="username"
              {...usernameField}
              onChange={(e) => {
                setUsernameTouched(true);
                usernameField.onChange(e);
              }}
              placeholder="yourname"
              className="text-text-primary placeholder:text-text-muted h-11 w-full rounded-xl bg-transparent pr-4 pl-1 text-sm outline-none"
            />
          </div>
          {errors.username && <p className="text-error mt-1.5 text-xs">{errors.username.message}</p>}
          {!errors.username && usernameStatus === "checking" && (
            <p className="text-text-muted mt-1.5 text-xs">Checking availability…</p>
          )}
          {!errors.username && usernameStatus === "available" && (
            <p className="text-success mt-1.5 text-xs">@{username} is available</p>
          )}
          {!errors.username && usernameStatus === "taken" && (
            <p className="text-error mt-1.5 text-xs">That username is already taken</p>
          )}
        </div>

        <div>
          <Label>Profile photo / logo (optional)</Label>
          <p className="text-text-muted mb-3 -mt-1 text-xs">
            You can upload a photo, company logo, or skip this for now. We&apos;ll review everything
            before your profile goes live.
          </p>
          <div className="flex items-center gap-4">
            <div className="bg-bg-elevated border-bg-border flex size-20 shrink-0 items-center justify-center overflow-hidden rounded-full border">
              {photoUrl ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={photoUrl} alt="" className="size-full object-cover" />
              ) : (
                <ImagePlus className="text-text-muted size-6" />
              )}
            </div>
            <div>
              <label className="glass glass-stroke-2 text-text-primary inline-flex cursor-pointer items-center rounded-full px-5 py-2.5 text-sm font-[500]">
                {photoFile ? "Change photo" : "Upload photo"}
                <input
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={(e) => handlePhotoPick(e.target.files?.[0])}
                />
              </label>
              {photoError && <p className="text-error mt-1.5 text-xs">{photoError}</p>}
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
          <div>
            <Label htmlFor="fullName">Display name</Label>
            <Input id="fullName" {...register("fullName")} placeholder="Your name" />
            {errors.fullName && <p className="text-error mt-1.5 text-xs">{errors.fullName.message}</p>}
          </div>
          <div>
            <Label htmlFor="designation">Designation</Label>
            <Input id="designation" {...register("designation")} placeholder="Creative Director" />
          </div>
          <div>
            <Label htmlFor="company">Company</Label>
            <Input id="company" {...register("company")} placeholder="Studio North" />
          </div>
          <div>
            <Label htmlFor="location">Location</Label>
            <Input id="location" {...register("location")} placeholder="Mumbai, India" />
          </div>
        </div>

        <div>
          <Label>Who does this profile primarily represent?</Label>
          <p className="text-text-muted mb-3 -mt-1 text-xs">
            This helps us optimize your profile before it goes live.
          </p>
          <div className="flex flex-col gap-3">
            {REPRESENTS_OPTIONS.map(({ value, icon, title, description }) => (
              <label
                key={value}
                className={`flex cursor-pointer items-start gap-3 rounded-xl p-4 transition-colors ${
                  represents === value ? "surface-card-accent" : "surface-card"
                }`}
              >
                <input type="radio" value={value} {...register("represents")} className="sr-only" />
                <span className="text-xl leading-none">{icon}</span>
                <span>
                  <span className="text-text-primary block font-[600]">{title}</span>
                  <span className="text-text-secondary block text-sm">{description}</span>
                </span>
              </label>
            ))}
          </div>
        </div>

        <div>
          <Label htmlFor="bio">Bio</Label>
          <textarea
            id="bio"
            {...register("bio")}
            rows={3}
            placeholder="A line or two about what you do"
            className="border-bg-border bg-bg-elevated text-text-primary placeholder:text-text-muted w-full resize-none rounded-xl border px-4 py-3 text-sm outline-none transition-colors focus:border-accent-purple/50"
          />
          {errors.bio && <p className="text-error mt-1.5 text-xs">{errors.bio.message}</p>}
        </div>

        <div>
          <Label htmlFor="professional-interests">Professional interests</Label>
          <p className="text-text-muted mb-3 -mt-1 text-xs">
            Describe what you do, your expertise, hobbies, industries, or anything you&apos;d like
            people to associate with you.
          </p>
          <textarea
            id="professional-interests"
            value={interestsText}
            onChange={(e) => setInterestsText(e.target.value)}
            rows={2}
            placeholder="I run a branding agency, love UI design, startups, coffee, public speaking and photography."
            className="border-bg-border bg-bg-elevated text-text-primary placeholder:text-text-muted w-full resize-none rounded-xl border px-4 py-3 text-sm outline-none transition-colors focus:border-accent-purple/50"
          />

          {suggestedTags.length > 0 && interests.length < MAX_INTERESTS && (
            <div className="mt-3">
              <p className="text-text-muted mb-2 text-xs">Suggested tags, tap to add</p>
              <div className="flex flex-wrap gap-2">
                {suggestedTags.map((tag) => (
                  <button
                    key={tag}
                    type="button"
                    onClick={() => addInterestTag(tag)}
                    className="border-bg-border text-text-secondary hover:border-accent-purple/50 hover:text-text-primary flex items-center gap-1.5 rounded-full border border-dashed px-3.5 py-1.5 text-sm transition-colors"
                  >
                    <Plus className="size-3" />
                    {tag}
                  </button>
                ))}
              </div>
            </div>
          )}

          {interests.length > 0 && (
            <div className="mt-4 flex flex-wrap gap-2">
              {interests.map((tag, index) => (
                <span
                  key={`${tag}-${index}`}
                  className="glass-pill glass-stroke-1 text-text-primary flex items-center gap-1 rounded-full py-1.5 pr-2 pl-3.5 text-sm"
                >
                  {tag}
                  <button
                    type="button"
                    onClick={() => moveInterest(index, -1)}
                    disabled={index === 0}
                    className="text-text-muted hover:text-text-primary disabled:opacity-30"
                  >
                    <ChevronLeft className="size-3" />
                  </button>
                  <button
                    type="button"
                    onClick={() => moveInterest(index, 1)}
                    disabled={index === interests.length - 1}
                    className="text-text-muted hover:text-text-primary disabled:opacity-30"
                  >
                    <ChevronRight className="size-3" />
                  </button>
                  <button
                    type="button"
                    onClick={() => removeInterest(index)}
                    className="text-text-muted hover:text-error ml-0.5"
                  >
                    <X className="size-3" />
                  </button>
                </span>
              ))}
            </div>
          )}

          {interests.length < MAX_INTERESTS && (
            <div className="mt-3 flex gap-3">
              <Input
                value={customTagInput}
                onChange={(e) => setCustomTagInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    e.preventDefault();
                    addCustomTag();
                  }
                }}
                placeholder="Add a custom tag"
                maxLength={30}
              />
              <Button type="button" variant="secondary" size="md" onClick={addCustomTag}>
                <Plus className="size-4" />
                Add
              </Button>
            </div>
          )}
          <p className="text-text-muted mt-1.5 text-xs">
            {interests.length}/{MAX_INTERESTS}
          </p>
        </div>

        <div>
          <p className="text-text-primary font-[600]">Links</p>
          <p className="text-text-muted mb-4 text-sm">
            Fill in whatever applies to you. Leave the rest blank, or add anything else under Extra
            links below.
          </p>
          <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
            <div>
              <Label htmlFor="website">Website</Label>
              <Input id="website" {...register("website")} placeholder="https://yoursite.com" />
            </div>
            <div>
              <Label htmlFor="whatsapp">WhatsApp number</Label>
              <Input id="whatsapp" {...register("whatsapp")} placeholder="+91 98765 43210" />
            </div>
            <div>
              <Label htmlFor="instagram">Instagram</Label>
              <Input id="instagram" {...register("instagram")} placeholder="https://instagram.com/you" />
            </div>
            <div>
              <Label htmlFor="linkedin">LinkedIn</Label>
              <Input id="linkedin" {...register("linkedin")} placeholder="https://linkedin.com/in/you" />
            </div>
            <div>
              <Label htmlFor="twitter">X (Twitter)</Label>
              <Input id="twitter" {...register("twitter")} placeholder="https://x.com/you" />
            </div>
            <div>
              <Label htmlFor="youtube">YouTube (optional)</Label>
              <Input id="youtube" {...register("youtube")} placeholder="https://youtube.com/@you" />
            </div>
            <div className="sm:col-span-2">
              <Label htmlFor="portfolio">Portfolio (optional)</Label>
              <Input id="portfolio" {...register("portfolio")} placeholder="https://yourportfolio.com" />
            </div>
          </div>
        </div>

        <div>
          <div className="mb-4 flex items-center justify-between">
            <p className="text-text-primary font-[600]">Extra links</p>
            <span className="text-text-muted text-xs">
              {extraLinkFields.length}/{MAX_EXTRA_LINKS}
            </span>
          </div>
          <div className="flex flex-col gap-3">
            {extraLinkFields.map((field, index) => {
              const urlField = register(`extraLinks.${index}.url`);
              return (
                <div key={field.id} className="flex gap-3">
                  <Input
                    {...register(`extraLinks.${index}.label`)}
                    placeholder="Label"
                    className="w-28 shrink-0 sm:w-36"
                  />
                  <Input
                    {...urlField}
                    placeholder="https://..."
                    onBlur={(e) => {
                      urlField.onBlur(e);
                      const url = e.target.value;
                      const currentLabel = watch(`extraLinks.${index}.label`);
                      if (url && !currentLabel) {
                        const guessed = labelFromUrl(url);
                        if (guessed) setValue(`extraLinks.${index}.label`, guessed);
                      }
                    }}
                  />
                  <button
                    type="button"
                    onClick={() => {
                      extraLinksCountRef.current -= 1;
                      removeExtraLink(index);
                    }}
                    className="text-text-muted hover:text-error flex size-11 shrink-0 items-center justify-center"
                  >
                    <X className="size-4" />
                  </button>
                </div>
              );
            })}
          </div>
          {errors.extraLinks && (
            <p className="text-error mt-1.5 text-xs">
              {errors.extraLinks.message ?? "Check your extra links"}
            </p>
          )}
          <Button
            type="button"
            variant="secondary"
            size="sm"
            disabled={extraLinkFields.length >= MAX_EXTRA_LINKS}
            onClick={() => {
              if (extraLinksCountRef.current < MAX_EXTRA_LINKS) {
                extraLinksCountRef.current += 1;
                appendExtraLink({ label: "", url: "" });
              }
            }}
            className="mt-3"
          >
            <Plus className="size-4" />
            Add another link
          </Button>
        </div>

        <div className="glass glass-stroke-3 flex items-start gap-3 rounded-xl p-4">
          <Sparkles className="text-accent-purple size-5 shrink-0" />
          <div>
            <p className="text-text-primary font-[600]">Premium Profile Review</p>
            <p className="text-text-secondary mt-1 text-sm">
              Every Unitouch profile is manually reviewed and optimized by our team before it goes
              live. We&apos;ll ensure your photos, logo, layout, and branding look professional.
            </p>
          </div>
        </div>

        <div className="flex flex-col gap-3 sm:flex-row">
          <Button type="button" variant="secondary" size="lg" onClick={() => setPreviewOpen(true)} className="sm:order-1">
            <Eye className="size-4" />
            Preview profile
          </Button>
          <Button type="button" variant="ghost" size="lg" onClick={onBack}>
            Back
          </Button>
          <Button
            variant="primary"
            size="lg"
            disabled={usernameStatus === "taken" || usernameStatus === "checking"}
            className="sm:ml-auto"
          >
            Continue to payment
          </Button>
        </div>
      </form>

      {previewOpen && (
        <div className="bg-bg-base fixed inset-0 z-50 overflow-y-auto">
          <button
            onClick={() => setPreviewOpen(false)}
            className="glass-icon-btn glass-stroke-3 fixed top-5 right-5 z-50 flex size-10 items-center justify-center rounded-full text-text-primary"
          >
            <X className="size-4" />
          </button>
          <PersonalProfile profile={draftProfile} stats={{ views: 0, saves: 0 }} preview />
        </div>
      )}
    </>
  );
}
