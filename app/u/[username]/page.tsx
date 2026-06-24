import { notFound } from "next/navigation";
import StandardProfile from "@/components/profile/StandardProfile";
import PersonalProfile from "@/components/profile/PersonalProfile";
import { DEMO_PROFILES, DEMO_STATS } from "@/lib/profile-demo";

export default async function ProfilePage({
  params,
}: {
  params: Promise<{ username: string }>;
}) {
  const { username } = await params;
  const profile = DEMO_PROFILES[username];
  if (!profile) notFound();

  const stats = DEMO_STATS[username] ?? { views: 0, saves: 0 };

  return profile.profileStyle === "personal" ? (
    <PersonalProfile profile={profile} stats={stats} />
  ) : (
    <StandardProfile profile={profile} stats={stats} />
  );
}
