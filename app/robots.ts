import type { MetadataRoute } from "next";
import { BUSINESS } from "@/lib/business";

/* /robots.txt. Private areas also carry noindex in their own metadata; this
   just stops crawlers spending time there. */
export default function robots(): MetadataRoute.Robots {
  return {
    rules: [{ userAgent: "*", allow: "/", disallow: ["/admin", "/studio", "/api/", "/dev-identity", "/order/success"] }],
    sitemap: `${BUSINESS.siteUrl}/sitemap.xml`,
  };
}
