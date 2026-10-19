import { notFound } from "next/navigation";
import { getProfileById } from "@/lib/profile";
import ProfileEditor from "@/components/admin/ProfileEditor";
import ProfileStatsPanel from "@/components/admin/ProfileStatsPanel";
import { getProfileStatsDetail } from "@/lib/admin-stats";

export default async function AdminProfileEditPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const profile = await getProfileById(id);
  if (!profile) notFound();
  const stats = await getProfileStatsDetail(profile.username);

  return (
    <ProfileEditor profile={profile}>
      <ProfileStatsPanel stats={stats} />
    </ProfileEditor>
  );
}
