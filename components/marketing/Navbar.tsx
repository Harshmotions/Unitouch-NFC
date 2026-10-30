"use client";

import { useEffect, useState } from "react";
import type { MouseEvent } from "react";
import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import Button from "@/components/ui/Button";
import GlassLens from "@/components/ui/GlassLens";
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
   in a small glass menu from a "Menu" button. */
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
    if (!menuOpen) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setMenuOpen(false);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
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
    {/* The header is Apple's floating navigation layer: a glass capsule
        inset from the edges, over the scrolling page. At the very top of
        the homepage it's clear, so the hero runs up behind it. The capsule
        sticks out of the content column by its own padding, so the logo
        and links still line up with the page. */}
    <header className="sticky top-0 z-50 pt-2">
      <div className="container-page">
      <div
        className={`liquid-glass liquid-glass-float -mx-3 flex h-14 items-center justify-between gap-6 rounded-full px-3 md:h-16 lg:-mx-5 lg:px-5 ${
          onHome && atTop && !menuOpen ? "is-clear" : ""
        }`}
      >
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
      </div>
    </header>

      {/* Phone and tablet: a glass menu that grows out of the Menu button
          (Apple: menus originate from the control that opens them) and is
          only as big as its links. Opens on a soft spring with the links
          cascading in; shuts quickly. Corners are concentric: 28px outside,
          8px padding, 20px rows. A tap anywhere else, or Escape, closes it.
          It sits outside the header on purpose: the header's glass blur
          makes it a containing block for fixed children. Inert when shut. */}
      {menuOpen && (
        <div aria-hidden className="fixed inset-0 z-40 lg:hidden" onClick={() => setMenuOpen(false)} />
      )}
      <div
        id="mobile-menu"
        inert={!menuOpen}
        className={`liquid-glass liquid-glass-menu fixed top-[4.5rem] right-[calc(clamp(1.25rem,4vw,2.5rem)-0.75rem)] z-50 w-[min(17rem,calc(100vw-1rem))] origin-[calc(100%-1.75rem)_-1.5rem] rounded-[28px] p-2 transition-[opacity,scale,translate,visibility] will-change-[scale,translate,opacity] motion-reduce:transition-none md:top-20 lg:hidden ${
          menuOpen
            ? "visible translate-y-0 scale-100 opacity-100 duration-[520ms] ease-[var(--ease-spring)]"
            : "invisible -translate-y-3 scale-[0.6] opacity-0 duration-[220ms] ease-[var(--ease-out)]"
        }`}
      >
        <GlassLens blur={18} saturation={1.8} specular={0.3} />
        <nav aria-label="Main" className="flex flex-col">
          {NAV_LINKS.map((link, i) => {
            const { href, onClick } = linkProps(link.href);
            return (
              <a
                key={link.label}
                href={href}
                onClick={onClick}
                style={{ transitionDelay: menuOpen ? `${70 + i * 35}ms` : "0ms" }}
                className={`font-display rounded-[20px] px-4 py-3 text-[1.1875rem] font-[600] transition-[opacity,translate,background-color] duration-[380ms] ease-[var(--ease-out)] hover:bg-white/45 active:bg-white/60 motion-reduce:transition-none ${
                  menuOpen ? "translate-y-0 opacity-100" : "-translate-y-1.5 opacity-0"
                }`}
              >
                {link.label}
              </a>
            );
          })}
          <span aria-hidden className="bg-text-primary/10 mx-4 my-1.5 h-px" />
          <span
            style={{ transitionDelay: menuOpen ? `${70 + NAV_LINKS.length * 35}ms` : "0ms" }}
            className={`font-display text-text-secondary text-[1.1875rem] font-[600] transition-[opacity,translate] duration-[380ms] ease-[var(--ease-out)] motion-reduce:transition-none [&>a]:block [&>a]:rounded-[20px] [&>a]:px-4 [&>a]:py-3 [&>a]:transition-colors [&>a:hover]:bg-white/45 ${
              menuOpen ? "translate-y-0 opacity-100" : "-translate-y-1.5 opacity-0"
            }`}
          >
            {account ?? <Link href="/login">Log in</Link>}
          </span>
        </nav>
      </div>
    </>
  );
}
