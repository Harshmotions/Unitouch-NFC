import Link from "next/link";
import { ChevronLeft } from "lucide-react";
import type { Profile } from "@/types";
import ProfileStudio from "@/components/studio/ProfileStudio";

/* Admin wrapper around the same form the customer digital studio uses —
   points it at the admin-only update route (no OTP, no ownership check,
   just the requireAdmin gate already enforced by the layout above this). */
export default function ProfileEditor({ profile }: { profile: Profile }) {
  return (
    <div className="flex flex-col gap-6">
      <Link
        href="/admin/profiles"
        className="text-text-muted hover:text-text-primary flex items-center gap-1 text-sm"
      >
        <ChevronLeft className="size-4" />
        All profiles
      </Link>
      <div>
        <h1 className="font-display text-h2 text-text-primary font-[600]">{profile.fullName || profile.username}</h1>
        <p className="text-text-secondary text-sm">@{profile.username}</p>
      </div>
      <ProfileStudio
        initialProfile={profile}
        updateEndpoint={`/api/admin/profiles/${profile.id}`}
        backHref="/admin/profiles"
      />
    </div>
  );
}
