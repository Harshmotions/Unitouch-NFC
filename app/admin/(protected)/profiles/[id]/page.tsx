import { notFound } from "next/navigation";
import { getProfileById } from "@/lib/profile";
import ProfileEditor from "@/components/admin/ProfileEditor";

export default async function AdminProfileEditPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const profile = await getProfileById(id);
  if (!profile) notFound();

  return <ProfileEditor profile={profile} />;
}
