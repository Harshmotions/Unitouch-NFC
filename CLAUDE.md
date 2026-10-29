# Unitouch — project context for Claude Code

NFC digital business card platform. Order a physical NFC card → it links to a
live, editable public profile page (`/u/[username]`) that shares contact
info, socials, and a vCard download with one tap.

## Stack

- Next.js 15 (App Router), TypeScript, Tailwind v4
- Supabase (Postgres + Auth + Storage), region **South Asia (Mumbai)** —
  see `supabase/schema.sql`
- Upstash Redis (rate limiting, Asia), Resend (email), Razorpay (payments)
- Light "three stones" theme (Oct 2026 rebrand): tokens in `app/globals.css`,
  Space Grotesk (headings) + Inter (text) via `next/font`, content in a
  centred `.container-page` column, CSS-only entrance motion
  (`components/motion/Reveal.tsx`), Lenis for smooth scroll, three.js for
  the 3D card and phone (lazy-loaded)
- Production: **https://www.unitouch.in** (`unitouch.in` redirects there)
- Repo: https://github.com/Harshmotions/Unitouch-NFC

## Deploys (Vercel)

- Every push to `main` auto-deploys to production. There's no staging, so
  test locally first.
- The live site is served by the Vercel project whose default domain is
  `unitouch-nfc-sigma.vercel.app`; that's where the production env vars
  (Supabase, `RZP_*`, `RESEND_API_KEY`, Upstash) live. An older duplicate
  project (`unitouch-nfc-five.vercel.app`, the one this repo's `.vercel/`
  folder is linked to) has been disconnected from Git; it doesn't serve the
  site and has none of the secrets. So the Vercel CLI here can't see the
  production env vars.
- `vercel.json` pins serverless functions to **`bom1` (Mumbai)**, next to
  Supabase. They previously ran in `iad1` (USA), and every DB round trip
  crossing the Pacific made checkout, sign-in and the studio slow. Don't
  remove it.
- New env vars only take effect after a redeploy.
- `lib/supabase/middleware.ts` skips the Supabase session refresh when a
  request has no `sb-` auth cookie (nearly every public visitor), which
  saves a network round trip per page. Keep it that way.
- Pushes from anyone but Harsh don't auto-deploy (Vercel Hobby). Deploy by
  hand: Deployments → "⋯" → Create Deployment → `main` → Deploy to
  Production (never "Redeploy" an old row; it rebuilds the old commit).

## Monitoring

- Uptime: an external free monitor (UptimeRobot, owned by the
  `unitouchnfc@gmail.com` account) checks `https://www.unitouch.in/` and
  `https://www.unitouch.in/order` every 5 minutes and emails that inbox
  when either stops answering 200. `/order` is server-rendered per request
  (Mumbai functions), so it also catches function outages that a cached
  homepage wouldn't.
- Don't point a monitor at `/api/webhook/razorpay`: it only accepts signed
  POSTs, so GET/HEAD answer 405 and would look "down". Webhook delivery
  failures are reported by Razorpay itself via the webhook's Alert Email
  (Razorpay dashboard → Webhooks → set to `unitouchnfc@gmail.com`).
- Set up by the team, not in code; if the monitor account changes, update
  this section.

## Get set up locally

1. `npm install`
2. Copy `.env.example` → `.env.local`. **Ask Harsh for the actual values**
   — never commit them (`SUPABASE_SERVICE_ROLE_KEY` bypasses all database
   security).
3. `npm run dev`

The Supabase project (schema + storage buckets) is already live and shared;
you only need the connection keys. Locally, payments need `RZP_KEY_ID` /
`RZP_KEY_SECRET`, and emails need `RESEND_API_KEY`; without them those steps
fail or are skipped, and everything else works.

## What's built

**Marketing homepage** (`app/(marketing)/page.tsx`): Hero (3D card),
HowItWorks, PhoneStory (sticky 3D iPhone, steps change on scroll),
MakeItYours (live name preview on the card, browser-only), TapDrum (two
rolling columns of what a tap leads to), Pricing, FAQ, Footer, plus
Organization / Product / FAQPage JSON-LD. The 3D lives in
`components/marketing/card3d/`: `parts.ts` (studio light, the card, contact
shadow), `scene.ts` (hero card: spins and sways on all axes, draggable) and
`phoneScene.ts` (the phone story, driven by one scroll progress value). The
phone is a real iPhone 14 Pro Max model, `public/models/iphone-14-pro-max.glb`
(converted from the OBJ Harsh supplied, meshopt-compressed, materials set in
code by part name; the screen shows `public/home/phone-screen.webp`). Pages
paint stills first (`public/cards/hero-card.webp`, `public/home/phone-*.webp`)
and load the scenes only when idle / near; reduced motion keeps the stills.
If you change a scene's framing, re-render its still so the swap stays
seamless. The card pictures in `public/cards/` are stills of the 3D card,
not photographs.
`Testimonials.tsx` is intentionally NOT rendered: it held made-up
placeholder reviews, which got flagged for Razorpay website verification.
Only re-add it with real customer quotes. Don't advertise features that
aren't built. The Premium analytics dashboard is real since Oct 2026
(`components/studio/ProfileAnalytics.tsx`, shown in /studio only for a
Premium order's profile; data from `lib/profile-stats.ts`). Views, saves
and taps from the profile's own owner and from admin sessions are not
counted (`app/api/analytics/route.ts`).

**Inner pages** (policies, contact, `/order`) live in the `app/(site)` route
group, whose layout adds `SiteHeader` + `Footer`. Razorpay verification
expects every page to link home and to every policy (Terms, Privacy,
Cancellation and Refund, Shipping and Delivery, Contact); keep new
customer-facing pages in this group. Business details (legal name, which
must match the Razorpay KYC, address, phone, support email, admin email,
canonical site URL) live in `lib/business.ts`.

**Public profiles** (`app/u/[username]/page.tsx`): always rendered by
`PersonalProfile` (reads `lib/profile.ts`). Tracks views and clicks
(`lib/track.ts` → `app/api/analytics/route.ts` → `lib/analytics.ts`); vCard
(`lib/vcard.ts`) and share (`lib/share.ts`) work. A bought-but-unpublished
link shows `ProfileNotLive` instead of a 404; unknown links get
`app/not-found.tsx`.

**Order flow** (`components/order/OrderWizard.tsx`): a 2-step **guest**
checkout, no sign-in. Don't reintroduce a sign-in requirement: Razorpay's
website verification was answered "no login required to pay".
1. Identity: account type, name, email (typed twice), logo/photo, profile
   link (auto-filled from the name, editable, live availability check via
   `app/api/profiles/check-username/route.ts`).
2. Shipping & payment. Pay → `app/api/razorpay/create-order/route.ts`
   reserves the link, uploads the image, and writes a **pending** order +
   placeholder profile (`create_order_with_profile` RPC, storing
   `razorpay_order_id`, `user_id = null`); then Razorpay's checkout.js opens
   (preloaded when step 2 mounts; modal times out after 15 min).
3. Paid only after server-side HMAC verification: the interactive path
   (`app/api/razorpay/verify/route.ts`) and, independently, the
   `payment.captured` webhook (`app/api/webhook/razorpay/route.ts`). Both
   flip `pending`/`failed` → `paid` with a guarded update (`failed` because
   a customer can retry inside the same checkout); whichever actually
   flipped it (`.select("id")` returns the row) sends the emails via
   `after()`.

**Unpaid reservations** (`lib/reservations.ts`, timings in
`lib/checkout-config.ts`): an unpaid (pending/failed) checkout holds its
profile link for **30 minutes**, then is deleted (order, placeholder
profile, photo). No cron: the release runs lazily in check-username and
create-order. The same email coming back for the same link takes over its
own unpaid reservation immediately. If a payment ever lands for a released
order, `lib/late-payment.ts` refunds it automatically and alerts the admin
inbox. Email is not unique: one email can own many orders/profiles.

**Customer accounts**: email OTP only (`/login`, `components/auth/OtpSignIn.tsx`).
Opening `/studio` runs `claimProfilesForUser` (`lib/profile.ts`), which
attaches every **paid**, unowned order placed with that email (exact match
on `orders.email`) and its profile to the account. The studio's "Your
profiles" switcher lists them all.

**Emails** (`lib/email.ts`, templates in `lib/emails/`), via Resend from
`orders@unitouch.in`, replies to `support@unitouch.in`:
- order confirmation → customer, and new-order alert → admin inbox (on paid)
- "your card has shipped" → customer (admin moves an order to Shipped)
- late-payment refund alert → admin inbox
- "your profile isn't live yet" → customer, for paid but unpublished
  profiles (`lib/draft-reminders.ts`): automatic on day 1, 3 and 7 after
  payment (never closer than 2 days apart, max 3) via the daily Vercel cron
  `/api/cron/draft-reminders` (10:00 IST, `vercel.json`), plus a manual
  button in admin. Counts live in Upstash. The cron route requires
  `Authorization: Bearer $CRON_SECRET` (set in Vercel). WhatsApp reminders
  are planned once a business number exists (`orders.phone` is stored).
Every sender is fire-and-forget (never throws) and uses Resend idempotency
keys. Without `RESEND_API_KEY` they log a warning and skip.

**Admin** (`/admin`, `app/admin/**`): one shared account
(`BUSINESS.adminEmail`, `unitouchnfc@gmail.com`) that needs **both** a
password and a one-time code emailed to that inbox. Flow:
`components/admin/AdminLoginForm.tsx` → `/api/admin/auth/password` (checks
the password with a throwaway client, emails the code, sets a 10-min signed
proof cookie) → browser `verifyOtp` (creates the Supabase session) →
`/api/admin/auth/complete` (issues a 12-hour signed 2FA cookie bound to the
user). `lib/admin.ts` `requireAdmin()` / `getAdminUser()` require the admin
session AND that cookie (`lib/admin-session.ts`; key derived from
`SUPABASE_SERVICE_ROLE_KEY`). Every protected page sits in
`app/admin/(protected)/`; admin API routes call `getAdminUser()`. Set or
reset the password with `node --env-file=.env.local scripts/set-admin-password.mjs`.
Pages: dashboard (order + revenue stats, fulfilment queue, profile stats),
orders (views: to fulfil / shipped / unpaid / all, search) with a detail
page to set status (`lib/order-status.ts`: received → designing → awaiting
approval → printing → shipped → delivered), tracking details and internal
notes, and profiles (`lib/admin-profiles.ts`: one status per profile,
Published / Not published (paid) / Unpaid checkout / No order / Demo, with
filters; edit via the shared `ProfileStudio`; delete with typed-username
confirmation, which removes the photo and the username-keyed view stats and
the unpaid order if any, keeps a paid order, and refuses the demo profiles
`priya`/`rohan`; manual draft reminder).

**Image uploads** (`lib/uploads.ts`): magic-byte check + Sharp re-encode
(rejects SVG/HTML), stored in the `profile-photos` bucket. Routes:
`create-order`, `app/api/profiles/update/route.ts`,
`app/api/admin/profiles/[id]/route.ts`. **Gotcha:** any route importing
Sharp must be listed in `next.config.ts` → `outputFileTracingIncludes`, or
its Vercel function ships without Sharp's native binary and 500s (works
locally regardless).

**Loading states**: slow steps show `components/ui/ProgressNotice.tsx`
(checkout stages incl. a full-screen "Confirming your payment" overlay,
sign-in redirect, publish/save); `/studio` and `/u/[username]` have
`loading.tsx` skeletons. Keep new async flows from looking frozen.

## Razorpay

Live keys, named `RZP_KEY_ID`, `RZP_KEY_SECRET`, `RZP_WEBHOOK_SECRET` (on
this Vercel project `RAZORPAY_*`-named vars never reached the production
runtime; see `lib/razorpay/client.ts`). The browser gets the public key id
from the create-order response. Webhook `/api/webhook/razorpay` is
configured in the Razorpay dashboard for `payment.captured` +
`payment.failed`. **Do NOT apply `lib/csrf.ts` to the webhook**: it's
server-to-server, authenticated by the raw-body HMAC. Website verification
is approved for `www.unitouch.in`.

Prices are in `lib/pricing.ts` (Standard ₹999, Premium ₹1,499). For a live
payment test they've been temporarily dropped to ₹1; if you do that, always
restore them right after.

## Supabase

Schema lives in `supabase/schema.sql` (source of truth; run it fresh in a new
project's SQL editor).

| Table | Anon access | Notes |
|---|---|---|
| `profiles` | Read-only, `is_published = true` rows only | `username` is unique |
| `analytics_events` | None | service-role only (writes from `lib/track.ts` via API route) |
| `orders` | None | service-role only; read by admin (`lib/orders.ts`) and emails |
| `admin_audit_log` | None | written by the admin profile-edit route |

Storage: `profile-photos` (public, used by uploads); `card-designs`
(private) and `assets` (public) exist but are unused.

Demo profiles (`rohan`, `priya`) are seeded via `scripts/seed-profiles.js`
(safe to re-run, upserts by username). **Both are intentionally fully
fictional**; don't put real contact details back into that script. They
have no order, so they can never be claimed.

## Dependencies

`package.json` `overrides` forces `postcss` ≥ 8.5.26 (Next 15 pins a
vulnerable 8.4.31; the fix otherwise needs Next 16). As of Oct 29, 2026
(next 15.5.28, zod 4.6.7, follow-redirects 1.16.2) `npm audit` reports 0
vulnerabilities. The `Dependency audit` workflow fails on critical
advisories, so bump patches promptly when it goes red.

## Conventions / things that bit us before

- **Tailwind v4**: arbitrary-value classes must be literal strings in
  source, not built via runtime template-literal interpolation; the JIT
  scanner won't pick up dynamically-constructed class names.
- **`window.lenis` is already taken**: the `lenis` package ambiently declares
  it. The live instance is `window.lenisInstance` (`lib/scroll.ts`,
  `components/SmoothScroll.tsx`). Don't redeclare `window.lenis`.
- **Hash links must not use native anchor behavior**: Lenis's `anchors`
  option doesn't call `preventDefault`. Every in-page `#anchor` link uses
  `handleHashLinkClick` from `lib/scroll.ts` (the footer switches to plain
  `/#…` links off the homepage).
- **No GSAP**: entrances are CSS (`[data-reveal]`, `.rise-line`,
  `.fade-in` in `globals.css`), hidden only under `html.js` (set by an inline
  script in `app/layout.tsx`) and `prefers-reduced-motion: no-preference`, so
  content never depends on script to appear. Animate transform and opacity
  only.
- **Design rules (light theme)**: one ground, one ink, one accent
  (`--color-accent`, the main action only). No gradients, glows, glass,
  shadows at rest, eyebrow labels, violet, or icon-topped card grids on the
  public pages. `.glass*` and `.surface-card` still exist for older markup but
  are flat tone-step surfaces now. Headlines stay at two lines or fewer at
  390, 768 and 1440 px.
- **`img { max-width: 100% }` global reset** can override a fixed Tailwind
  width on an `<img>` in an auto-sized container; add `max-w-none` and
  verify with `getBoundingClientRect()`.
- **Client components must not import server modules** (anything pulling
  in `lib/supabase/server.ts`). Shared constants go in import-free files
  (`lib/checkout-config.ts`, `lib/order-status.ts`).
- **Customer-facing copy**: no em dashes.
- Run `npm run lint` before considering any change done.
