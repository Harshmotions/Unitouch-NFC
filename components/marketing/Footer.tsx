import Link from "next/link";
import Image from "next/image";

const LINKS = [
  { label: "Home", href: "/" },
  { label: "Features", href: "#features" },
  { label: "Pricing", href: "#pricing" },
  { label: "FAQ", href: "#faq" },
];

export default function Footer() {
  return (
    <footer className="border-t border-white/[0.06] px-6 py-16">
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
              className="text-text-secondary hover:text-text-primary text-sm transition-colors"
            >
              {link.label}
            </a>
          ))}
        </div>

        <p className="text-text-muted text-sm">Made in India 🇮🇳</p>
      </div>

      <div className="mx-auto mt-10 flex w-full max-w-6xl flex-col items-center justify-between gap-3 border-t border-white/[0.06] pt-8 sm:flex-row">
        <p className="text-text-muted text-xs">© {new Date().getFullYear()} Unitouch. All rights reserved.</p>
        <div className="flex gap-4">
          <Link href="/privacy" className="text-text-muted hover:text-text-primary text-xs transition-colors">
            Privacy Policy
          </Link>
          <Link href="/terms" className="text-text-muted hover:text-text-primary text-xs transition-colors">
            Terms of Service
          </Link>
        </div>
      </div>
    </footer>
  );
}
