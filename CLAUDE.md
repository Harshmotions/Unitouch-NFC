# Unitouch — project context for Claude Code

NFC digital business card platform. Order a physical NFC card → it links to a
live, editable public profile page (`/u/[username]`) that shares contact
info, socials, and a vCard download with one tap.

## Stack

- Next.js 15 (App Router), TypeScript, Tailwind v4
- Supabase (Postgres + Auth + Storage) — see `supabase/schema.sql`
- GSAP for entrance animations, Lenis for smooth scroll
- Deployed on Vercel: https://unitouch-nfc-five.vercel.app
- Repo: https://github.com/Harshmotions/Unitouch-NFC

## Get set up locally

1. `npm install`
2. Copy `.env.example` → `.env.local`. **Ask Harsh for the actual values**
   (Supabase URL/anon key/service-role key, `ADMIN_EMAILS`) — these are
   intentionally not committed since `SUPABASE_SERVICE_ROLE_KEY` bypasses
   all database security. Don't put real keys in this file or any other
   committed file.
3. `npm run dev`

The Supabase project (schema + the 3 storage buckets below) is already live
and shared — you don't need to set any of that up yourself, just need the
connection keys from Harsh.

## What's actually built vs. just stubbed

It's easy to assume more is wired up than actually is — several files exist
as empty placeholders (`return null` or similar, no real implementation).
Check before assuming something works.

**Fully working:**
- Marketing homepage (`app/(marketing)/page.tsx`) — Hero, SocialProof,
  ProductShowcase, HowItWorks, Features, ProfileDemo, Pricing, Testimonials,
  FAQ, Footer. All real, all styled.
- Public profile pages (`app/u/[username]/page.tsx`) — reads live from
  Supabase (`lib/profile.ts`), renders `StandardProfile` or
  `PersonalProfile` depending on `profile_style`. Tracks page views and
  click events (`lib/track.ts` → `app/api/analytics/route.ts` →
  `lib/analytics.ts`). vCard download (`lib/vcard.ts`) and native share
  (`lib/share.ts`) both work.
- Order creation API (`app/api/orders/route.ts`) — validates with
  `lib/validations.ts` (zod) and inserts a `pending` row into `orders`.
  Generates a `UTK-XXXXXX` order number.
- Order form UI (`components/order/OrderForm.tsx`) + success page.

**Stubbed — exists as a file/route but does nothing yet:**
- Everything under `app/admin/**` (login, dashboard, orders, profiles,
  analytics) — all `return null`. No admin auth check is wired up despite
  `ADMIN_EMAILS` existing as an env var.
- `components/admin/*` (AdminNav, AnalyticsChart, OrderCard, ProfileEditor)
- `components/order/PaymentButton.tsx`, `components/order/ProfileForm.tsx`
- `components/profile/ContactActions.tsx`, `SocialLinks.tsx`,
  `VCardDownload.tsx`, `ProfilePage.tsx` — superseded by
  `StandardProfile.tsx` / `PersonalProfile.tsx` / `PlatformIcons.tsx`, which
  is where the real logic actually lives. Treat the former as dead code
  unless told otherwise.
- All of Razorpay: `lib/razorpay/client.ts`, `lib/razorpay/verify.ts`,
  `app/api/razorpay/create-order/route.ts`, `app/api/razorpay/verify/route.ts`,
  `app/api/webhook/razorpay/route.ts`. The order form collects payment
  intent but nothing actually charges a card yet. `RAZORPAY_*` env vars are
  empty.
- Resend (email) — `RESEND_API_KEY` is empty, nothing sends email.
- File uploads — `orders.profile_photo_url` / `orders.existing_design_url`
  columns exist in the schema and the 3 Storage buckets exist, but no
  upload UI or API handling exists. The order form has no file input.

## Supabase

Schema lives in `supabase/schema.sql` — this is the source of truth, run it
fresh in any new project's SQL editor. Three tables, two of them RLS-locked
to service-role only:

| Table | Anon access | Notes |
|---|---|---|
| `profiles` | Read-only, `is_published = true` rows only | public profile pages |
| `analytics_events` | None | service-role only (writes from `lib/track.ts` via API route) |
| `orders` | None | service-role only, write-only currently (nothing reads it back yet — admin order pages are stubs) |

Storage buckets (already created, not yet used by any code):
- `profile-photos` — public
- `card-designs` — private
- `assets` — public

Demo profiles (`rohan`, `priya`) are seeded via `scripts/seed-profiles.js`
(safe to re-run — upserts by username). **Both are intentionally fully
fictional** — no real personal contact info. Don't put real contact details
back into that script.

## Conventions / things that bit us before

- **Tailwind v4**: arbitrary-value classes must be literal strings in
  source, not built via runtime template-literal interpolation — the JIT
  scanner won't pick up dynamically-constructed class names.
- **`window.lenis` is already taken** — the `lenis` package itself
  ambiently declares that property for its own devtools detection. The
  live Lenis instance is stored at `window.lenisInstance` instead
  (`lib/scroll.ts`, `components/SmoothScroll.tsx`). Don't redeclare
  `window.lenis`.
- **Hash links must not use native anchor behavior** — Lenis's `anchors`
  option doesn't call `preventDefault`, so native instant-jump wins the
  race against the smooth-scroll animation. Every in-page `#anchor` link
  uses `handleHashLinkClick` from `lib/scroll.ts` instead.
- **GSAP entrance timelines need bfcache handling** — navigating back to a
  page via the browser's back/forward cache restores it frozen mid-animation
  (no fresh mount). Hero and Navbar both guard against this with a
  `pageshow` listener that replays the intro when `event.persisted` is true,
  plus `gsap.set(targets, { clearProps: "all" })` before replaying so no
  stale inline styles linger.
- **Glass UI**: `.glass`, `.glass-icon-btn`, `.glass-pill` give the base
  frosted look; layer one of `.glass-stroke-1` through `.glass-stroke-4` on
  top for a corner-highlight accent. Vary which numbered variant
  neighboring elements use so they don't all show an identical stroke
  position.
- **`img { max-width: 100% }` global reset** can silently override an
  explicit fixed Tailwind width (e.g. `w-[600px]`) on an `<img>` sitting
  inside an auto-sized container — add `max-w-none` if you need a real
  fixed pixel width to actually take effect, and verify with
  `getBoundingClientRect()`, not just a glance at a screenshot.
- Run `npm run lint` before considering any change done — it's fast and
  catches real issues.
