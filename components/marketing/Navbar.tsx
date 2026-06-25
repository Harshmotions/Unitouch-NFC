"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { Menu, X } from "lucide-react";
import gsap from "gsap";
import Button from "@/components/ui/Button";
import { handleHashLinkClick } from "@/lib/scroll";

const NAV_LINKS = [
  { label: "Features", href: "#features" },
  { label: "How It Works", href: "#how-it-works" },
  { label: "Pricing", href: "#pricing" },
  { label: "Demo Profile", href: "#profile-demo" },
];

export default function Navbar() {
  const navRef = useRef<HTMLElement>(null);
  const [scrolled, setScrolled] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 80);
    window.addEventListener("scroll", onScroll);
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  useEffect(() => {
    if (!navRef.current) return;
    const prefersReducedMotion = window.matchMedia(
      "(prefers-reduced-motion: reduce)"
    ).matches;
    if (prefersReducedMotion) return;

    const el = navRef.current;
    let tween: gsap.core.Tween | undefined;

    function playIntro() {
      tween?.kill();
      // Clears any inline style a previous, interrupted run left behind
      // (e.g. navigating away mid-animation) before replaying.
      gsap.set(el, { clearProps: "all" });
      tween = gsap.from(el, { y: -24, opacity: 0, duration: 0.6, delay: 0.1, ease: "power2.out" });
    }

    playIntro();

    // Browsers can restore this exact page from the back/forward cache when
    // navigating back to it — a mid-flight tween freezes and resumes as-is,
    // with no fresh mount/effect run. Replay cleanly when that happens.
    function handlePageShow(e: PageTransitionEvent) {
      if (e.persisted) playIntro();
    }
    window.addEventListener("pageshow", handlePageShow);

    return () => {
      window.removeEventListener("pageshow", handlePageShow);
      tween?.kill();
    };
  }, []);

  return (
    <nav
      ref={navRef}
      className={`fixed inset-x-0 top-0 z-50 border-b backdrop-blur-xl transition-colors duration-300 ${
        scrolled
          ? "border-white/[0.07] bg-bg-base/80"
          : "border-transparent bg-bg-base/40"
      }`}
    >
      <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-4">
        <Link href="/" className="flex items-center gap-2">
          <Image src="/logo.png" alt="Unitouch" width={28} height={28} />
          <span className="font-display text-text-primary text-lg font-[600]">
            Unitouch
          </span>
        </Link>

        <div className="hidden items-center gap-8 md:flex">
          {NAV_LINKS.map((link) => (
            <a
              key={link.href}
              href={link.href}
              onClick={handleHashLinkClick(link.href)}
              className="text-text-secondary hover:text-text-primary text-sm transition-colors duration-200"
            >
              {link.label}
            </a>
          ))}
        </div>

        <div className="hidden md:block">
          <Button variant="primary" size="sm" href="/order">
            Order Your Card
          </Button>
        </div>

        <button
          aria-label="Toggle menu"
          className="text-text-primary md:hidden"
          onClick={() => setMenuOpen((open) => !open)}
        >
          {menuOpen ? <X className="size-6" /> : <Menu className="size-6" />}
        </button>
      </div>

      <div
        className={`bg-bg-base overflow-hidden border-t border-white/[0.06] transition-[max-height] duration-300 md:hidden ${
          menuOpen ? "max-h-80" : "max-h-0"
        }`}
      >
        <div className="flex flex-col gap-4 px-6 py-6">
          {NAV_LINKS.map((link) => (
            <a
              key={link.href}
              href={link.href}
              className="text-text-secondary hover:text-text-primary text-sm transition-colors duration-200"
              onClick={(e) => {
                handleHashLinkClick(link.href)(e);
                setMenuOpen(false);
              }}
            >
              {link.label}
            </a>
          ))}
          <Button variant="primary" size="sm" href="/order">
            Order Your Card
          </Button>
        </div>
      </div>
    </nav>
  );
}
