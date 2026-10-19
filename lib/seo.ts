import type { Metadata } from "next";

/* Shared share-preview pieces. Import-free apart from a type, so any page can
   use it.

   Next.js replaces (not merges) a parent's openGraph when a page sets its
   own, so a page that wants its own share headline must repeat the picture:
   pageMetadata() does that. */

export const SHARE_IMAGE = {
  url: "/og-image.jpg",
  width: 1200,
  height: 630,
  alt: "Unitouch NFC business card next to a phone showing a live Unitouch profile",
};

/* Title, description, canonical URL and a matching share preview for a
   public page. `title` goes through the root template ("<title> | Unitouch"). */
export function pageMetadata({ title, description, path }: { title: string; description: string; path: string }): Metadata {
  return {
    title,
    description,
    alternates: { canonical: path },
    openGraph: {
      type: "website",
      siteName: "Unitouch",
      locale: "en_IN",
      title: `${title} | Unitouch`,
      description,
      url: path,
      images: [SHARE_IMAGE],
    },
    twitter: { card: "summary_large_image", images: [SHARE_IMAGE.url] },
  };
}
