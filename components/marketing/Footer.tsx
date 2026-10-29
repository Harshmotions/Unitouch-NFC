"use client";

import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import { handleHashLinkClick } from "@/lib/scroll";
import { BUSINESS } from "@/lib/business";
import Button from "@/components/ui/Button";

const EXPLORE = [
  { label: "How it works", href: "#how-it-works" },
  { label: "Pricing", href: "#pricing" },
  { label: "Questions", href: "#faq" },
  { label: "Demo profile", href: "/u/priya" },
];

const ACCOUNT = [
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

/* A compact footer in the page's centred column: the brand and the one
   action, three short link columns, then every policy and the legal line.
   It also sits under the inner pages (app/(site)/layout.tsx), where
   "#pricing" etc. become "/#pricing". */
export default function Footer() {
  const onHome = usePathname() === "/";

  const linkFor = (href: string) => {
    const isHash = href.startsWith("#");
    return {
      href: isHash && !onHome ? `/${href}` : href,
      onClick: isHash && onHome ? handleHashLinkClick(href) : undefined,
    };
  };

  return (
    <footer id="site-footer" className="bg-bg-subtle">
      <div className="container-page py-14 md:py-16">
        <div className="flex flex-col gap-6 md:flex-row md:items-center md:justify-between">
          <div>
            <Link href="/" className="flex w-fit items-center gap-2.5" aria-label="Unitouch home">
              <Image src="/brand/u-mark-ink.png" alt="" width={22} height={25} />
              <span className="font-display text-[1.25rem] font-[600]">Unitouch</span>
            </Link>
            <p className="text-text-secondary mt-3 max-w-[32ch] text-[0.9375rem]">
              NFC business cards with a live profile. Made in Kolhapur.
            </p>
          </div>
          <Button variant="ink" size="md" href="/order" className="w-fit">
            Order your card
          </Button>
        </div>

        <div className="mt-12 grid gap-10 text-[0.9375rem] sm:grid-cols-3">
          <nav aria-label="Explore" className="flex flex-col gap-2.5">
            <p className="text-text-secondary text-[0.8125rem] font-[500]">Explore</p>
            {EXPLORE.map((l) => (
              <a key={l.label} {...linkFor(l.href)} className="link-draw w-fit">
                {l.label}
              </a>
            ))}
          </nav>
          <nav aria-label="Account" className="flex flex-col gap-2.5">
            <p className="text-text-secondary text-[0.8125rem] font-[500]">Your card</p>
            {ACCOUNT.map((l) => (
              <Link key={l.label} href={l.href} className="link-draw w-fit">
                {l.label}
              </Link>
            ))}
          </nav>
          <div className="flex flex-col gap-2.5">
            <p className="text-text-secondary text-[0.8125rem] font-[500]">Contact</p>
            <a href={`mailto:${BUSINESS.email}`} className="link-draw w-fit">
              {BUSINESS.email}
            </a>
            <a href={`tel:${BUSINESS.phone}`} className="link-draw w-fit">
              {BUSINESS.phoneDisplay}
            </a>
            <p className="text-text-secondary">{BUSINESS.addressLines.join(", ")}</p>
          </div>
        </div>

        <div className="border-bg-border mt-12 flex flex-col gap-4 border-t pt-6 text-[0.8125rem] md:flex-row md:items-center md:justify-between">
          <nav aria-label="Policies" className="flex flex-wrap gap-x-5 gap-y-2">
            {POLICIES.map((p) => (
              <Link key={p.href} href={p.href} className="link-draw">
                {p.label}
              </Link>
            ))}
          </nav>
          <p className="text-text-secondary">
            © {new Date().getFullYear()} {BUSINESS.legalName}. All rights reserved.
          </p>
        </div>
      </div>
    </footer>
  );
}
