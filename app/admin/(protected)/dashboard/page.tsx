import Link from "next/link";
import { listProfilesForAdmin } from "@/lib/profile";

export default async function AdminDashboardPage() {
  const profiles = await listProfilesForAdmin();
  const published = profiles.filter((p) => p.isPublished).length;
  const recent = profiles.slice(0, 5);

  return (
    <div className="flex flex-col gap-8">
      <h1 className="font-display text-h2 text-text-primary font-[600]">Dashboard</h1>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <div className="surface-card rounded-2xl p-5">
          <p className="text-text-muted text-xs">Total profiles</p>
          <p className="text-text-primary font-display mt-1 text-2xl font-[600]">{profiles.length}</p>
        </div>
        <div className="surface-card rounded-2xl p-5">
          <p className="text-text-muted text-xs">Published</p>
          <p className="text-text-primary font-display mt-1 text-2xl font-[600]">{published}</p>
        </div>
        <div className="surface-card rounded-2xl p-5">
          <p className="text-text-muted text-xs">Awaiting studio</p>
          <p className="text-text-primary font-display mt-1 text-2xl font-[600]">{profiles.length - published}</p>
        </div>
      </div>

      <div>
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-text-primary font-[600]">Recent signups</h2>
          <Link href="/admin/profiles" className="text-accent-purple text-sm hover:underline">
            View all →
          </Link>
        </div>
        <div className="surface-card divide-bg-border flex flex-col divide-y rounded-2xl">
          {recent.length === 0 && <p className="text-text-muted p-5 text-sm">No profiles yet.</p>}
          {recent.map((p) => (
            <Link
              key={p.id}
              href={`/admin/profiles/${p.id}`}
              className="hover:bg-bg-elevated/50 flex items-center justify-between px-5 py-4 text-sm transition-colors"
            >
              <div>
                <p className="text-text-primary font-[500]">{p.fullName || p.username}</p>
                <p className="text-text-muted text-xs">@{p.username}</p>
              </div>
              <span className={`text-xs ${p.isPublished ? "text-success" : "text-text-muted"}`}>
                {p.isPublished ? "Published" : "Draft"}
              </span>
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
}
