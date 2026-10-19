import type { MetadataRoute } from "next";
import { BUSINESS } from "@/lib/business";

/* /sitemap.xml: the public marketing and policy pages. Customer profiles
   (/u/...) are deliberately not listed: they're public and shareable, but
   the site shouldn't hand search engines a directory of every customer. */
const PAGES: { path: string; priority: number }[] = [
  { path: "/", priority: 1 },
  { path: "/order", priority: 0.9 },
  { path: "/contact", priority: 0.5 },
  { path: "/shipping", priority: 0.3 },
  { path: "/refunds", priority: 0.3 },
  { path: "/terms", priority: 0.3 },
  { path: "/privacy", priority: 0.3 },
];

export default function sitemap(): MetadataRoute.Sitemap {
  return PAGES.map(({ path, priority }) => ({ url: `${BUSINESS.siteUrl}${path === "/" ? "" : path}`, priority }));
}
