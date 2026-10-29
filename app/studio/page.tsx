import type { Metadata } from "next";
import { redirect } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { claimProfilesForUser, getEditableProfile, getOwnedProfiles } from "@/lib/profile";
import ProfileStudio from "@/components/studio/ProfileStudio";
import YourOrders from "@/components/studio/YourOrders";
import ProfileAnalytics from "@/components/studio/ProfileAnalytics";
import { getOrdersForCustomer } from "@/lib/customer-orders";
import { getProfileStatsDetail } from "@/lib/profile-stats";
import Button from "@/components/ui/Button";
import SignOutButton from "@/components/auth/SignOutButton";

export const metadata: Metadata = { title: "Your profile studio", robots: { index: false, follow: false } };

/* The digital studio. Requires sign-in; loads the user's profile (the one
   just ordered, if a username is passed, else their most recent) and lets
   them build and publish it. */
export default async function StudioPage({
  searchParams,
}: {
  searchParams: Promise<{ username?: string }>;
}) {
  const { username } = await searchParams;

  const supabase = await createServerSupabaseClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  // Guest checkout leaves new orders unowned; attach any paid ones placed
  // with this (OTP-verified) email before loading. No-op once claimed.
  if (user.email) await claimProfilesForUser(user.id, user.email);

  const [profile, ownedProfiles, orders] = await Promise.all([
    getEditableProfile(user.id, username),
    getOwnedProfiles(user.id),
    getOrdersForCustomer(user.id),
  ]);

  // Analytics is a Premium feature: only for a profile whose (paid, owned)
  // order is a Premium card. Standard profiles see nothing for now.
  const isPremium = Boolean(profile && orders.some((o) => o.username === profile.username && o.cardType === "premium"));
  const analytics = isPremium && profile ? await getProfileStatsDetail(profile.username) : null;

  return (
    <main className="bg-bg-base min-h-screen px-6 pt-6 pb-16">
      <Link href="/" className="flex w-fit items-center gap-2.5" aria-label="Unitouch home">
        <Image src="/brand/u-mark-ink.png" alt="" width={22} height={25} />
        <span className="font-display text-[1.25rem] font-[650]">Unitouch</span>
      </Link>
      <div className="mx-auto mt-10 w-full max-w-2xl">
        <h1 className="font-display text-h2 text-text-primary mb-2 font-[600]">Build your profile</h1>
        <p className="text-text-secondary mb-10">
          Add your details and links, preview it, then publish when you&apos;re ready.
        </p>

        {ownedProfiles.length > 0 && (
          <section className="surface-card mb-8 rounded-2xl p-4" aria-label="Your profiles">
            <div className="mb-3 flex items-center justify-between gap-3">
              <div>
                <h2 className="text-text-primary font-[600]">Your profiles</h2>
                <p className="text-text-muted text-xs">
                  Every card ordered with {user.email} shows up here. Pick one to set it up.
                </p>
              </div>
              <span className="text-text-muted text-xs">{ownedProfiles.length} total</span>
            </div>
            <div className="flex flex-wrap gap-2">
              {ownedProfiles.map((ownedProfile) => {
                const selected = profile?.username === ownedProfile.username;
                return (
                  <Link
                    key={ownedProfile.username}
                    href={`/studio?username=${encodeURIComponent(ownedProfile.username)}`}
                    aria-current={selected ? "page" : undefined}
                    className={`rounded-xl border px-3 py-2 text-left text-sm transition-colors ${
                      selected
                        ? "border-accent bg-accent/10 text-text-primary"
                        : "border-bg-border bg-bg-elevated text-text-secondary hover:border-accent/40 hover:text-text-primary"
                    }`}
                  >
                    <span className="block font-[500]">@{ownedProfile.username}</span>
                    <span className="text-text-muted block text-xs">
                      {ownedProfile.fullName || "Untitled profile"} · {ownedProfile.isPublished ? "Live" : "Draft"}
                    </span>
                  </Link>
                );
              })}
            </div>
          </section>
        )}

        <YourOrders orders={orders} />

        {profile && analytics && <ProfileAnalytics username={profile.username} stats={analytics} />}

        {profile ? (
          <ProfileStudio initialProfile={profile} />
        ) : (
          <div className="surface-card rounded-2xl p-8 text-center">
            <p className="text-text-primary font-[600]">No profile to build yet</p>
            <p className="text-text-secondary mt-1 mb-6 text-sm">
              You&apos;re signed in as <span className="text-text-primary">{user.email}</span>. If you
              ordered with a different email, sign out and sign in with that one. Otherwise, order a
              card and your profile will appear here to set up.
            </p>
            <div className="flex flex-col items-center justify-center gap-3 sm:flex-row">
              <Button variant="primary" size="md" href="/order">
                Order a card
              </Button>
              <SignOutButton />
            </div>
          </div>
        )}
      </div>
    </main>
  );
}
