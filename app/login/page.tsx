"use client";

import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import OtpSignIn from "@/components/auth/OtpSignIn";

/* Sign-in page. On success (or if a session already exists) the customer is
   sent to the studio, their home base for editing their profile. Desktop
   gives the other half to the card itself; on a phone it's just the form. */
export default function LoginPage() {
  const router = useRouter();

  return (
    <main className="bg-bg-base grid min-h-screen lg:grid-cols-2">
      <div className="flex flex-col px-[var(--margin)] py-6">
        <Link href="/" className="flex w-fit items-center gap-2.5" aria-label="Unitouch home">
          <Image src="/brand/u-mark-ink.png" alt="" width={22} height={25} priority />
          <span className="font-display text-[1.25rem] font-[650]">Unitouch</span>
        </Link>

        <div className="mx-auto flex w-full max-w-sm flex-1 flex-col justify-center py-16">
          <h1 className="font-display text-[clamp(2.25rem,1.6rem+2vw,3.25rem)] font-[650]">Welcome back</h1>
          <p className="text-text-secondary mt-3 mb-8">
            Enter the email you used when ordering your card and we&apos;ll send you a one-time code.
          </p>
          <OtpSignIn
            onAuthenticated={() => router.replace("/studio")}
            redirectMessage="Signed in. Opening your profile…"
          />
          <p className="text-text-secondary mt-10 text-[0.9375rem]">
            No card yet?{" "}
            <Link href="/order" className="text-text-primary font-[550] underline underline-offset-4">
              Order one
            </Link>
          </p>
        </div>
      </div>

      <div className="bg-bg-field relative hidden overflow-hidden lg:block">
        <Image
          src="/cards/card-close.webp"
          alt=""
          fill
          sizes="50vw"
          className="object-cover object-[30%_60%]"
        />
      </div>
    </main>
  );
}
