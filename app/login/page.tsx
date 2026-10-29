"use client";

import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import OtpSignIn from "@/components/auth/OtpSignIn";
import { BUSINESS } from "@/lib/business";

/* Sign-in page. On success (or if a session already exists) the customer is
   sent to the studio, their home base for editing their profile.

   Left: the wordmark, then the form centred in its own column, then a line
   for help, so the eye goes straight to the one thing to do. Right (desktop
   only): an inset panel on the same fabric-and-grain ground as the
   homepage hero, with the whole card resting in it at a calm size and a
   short line on what signing in is for. */
export default function LoginPage() {
  const router = useRouter();

  return (
    <main className="bg-bg-base grid min-h-svh lg:grid-cols-[minmax(0,1fr)_minmax(0,1.1fr)]">
      <div className="flex min-h-svh flex-col px-[var(--margin)] py-6 lg:px-12">
        <Link href="/" className="flex w-fit items-center gap-2.5" aria-label="Unitouch home">
          <Image src="/brand/u-mark-ink.png" alt="" width={22} height={25} priority />
          <span className="font-display text-[1.25rem] font-[600]">Unitouch</span>
        </Link>

        <div className="mx-auto flex w-full max-w-[25rem] flex-1 flex-col justify-center py-14">
          <h1 className="font-display text-[clamp(2.25rem,1.8rem+1.4vw,3rem)] leading-[1.05] font-[600]">
            Welcome back
          </h1>
          <p className="text-text-secondary mt-4 mb-9 text-[1.0625rem] leading-relaxed">
            Enter the email you used when ordering your card and we&apos;ll send you a one-time code.
          </p>
          <OtpSignIn
            onAuthenticated={() => router.replace("/studio")}
            redirectMessage="Signed in. Opening your profile…"
          />
          <div className="bg-bg-border mt-10 h-px" />
          <p className="text-text-secondary mt-6 text-[0.9375rem]">
            No card yet?{" "}
            <Link href="/order" className="text-text-primary font-[500] underline underline-offset-4">
              Order one
            </Link>
          </p>
        </div>

        <p className="text-text-muted text-[0.875rem]">
          Trouble signing in?{" "}
          <a href={`mailto:${BUSINESS.email}`} className="text-text-secondary underline underline-offset-4">
            {BUSINESS.email}
          </a>
        </p>
      </div>

      <div className="hidden p-3 lg:block">
        <div className="bg-bg-subtle relative flex h-full flex-col overflow-hidden rounded-[32px]">
          <div aria-hidden className="fabric-shade absolute inset-0" />
          <div aria-hidden className="fabric-grain absolute inset-0" />

          <div className="relative flex flex-1 items-center justify-center px-10">
            <Image
              src="/cards/card-login.webp"
              alt="A Unitouch card printed with its owner's name, Priya Anand, and her title"
              width={1200}
              height={960}
              priority
              sizes="(min-width: 1024px) 40vw, 1px"
              className="h-auto w-[82%] max-w-[36rem]"
            />
          </div>

          <div className="relative px-12 pb-12">
            <p className="font-display text-[1.5rem] leading-tight font-[600]">Your profile, always up to date</p>
            <p className="text-text-secondary mt-2 max-w-[38ch] leading-relaxed">
              Change your photo, links and details any time. Every tap of your card shows the latest version.
            </p>
          </div>
        </div>
      </div>
    </main>
  );
}
