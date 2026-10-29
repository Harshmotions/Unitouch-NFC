import Link from "next/link";
import Image from "next/image";
import Button from "@/components/ui/Button";

/* Site-wide 404 (also used by notFound() in /u/[username] for links nobody
   has bought). Replaces Next.js's unstyled default. */
export default function NotFound() {
  return (
    <main className="bg-bg-base flex min-h-screen flex-col items-center justify-center px-6 py-16 text-center">
      <Link href="/" className="mb-10 flex items-center gap-2">
        <Image src="/brand/u-mark-ink.png" alt="" width={22} height={25} />
        <span className="font-display text-text-primary text-lg font-[600]">Unitouch</span>
      </Link>
      <h1 className="font-display text-h2 text-text-primary mb-3 font-[600]">Page not found</h1>
      <p className="text-text-secondary mb-8 max-w-md">
        The page or profile you&apos;re looking for doesn&apos;t exist.
      </p>
      <Button variant="primary" size="md" href="/">
        Go to homepage
      </Button>
    </main>
  );
}
