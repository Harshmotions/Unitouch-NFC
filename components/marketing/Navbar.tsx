"use client";

import { useEffect, useState } from "react";
import type { MouseEvent } from "react";
import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import Button from "@/components/ui/Button";
import { handleHashLinkClick, settleArrivalHash, smoothScrollToTop } from "@/lib/scroll";
import { createSupabaseBrowserClient } from "@/lib/supabase/client";

const NAV_LINKS = [
  { label: "How it works", href: "#how-it-works" },
  { label: "Pricing", href: "#pricing" },
  { label: "FAQ", href: "#faq" },
  { label: "Demo profile", href: "/u/priya" },
];

/* One navigation for every public page: the wordmark, four plain links, the
   sign-in link and the one action. On the homepage the section links scroll
   (Lenis); anywhere else they go to "/#section". On a phone the links open
   in a full-screen sheet from a "Menu" button. */
export default function Navbar() {
  const pathname = usePathname();
  const onHome = pathname === "/";
  const [menuOpen, setMenuOpen] = useState(false);
  // null = not checked yet: render neither state, so nothing flashes.
  const [signedIn, setSignedIn] = useState<boolean | null>(null);
  /* At the very top of the homepage the bar is see-through, so the hero's
     moving shadows run up behind it; it turns solid once you scroll. */
  const [atTop, setAtTop] = useState(true);

  useEffect(() => {
    if (!onHome) return;
    const update = () => setAtTop(window.scrollY < 8);
    update();
    window.addEventListener("scroll", update, { passive: true });
    return () => window.removeEventListener("scroll", update);
  }, [onHome]);

  useEffect(() => {
    const supabase = createSupabaseBrowserClient();
    supabase.auth.getUser().then(({ data }) => setSignedIn(!!data.user));
    const { data: sub } = supabase.auth.onAuthStateChange((_event, session) => {
      setSignedIn(!!session?.user);
    });
    return () => sub.subscription.unsubscribe();
  }, []);

  // Landed on the homepage with a section link (/#faq): scroll there, then
  // clear the hash from the address bar.
  useEffect(() => {
    if (onHome) settleArrivalHash();
  }, [onHome]);

  useEffect(() => {
    document.documentElement.style.overflow = menuOpen ? "hidden" : "";
    if (menuOpen) window.lenisInstance?.stop();
    else window.lenisInstance?.start();
  }, [menuOpen]);

  function handleLogoClick(e: MouseEvent) {
    setMenuOpen(false);
    if (onHome) {
      e.preventDefault();
      smoothScrollToTop();
    }
  }

  const linkProps = (href: string) => {
    if (!href.startsWith("#")) return { href, onClick: () => setMenuOpen(false) };
    if (!onHome) return { href: `/${href}`, onClick: () => setMenuOpen(false) };
    return {
      href,
      onClick: (e: MouseEvent) => {
        // Unlock the page before scrolling: while the menu is open the
        // page's overflow is hidden, which would swallow the scroll.
        document.documentElement.style.overflow = "";
        setMenuOpen(false);
        handleHashLinkClick(href)(e);
      },
    };
  };

  const account =
    signedIn === null ? null : signedIn ? (
      <Link href="/studio" className="link-draw">
        Your profile
      </Link>
    ) : (
      <Link href="/login" className="link-draw">
        Log in
      </Link>
    );

  return (
    <>
    <header
      className={`sticky top-0 z-50 transition-colors duration-500 ${
        onHome && atTop && !menuOpen ? "bg-transparent" : menuOpen ? "liquid-glass-sheet" : "liquid-glass-bar"
      }`}
    >
      <div className="container-page flex h-16 items-center justify-between gap-6 md:h-[4.5rem]">
        <Link href="/" onClick={handleLogoClick} className="flex items-center gap-2.5" aria-label="Unitouch home">
          <Image src="/brand/u-mark-ink.png" alt="" width={22} height={25} priority />
          <span className="font-display text-[1.25rem] font-[600]">Unitouch</span>
        </Link>

        <nav aria-label="Main" className="hidden items-center gap-8 text-[0.9375rem] lg:flex">
          {NAV_LINKS.map((link) => {
            const { href, onClick } = linkProps(link.href);
            return (
              <a key={link.label} href={href} onClick={onClick} className="link-draw">
                {link.label}
              </a>
            );
          })}
        </nav>

        <div className="flex items-center gap-5 text-[0.9375rem]">
          <span className="hidden min-w-[5.5rem] text-right lg:inline">{account}</span>
          <Button variant="primary" size="sm" href="/order">
            <span>
              Order<span className="hidden sm:inline"> your card</span>
            </span>
          </Button>
          <button
            type="button"
            className="h-10 px-1 font-[500] lg:hidden"
            aria-expanded={menuOpen}
            aria-controls="mobile-menu"
            onClick={() => setMenuOpen((open) => !open)}
          >
            {menuOpen ? "Close" : "Menu"}
          </button>
        </div>
      </div>

    </header>

      {/* Phone and tablet: a full-screen sheet of large links. It sits
          outside the header on purpose: the header's glass blur makes it a
          containing block for fixed children, which clipped the sheet to
          the header's height. Fades and drops in, and is inert when shut. */}
      <div
        id="mobile-menu"
        inert={!menuOpen}
        className={`liquid-glass-sheet fixed inset-x-0 top-16 bottom-0 z-40 overflow-y-auto px-[var(--margin)] pt-8 pb-12 transition-[opacity,transform,visibility] duration-300 ease-[var(--ease-out)] md:top-[4.5rem] lg:hidden ${
          menuOpen ? "visible translate-y-0 opacity-100" : "invisible -translate-y-2 opacity-0"
        }`}
      >
        <nav aria-label="Main" className="flex flex-col gap-5">
          {NAV_LINKS.map((link) => {
            const { href, onClick } = linkProps(link.href);
            return (
              <a key={link.label} href={href} onClick={onClick} className="font-display text-[1.75rem] font-[600]">
                {link.label}
              </a>
            );
          })}
          <span className="font-display text-text-secondary text-[1.75rem] font-[600]">
            {account ?? <Link href="/login">Log in</Link>}
          </span>
        </nav>
      </div>
    </>
  );
}
