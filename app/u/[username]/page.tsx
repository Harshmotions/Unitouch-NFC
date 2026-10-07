import { notFound } from "next/navigation";
import PersonalProfile from "@/components/profile/PersonalProfile";
import ProfileNotLive from "@/components/profile/ProfileNotLive";
import { getPublishedProfile } from "@/lib/profile";
import { getProfileStats } from "@/lib/analytics";
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

export default async function ProfilePage({
  params,
}: {
  params: Promise<{ username: string }>;
}) {
  const { username: rawUsername } = await params;
  const username = decodeURIComponent(rawUsername).trim().toLowerCase();
  const profile = await getPublishedProfile(username);
  if (!profile) {
    if (await isReservedUsername(username)) return <ProfileNotLive username={username} />;
    notFound();
  }

  const stats = await getProfileStats(username);

  return <PersonalProfile profile={profile} stats={stats} />;
}
