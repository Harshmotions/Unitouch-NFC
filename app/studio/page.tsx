import { redirect } from "next/navigation";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { claimProfilesForUser, getEditableProfile } from "@/lib/profile";
import ProfileStudio from "@/components/studio/ProfileStudio";
import Button from "@/components/ui/Button";
import SignOutButton from "@/components/auth/SignOutButton";

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

  const profile = await getEditableProfile(user.id, username);

  return (
    <main className="bg-bg-base min-h-screen px-6 py-16">
      <div className="mx-auto w-full max-w-2xl">
        <h1 className="font-display text-h2 text-text-primary mb-2 font-[600]">Build your profile</h1>
        <p className="text-text-secondary mb-10">
          Add your details and links, preview it, then publish when you&apos;re ready.
        </p>

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
