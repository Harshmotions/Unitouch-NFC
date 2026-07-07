import { notFound } from "next/navigation";
import PersonalProfile from "@/components/profile/PersonalProfile";
import { getPublishedProfile } from "@/lib/profile";
import { getProfileStats } from "@/lib/analytics";

export default async function ProfilePage({
  params,
}: {
  params: Promise<{ username: string }>;
}) {
  const { username } = await params;
  const profile = await getPublishedProfile(username);
  if (!profile) notFound();

  const stats = await getProfileStats(username);

  return <PersonalProfile profile={profile} stats={stats} />;
}
