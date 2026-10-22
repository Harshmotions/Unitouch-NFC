# Unitouch: handoff for the next developer (and their Claude Code)

Last updated: October 19, 2026, by Sanket (with Claude Code). Previously October 7, 2026, by Harsh.

This file is for two readers:
1. **You, the developer** taking over: what exists, what was just done, what's next.
2. **Your Claude Code**: read Section 0 and follow it for the whole session.

Read `CLAUDE.md` too. It's the detailed technical reference and Claude loads it
automatically. This file is the "where we are and what's next" layer on top.

---

## 0. Instructions for Claude Code (read first, follow always)

You are continuing work on a **live production site** (https://www.unitouch.in)
that takes **real payments** (Razorpay, live keys). Pushing to `main` deploys to
production automatically within ~1 minute. There is no staging. Behave accordingly.

### 0.1 Show the task list out loud, then work it one by one
1. At the start of the session, print the full task list from **Section 4** to
   the developer as a numbered checklist, with each task's status
   (`[ ]` todo, `[~]` in progress, `[x]` done, `[-]` skipped by the developer).
2. Create a todo list from it (use your task/todo tool) and keep it updated as
   you go. Mark a task in progress before starting it and done only when it's
   verified (lint passes, build passes, checked in the browser where relevant).
3. Work **one task at a time**, in order, unless the developer picks another.
   Before starting a task, say in 2 to 4 lines what you're about to change.
4. After each task, show the updated checklist again so nothing gets lost.
5. Never silently drop a task. If one is blocked or the developer says skip it,
   mark it `[-]` with a one-line reason and keep it in the list.
6. At the end of the session, print the final checklist and update the status
   column in **Section 4 of this file** so the next session starts accurate.

### 0.2 Guarded areas: stop and double-check before changing these
If the developer asks for something that touches any item below, **do not just
do it**. First explain in plain words what currently happens, what would change,
and what could break (payments, customer data, logins, the live site), then ask
for an explicit "yes, go ahead" before writing any code. If the request looks
accidental or vague ("just remove the login stuff", "simplify checkout",
"clean up the database"), assume it's a mistake and ask what they actually want.

| Guarded area | Why | Key files |
|---|---|---|
| Payment flow (create order, verify, webhook, signature checks) | Real money. A mistake can mark unpaid orders paid or lose paid ones. | `app/api/razorpay/*`, `app/api/webhook/razorpay/route.ts`, `lib/razorpay/*` |
| Guest checkout (no login to pay) | Razorpay approved the site on the basis "no login required to pay". Adding a login breaks that approval. | `components/order/*`, create-order route |
| Prices | Live prices are Standard ₹999 / Premium ₹1,499. Never change them without explicit instruction; if dropped to ₹1 for a test, restore right after. | `lib/pricing.ts` |
| Unpaid reservation release (30 min) and late-payment auto-refund | Deletes rows and issues refunds automatically. | `lib/reservations.ts`, `lib/late-payment.ts`, `lib/checkout-config.ts` |
| Profile claiming (linking paid orders to the account on sign-in) | Wrong logic = customers see or lose someone else's profile. Only PAID orders, exact email match, verified session email only. | `lib/profile.ts` (`claimProfilesForUser`) |
| Admin login (password + emailed code, separate admin session cookie) | Weakening it exposes every customer's data. | `lib/admin.ts`, `lib/admin-session.ts`, `lib/supabase/admin-cookie.ts`, `app/api/admin/auth/*` |
| Admin delete profile | Permanent. Demo profiles `priya`/`rohan` must stay protected (homepage links to them). | `lib/admin-profiles.ts` |
| Emails (Resend) | Customers receive these. Don't add sends in loops or remove idempotency keys. | `lib/email.ts`, `lib/emails/*` |
| Database schema / RLS | Live shared database. Schema changes must be written to `supabase/schema.sql` AND run manually by Harsh in the Supabase SQL editor. Never run destructive SQL yourself. | `supabase/schema.sql` |
| Business / legal details shown on the site | Razorpay verified the site against these. Legal name must match the Razorpay KYC ("Unitouch NFC"). | `lib/business.ts`, policy pages in `app/(site)/*` |
| Policy pages, footer policy links, contact details | Required for Razorpay to keep the account active. Don't remove or hide them. | `app/(site)/{terms,privacy,refunds,shipping,contact}`, `components/marketing/Footer.tsx` |
| `vercel.json` (region `bom1`, daily cron) | Removing the region makes everything ~4x slower; removing the cron stops reminders. | `vercel.json` |
| Middleware session handling | Breaking it logs everyone out or mixes admin/customer sessions. | `middleware.ts`, `lib/supabase/middleware.ts` |
| Environment variables / secrets | Never print, commit or paste secret values. Never put real keys in any committed file. | `.env.local` (not committed) |

### 0.3 Always
- Run `npm run lint` and `npx tsc --noEmit` before calling anything done. For
  anything touching payments, auth, or routing, also run a production build
  (`npx next build`) before pushing.
- Never push to `main` without the developer saying so. Pushing = deploying.
- Never delete data in the live database without listing exactly what will be
  deleted and getting a yes. Take a JSON backup first (into `/tmp/`, which is
  git-ignored).
- Never stop the developer's running dev server without asking.
- Customer-facing copy: no em dashes. Keep the tone plain and friendly.
- Client components must never import server-only modules
  (`lib/supabase/server.ts` and anything that imports it).
- When unsure whether something is safe, ask. A short question is cheaper than
  a broken checkout.

---

## 1. What Unitouch is and how it works (the short version)

Unitouch sells physical **NFC business cards**. Each card links to a live,
editable profile page at `unitouch.in/u/<username>`. Tapping the card on a phone
opens that page (contact details, socials, "save contact" vCard). No app needed.

**Stack:** Next.js 15 (App Router) + TypeScript + Tailwind v4, Supabase
(Postgres, Auth, Storage, region Mumbai), Razorpay (payments), Resend (email),
Upstash Redis (rate limits + reminder counters), Vercel (hosting, functions in
Mumbai `bom1`, daily cron).

**Customer journey**
1. **Order** at `/order`, two steps, **no login**:
   - Step 1: account type, name, email (typed twice), photo/logo, profile link
     (auto-filled from the name, editable, live availability check).
   - Step 2: card type, quantity, phone, shipping address, pay with Razorpay.
2. Clicking Pay creates an **unpaid** order + a placeholder profile (reserves the
   link). Razorpay opens. When payment succeeds it's verified server-side
   (signature check) and the order becomes **paid**. If the customer abandons,
   the reservation is released after 30 minutes.
3. On payment: the customer gets an **order confirmation email**; the admin
   inbox (`unitouchnfc@gmail.com`) gets a **new order alert**.
4. Success page links to the profile and explains how to set it up.
5. The customer signs in at `/login` with **the same email** (one-time code, no
   password), lands in `/studio`, sees all their profiles ("Your profiles"
   switcher), fills in details and **publishes**.
6. If they don't publish, they get reminder emails on day 1, 3 and 7.
7. The team designs, prints and ships the card, tracking it in the admin. When
   marked **Shipped**, the customer gets a "your card has shipped" email with
   tracking.

**Admin** at `/admin` (team only): shared account `unitouchnfc@gmail.com`,
password **and** an emailed one-time code. Dashboard (orders to fulfil, revenue,
unpaid checkouts, profile stats), Orders (filter, search, status pipeline,
tracking, notes), Profiles (status, filters, send reminder, delete).

**Where things live** (full detail in `CLAUDE.md`)

| Area | Files |
|---|---|
| Homepage | `app/(marketing)/page.tsx`, `components/marketing/*` |
| Policy, contact, order pages (with header/footer) | `app/(site)/*` |
| Checkout UI | `components/order/*` |
| Payment APIs | `app/api/razorpay/*`, `app/api/webhook/razorpay/route.ts` |
| Public profile page | `app/u/[username]/page.tsx`, `components/profile/PersonalProfile.tsx` |
| Customer login + profile editor | `app/login`, `app/studio`, `components/auth/*`, `components/studio/ProfileStudio.tsx` |
| Admin | `app/admin/**`, `app/api/admin/**`, `components/admin/*`, `lib/admin*.ts`, `lib/orders.ts` |
| Emails | `lib/email.ts`, `lib/emails/*` |
| Business details (single source) | `lib/business.ts` |
| Prices | `lib/pricing.ts` |

---

## 2. What has been done (by Harsh, up to Oct 7, 2026)

**Payments and Razorpay approval**
- Real Razorpay payments (create order → checkout → server-side signature
  verification + webhook). Website verification **approved** for `www.unitouch.in`.
- Checkout switched to **guest checkout** (no login to pay), which is what
  Razorpay approved.
- Bug fixed: a successful retry after a failed attempt in the same checkout
  now correctly marks the order paid.
- Abandoned checkouts release their profile link after 30 min; the same email
  can immediately reclaim its own link; Razorpay window times out at 15 min;
  late payments on released checkouts are auto-refunded with an admin alert.
- End-to-end tested with a live ₹1 payment, then prices restored.

**Site content for compliance and trust**
- Policy pages: Terms, Privacy, Cancellation & Refund, **Shipping & Delivery**
  (new), Contact (business name Unitouch NFC, phone, address in Kolhapur).
- Every inner page has a header and the full footer with all policy links.
- Removed fake "placeholder" testimonials; analytics claims made honest
  ("View & Save Counts" is real; Premium dashboard marked "coming soon").
- Favicon / app icons from the Unitouch logo.
- Friendly "profile isn't live yet" page and styled 404.

**Customer experience**
- Profile link auto-fills from the name with live availability + suggestions.
- Clickable profile link on the success page.
- Loading states everywhere something is slow (checkout stages, "Confirming
  your payment" overlay, sign-in redirect, studio/profile skeletons, publish).
- "Your profiles" switcher: one email can own several cards/profiles.

**Speed**
- Serverless functions moved from the USA (`iad1`) to Mumbai (`bom1`), next to
  the database: ~4x faster API calls.
- Middleware no longer calls Supabase for visitors without a login cookie.
- Razorpay script preloaded before the Pay click.

**Emails (Resend, from `orders@unitouch.in`)**
- Order confirmation (customer), new order alert (admin), card shipped
  (customer), draft reminders day 1/3/7 (customer, daily cron 10:00 IST),
  late-payment refund alert (admin).

**Admin**
- Two-factor shared admin login (password + emailed code), separate session
  cookie from customers (so you can test customer logins in the same browser).
- Dashboard, Orders (pipeline Received → Designing → Awaiting approval →
  Printing → Shipped → Delivered, tracking, notes), Profiles (status, filters,
  reminders, delete with typed confirmation).

**Housekeeping**
- Security patches for all Dependabot alerts (postcss override, sharp, fflate,
  js-yaml, source-map-js).
- Dead placeholder files removed; `CLAUDE.md` and `.env.example` brought up to date.
- Duplicate Vercel projects disconnected (only the live project builds now).
- **All test data wiped** (orders, test profiles, photos, stats). Only demo
  profiles `priya` and `rohan` remain. A backup JSON is on Harsh's machine.
- Site is **not launched publicly yet**.

---

## 3. Getting started

1. `git pull`, then `npm install`.
2. Get `.env.local` values **from Harsh** (never commit them). See `.env.example`
   for the names. Locally, payments need `RZP_KEY_ID`/`RZP_KEY_SECRET`, emails
   need `RESEND_API_KEY`; without them those steps fail or skip, everything else works.
3. `npm run dev` → http://localhost:3000. Local uses the **live** Supabase
   database, so anything you create locally is real data. Use obviously fake
   test names and clean up after.
4. Admin: http://localhost:3000/admin (ask Harsh for the admin password; the
   code arrives in the `unitouchnfc@gmail.com` inbox).
5. Before pushing: `npm run lint`, `npx tsc --noEmit`, and for risky changes
   `npx next build`.

---

## 4. Next tasks (work these in order; keep statuses updated)

| # | Status | Task | Notes |
|---|---|---|---|
| 1 | [~] | **Card images in the pricing section** | **Code live Oct 19, 2026, with PLACEHOLDER images** (made from `public/Card Design.png`). Still to do: generate the real mockups and overwrite `public/cards/standard.webp` / `premium.webp` in place (paths and alt text in `lib/card-images.ts`). Original brief: See Section 6. Generate two mockups (Standard, Premium) with the prompts there, save as `public/cards/standard.webp` and `public/cards/premium.webp` (about 1600×915, 7:4 landscape, under 200 KB each), and render them with `next/image` inside the existing `aspect-[3.5/2]` placeholders in `components/marketing/ProductShowcase.tsx` (`object-cover`, rounded, keep the border). Add good `alt` text. Check desktop + mobile. |
| 2 | [x] | **Order page card preview** | Done and live Oct 19 (uses `lib/card-images.ts`). Show the same card image on checkout step 2 for the selected card (`components/order/OrderStepShippingPayment.tsx`), so buyers see what they're paying for. |
| 3 | [x] | **Email domain check (MX) at checkout and login** | Done and live Oct 19: `lib/email-domain.ts`, `POST /api/email/check`, enforced in create-order; on `/login` it is client-side only (OTP goes straight to Supabase). Today only the email *format* is checked, so fake domains and typos (`gmial.com`) pass and confirmation emails bounce. Add a server-side check that the domain has mail servers (DNS MX lookup with `node:dns/promises` `resolveMx`, falling back to A record; short timeout, e.g. 3 s; if DNS itself fails, allow rather than block). Use it in `app/api/razorpay/create-order/route.ts` (reject with a friendly field error) and expose a small endpoint the checkout form calls on blur of the email field (`components/order/IdentityFields.tsx`). Guarded area (checkout): explain and confirm before changing. |
| 4 | [x] | **"Did you mean…?" typo suggestions** | Done and live Oct 19: `lib/email-typos.ts`, `components/ui/EmailTypoHint.tsx`. Also fixed: Continue on checkout step 1 was ignored while the link check ran. Under the checkout email field (and `/login`), suggest fixes for common domain typos (`gmial.com`, `gmal.com`, `gmail.co`, `yaho.com`, `hotmial.com`, `outlok.com`, `rediffmial.com`, …) as a one-click button. Pure client-side helper in its own import-free file. Never auto-change what the user typed. |
| 5 | [x] | **Block disposable email addresses** | Done and live Oct 19: `lib/disposable-email.ts` with `disposable-email-domains-js` (pinned; bump occasionally) plus two extra domains. Throwaway inboxes (`mailto.plus`, `watchyio.com`, `gmail10p.com`, 10minutemail, guerrillamail, etc.) were used for test sign-ups and vanish after minutes, so the customer could never manage their profile. Reject them at checkout and `/login` with: "Please use a permanent email address. You'll need it to manage your card." Use a maintained list (e.g. the `disposable-email-domains` npm package or a vendored JSON list) checked server-side. |
| 6 | [x] | **Clean up unverified sign-in accounts** | Done and live Oct 19: `lib/auth-cleanup.ts` in the daily cron; fails closed, max 50 per run. Dry run on Oct 19 matched 0 of 3 accounts. Supabase creates an auth user as soon as someone *requests* a login code, even if they never enter it (accounts with "last sign-in: never"). Extend the existing daily cron (`app/api/cron/draft-reminders/route.ts`, or a sibling route added to `vercel.json`) to delete auth users older than 24 h that have never signed in (`last_sign_in_at` null), never the admin email, never anyone owning a profile or order. Log how many were removed. |
| 7 | [x] | **Bounce alerts for customer emails** | Done and live Oct 19: `/api/webhook/resend` + `lib/email-bounces.ts`; columns `orders.email_bounced_at` / `email_bounce_reason` added in Supabase, Resend webhook and `RESEND_WEBHOOK_SECRET` set up. Not yet seen a real bounce. Add a Resend webhook (`email.bounced` / `email.complained`) at e.g. `app/api/webhook/resend/route.ts`, verified with Resend's signing secret (new env var; don't apply `lib/csrf.ts`, it's server-to-server like the Razorpay webhook). On a bounce for an order email: flag the order in admin ("Email bounced, contact by phone", the phone is on the order) and email the admin inbox. Needs a place to store the flag: either a new `orders.email_bounced` column (schema change: add to `supabase/schema.sql`, Harsh runs it) or Upstash. |
| 8 | [x] | **Delete test sign-in accounts** | 14 test accounts exist besides the admin (list them with the Supabase admin API or the Supabase dashboard → Authentication → Users). **Ask Harsh which to keep** (likely his own `harshuvideocc@gmail.com` / `lexerys.official@gmail.com` for testing); keep `unitouchnfc@gmail.com` always. Deleting is permanent, but anyone can sign up again with the same email. |
| 9 | [x] | **SEO and share previews** | Done and live Oct 19: `lib/seo.ts`, `public/og-image.jpg`, `app/robots.ts`, `app/sitemap.ts` (profiles deliberately not listed). Page titles are all just "Unitouch". Add proper `metadata` (title, description) per page, an Open Graph image (1200×630) for the homepage, and per-profile OG metadata on `/u/[username]` (name + photo) so shared links look good on WhatsApp. Keep admin `noindex`. |
| 10 | [x] | **"Resend confirmation email" button** on the admin order page | Done and live Oct 19 (`resendOrderConfirmation` in `lib/email.ts`); not yet clicked for real. For customers who say they never got it. Reuse `sendOrderPaidEmails`; use a new idempotency key so it actually resends. |
| 11 | [x] | **CSV export of orders** in admin | Done and live Oct 19 (`lib/orders-csv.ts`, `/api/admin/orders/export`). No GST split yet: needs the rate from the accountant. For accounting/GST. Paid orders only by default, date range filter. Admin-only route. |
| 12 | [x] | **Customer order status** | Done and live Oct 19 (`lib/customer-orders.ts`, `components/studio/YourOrders.tsx`). After sign-in, show the customer each order's status and tracking ("where's my card?") in `/studio`. Read-only. |
| 13 | [x] | **Profile stats in admin** | Done and live Oct 19 (`lib/admin-stats.ts`). Views/saves per profile (data already in `daily_analytics`). First step toward the promised Premium analytics dashboard. |
| 14 | [x] | **Premium analytics dashboard for customers** | Done Oct 22, 2026: `components/studio/ProfileAnalytics.tsx` (Premium profiles only), "(coming soon)" removed; the owner's own visits and admin visits are no longer counted. Advertised as "coming soon" for Premium. Views over time, link clicks, contact saves, in the studio, Premium orders only. Remove "(coming soon)" from `lib/pricing.ts` and the FAQ only when it's live. |
| 15 | [ ] | **WhatsApp notifications** | Blocked until Unitouch has a WhatsApp Business number. Then add WhatsApp alongside the existing emails (order confirmation, draft reminders, shipped). Phone is already on every order. |
| 16 | [ ] | **Uptime monitoring** | Free monitor (e.g. UptimeRobot / Better Stack) on the homepage and `/api/webhook/razorpay` (expects POST; monitor for 4xx not 5xx), alerting `unitouchnfc@gmail.com`. No code needed; document it in `CLAUDE.md`. |
| 17 | [ ] | **Real testimonials** | Once real customers exist, re-enable `components/marketing/Testimonials.tsx` with real quotes (with permission). Never fake ones. |
| 18 | [ ] | **Pre-launch cleanup** | Remove the unused `ADMIN_EMAILS` line from local `.env.local`. (Test sign-in accounts were already deleted on Oct 7; only `unitouchnfc@gmail.com`, `harshuvideocc@gmail.com` and `lexerys.official@gmail.com` remain.) |
| 19 | [ ] | **Launch test** | Also try the Oct 19 additions: resend-confirmation button, CSV export, "Your orders" in the studio. With Harsh: temporarily set prices to ₹1, place one real order end to end (pay, emails arrive, admin alert, sign in, publish, mark shipped, shipped email), refund it in Razorpay, delete it in admin, **restore prices**. |
| 20 | [ ] | **Later: Next.js 16 upgrade** | Removes the `postcss` override in `package.json`. Do it on its own branch with a full test of checkout and admin. Not urgent. |

| 21 | [ ] | **Fix name typo in the hero mockup** | `public/Card Hero Page Mockup.png` (also used in `public/og-image.jpg`): the card says "Priya Aanand", the phone says "Priya Anand". Fix the source design, then regenerate the share image. |
| 22 | [ ] | **Shrink the demo profile photo** | `public/profile-user.png` (Priya) is 1.9 MB, too big for WhatsApp to preview when her profile is shared. Re-export it around 200 KB. |

Ideas welcome; add them as new rows rather than starting them silently.

---

## 5. Precautions (for the developer)

- **Live site, live money.** Every push to `main` deploys to unitouch.in.
  Prefer working on a branch and merging when tested.
- **Local = live database.** There's no separate test database. Create only
  clearly fake test data and delete it afterwards (admin → Profiles → 🗑).
- **Prices:** if you drop them to ₹1 to test, put them back to ₹999 / ₹1,499
  immediately after.
- **The GitHub repo is public.** Anyone can read every committed file. Never commit secrets, customer data, backups (`/tmp/`) or reports like security assessments (`/output/`); both folders are git-ignored for that reason.
- **Never share or commit secrets** (Supabase service role key, Razorpay keys,
  Resend key, cron secret, admin password). If one leaks, tell Harsh so it can
  be rotated.
- **Don't remove** the policy pages, footer links, contact details, or the
  "no login to pay" checkout. Razorpay's approval depends on them.
- **Schema changes** go in `supabase/schema.sql` and must be run by Harsh in
  the Supabase SQL editor. Don't run SQL against the live DB yourself.
- **Pushes by other developers don't auto-deploy.** The Vercel team is on the
  Hobby plan, so only Harsh's commits deploy automatically; anyone else's
  push to `main` is silently skipped (or shows "Blocked"). To deploy: Vercel
  → project unitouch-nfc → Deployments → "⋯" (top right) → Create Deployment
  → type `main` → check it shows the new commit → Deploy to Production.
  Don't use "Redeploy" on an old row: that rebuilds the old commit.
- **Vercel:** the live project has all the env vars; new vars need a redeploy.
  The repo's `.vercel/` link points to an old, disconnected project, so the
  Vercel CLI can't see the live env vars. Use the dashboard.
- **Ask before deleting anything** in the live database, Storage, Vercel or
  Razorpay.

---

## 6. Card mockup images: ready-made prompts

**Where they go:** the two empty rounded boxes above "Standard ₹999" and
"Premium ₹1,499" in the pricing section (`components/marketing/ProductShowcase.tsx`,
`aspect-[3.5/2]`, i.e. 7:4 landscape, on a near-black #080808 page).

**How to use:** open GPT Image (ChatGPT) or Nano Banana (Gemini), **attach your
card design** (the front artwork: logo, name layout, whatever you want printed)
as a reference image, paste the prompt, generate a few, pick the best, then
crop to 7:4 and export as WebP. Generate both with the same model and
settings so they look like a set. If the model distorts text or the logo, say
"keep the reference artwork exactly, do not redraw or retype any text" and
regenerate.

### Prompt 1: Standard card

**Idea:** a clean, honest studio product shot of one matte black NFC card,
showing exactly what the buyer gets.

**Prompt (paste as is, attach your design):**

> Photorealistic studio product photograph for a website pricing card. Subject: a single NFC business card in standard credit-card proportions (85.6 × 54 mm, rounded corners, about 0.8 mm thick), matte black finish, printed with the EXACT front design from the attached reference image: reproduce the reference artwork, logo and every letter precisely, do not redraw, translate, or invent any text. Composition: landscape frame, card centered, rotated about 12 degrees and tilted slightly back in a gentle three-quarter view so the thin card edge is just visible, the card fills about 70 percent of the frame width with even breathing room on all sides, no other objects. Lighting: soft large overhead softbox with a subtle cool rim light along the top edge, a gentle soft-edged contact shadow under the card, realistic micro-texture of the matte coating, very faint fingerprint-free sheen where the light rolls over. Background: seamless near-black (#080808) studio sweep that fades to pure black at the edges, so the image blends into a dark website section; no gradients of color, no props, no text, no watermark. Style: premium e-commerce product photography, sharp focus across the whole card, true-to-life color, 100 mm macro lens look, f/8. Aspect ratio 16:9 (will be cropped to 7:4).

### Prompt 2: Premium card

**Idea:** the same card language elevated: premium matte finish, more dramatic
light, a hint of the brand purple, so it reads as the upgrade at a glance.

**Prompt (paste as is, attach your design):**

> Photorealistic luxury product photograph for a website pricing card, premium tier. Subject: a single NFC business card in standard credit-card proportions (85.6 × 54 mm, rounded corners, slightly thicker premium stock about 1 mm), deep soft-touch matte black finish, printed with the EXACT front design from the attached reference image: reproduce the reference artwork, logo and every letter precisely, do not redraw, translate, or invent any text; any logo or accent lines may carry a subtle tone-on-tone spot gloss that catches the light. Composition: landscape frame, card centered and floating a few millimeters above the surface, rotated about 15 degrees with a slightly stronger three-quarter tilt than a flat shot so the card edge shows a fine clean bevel, the card fills about 70 percent of the frame width, no other objects. Lighting: low-key and dramatic, a narrow cool white key light from the upper left, a soft violet rim light (#8B5CFF, subtle, not neon) tracing the right and bottom edges, a soft diffused shadow beneath the floating card, rich deep blacks with readable detail. Background: seamless near-black (#080808) that falls off to pure black at the edges, with an extremely faint violet glow behind the card; no props, no text, no watermark. Style: high-end tech product launch photography, crisp focus on the whole card, true-to-life color, 100 mm macro lens look, f/8. Aspect ratio 16:9 (will be cropped to 7:4).

**Why these work**
- They lead with the image type (studio product photo for a pricing card), so
  the model composes a clean e-commerce shot instead of a lifestyle scene.
- Real card proportions, framing (70% width, centered) and a near-black
  background matching the site mean both images drop into the dark
  placeholders without visible edges.
- "Reproduce the reference artwork exactly, do not invent text" protects your
  design and logo from being redrawn.
- Same structure, different lighting/finish: the two images read as a matched
  set, with Premium clearly the upgrade.

**Variations if you want options**
- Hand-held: "held between thumb and index finger of a hand in a dark suit
  sleeve, the card's top edge near a phone showing a profile page".
- Tap moment: "card resting against the back of a black smartphone, subtle
  glowing NFC ripple between them".
- Flat lay: "card flat on dark slate stone, top-down, soft window light".

---

## 7. Accounts and services (ask Harsh for access)

| Service | Used for |
|---|---|
| GitHub `Harshmotions/Unitouch-NFC` | Code. Push to `main` = deploy. |
| Vercel (live project, default domain `unitouch-nfc-sigma.vercel.app`) | Hosting, env vars, cron, logs |
| Supabase (Mumbai) | Database, auth, storage |
| Razorpay (merchant `TUKgz1J1aOFLK5`) | Payments, refunds, webhook |
| Resend | Emails (domain `unitouch.in` verified) |
| Upstash Redis | Rate limits, reminder counters |
| BigRock | DNS for `unitouch.in` (Google Workspace mail + Resend records) |
| `unitouchnfc@gmail.com` | Admin login + admin alerts |
| `support@unitouch.in` | Customer support inbox (reply-to on all emails) |
