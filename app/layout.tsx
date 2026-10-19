import type { Metadata } from "next";
import { Space_Grotesk, Inter } from "next/font/google";
import "./globals.css";
import SmoothScroll from "@/components/SmoothScroll";
import { BUSINESS } from "@/lib/business";
import { SHARE_IMAGE } from "@/lib/seo";

const spaceGrotesk = Space_Grotesk({
  variable: "--font-space-grotesk",
  subsets: ["latin"],
  weight: ["500", "600", "700"],
});

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
  weight: ["400", "500"],
});

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
    <html lang="en">
      <body className={`${spaceGrotesk.variable} ${inter.variable} antialiased`}>
        <SmoothScroll />
        {children}
      </body>
    </html>
  );
}
