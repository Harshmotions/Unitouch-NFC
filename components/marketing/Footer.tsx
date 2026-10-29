"use client";

import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import { handleHashLinkClick } from "@/lib/scroll";
import { BUSINESS } from "@/lib/business";
import Reveal from "@/components/motion/Reveal";

const MENU = [
  { label: "How it works", href: "#how-it-works" },
  { label: "Pricing", href: "#pricing" },
  { label: "Questions", href: "#faq" },
  { label: "Demo profile", href: "/u/priya" },
  { label: "Order your card", href: "/order" },
  { label: "Log in", href: "/login" },
];

/* Razorpay's website check expects every page to link to each of these. */
const POLICIES = [
  { label: "Privacy Policy", href: "/privacy" },
  { label: "Terms of Service", href: "/terms" },
  { label: "Cancellation & Refunds", href: "/refunds" },
  { label: "Shipping Policy", href: "/shipping" },
  { label: "Contact Us", href: "/contact" },
];

/* The close: half the footer is the card again, from closer than anywhere
   above; the other half is the site's menu set large, then the contact
   details and every policy. The footer also sits under the inner pages
   (app/(site)/layout.tsx), where "#pricing" etc. become "/#pricing". */
export default function Footer() {
  const onHome = usePathname() === "/";

  return (
    <footer id="site-footer" className="bg-bg-subtle grid md:min-h-[100svh] md:grid-cols-12">
      <div className="bg-bg-field relative h-[50svh] overflow-hidden md:col-span-6 md:h-auto">
        <Image
          src="/cards/card-close.webp"
          alt="A Unitouch card up close, its fingerprint U catching the light"
          fill
          sizes="(min-width: 768px) 50vw, 100vw"
          className="object-cover object-[30%_60%]"
        />
      </div>

      <div className="flex flex-col px-[var(--margin)] py-12 md:col-span-6 md:col-start-7 md:py-16 md:pl-[8.333%]">
        <Link href="/" className="flex items-center gap-2.5" aria-label="Unitouch home">
          <Image src="/brand/u-mark-ink.png" alt="" width={22} height={25} />
          <span className="font-display text-[1.25rem] font-[650]">Unitouch</span>
        </Link>

        <nav aria-label="Footer" className="mt-10 md:mt-14">
          <Reveal className="flex flex-col items-start gap-3 md:gap-4">
          {MENU.map((item) => {
            const isHash = item.href.startsWith("#");
            return (
              <a
                key={item.label}
                href={isHash && !onHome ? `/${item.href}` : item.href}
                onClick={isHash && onHome ? handleHashLinkClick(item.href) : undefined}
                className="font-display text-[clamp(2rem,1rem+3vw,2.75rem)] leading-[1.05] font-[650] transition-transform duration-[240ms] ease-[var(--ease-out)] hover:translate-x-3"
              >
                {item.label}
              </a>
            );
          })}
          </Reveal>
        </nav>

        <div className="mt-14 grid gap-8 text-[0.9375rem] sm:grid-cols-2 md:mt-16">
          <div className="flex flex-col gap-1">
            <p className="font-[600]">Contact</p>
            <a href={`mailto:${BUSINESS.email}`} className="link-draw w-fit">
              {BUSINESS.email}
            </a>
            <a href={`tel:${BUSINESS.phone}`} className="link-draw w-fit">
              {BUSINESS.phoneDisplay}
            </a>
          </div>
          <div className="flex flex-col gap-1">
            <p className="font-[600]">Made in Kolhapur</p>
            {BUSINESS.addressLines.map((line) => (
              <p key={line}>{line}</p>
            ))}
          </div>
        </div>

        <nav aria-label="Policies" className="mt-10 flex flex-wrap gap-x-5 gap-y-2 text-[0.9375rem] md:mt-auto md:pt-16">
          {POLICIES.map((p) => (
            <Link key={p.href} href={p.href} className="link-draw">
              {p.label}
            </Link>
          ))}
        </nav>
        <p className="text-text-secondary mt-4 text-[0.9375rem]">
          © {new Date().getFullYear()} {BUSINESS.legalName}. All rights reserved.
        </p>
      </div>
    </footer>
  );
}
