"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { X, Eye, ImagePlus, Plus, Sparkles, ChevronLeft, ChevronRight, CheckCircle2 } from "lucide-react";
import { useForm, useFieldArray } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { studioUpdateSchema, type StudioUpdateValues } from "@/lib/validations";
import { suggestTagsFromText, labelFromUrl } from "@/lib/interests";
import type { Profile } from "@/types";
import Input from "@/components/ui/Input";
import Label from "@/components/ui/Label";
import Button from "@/components/ui/Button";
import PersonalProfile from "@/components/profile/PersonalProfile";

const MAX_EXTRA_LINKS = 8;
const MAX_INTERESTS = 6;

const REPRESENTS_OPTIONS = [
  { value: "me" as const, icon: "👤", title: "Me", description: "This profile represents me as an individual." },
  { value: "company" as const, icon: "🏢", title: "My Company", description: "This profile represents my business or organization." },
  { value: "both" as const, icon: "🤝", title: "Both", description: "I want to represent both myself and my company." },
];

/* The post-payment digital studio. Edits an existing (placeholder) profile
   and publishes it. Mirrors the old profile-setup fields, but loads from the
   saved row, can override the profile image, and saves via
   /api/profiles/update (UPDATE, not insert). Username is fixed here. */
export default function ProfileStudio({
  initialProfile,
  updateEndpoint = "/api/profiles/update",
  backHref,
}: {
  initialProfile: Profile;
  /* Lets the admin dashboard reuse this exact form against its own
     ownership-free update route instead of the customer one. */
  updateEndpoint?: string;
  /* Shown as a "back to list" link on the published-success screen — only
     relevant for the admin context, where there's a list to return to. */
  backHref?: string;
}) {
  const {
    register,
    handleSubmit,
    watch,
    setValue,
    control,
    formState: { errors },
  } = useForm<StudioUpdateValues>({
    resolver: zodResolver(studioUpdateSchema),
    defaultValues: {
      fullName: initialProfile.fullName ?? "",
      designation: initialProfile.designation ?? "",
      company: initialProfile.company ?? "",
      bio: initialProfile.bio ?? "",
      location: initialProfile.location ?? "",
      website: initialProfile.website ?? "",
      whatsapp: initialProfile.whatsapp ?? "",
      instagram: initialProfile.instagram ?? "",
      linkedin: initialProfile.linkedin ?? "",
      twitter: initialProfile.twitter ?? "",
      youtube: initialProfile.youtube ?? "",
      portfolio: initialProfile.portfolio ?? "",
      represents: initialProfile.represents,
      profileStyle: initialProfile.profileStyle,
      extraLinks: initialProfile.extraLinks ?? [],
    },
  });

  const { fields: extraLinkFields, append: appendExtraLink, remove: removeExtraLink } = useFieldArray({
    control,
    name: "extraLinks",
  });
  const extraLinksCountRef = useRef(extraLinkFields.length);

  const represents = watch("represents");
  const [interests, setInterests] = useState<string[]>(initialProfile.interests ?? []);
  const [interestsText, setInterestsText] = useState("");
  const [suggestedTags, setSuggestedTags] = useState<string[]>([]);
  const [customTagInput, setCustomTagInput] = useState("");

  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imageError, setImageError] = useState<string | null>(null);
  const [previewOpen, setPreviewOpen] = useState(false);
  const [busy, setBusy] = useState<"draft" | "publish" | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [published, setPublished] = useState(false);

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

  // Override image blob URL (if picked) else the saved avatar.
  const overrideUrl = useMemo(() => (imageFile ? URL.createObjectURL(imageFile) : null), [imageFile]);
  useEffect(() => {
    return () => {
      if (overrideUrl) URL.revokeObjectURL(overrideUrl);
    };
  }, [overrideUrl]);
  const shownAvatar = overrideUrl ?? initialProfile.avatarUrl;

  function handleImagePick(file: File | undefined) {
    if (!file) return;
    if (!file.type.startsWith("image/")) {
      setImageError("Please choose an image file");
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      setImageError("Image must be under 5MB");
      return;
    }
    setImageError(null);
    setImageFile(file);
  }

  const formValues = watch();
  const draftProfile: Profile = {
    ...initialProfile,
    fullName: formValues.fullName || "Your name",
    designation: formValues.designation,
    company: formValues.company,
    whatsapp: formValues.whatsapp,
    website: formValues.website,
    instagram: formValues.instagram,
    linkedin: formValues.linkedin,
    twitter: formValues.twitter,
    youtube: formValues.youtube,
    portfolio: formValues.portfolio,
    location: formValues.location,
    bio: formValues.bio,
    avatarUrl: shownAvatar,
    interests: interests.length > 0 ? interests : undefined,
    extraLinks: (formValues.extraLinks ?? []).filter((l) => l?.label && l?.url) as { label: string; url: string }[],
    isPublished: true,
  };

  async function save(publish: boolean) {
    setError(null);
    setBusy(publish ? "publish" : "draft");

    const cleanedLinks = (watch("extraLinks") ?? []).filter((l) => l?.label?.trim() && l?.url?.trim());
    const values = { ...watch(), extraLinks: cleanedLinks, interests };

    const form = new FormData();
    form.set("username", initialProfile.username);
    form.set("profile", JSON.stringify(values));
    form.set("publish", publish ? "true" : "false");
    if (imageFile) form.set("image", imageFile);

    try {
      const res = await fetch(updateEndpoint, { method: "POST", body: form });
      const data = await res.json().catch(() => null);
      if (!res.ok) {
        setBusy(null);
        setError(data?.error ?? "Something went wrong, please try again.");
        return;
      }
      setBusy(null);
      if (publish) {
        setPublished(true);
      } else {
        setError(null);
      }
    } catch {
      setBusy(null);
      setError("We couldn't reach the server. Check your connection and try again.");
    }
  }

  // Validate the form before publishing; a plain save can skip validation.
  const onPublish = handleSubmit(
    () => save(true),
    () => setError("Please fix the highlighted fields before publishing."),
  );

  if (published) {
    return (
      <div className="flex flex-col items-center gap-5 py-12 text-center">
        <CheckCircle2 className="text-success size-12" />
        <div>
          <h2 className="font-display text-h3 text-text-primary font-[600]">Your profile is live!</h2>
          <p className="text-text-secondary mt-1">
            It&apos;s published at <span className="text-text-primary font-[600]">unitouch.in/u/{initialProfile.username}</span>
          </p>
        </div>
        <div className="flex flex-col gap-3 sm:flex-row">
          <Button variant="primary" size="md" href={`/u/${initialProfile.username}`}>
            View your profile
          </Button>
          <Button variant="secondary" size="md" onClick={() => setPublished(false)}>
            Keep editing
          </Button>
          {backHref && (
            <Button variant="ghost" size="md" href={backHref}>
              Back to list
            </Button>
          )}
        </div>
      </div>
    );
  }

  return (
    <>
      <div className="flex flex-col gap-8">
        {/* Profile link (fixed) */}
        <div>
          <Label>Your profile link</Label>
          <div className="text-text-secondary bg-bg-elevated border-bg-border flex h-11 items-center rounded-xl border px-4 text-sm">
            unitouch.in/u/{initialProfile.username}
          </div>
        </div>

        {/* Image override */}
        <div>
          <Label>Profile photo / logo</Label>
          <p className="text-text-muted mb-3 -mt-1 text-xs">
            Use your card image, or upload a different one for your digital profile.
          </p>
          <div className="flex items-center gap-4">
            <div className="bg-bg-elevated border-bg-border flex size-20 shrink-0 items-center justify-center overflow-hidden rounded-full border">
              {shownAvatar ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={shownAvatar} alt="" className="size-full object-cover" />
              ) : (
                <ImagePlus className="text-text-muted size-6" />
              )}
            </div>
            <label className="glass glass-stroke-2 text-text-primary inline-flex cursor-pointer items-center rounded-full px-5 py-2.5 text-sm font-[500]">
              {shownAvatar ? "Change image" : "Upload image"}
              <input type="file" accept="image/*" className="hidden" onChange={(e) => handleImagePick(e.target.files?.[0])} />
            </label>
          </div>
          {imageError && <p className="text-error mt-1.5 text-xs">{imageError}</p>}
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
          <div className="mt-2 flex flex-col gap-3">
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
          <textarea
            id="professional-interests"
            value={interestsText}
            onChange={(e) => setInterestsText(e.target.value)}
            rows={2}
            placeholder="I run a branding agency, love UI design, startups, coffee, public speaking and photography."
            className="border-bg-border bg-bg-elevated text-text-primary placeholder:text-text-muted mt-1 w-full resize-none rounded-xl border px-4 py-3 text-sm outline-none transition-colors focus:border-accent-purple/50"
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
                  <button type="button" onClick={() => moveInterest(index, -1)} disabled={index === 0} className="text-text-muted hover:text-text-primary disabled:opacity-30">
                    <ChevronLeft className="size-3" />
                  </button>
                  <button type="button" onClick={() => moveInterest(index, 1)} disabled={index === interests.length - 1} className="text-text-muted hover:text-text-primary disabled:opacity-30">
                    <ChevronRight className="size-3" />
                  </button>
                  <button type="button" onClick={() => removeInterest(index)} className="text-text-muted hover:text-error ml-0.5">
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
          <p className="text-text-muted mb-4 text-sm">Fill in whatever applies. Leave the rest blank.</p>
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
                  <Input {...register(`extraLinks.${index}.label`)} placeholder="Label" className="w-28 shrink-0 sm:w-36" />
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
            <p className="text-error mt-1.5 text-xs">{errors.extraLinks.message ?? "Check your extra links"}</p>
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
            <p className="text-text-primary font-[600]">Save now, refine anytime</p>
            <p className="text-text-secondary mt-1 text-sm">
              You&apos;re signed in — save a draft and come back later, or publish to make your
              profile live immediately.
            </p>
          </div>
        </div>

        {error && <p className="text-error text-sm">{error}</p>}

        <div className="flex flex-col gap-3 sm:flex-row">
          <Button type="button" variant="secondary" size="lg" onClick={() => setPreviewOpen(true)} className="sm:order-1">
            <Eye className="size-4" />
            Preview
          </Button>
          <Button
            type="button"
            variant="ghost"
            size="lg"
            onClick={() => save(false)}
            loading={busy === "draft"}
            disabled={busy !== null}
          >
            Save draft
          </Button>
          <Button
            type="button"
            variant="primary"
            size="lg"
            onClick={() => onPublish()}
            loading={busy === "publish"}
            disabled={busy !== null}
            className="sm:ml-auto"
          >
            Publish profile
          </Button>
        </div>
      </div>

      {previewOpen && (
        <div className="bg-bg-base fixed inset-0 z-50 overflow-y-auto">
          {/* Top-left so it doesn't collide with the profile's own share
              button (top-right). Labelled "Back" since this returns to editing. */}
          <button
            onClick={() => setPreviewOpen(false)}
            className="glass glass-stroke-3 text-text-primary fixed top-5 left-5 z-50 flex h-10 items-center gap-1.5 rounded-full pr-4 pl-3 text-sm font-[500]"
          >
            <ChevronLeft className="size-4" />
            Back
          </button>
          <PersonalProfile profile={draftProfile} stats={{ views: 0, saves: 0 }} preview />
        </div>
      )}
    </>
  );
}
