import { cache } from "react";
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import PersonalProfile from "@/components/profile/PersonalProfile";
import ProfileNotLive from "@/components/profile/ProfileNotLive";
import { getPublishedProfile } from "@/lib/profile";
import { getProfileStats } from "@/lib/analytics";
import { SHARE_IMAGE } from "@/lib/seo";
import { createServiceRoleClient } from "@/lib/supabase/server";

/* A link that was bought but isn't published yet (the owner hasn't finished
   it in the studio) gets a friendly "not live yet" page instead of a bare
   404, since the owner lands here from the order success page. This reveals
   nothing new: /api/profiles/check-username already says whether a
   username is taken. */
async function isReservedUsername(username: string): Promise<boolean> {
  const { data } = await createServiceRoleClient()
    .from("profiles")
    .select("id")
    .eq("username", username)
    .maybeSingle();
  return Boolean(data);
}

// generateMetadata and the page both need the profile: one query per request.
const loadProfile = cache((username: string) => getPublishedProfile(username));

function normalize(rawUsername: string): string {
  return decodeURIComponent(rawUsername).trim().toLowerCase();
}

/* Share preview (WhatsApp, LinkedIn, iMessage) for a published profile: the
   person's name, their role, and their photo (or the Unitouch share picture
   when they haven't added one). Unpublished or unknown links stay out of
   search results and get no personal details. */
export async function generateMetadata({
  params,
}: {
  params: Promise<{ username: string }>;
}): Promise<Metadata> {
  const username = normalize((await params).username);
  const profile = await loadProfile(username);
  if (!profile) {
    return { title: "Profile not available", robots: { index: false, follow: false } };
  }

  const role = [profile.designation, profile.company].filter(Boolean).join(" at ");
  const description = (
    role
      ? `${role}. Tap to save ${profile.fullName}'s contact and connect.`
      : profile.bio || `Tap to save ${profile.fullName}'s contact and connect.`
  ).slice(0, 200);
  const url = `/u/${profile.username}`;
  const images = profile.avatarUrl
    ? [{ url: profile.avatarUrl, alt: profile.fullName }]
    : [SHARE_IMAGE];

  return {
    title: profile.fullName,
    description,
    alternates: { canonical: url },
    openGraph: { type: "profile", siteName: "Unitouch", title: profile.fullName, description, url, images },
    // A square photo reads better as a small card than a cropped wide one.
    twitter: { card: profile.avatarUrl ? "summary" : "summary_large_image", images: images.map((i) => i.url) },
  };
}

export default async function ProfilePage({
  params,
}: {
  params: Promise<{ username: string }>;
}) {
  const username = normalize((await params).username);
  const profile = await loadProfile(username);
  if (!profile) {
    if (await isReservedUsername(username)) return <ProfileNotLive username={username} />;
    notFound();
  }

  const stats = await getProfileStats(username);

  return <PersonalProfile profile={profile} stats={stats} />;
}
