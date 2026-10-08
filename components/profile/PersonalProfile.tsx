"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { Share2, Check, BadgeCheck, Eye, Bookmark, Download, MapPin, ChevronDown } from "lucide-react";
import type { Profile, EventType } from "@/types";
import { formatMemberSince } from "@/lib/profile-demo";
import { downloadVCard } from "@/lib/vcard";
import { track } from "@/lib/track";
import { shareProfile } from "@/lib/share";
import { withProtocol } from "@/lib/url";
import { PlatformGrid, type PlatformKey } from "./PlatformIcons";

const PLATFORM_EVENTS: Partial<Record<PlatformKey, EventType>> = {
  whatsapp: "whatsapp_click",
  email: "email_click",
  website: "website_click",
  instagram: "instagram_click",
  linkedin: "linkedin_click",
  youtube: "youtube_click",
  phone: "phone_click",
};

function withHref<T extends { href?: string }>(item: T): item is T & { href: string } {
  return Boolean(item.href);
}

export default function PersonalProfile({
  profile,
  stats,
  preview = false,
}: {
  profile: Profile;
  stats: { views: number; saves: number };
  preview?: boolean;
}) {
  const [shared, setShared] = useState(false);
  /* Phones: a small hint that the contact options are further down. Appears
     shortly after load (only if the page actually scrolls) and fades out for
     good on the first scroll. Not shown in the studio preview. */
  const [hint, setHint] = useState<"hidden" | "shown" | "gone">("hidden");
  useEffect(() => {
    if (preview) return;
    const timer = window.setTimeout(() => {
      const scrollable = document.documentElement.scrollHeight > window.innerHeight + 80;
      if (scrollable && window.scrollY < 24) setHint("shown");
    }, 700);
    const onScroll = () => {
      if (window.scrollY > 24) {
        setHint("gone");
        window.removeEventListener("scroll", onScroll);
      }
    };
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => {
      window.clearTimeout(timer);
      window.removeEventListener("scroll", onScroll);
    };
  }, [preview]);

  const safeTrack: typeof track = (eventType, username, metadata) => {
    if (!preview) track(eventType, username, metadata);
  };

  useEffect(() => {
    if (!preview) track("page_view", profile.username);
  }, [preview, profile.username]);

  const links: { platform?: PlatformKey; label: string; href?: string }[] = [
    { platform: "phone", label: "Call", href: profile.phone && `tel:${profile.phone}` },
    {
      platform: "whatsapp",
      label: "WhatsApp",
      href: profile.whatsapp && `https://wa.me/${profile.whatsapp.replace(/\D/g, "")}`,
    },
    { platform: "website", label: "Website", href: profile.website && withProtocol(profile.website) },
    { platform: "instagram", label: "Instagram", href: profile.instagram && withProtocol(profile.instagram) },
    { platform: "linkedin", label: "LinkedIn", href: profile.linkedin && withProtocol(profile.linkedin) },
    { platform: "twitter", label: "X (Twitter)", href: profile.twitter && withProtocol(profile.twitter) },
    { platform: "youtube", label: "YouTube", href: profile.youtube && withProtocol(profile.youtube) },
    { platform: "email", label: "Email", href: profile.email && `mailto:${profile.email}` },
    ...(profile.extraLinks ?? []).map((link) => ({ label: link.label, href: link.url })),
  ];
  const visibleLinks = links.filter(withHref);

  function handleSaveContact() {
    downloadVCard(profile);
    safeTrack("contact_save", profile.username);
  }

  const interestPills = (profile.interests ?? []).map((tag, i) => (
    <span
      key={tag}
      className={`glass-pill glass-stroke-${((i + 2) % 4) + 1} text-text-primary rounded-full px-4 py-2 text-sm font-[500]`}
    >
      {tag}
    </span>
  ));

  return (
    <main className="bg-bg-base min-h-screen pb-32 lg:pb-0">
      {/* Stacked column on mobile; two-column split (hero | details) on desktop. */}
      <div className="lg:mx-auto lg:flex lg:min-h-screen lg:max-w-6xl">
        {/* Hero — top on mobile, left half (sticky, full height) on desktop. */}
        <div className="relative mx-auto w-full max-w-xl lg:mx-0 lg:w-1/2 lg:max-w-none lg:shrink-0">
          {/* Mobile/tablet: taller photo, and only location + name + title sit on
              it (bottom ~25%); the interest tags render below the photo so the
              face/photo stays visible. Desktop keeps the full overlay. */}
          <div className="relative h-[62vh] max-h-[640px] min-h-[420px] w-full overflow-hidden md:rounded-b-[2.5rem] lg:sticky lg:top-0 lg:h-screen lg:max-h-none lg:min-h-0 lg:rounded-none">
            {profile.avatarUrl ? (
              <>
                {/* Shimmer underneath: visible until the photo paints over it,
                    so a slow image never leaves an empty black hero. */}
                <div className="absolute inset-0 animate-pulse bg-white/[0.06]" aria-hidden />
                <Image
                  src={profile.avatarUrl}
                  alt={profile.fullName}
                  fill
                  priority
                  sizes="(min-width: 1024px) 50vw, 100vw"
                  className="object-cover object-top"
                />
              </>
            ) : (
              <div
                className="absolute inset-0"
                style={{
                  background:
                    "radial-gradient(120% 80% at 20% 0%, var(--color-accent-purple-glow-soft), transparent 60%), linear-gradient(160deg, #1b1030 0%, #100a1c 45%, #080808 100%)",
                }}
              />
            )}
            {/* long, multi-stop wipe so the photo melts into the page — no hard edge.
                Mobile: short wipe over the bottom ~30% only (just the name block
                sits there). Desktop: the original long wipe under the full overlay. */}
            <div
              className="pointer-events-none absolute inset-0 lg:hidden"
              style={{
                background:
                  "linear-gradient(to top, var(--color-bg-base) 2%, rgba(8,8,8,0.8) 14%, rgba(8,8,8,0.3) 26%, transparent 38%)",
              }}
            />
            <div
              className="pointer-events-none absolute inset-0 hidden lg:block"
              style={{
                background:
                  "linear-gradient(to top, var(--color-bg-base) 4%, rgba(8,8,8,0.85) 22%, rgba(8,8,8,0.35) 42%, transparent 72%)",
              }}
            />
            {/* top scrim so the floating glass controls stay legible over light photos */}
            <div
              className="pointer-events-none absolute inset-x-0 top-0 h-32"
              style={{
                background: "linear-gradient(to bottom, rgba(0,0,0,0.45), transparent)",
              }}
            />

            <div className="absolute inset-x-5 top-6 flex items-center justify-end">
              <button
                onClick={async () => {
                  await shareProfile(profile.fullName, profile.username);
                  setShared(true);
                  setTimeout(() => setShared(false), 1500);
                }}
                className="glass-icon-btn glass-stroke-4 flex size-10 items-center justify-center rounded-full text-text-primary"
              >
                {shared ? <Check className="text-success size-4" /> : <Share2 className="size-4" />}
              </button>
            </div>

            <div className="absolute inset-x-6 bottom-5 lg:bottom-6">
              {profile.location && (
                <div className="text-text-primary/90 mb-1.5 flex items-center gap-1.5 text-sm">
                  <MapPin className="size-3.5" />
                  {profile.location}
                </div>
              )}
              <div className="flex items-center gap-2">
                <h1 className="font-display text-text-primary text-2xl leading-tight font-[600] lg:text-h3">{profile.fullName}</h1>
                {profile.isPublished && <BadgeCheck className="text-verified size-5" />}
              </div>
              <p className="text-text-secondary text-sm">
                {profile.designation}
                {profile.company ? ` · ${profile.company}` : ""}
              </p>

              {profile.interests && profile.interests.length > 0 && (
                <div className="mt-3 hidden flex-wrap gap-2 lg:flex">{interestPills}</div>
              )}
            </div>
          </div>

          {/* Mobile/tablet: tags below the photo instead of on top of it. */}
          {profile.interests && profile.interests.length > 0 && (
            <div className="flex flex-wrap gap-2 px-6 pt-3 pb-1 lg:hidden">{interestPills}</div>
          )}
        </div>

        {/* Details — below hero on mobile, right half (vertically centred) on desktop. */}
        <div className="mx-auto w-full max-w-xl lg:mx-0 lg:flex lg:w-1/2 lg:max-w-none lg:flex-col lg:justify-center lg:px-12 lg:py-16">
          <div className="mx-auto mt-4 w-[calc(100%-2.5rem)] lg:mt-0 lg:w-full">
            <div className="rounded-2xl border border-white/10 bg-bg-elevated/70 p-5 shadow-[inset_0_1px_0_rgba(255,255,255,0.06),0_20px_50px_-30px_rgba(0,0,0,0.9)] backdrop-blur-xl">
              {profile.bio && (
                <p className="text-text-secondary text-sm leading-relaxed">{profile.bio}</p>
              )}

              <div className="mt-4 flex items-center gap-4 border-t border-white/10 pt-4">
                <div className="flex items-center gap-1.5">
                  <Eye className="text-accent-purple size-4" />
                  <span className="text-text-primary text-sm font-[600]">{stats.views.toLocaleString()}</span>
                  <span className="text-text-muted text-xs">views</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <Bookmark className="text-accent-purple size-4" />
                  <span className="text-text-primary text-sm font-[600]">{stats.saves.toLocaleString()}</span>
                  <span className="text-text-muted text-xs">saves</span>
                </div>
              </div>
              <p className="text-text-muted mt-3 text-xs">
                Unitouch member since {formatMemberSince(profile.createdAt)}
              </p>
            </div>
          </div>

          {visibleLinks.length > 0 && (
            <div className="mx-auto mt-5 w-[calc(100%-2.5rem)] lg:w-full">
              <PlatformGrid
                items={visibleLinks}
                onItemClick={(platform) => {
                  const eventType = PLATFORM_EVENTS[platform];
                  if (eventType) safeTrack(eventType, profile.username);
                }}
              />
            </div>
          )}

          {/* Save Contact — inline on desktop (the fixed mobile bar is hidden at lg). */}
          <div className="mx-auto mt-6 hidden w-[calc(100%-2.5rem)] lg:block lg:w-full">
            <button
              onClick={handleSaveContact}
              className="bg-accent-purple text-bg-base flex w-full items-center justify-center gap-2 rounded-full py-3.5 text-sm font-[600] shadow-[inset_0_1px_0_rgba(255,255,255,0.25),0_10px_30px_-12px_var(--color-accent-purple-glow)] transition-all duration-200 ease-out hover:brightness-[1.07]"
            >
              <Download className="size-4" />
              Save Contact
            </button>
          </div>

          <div className="mx-auto mt-10 flex w-[calc(100%-2.5rem)] flex-col items-center gap-4 border-t border-white/10 pt-6 lg:w-full">
            <Link href="/" className="flex items-center gap-1.5 opacity-70 transition-opacity hover:opacity-100">
              <Image src="/logo.png" alt="" width={16} height={16} />
              <span className="text-text-muted text-xs font-[500]">This profile is powered by Unitouch</span>
            </Link>
            <Link
              href="/"
              className="glass glass-stroke-2 text-text-primary rounded-full px-4 py-2 text-xs font-[500]"
            >
              Get your NFC card →
            </Link>
          </div>
        </div>
      </div>

      {/* Scroll hint — phones only, floats just above the Save Contact bar. */}
      {hint !== "hidden" && (
        <div
          aria-hidden
          className={`pointer-events-none fixed inset-x-0 bottom-[6.5rem] z-10 flex justify-center transition-all duration-500 ease-out lg:hidden ${
            hint === "shown" ? "translate-y-0 opacity-100" : "translate-y-2 opacity-0"
          }`}
        >
          <div className="bg-bg-elevated/95 text-text-primary flex items-center gap-1.5 rounded-full border border-white/10 px-4 py-2 text-xs font-[500] shadow-[0_8px_24px_-8px_rgba(0,0,0,0.8)] backdrop-blur-md">
            <ChevronDown className="size-3.5 motion-safe:animate-bounce" />
            Swipe up to connect
          </div>
        </div>
      )}

      {/* Save Contact — fixed bottom bar on mobile only. */}
      <div className="fixed inset-x-0 bottom-0 z-10 px-5 pb-6 pt-4 lg:hidden">
        <div className="bg-bg-base/80 absolute inset-0 -z-10 backdrop-blur-xl" />
        <button
          onClick={handleSaveContact}
          className="bg-accent-purple text-bg-base mx-auto flex w-full max-w-xl items-center justify-center gap-2 rounded-full py-3.5 text-sm font-[600] shadow-[inset_0_1px_0_rgba(255,255,255,0.25),0_10px_30px_-12px_var(--color-accent-purple-glow)] transition-all duration-200 ease-out hover:brightness-[1.07]"
        >
          <Download className="size-4" />
          Save Contact
        </button>
      </div>
    </main>
  );
}
