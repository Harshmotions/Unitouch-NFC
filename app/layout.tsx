import type { Metadata, Viewport } from "next";
import localFont from "next/font/local";
import "./globals.css";
import SmoothScroll from "@/components/SmoothScroll";
import { BUSINESS } from "@/lib/business";
import { SHARE_IMAGE } from "@/lib/seo";

/* TikTok Sans, one variable file (weight 300 to 900, width 75 to 150%),
   Latin only and self-hosted so there's no request to Google at runtime.
   Headings use the same face stretched wide (globals.css). */
const tiktokSans = localFont({
  src: "./fonts/tiktok-sans-latin.woff2",
  variable: "--font-tiktok",
  weight: "300 900",
  display: "swap",
  declarations: [{ prop: "font-stretch", value: "75% 150%" }],
  fallback: ["Helvetica Neue", "Arial", "sans-serif"],
});

export const viewport: Viewport = {
  themeColor: "#eeecea",
};

const DESCRIPTION =
  "NFC business cards with a live digital profile. Tap once to share your contact, socials and links. No app needed. Made in India.";

/* Site-wide defaults. Pages set their own `title` (filled into the template)
   and description; /u/[username] builds its own share preview from the
   profile. public/og-image.jpg (1200x630) is the default share picture
   (WhatsApp, LinkedIn, X). It's set here, not as an app/opengraph-image
   file, because file-based images override every page below them and would
   hide each profile's own photo. Public pages use pageMetadata() (lib/seo.ts)
   for their own share headline. */
export const metadata: Metadata = {
  metadataBase: new URL(BUSINESS.siteUrl),
  title: {
    default: "Unitouch: NFC business cards with a live profile",
    template: "%s | Unitouch",
  },
  description: DESCRIPTION,
  applicationName: "Unitouch",
  openGraph: {
    type: "website",
    siteName: "Unitouch",
    locale: "en_IN",
    title: "Unitouch: NFC business cards with a live profile",
    description: DESCRIPTION,
    url: "/",
    images: [SHARE_IMAGE],
  },
  twitter: { card: "summary_large_image", images: [SHARE_IMAGE.url] },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={tiktokSans.variable} suppressHydrationWarning>
      <head>
        {/* Marks the page as scripted before first paint, so entrance
            animations only hide content when they can also reveal it. */}
        <script dangerouslySetInnerHTML={{ __html: "document.documentElement.classList.add('js')" }} />
      </head>
      <body className="antialiased">
        <SmoothScroll />
        {children}
      </body>
    </html>
  );
}
