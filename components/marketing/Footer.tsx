"use client";

import Link from "next/link";
import Image from "next/image";
import { handleHashLinkClick } from "@/lib/scroll";
import { BUSINESS } from "@/lib/business";

const LINKS = [
  { label: "Home", href: "/" },
  { label: "Features", href: "#features" },
  { label: "Pricing", href: "#pricing" },
  { label: "FAQ", href: "#faq" },
];

export default function Footer() {
  return (
    <footer id="site-footer" className="border-t border-white/[0.06] px-6 py-16">
      <div className="mx-auto flex w-full max-w-6xl flex-col items-center justify-between gap-8 sm:flex-row sm:items-start">
        <div className="flex flex-col items-center gap-2 sm:items-start">
          <Link href="/" className="flex items-center gap-2">
            <Image src="/logo.png" alt="Unitouch" width={24} height={24} />
            <span className="font-display text-text-primary font-[600]">Unitouch</span>
          </Link>
          <p className="text-text-muted text-sm">Tap. Connect. Impress.</p>
        </div>

        <div className="flex gap-6">
          {LINKS.map((link) => (
            <a
              key={link.label}
              href={link.href}
              onClick={link.href.startsWith("#") ? handleHashLinkClick(link.href) : undefined}
              className="text-text-secondary hover:text-text-primary text-sm transition-colors"
            >
              {link.label}
            </a>
          ))}
        </div>

        <div className="text-text-muted flex flex-col items-center gap-1 text-sm sm:items-end">
          <a href={`tel:${BUSINESS.phone}`} className="hover:text-text-primary transition-colors">
            {BUSINESS.phoneDisplay}
          </a>
          <a href={`mailto:${BUSINESS.email}`} className="hover:text-text-primary transition-colors">
            {BUSINESS.email}
          </a>
          <p className="text-center sm:text-right">{BUSINESS.addressLines.join(", ")}</p>
        </div>
      </div>

      <div className="mx-auto mt-10 flex w-full max-w-6xl flex-col items-center justify-between gap-3 border-t border-white/[0.06] pt-8 sm:flex-row">
        <p className="text-text-muted text-xs">
          © {new Date().getFullYear()} {BUSINESS.legalName}. All rights reserved. Made in India 🇮🇳
        </p>
        <div className="flex flex-wrap justify-center gap-4">
          <Link href="/privacy" className="text-text-muted hover:text-text-primary text-xs transition-colors">
            Privacy Policy
          </Link>
          <Link href="/terms" className="text-text-muted hover:text-text-primary text-xs transition-colors">
            Terms of Service
          </Link>
          <Link href="/refunds" className="text-text-muted hover:text-text-primary text-xs transition-colors">
            Cancellation &amp; Refunds
          </Link>
          <Link href="/shipping" className="text-text-muted hover:text-text-primary text-xs transition-colors">
            Shipping Policy
          </Link>
          <Link href="/contact" className="text-text-muted hover:text-text-primary text-xs transition-colors">
            Contact Us
          </Link>
        </div>
      </div>
    </footer>
  );
}
