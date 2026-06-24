import { Share2, Eye, Bookmark, MapPin, Download } from "lucide-react";
import type { Profile } from "@/types";
import { formatMemberSince } from "@/lib/profile-demo";
import { PlatformBadge } from "./PlatformIcons";

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
}: {
  profile: Profile;
  stats: { views: number; saves: number };
}) {
  const links = [
    {
      platform: "whatsapp" as const,
      label: "WhatsApp",
      href: profile.whatsapp && `https://wa.me/${profile.whatsapp.replace(/\D/g, "")}`,
    },
    { platform: "email" as const, label: "Email", href: profile.email && `mailto:${profile.email}` },
    { platform: "website" as const, label: "Website", href: profile.website },
    { platform: "instagram" as const, label: "Instagram", href: profile.instagram },
    { platform: "linkedin" as const, label: "LinkedIn", href: profile.linkedin },
  ].filter((link) => link.href);

  return (
    <main className="bg-bg-base min-h-screen px-5 pt-6 pb-28">
      <div className="mx-auto flex w-full max-w-md items-center justify-end">
        <button className="glass-icon-btn flex size-10 items-center justify-center rounded-full text-text-primary">
          <Share2 className="size-4" />
        </button>
      </div>

      <div className="mx-auto flex w-full max-w-md flex-col items-center gap-4 pt-8 text-center">
        <div className="bg-accent-purple/15 border-accent-purple/30 flex size-24 items-center justify-center rounded-3xl border text-2xl font-[700] text-accent-purple shadow-[inset_0_1px_0_rgba(255,255,255,0.1)]">
          {initials(profile.fullName)}
        </div>
        <div>
          <h1 className="font-display text-h3 text-text-primary font-[600]">{profile.fullName}</h1>
          <p className="text-text-secondary text-sm">
            {profile.designation}
            {profile.company ? ` · ${profile.company}` : ""}
          </p>
        </div>
        <span className="glass-pill text-text-secondary rounded-full px-3.5 py-1.5 text-xs">
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

      <div className="mx-auto mt-8 grid w-full max-w-md grid-cols-2 gap-2.5">
        {links.map(({ platform, label, href }, i) => (
          <a
            key={label}
            href={href}
            target="_blank"
            rel="noopener noreferrer"
            className={`glass-icon-btn flex items-center gap-3 rounded-xl px-3.5 py-3 text-text-primary transition-transform active:scale-[0.98] ${
              links.length % 2 === 1 && i === links.length - 1 ? "col-span-2" : ""
            }`}
          >
            <PlatformBadge platform={platform} className="size-9" />
            <span className="truncate text-sm font-[500]">{label}</span>
          </a>
        ))}
      </div>

      <div className="fixed inset-x-0 bottom-0 z-10 px-5 pb-6 pt-4">
        <div className="bg-bg-base/80 absolute inset-0 -z-10 backdrop-blur-xl" />
        <button className="bg-accent-purple text-bg-base mx-auto flex w-full max-w-md items-center justify-center gap-2 rounded-full py-3.5 text-sm font-[600] shadow-[inset_0_1px_0_rgba(255,255,255,0.25),0_10px_30px_-12px_var(--color-accent-purple-glow)] transition-all duration-200 ease-out hover:brightness-[1.07]">
          <Download className="size-4" />
          Save Contact
        </button>
      </div>
    </main>
  );
}
