import Link from "next/link";
import Image from "next/image";
import Button from "@/components/ui/Button";

const LINKS = [
  { label: "Home", href: "/" },
  { label: "Pricing", href: "/#pricing" },
  { label: "FAQ", href: "/#faq" },
  { label: "Contact", href: "/contact" },
];

/* Plain header for the inner pages (policies, contact, order) so a visitor
   who lands on one can always get back to the rest of the site. The
   homepage keeps its own animated Navbar, whose hash links only work there. */
export default function SiteHeader() {
  return (
    <header className="border-b border-white/[0.06] px-6">
      <div className="mx-auto flex max-w-6xl items-center justify-between gap-4 py-4">
        <Link href="/" className="flex items-center gap-2">
          <Image src="/logo.png" alt="Unitouch" width={28} height={28} />
          <span className="font-display text-text-primary text-lg font-[600]">Unitouch</span>
        </Link>

        <nav className="hidden items-center gap-8 md:flex">
          {LINKS.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className="text-text-secondary hover:text-text-primary text-sm transition-colors duration-200"
            >
              {link.label}
            </Link>
          ))}
        </nav>

        <Button variant="primary" size="sm" href="/order">
          Order your card
        </Button>
      </div>
    </header>
  );
}
