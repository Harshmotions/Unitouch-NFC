import Link from "next/link";
import Image from "next/image";
import Button from "@/components/ui/Button";

/* Shown at /u/[username] when the link has been bought but the owner hasn't
   published their profile yet (see app/u/[username]/page.tsx). */
export default function ProfileNotLive({ username }: { username: string }) {
  return (
    <main className="bg-bg-base flex min-h-screen flex-col items-center justify-center px-6 py-16 text-center">
      <Link href="/" className="mb-10 flex items-center gap-2">
        <Image src="/logo.png" alt="Unitouch" width={28} height={28} />
        <span className="font-display text-text-primary text-lg font-[600]">Unitouch</span>
      </Link>

      <p className="text-text-muted mb-3 text-sm">unitouch.in/u/{username}</p>
      <h1 className="font-display text-h2 text-text-primary mb-3 font-[600]">This profile isn&apos;t live yet</h1>
      <p className="text-text-secondary mb-8 max-w-md">
        Its owner is still setting it up. Check back soon.
      </p>

      <div className="surface-card mb-8 w-full max-w-md rounded-2xl p-6">
        <p className="text-text-primary mb-1 font-[600]">Is this your profile?</p>
        <p className="text-text-secondary mb-5 text-sm">
          Sign in with the email you used at checkout to finish it and publish it. We&apos;ll send you
          a one-time code.
        </p>
        <Button variant="primary" size="md" href="/login" className="w-full">
          Sign in to set it up
        </Button>
      </div>

      <Link href="/" className="text-text-muted hover:text-text-primary text-sm transition-colors">
        Get your own Unitouch card
      </Link>
    </main>
  );
}
