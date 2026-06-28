"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import { Share2, Check, Eye, Bookmark, MapPin, Download } from "lucide-react";
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

const initials = (name: string) =>
  name
    .split(" ")
    .map((part) => part[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();

export default function StandardProfile({
  profile,
  stats,
  preview = false,
}: {
  profile: Profile;
  stats: { views: number; saves: number };
  preview?: boolean;
}) {
  const [shared, setShared] = useState(false);

  const safeTrack: typeof track = (eventType, username, metadata) => {
    if (!preview) track(eventType, username, metadata);
  };

  useEffect(() => {
    if (!preview) track("page_view", profile.username);
  }, [preview, profile.username]);

  const links: { platform?: PlatformKey; label: string; href?: string }[] = [
    {
      platform: "whatsapp",
      label: "WhatsApp",
      href: profile.whatsapp && `https://wa.me/${profile.whatsapp.replace(/\D/g, "")}`,
    },
    { platform: "email", label: "Email", href: profile.email && `mailto:${profile.email}` },
    { platform: "website", label: "Website", href: profile.website && withProtocol(profile.website) },
    { platform: "instagram", label: "Instagram", href: profile.instagram && withProtocol(profile.instagram) },
    { platform: "linkedin", label: "LinkedIn", href: profile.linkedin && withProtocol(profile.linkedin) },
    ...(profile.extraLinks ?? []).map((link) => ({ label: link.label, href: link.url })),
  ];
  const visibleLinks = links.filter(withHref);

  return (
    <main className="bg-bg-base min-h-screen px-5 pt-6 pb-28">
      <div className="mx-auto flex w-full max-w-md items-center justify-end">
        <button
          onClick={async () => {
            await shareProfile(profile.fullName, profile.username);
            setShared(true);
            setTimeout(() => setShared(false), 1500);
          }}
          className="glass-icon-btn glass-stroke-3 flex size-10 items-center justify-center rounded-full text-text-primary"
        >
          {shared ? <Check className="text-success size-4" /> : <Share2 className="size-4" />}
        </button>
      </div>

      <div className="mx-auto flex w-full max-w-md flex-col items-center gap-4 pt-8 text-center">
        {profile.avatarUrl ? (
          <div className="border-accent-purple/30 relative size-36 overflow-hidden rounded-full border shadow-[inset_0_1px_0_rgba(255,255,255,0.1)]">
            <Image src={profile.avatarUrl} alt={profile.fullName} fill className="object-cover" />
            <div className="pointer-events-none absolute inset-x-0 bottom-0 h-2/5 bg-gradient-to-t from-black/75 to-transparent" />
          </div>
        ) : (
          <div className="bg-accent-purple/15 border-accent-purple/30 flex size-36 items-center justify-center rounded-full border text-2xl font-[700] text-accent-purple shadow-[inset_0_1px_0_rgba(255,255,255,0.1)]">
            {initials(profile.fullName)}
          </div>
        )}
        <div>
          <h1 className="font-display text-h3 text-text-primary font-[600]">{profile.fullName}</h1>
          <p className="text-text-secondary text-sm">
            {profile.designation}
            {profile.company ? ` · ${profile.company}` : ""}
          </p>
        </div>
        <span className="glass-pill glass-stroke-1 text-text-secondary rounded-full px-3.5 py-1.5 text-xs">
          Unitouch member since {formatMemberSince(profile.createdAt)}
        </span>
      </div>

      <div className="surface-card mx-auto mt-6 flex w-full max-w-md divide-x divide-white/[0.06] rounded-2xl">
        <div className="flex flex-1 flex-col items-center gap-1 py-4">
          <Eye className="text-accent-purple size-4" />
          <span className="text-text-primary text-sm font-[600]">{stats.views.toLocaleString()}</span>
          <span className="text-text-muted text-xs">Views</span>
        </div>
        <div className="flex flex-1 flex-col items-center gap-1 py-4">
          <Bookmark className="text-accent-purple size-4" />
          <span className="text-text-primary text-sm font-[600]">{stats.saves.toLocaleString()}</span>
          <span className="text-text-muted text-xs">Saves</span>
        </div>
      </div>

      {profile.bio && (
        <p className="text-text-secondary mx-auto mt-6 max-w-md text-center text-sm leading-relaxed">
          {profile.bio}
        </p>
      )}

      {profile.location && (
        <div className="text-text-muted mx-auto mt-3 flex items-center justify-center gap-1.5 text-xs">
          <MapPin className="size-3.5" />
          {profile.location}
        </div>
      )}

      {profile.interests && profile.interests.length > 0 && (
        <div className="mx-auto mt-5 flex w-full max-w-md flex-wrap justify-center gap-2">
          {profile.interests.map((tag, i) => (
            <span
              key={tag}
              className={`glass-pill glass-stroke-${((i + 1) % 4) + 1} text-text-primary rounded-full px-4 py-2 text-sm font-[500]`}
            >
              {tag}
            </span>
          ))}
        </div>
      )}

      <div className="mx-auto mt-8 w-full max-w-md">
        <PlatformGrid
          items={visibleLinks}
          onItemClick={(platform) => {
            const eventType = PLATFORM_EVENTS[platform];
            if (eventType) safeTrack(eventType, profile.username);
          }}
        />
      </div>

      <div className="fixed inset-x-0 bottom-0 z-10 px-5 pb-6 pt-4">
        <div className="bg-bg-base/80 absolute inset-0 -z-10 backdrop-blur-xl" />
        <button
          onClick={() => {
            downloadVCard(profile);
            safeTrack("contact_save", profile.username);
          }}
          className="bg-accent-purple text-bg-base mx-auto flex w-full max-w-md items-center justify-center gap-2 rounded-full py-3.5 text-sm font-[600] shadow-[inset_0_1px_0_rgba(255,255,255,0.25),0_10px_30px_-12px_var(--color-accent-purple-glow)] transition-all duration-200 ease-out hover:brightness-[1.07]"
        >
          <Download className="size-4" />
          Save Contact
        </button>
      </div>
    </main>
  );
}
