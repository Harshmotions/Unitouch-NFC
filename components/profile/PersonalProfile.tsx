"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import {
  Share2,
  Check,
  BadgeCheck,
  Eye,
  Bookmark,
  Phone,
  MessageCircle,
  Download,
  Globe,
  MapPin,
} from "lucide-react";
import type { Profile, EventType } from "@/types";
import { formatMemberSince } from "@/lib/profile-demo";
import { downloadVCard } from "@/lib/vcard";
import { track } from "@/lib/track";
import { shareProfile } from "@/lib/share";
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
}: {
  profile: Profile;
  stats: { views: number; saves: number };
}) {
  const [shared, setShared] = useState(false);

  useEffect(() => {
    track("page_view", profile.username);
  }, [profile.username]);

  const actions: { icon: typeof Phone; label: string; href?: string; onClick?: () => void }[] = [
    {
      icon: Phone,
      label: "Call",
      href: profile.phone && `tel:${profile.phone}`,
      onClick: () => track("phone_click", profile.username),
    },
    {
      icon: MessageCircle,
      label: "WhatsApp",
      href: profile.whatsapp && `https://wa.me/${profile.whatsapp.replace(/\D/g, "")}`,
      onClick: () => track("whatsapp_click", profile.username),
    },
    {
      icon: Globe,
      label: "Website",
      href: profile.website,
      onClick: () => track("website_click", profile.username),
    },
    {
      icon: Download,
      label: "Save",
      onClick: () => {
        downloadVCard(profile);
        track("contact_save", profile.username);
      },
    },
  ].filter((action) => action.href || action.label === "Save");

  // WhatsApp and Website are already covered by the bottom action dock —
  // this grid only surfaces the other platforms, so nothing is duplicated.
  const links: { platform: PlatformKey; label: string; href?: string }[] = [
    { platform: "instagram", label: "Instagram", href: profile.instagram },
    { platform: "linkedin", label: "LinkedIn", href: profile.linkedin },
    { platform: "twitter", label: "X (Twitter)", href: profile.twitter },
    { platform: "youtube", label: "YouTube", href: profile.youtube },
    { platform: "email", label: "Email", href: profile.email && `mailto:${profile.email}` },
  ];
  const visibleLinks = links.filter(withHref);

  return (
    <main className="bg-bg-base min-h-screen pb-32">
      {/* contained column — full-bleed on mobile, centred card on desktop */}
      <div className="relative mx-auto max-w-xl">
        <div className="relative h-[52vh] max-h-[560px] w-full overflow-hidden md:rounded-b-[2.5rem]">
          {profile.avatarUrl ? (
            <Image
              src={profile.avatarUrl}
              alt={profile.fullName}
              fill
              priority
              className="object-cover object-top"
            />
          ) : (
            <div
              className="absolute inset-0"
              style={{
                background:
                  "radial-gradient(120% 80% at 20% 0%, var(--color-accent-purple-glow-soft), transparent 60%), linear-gradient(160deg, #1b1030 0%, #100a1c 45%, #080808 100%)",
              }}
            />
          )}
          {/* long, multi-stop wipe so the photo melts into the page — no hard edge */}
          <div
            className="pointer-events-none absolute inset-0"
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
              className="glass-icon-btn flex size-10 items-center justify-center rounded-full text-text-primary"
            >
              {shared ? <Check className="text-success size-4" /> : <Share2 className="size-4" />}
            </button>
          </div>

          <div className="absolute inset-x-6 bottom-6">
            {profile.location && (
              <div className="text-text-primary/90 mb-1.5 flex items-center gap-1.5 text-sm">
                <MapPin className="size-3.5" />
                {profile.location}
              </div>
            )}
            <div className="flex items-center gap-2">
              <h1 className="font-display text-h3 text-text-primary font-[600]">{profile.fullName}</h1>
              {profile.isPublished && <BadgeCheck className="text-verified size-5" />}
            </div>
            <p className="text-text-secondary text-sm">{profile.designation}</p>

            {profile.interests && profile.interests.length > 0 && (
              <div className="mt-3 flex flex-wrap gap-2">
                {profile.interests.map((tag) => (
                  <span
                    key={tag}
                    className="glass-pill text-text-primary rounded-full px-4 py-2 text-sm font-[500]"
                  >
                    {tag}
                  </span>
                ))}
              </div>
            )}
          </div>
        </div>

        <div className="mx-auto mt-4 w-[calc(100%-2.5rem)]">
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
          <div className="mx-auto mt-5 w-[calc(100%-2.5rem)]">
            <PlatformGrid
              items={visibleLinks}
              onItemClick={(platform) => {
                const eventType = PLATFORM_EVENTS[platform];
                if (eventType) track(eventType, profile.username);
              }}
            />
          </div>
        )}
      </div>

      <div className="fixed bottom-0 left-1/2 z-10 w-full max-w-xl -translate-x-1/2 px-5 pb-6 pt-4">
        <div className="bg-bg-base/80 absolute inset-0 -z-10 backdrop-blur-xl" />
        <div className="flex items-center justify-center gap-4">
          {actions.map(({ icon: Icon, label, href, onClick }) =>
            href ? (
              <a
                key={label}
                href={href}
                target="_blank"
                rel="noopener noreferrer"
                onClick={onClick}
                className="glass-icon-btn flex flex-1 flex-col items-center gap-1.5 rounded-2xl py-3.5 text-text-primary transition-transform active:scale-[0.96]"
              >
                <Icon className="size-5" />
                <span className="text-xs">{label}</span>
              </a>
            ) : (
              <button
                key={label}
                onClick={onClick}
                className="glass-icon-btn flex flex-1 flex-col items-center gap-1.5 rounded-2xl py-3.5 text-text-primary transition-transform active:scale-[0.96]"
              >
                <Icon className="size-5" />
                <span className="text-xs">{label}</span>
              </button>
            )
          )}
        </div>
      </div>
    </main>
  );
}
