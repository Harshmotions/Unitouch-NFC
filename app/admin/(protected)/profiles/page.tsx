import { listAdminProfiles } from "@/lib/admin-profiles";
import { getViewSaveTotals } from "@/lib/profile-stats";
import ProfilesList from "@/components/admin/ProfilesList";

export default async function AdminProfilesPage() {
  const profiles = await listAdminProfiles();
  const stats = await getViewSaveTotals(profiles.map((p) => p.username));

  return (
    <div className="flex flex-col gap-6">
      <h1 className="font-display text-h2 text-text-primary font-[600]">Profiles</h1>
      <ProfilesList profiles={profiles} stats={stats} />
    </div>
  );
}
