import { listProfilesForAdmin } from "@/lib/profile";
import ProfilesList from "@/components/admin/ProfilesList";

export default async function AdminProfilesPage() {
  const profiles = await listProfilesForAdmin();

  return (
    <div className="flex flex-col gap-6">
      <h1 className="font-display text-h2 text-text-primary font-[600]">Profiles</h1>
      <ProfilesList profiles={profiles} />
    </div>
  );
}
