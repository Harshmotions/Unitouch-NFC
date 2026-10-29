"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { Share2, Check, BadgeCheck, Eye, Bookmark, Download, MapPin, ChevronDown } from "lucide-react";
import type { Profile, EventType } from "@/types";
import { DEMO_USERNAMES, formatMemberSince } from "@/lib/profile-demo";
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
     good on the first scroll (rendered inside the Save Contact bar). Not
     shown in the studio preview. */
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

  const firstName = profile.fullName.trim().split(/\s+/)[0] || "them";

  const interestPills = (profile.interests ?? []).map((tag) => (
    <span
      key={tag}
      className={`glass-pill text-text-primary shrink-0 rounded-full px-4 py-2 text-sm font-[500] whitespace-nowrap`}
    >
      {tag}
    </span>
  ));

  return (
    <main className="bg-bg-base min-h-screen pb-32 lg:pb-0">
      {/* The demo profiles are fictional: say so, and offer the real thing. */}
      {!preview && DEMO_USERNAMES.includes(profile.username) && (
        <Link
          href="/order"
          className="bg-bg-ink text-text-on-ink fixed top-3 left-1/2 z-40 -translate-x-1/2 rounded-full px-4 py-2 text-[0.8125rem] font-[500] whitespace-nowrap"
        >
          Example profile · Get your own card
        </Link>
      )}
      {/* Stacked column on mobile; two-column split (hero | details) on desktop. */}
      <div className="lg:mx-auto lg:flex lg:min-h-screen lg:max-w-6xl">
        {/* Hero — top on mobile, left half (sticky, full height) on desktop. */}
        <div className="relative mx-auto w-full max-w-xl lg:mx-0 lg:w-1/2 lg:max-w-none lg:shrink-0">
          {/* Phones/tablets: a square photo with only location + name + title
              on its bottom edge, so the links grid below is on screen at load
              (see the ordered details column). Desktop: full-height left half
              with the full overlay. */}
          <div className="relative aspect-square w-full overflow-hidden md:rounded-b-[2.5rem] lg:sticky lg:top-0 lg:aspect-auto lg:h-screen lg:rounded-none">
            {profile.avatarUrl ? (
              <>
                {/* Shimmer underneath: visible until the photo paints over it,
                    so a slow image never leaves an empty black hero. */}
                <div className="absolute inset-0 animate-pulse bg-bg-subtle" aria-hidden />
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
                style={{ background: "var(--color-bg-subtle)" }}
              />
            )}
            {/* long, multi-stop wipe so the photo melts into the page — no hard edge.
                Mobile: short wipe over the bottom ~30% only (just the name block
                sits there). Desktop: the original long wipe under the full overlay. */}
            <div
              className="pointer-events-none absolute inset-0 lg:hidden"
              style={{
                background:
                  "linear-gradient(to top, var(--color-bg-base) 2%, rgba(238,236,234,0.82) 14%, rgba(238,236,234,0.32) 26%, transparent 38%)",
              }}
            />
            <div
              className="pointer-events-none absolute inset-0 hidden lg:block"
              style={{
                background:
                  "linear-gradient(to top, var(--color-bg-base) 4%, rgba(238,236,234,0.86) 22%, rgba(238,236,234,0.36) 42%, transparent 72%)",
              }}
            />

            <div className="absolute inset-x-5 top-6 flex items-center justify-end">
              <button
                onClick={async () => {
                  await shareProfile(profile.fullName, profile.username);
                  setShared(true);
                  setTimeout(() => setShared(false), 1500);
                }}
                aria-label={shared ? "Link copied" : "Share this profile"}
                className="glass-icon-btn flex size-10 items-center justify-center rounded-full text-text-primary"
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

        </div>

        {/* Details — below hero on mobile, right half (vertically centred) on desktop. */}
        {/* Phones: links first (order-1), then tags (order-2), then bio/stats
            (order-3), so contact options are visible without scrolling.
            Desktop (lg): original order (bio, links, save, footer). */}
        <div className="mx-auto flex w-full max-w-xl flex-col lg:mx-0 lg:w-1/2 lg:max-w-none lg:justify-center lg:px-12 lg:py-16">
          {profile.interests && profile.interests.length > 0 && (
            <div
              className="order-2 mt-4 flex gap-2 overflow-x-auto px-5 pb-1 lg:hidden"
              style={{
                scrollbarWidth: "none",
                maskImage: "linear-gradient(to right, black 85%, transparent)",
                WebkitMaskImage: "linear-gradient(to right, black 85%, transparent)",
              }}
            >
              {interestPills}
            </div>
          )}

          <div className="order-3 mx-auto mt-4 w-[calc(100%-2.5rem)] lg:order-none lg:mt-0 lg:w-full">
            <div className="bg-bg-elevated rounded-2xl p-5">
              {profile.bio && (
                <p className="text-text-secondary text-sm leading-relaxed">{profile.bio}</p>
              )}

              <div className="mt-4 flex items-center gap-4 border-t border-bg-border pt-4">
                <div className="flex items-center gap-1.5">
                  <Eye className="text-accent size-4" />
                  <span className="text-text-primary text-sm font-[600]">{stats.views.toLocaleString()}</span>
                  <span className="text-text-muted text-xs">views</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <Bookmark className="text-accent size-4" />
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
            <div className="order-1 mx-auto mt-4 w-[calc(100%-2.5rem)] lg:order-none lg:mt-5 lg:w-full">
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
              className="bg-accent text-accent-ink flex w-full items-center justify-center gap-2 rounded-full py-3.5 text-sm font-[600] transition-colors duration-200 ease-out hover:bg-accent-hover"
            >
              <Download className="size-4" />
              Save Contact
            </button>
          </div>

          <div className="order-4 mx-auto mt-10 flex w-[calc(100%-2.5rem)] flex-col items-center gap-4 border-t border-bg-border pt-6 lg:order-none lg:w-full">
            <Link href="/" className="flex items-center gap-1.5 opacity-70 transition-opacity hover:opacity-100">
              <Image src="/brand/u-mark-ink.png" alt="" width={14} height={16} />
              <span className="text-text-muted text-xs font-[500]">This profile is powered by Unitouch</span>
            </Link>
            <Link
              href="/"
              className="glass text-text-primary rounded-full px-4 py-2 text-xs font-[500]"
            >
              Get your own Unitouch card
            </Link>
          </div>
        </div>
      </div>

      {/* Save Contact — fixed bottom bar on mobile only. */}
      <div className="fixed inset-x-0 bottom-0 z-10 px-5 pb-6 pt-4 lg:hidden">
        <div className="bg-bg-base absolute inset-0 -z-10" />
        {/* Scroll hint: a small line inside the bar (so it never covers page
            content) that collapses for good on the first scroll. */}
        <div
          aria-hidden
          className={`text-text-secondary flex items-center justify-center gap-1.5 overflow-hidden text-xs font-[500] transition-all duration-500 ease-out ${
            hint === "shown" ? "mb-3 max-h-6 opacity-100" : "mb-0 max-h-0 opacity-0"
          }`}
        >
          <ChevronDown className="size-3.5 motion-safe:animate-bounce" />
          More about {firstName}
        </div>
        <button
          onClick={handleSaveContact}
          className="bg-accent text-accent-ink mx-auto flex w-full max-w-xl items-center justify-center gap-2 rounded-full py-3.5 text-sm font-[600] transition-colors duration-200 ease-out hover:bg-accent-hover"
        >
          <Download className="size-4" />
          Save Contact
        </button>
      </div>
    </main>
  );
}
