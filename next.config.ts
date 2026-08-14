import type { NextConfig } from "next";

const isDev = process.env.NODE_ENV === "development";

/* Content-Security-Policy.

   'unsafe-inline' on script-src is required: the App Router injects inline
   bootstrap/hydration scripts (self.__next_f.push(...)) on every page, and a
   bare script-src 'self' blocks them and breaks the app. Eliminating it means
   moving to a per-request nonce in middleware, which forces every currently
   static page to render dynamically — a real tradeoff, deliberately not taken
   here. 'unsafe-eval' is dev-only (Turbopack HMR needs it).

   Everything else is tight: no plugins/objects, no framing, forms and base
   URLs pinned to our own origin. The two external hosts are Supabase (API,
   auth, storage images) and Google's favicon service, which PlatformIcons.tsx
   uses to show real favicons for customers' custom links. */
const csp = [
  "default-src 'self'",
  `script-src 'self' 'unsafe-inline'${isDev ? " 'unsafe-eval'" : ""}`,
  "style-src 'self' 'unsafe-inline'",
  /* blob: covers the local object URLs used for image previews before upload.
     gstatic.com is required alongside google.com because the favicon service
     301s to a rotating t1/t2/t3.gstatic.com pool, and CSP is enforced against
     the redirect target — allowing only www.google.com silently breaks every
     custom-link favicon on profile pages. */
  "img-src 'self' data: blob: https://*.supabase.co https://www.google.com https://*.gstatic.com",
  "font-src 'self' data:",
  "connect-src 'self' https://*.supabase.co wss://*.supabase.co",
  "frame-ancestors 'none'",
  "object-src 'none'",
  "base-uri 'self'",
  "form-action 'self'",
].join("; ");

const securityHeaders = [
  { key: "Content-Security-Policy", value: csp },
  { key: "X-Content-Type-Options", value: "nosniff" },
  { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
  {
    key: "Permissions-Policy",
    value: "camera=(), microphone=(), geolocation=(), interest-cohort=()",
  },
  /* includeSubDomains added on top of Vercel's default max-age. Every
     subdomain we own is either Vercel-hosted (HTTPS-only) or a mail-only DNS
     record, which HSTS doesn't touch. `preload` is deliberately NOT set yet —
     it should only be added after this runs stably, since preload lists are
     slow to back out of. */
  {
    key: "Strict-Transport-Security",
    value: "max-age=63072000; includeSubDomains",
  },
];

const nextConfig: NextConfig = {
  // Don't advertise the framework/version to scanners looking for known CVEs.
  poweredByHeader: false,
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "*.supabase.co",
        pathname: "/storage/v1/object/public/**",
      },
    ],
  },
  async headers() {
    return [
      {
        source: "/:path*",
        headers: securityHeaders,
      },
      {
        /* Uploaded/user-supplied files must never be rendered inline by the
           browser — nosniff plus an attachment disposition means a file that
           slips through upload validation still can't execute as HTML/SVG in
           our origin. */
        source: "/:path*.(svg|jpg|jpeg|png|webp|avif|gif|ico)",
        headers: [{ key: "X-Content-Type-Options", value: "nosniff" }],
      },
    ];
  },
};

export default nextConfig;
