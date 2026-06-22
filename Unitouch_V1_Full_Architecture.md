# UNITOUCH V1 — FULL ARCHITECTURE & CLAUDE CODE BUILD PLAN

> **Source of truth for all Claude Code sessions. Do not deviate from this document.**
> Version: 2.0 | June 2026

---

## 0. HOW TO USE THIS DOCUMENT (Claude Code Instructions)

Read this entire document before writing a single line of code. This is your ground truth — not your training data, not conventions you've seen before.

Every decision you make — component structure, DB schema, route naming, animation behavior, color value, font weight — must trace back to a section in this document. If something is not specified here, ask before assuming.

Build strictly phase-by-phase. Each phase = a natural commit checkpoint. Never combine phases. Never jump ahead. When a phase is complete, stop and confirm before continuing.

**`[USER INPUT REQUIRED]` blocks:** Throughout this document you will find highlighted blocks like the one below. When you reach that phase or component, STOP building and present the questions to Harsh clearly before writing any code for that section. Wait for answers. Do not guess or use defaults.

```
╔══════════════════════════════════════════════════════╗
║  [USER INPUT REQUIRED] — Example                     ║
║  Q1: Question one?                                   ║
║  Q2: Question two?                                   ║
║  → Wait for answers before continuing.               ║
╚══════════════════════════════════════════════════════╝
```

**PDF Architecture Reference:** The original `Unitouch_V1_Architecture.pdf` brief is your secondary reference. This document supersedes it wherever there is a conflict. This document adds precision; the PDF adds intent — read both.

---

## 1. PROJECT IDENTITY

| Field | Value |
|---|---|
| Product Name | Unitouch |
| Tagline | *Tap. Connect. Impress.* |
| Category | Premium NFC Digital Business Card Platform |
| Domain | unitouch.in |
| Positioning | Apple-level premium. Not a SaaS dashboard. A luxury physical+digital product. |
| Target Customer | Founders, Sales Professionals, Creatives, Executives |
| Core Promise | One tap → your entire professional identity |
| Business Model | One-time card purchase. No subscriptions in V1. |

---

## 2. TECH STACK (EXACT VERSIONS)

```
Frontend:     Next.js 15 (App Router)
Language:     TypeScript (strict mode)
Styling:      Tailwind CSS v4
Animation:    GSAP 3 (primary), Framer Motion (secondary, limited)
3D:           React Three Fiber + Drei (hero card only)
Backend:      Supabase (DB + Auth + Storage)
Payments:     Razorpay
Hosting:      Vercel
Version Ctrl: GitHub
Forms:        React Hook Form + Zod
Email:        Resend (order confirmations)
Image Opt:    Next/Image (built-in)
Icons:        Lucide React
```

**DO NOT add libraries not listed here without explicit approval.**

---

## 3. DESIGN SYSTEM

### 3.1 Color Palette

```css
/* Backgrounds */
--color-bg-base:       #080808;   /* Near black — primary background */
--color-bg-elevated:   #0F0F0F;   /* Card surfaces */
--color-bg-subtle:     #141414;   /* Section alternates */
--color-bg-border:     #1E1E1E;   /* Dividers, card borders */

/* Typography */
--color-text-primary:  #F5F5F5;   /* Headlines */
--color-text-secondary:#A0A0A0;   /* Body, labels */
--color-text-muted:    #5A5A5A;   /* Captions, placeholders */

/* Accents (use sparingly — decorative only) */
--color-accent-green:  #9EF5C0;   /* Pastel mint green — CTAs, active states */
--color-accent-purple: #C4B5FD;   /* Pastel lavender — secondary highlights */
--color-accent-glow:   rgba(158, 245, 192, 0.08); /* Green ambient glow */

/* Functional */
--color-success:       #4ADE80;
--color-error:         #F87171;
--color-warning:       #FBBF24;
```

**CRITICAL:** Never use pure white (#FFFFFF) for large text blocks. Never use bright saturated colors. The palette should feel like an expensive matte black product with subtle light catching on edges.

### 3.2 Typography

```css
/* Fonts — load from Google Fonts */
--font-display: 'Space Grotesk', sans-serif;   /* All headings */
--font-body:    'Inter', sans-serif;            /* All body text, UI */

/* Type Scale */
--text-hero:    clamp(52px, 7vw, 96px);    /* Hero headline */
--text-h1:      clamp(36px, 4.5vw, 64px);
--text-h2:      clamp(28px, 3.5vw, 48px);
--text-h3:      clamp(22px, 2.5vw, 32px);
--text-body-lg: 18px;
--text-body:    16px;
--text-sm:      14px;
--text-xs:      12px;

/* Font Weights */
--weight-hero:   700;
--weight-h:      600;
--weight-body:   400;
--weight-label:  500;
```

### 3.3 Spacing System

```css
/* Base 8px grid */
--space-1:  8px
--space-2:  16px
--space-3:  24px
--space-4:  32px
--space-5:  48px
--space-6:  64px
--space-7:  80px
--space-8:  96px
--space-9:  128px
--space-10: 160px
```

### 3.4 Border Radius

```css
--radius-sm:   6px
--radius-md:   12px
--radius-lg:   20px
--radius-xl:   28px
--radius-full: 9999px
```

### 3.5 Motion Tokens

```css
/* GSAP ease names */
--ease-smooth:    'power2.out'
--ease-bounce:    'back.out(1.4)'
--ease-cinematic: 'expo.out'

/* Durations */
--dur-fast:   0.25s
--dur-normal: 0.45s
--dur-slow:   0.75s
--dur-hero:   1.2s
```

### 3.6 Design Principles from References

The 3 provided reference images are **mood and visual language references only.** Do not copy, replicate, or mirror any layout structure, section order, copy, UI component, brand identity, or product-specific pattern from them. They exist purely to communicate the desired visual feel: lighting quality, depth, spacing density, and tone.

**What to extract from the references (visual language only):**

- **Lighting and depth feel:** Deep near-black backgrounds with controlled radial glows. Light used as a material — not decoration. The sense that surfaces catch light rather than emit it.
- **Typographic weight contrast:** Large, confident display headlines paired with small, muted supporting text. Breathing room between elements.
- **Card depth and layering:** UI elements that feel physically stacked — subtle shadows, slight elevation differences between layers, no flat-on-flat compositions.
- **Accent restraint:** Color used as a signal, not a flood. One accent color appears in very specific moments (CTAs, active states, a single glow) and nowhere else.
- **Motion quality:** Animations that feel inevitable, not decorative. Elements that arrive rather than appear.
- **Spacing generosity:** Sections have room to breathe. No cramped layouts, no content packed edge-to-edge.

**What NOT to do with the references:**
- Do not replicate any section, layout, or structural pattern from the reference products
- Do not copy navigation structure, hero layout, or page organization from the images
- Do not mirror any specific component UI (cards, tabs, pricing tables, FAQ) from the reference products
- The references are a **feeling**, not a template

**Hard visual avoid:** Do not produce anything that reads as a crypto/trading platform, a generic SaaS dashboard, or a dark-mode clone of the reference products.

---

## 4. FILE STRUCTURE

```
unitouch/
├── app/
│   ├── (marketing)/          # Landing page route group
│   │   ├── page.tsx          # Homepage
│   │   ├── layout.tsx
│   ├── u/
│   │   └── [username]/
│   │       └── page.tsx      # Public profile page
│   ├── order/
│   │   ├── page.tsx          # Order + profile form
│   │   └── success/
│   │       └── page.tsx      # Post-payment confirmation
│   ├── admin/
│   │   ├── layout.tsx        # Admin auth wrapper
│   │   ├── login/
│   │   │   └── page.tsx
│   │   ├── dashboard/
│   │   │   └── page.tsx      # Orders overview
│   │   ├── orders/
│   │   │   ├── page.tsx      # Orders list
│   │   │   └── [id]/
│   │   │       └── page.tsx  # Single order detail
│   │   ├── profiles/
│   │   │   ├── page.tsx      # Profiles list
│   │   │   └── [id]/
│   │   │       └── page.tsx  # Edit/publish profile
│   │   └── analytics/
│   │       └── page.tsx
│   ├── api/
│   │   ├── razorpay/
│   │   │   ├── create-order/
│   │   │   │   └── route.ts
│   │   │   └── verify/
│   │   │       └── route.ts
│   │   ├── webhook/
│   │   │   └── razorpay/
│   │   │       └── route.ts
│   │   └── analytics/
│   │       └── route.ts
│   ├── globals.css
│   └── layout.tsx            # Root layout
├── components/
│   ├── ui/                   # Reusable primitives
│   │   ├── Button.tsx
│   │   ├── Input.tsx
│   │   ├── Label.tsx
│   │   ├── Badge.tsx
│   │   ├── Card.tsx
│   │   └── Modal.tsx
│   ├── marketing/            # Landing page sections
│   │   ├── Navbar.tsx
│   │   ├── Hero.tsx
│   │   ├── SocialProof.tsx
│   │   ├── ProductShowcase.tsx
│   │   ├── HowItWorks.tsx
│   │   ├── Features.tsx
│   │   ├── ProfileDemo.tsx
│   │   ├── Pricing.tsx
│   │   ├── Testimonials.tsx
│   │   ├── FAQ.tsx
│   │   └── Footer.tsx
│   ├── three/
│   │   └── HeroCard.tsx      # R3F 3D card component
│   ├── order/
│   │   ├── OrderForm.tsx
│   │   ├── ProfileForm.tsx
│   │   └── PaymentButton.tsx
│   ├── profile/
│   │   ├── ProfilePage.tsx
│   │   ├── ContactActions.tsx
│   │   ├── SocialLinks.tsx
│   │   └── VCardDownload.tsx
│   └── admin/
│       ├── AdminNav.tsx
│       ├── OrderCard.tsx
│       ├── ProfileEditor.tsx
│       └── AnalyticsChart.tsx
├── lib/
│   ├── supabase/
│   │   ├── client.ts         # Browser client
│   │   ├── server.ts         # Server client
│   │   └── middleware.ts
│   ├── razorpay/
│   │   ├── client.ts
│   │   └── verify.ts
│   ├── analytics.ts          # Event tracking helpers
│   ├── validations.ts        # Zod schemas
│   └── utils.ts
├── hooks/
│   ├── useScrollAnimation.ts
│   ├── useAnalytics.ts
│   └── useAdmin.ts
├── types/
│   └── index.ts              # All TypeScript interfaces
├── public/
│   ├── card-model.glb        # 3D card — placeholder until real GLB provided
│   ├── card-placeholder.png  # 2D fallback for hero if GLB unavailable
│   └── fonts/               # Self-hosted fallback (optional)
├── .env.local                # Local env (never commit)
├── .env.example              # Template to commit
├── middleware.ts             # Admin route protection
├── next.config.ts
├── tailwind.config.ts
└── tsconfig.json
```

---

## 5. DATABASE SCHEMA (Supabase)

### 5.1 Table: `profiles`

```sql
CREATE TABLE profiles (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  username      TEXT UNIQUE NOT NULL,
  full_name     TEXT NOT NULL,
  designation   TEXT,
  company       TEXT,
  phone         TEXT,
  whatsapp      TEXT,
  email         TEXT,
  website       TEXT,
  instagram     TEXT,
  linkedin      TEXT,
  twitter       TEXT,
  youtube       TEXT,
  portfolio     TEXT,
  location      TEXT,
  bio           TEXT,
  avatar_url    TEXT,
  is_published  BOOLEAN DEFAULT false,
  created_at    TIMESTAMPTZ DEFAULT now(),
  updated_at    TIMESTAMPTZ DEFAULT now(),
  order_id      UUID REFERENCES orders(id)
);
```

### 5.2 Table: `orders`

```sql
CREATE TABLE orders (
  id                    UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_number          TEXT UNIQUE NOT NULL, -- UTK-XXXXXX format
  full_name             TEXT NOT NULL,
  email                 TEXT NOT NULL,
  phone                 TEXT NOT NULL,
  card_type             TEXT NOT NULL,       -- 'standard' | 'premium' | 'metal'
  quantity              INTEGER DEFAULT 1,
  shipping_address      JSONB NOT NULL,      -- {line1, line2, city, state, pincode}
  profile_photo_url     TEXT,
  existing_design_url   TEXT,
  additional_notes      TEXT,
  payment_status        TEXT DEFAULT 'pending', -- pending | paid | failed
  razorpay_order_id     TEXT,
  razorpay_payment_id   TEXT,
  razorpay_signature    TEXT,
  order_status          TEXT DEFAULT 'received', -- received | in_review | designing | printing | shipped | delivered
  amount                INTEGER NOT NULL,     -- in paise (INR)
  tracking_number       TEXT,
  admin_notes           TEXT,
  profile_id            UUID REFERENCES profiles(id),
  created_at            TIMESTAMPTZ DEFAULT now(),
  updated_at            TIMESTAMPTZ DEFAULT now()
);
```

### 5.3 Table: `admins`

```sql
CREATE TABLE admins (
  id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email      TEXT UNIQUE NOT NULL,
  name       TEXT NOT NULL,
  role       TEXT DEFAULT 'admin',   -- 'admin' | 'super_admin'
  created_at TIMESTAMPTZ DEFAULT now()
);
```

*Admin auth is handled via Supabase Auth. Only emails in this table can access /admin routes.*

### 5.4 Table: `analytics_events`

```sql
CREATE TABLE analytics_events (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  profile_id   UUID REFERENCES profiles(id) ON DELETE CASCADE,
  username     TEXT NOT NULL,
  event_type   TEXT NOT NULL, -- 'page_view' | 'whatsapp_click' | 'website_click' | 'contact_save' | 'instagram_click' | 'linkedin_click' | 'email_click' | 'phone_click' | 'youtube_click' | 'portfolio_click'
  metadata     JSONB,         -- {referrer, user_agent, city} etc
  created_at   TIMESTAMPTZ DEFAULT now()
);
```

### 5.5 Storage Buckets

```
profile-photos/     # Public read, authenticated write
card-designs/       # Private, admin read only
assets/             # General public assets
```

### 5.6 RLS Policies

```sql
-- Profiles: public read (published only), service role write
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Public can read published profiles"
  ON profiles FOR SELECT USING (is_published = true);

-- Analytics: service role insert only, admin read
-- Orders: service role only
-- Admins: service role only
```

---

## 6. ENVIRONMENT VARIABLES

```bash
# .env.example — commit this file

# Supabase
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=

# Razorpay
RAZORPAY_KEY_ID=
RAZORPAY_KEY_SECRET=
NEXT_PUBLIC_RAZORPAY_KEY_ID=

# App
NEXT_PUBLIC_APP_URL=https://unitouch.in
NEXT_PUBLIC_APP_ENV=production

# Email (Resend)
RESEND_API_KEY=

# Admin
ADMIN_EMAILS=admin1@unitouch.in,admin2@unitouch.in,admin3@unitouch.in

# Webhook
RAZORPAY_WEBHOOK_SECRET=
```

---

## 7. PHASE-BY-PHASE BUILD PLAN

---

### PHASE 1 — Foundation Setup
**Goal:** Blank project with full config, zero UI.

**Tasks:**
1. `npx create-next-app@latest unitouch --typescript --tailwind --app --src-dir=no`
2. Install all dependencies from Section 2
3. Set up `tailwind.config.ts` with design tokens from Section 3 (CSS variables + Tailwind mappings)
4. Set up `globals.css` with CSS variable declarations, font imports, base resets
5. Configure `tsconfig.json` with path aliases (`@/components`, `@/lib`, `@/types`, `@/hooks`)
6. Create all folder structure from Section 4 (empty files with placeholder exports)
7. Set up Supabase project → run schema from Section 5 → configure storage buckets → set RLS
8. Create `.env.example`, `.env.local` with all vars from Section 6
9. Set up GitHub repo → initial commit
10. Deploy to Vercel → confirm blank page deploys without errors
11. Configure Vercel environment variables

```
╔══════════════════════════════════════════════════════════════════╗
║  [USER INPUT REQUIRED] — Phase 1 Before Starting                 ║
║                                                                  ║
║  Q1: What is the GitHub repo name? (e.g. unitouch-v1)           ║
║  Q2: What are the 3 admin email addresses for the admins table   ║
║      and ADMIN_EMAILS env var?                                   ║
║  Q3: Is the Supabase project already created, or should I        ║
║      walk through creating it fresh?                             ║
║  Q4: Is unitouch.in already pointed to Vercel, or is that        ║
║      happening later after Phase 1?                              ║
║                                                                  ║
║  → Wait for answers before writing any code.                     ║
╚══════════════════════════════════════════════════════════════════╝
```

**Commit message:** `feat: phase-1 — project foundation, schema, config`

**DO NOT write any visible UI in this phase.**

---

### PHASE 2 — Navbar + Hero Section
**Goal:** The site's most important visual impression. This must be production-quality.

**Navbar (`components/marketing/Navbar.tsx`):**
- Fixed position, `backdrop-blur-md`, border-bottom with `--color-bg-border`
- Logo: "Unitouch" in Space Grotesk 600 weight, with a small NFC icon (Lucide or custom SVG)
- Desktop nav links: Features | How It Works | Pricing | Demo Profile
- CTA: "Order Your Card" → pastel green filled button, `--radius-full`
- Mobile: hamburger → slide-down drawer with same links
- GSAP: fade+slide in on page load (delay 0.1s)
- Scroll behavior: add subtle `bg-opacity` increase after 80px scroll

```
╔══════════════════════════════════════════════════════════════════╗
║  [USER INPUT REQUIRED] — Navbar                                  ║
║                                                                  ║
║  Q1: Do you have a Unitouch logo file (SVG/PNG), or should I     ║
║      build a wordmark logo in code using Space Grotesk?          ║
║  Q2: Should "Demo Profile" in the nav link to a real             ║
║      /u/username page, or to a static demo section on the        ║
║      homepage? If real, which username should it point to?       ║
║  Q3: Any nav links you want to add or remove from:               ║
║      [Features | How It Works | Pricing | Demo Profile]?         ║
║                                                                  ║
║  → Wait for answers before building Navbar.                      ║
╚══════════════════════════════════════════════════════════════════╝
```

**Hero Section (`components/marketing/Hero.tsx`):**
- Full-viewport height (`100svh`)
- Layout: centered text content, 3D card positioned right-center (desktop) or below (mobile)
- Background: `--color-bg-base` + radial gradient glow at top-center (pastel green tint, very subtle)

**Light Beam System:**
```
- Absolute positioned at top-center
- SVG or CSS conic-gradient beam pointing downward
- Width: ~2px line + diffused glow around it
- Color: mix of white (#FFFFFF at 60% opacity) and --color-accent-green at 20% opacity
- Subtle flicker animation (GSAP, 0.05s opacity variation, loop)
- The beam should feel like a spotlight from above, not a laser
```

**3D Card (`components/three/HeroCard.tsx`):**
```
Option A (preferred): Load .glb model from /public/card-model.glb using React Three Fiber
  - useGLTF hook to load model
  - Gentle float animation (GSAP or R3F animation loop)
  - Mouse parallax: card tilts slightly following cursor (max ±8deg X, ±5deg Y)
  - Environment map for reflections (use @react-three/drei's Environment)
  - Fallback: if GLB fails to load, show card-placeholder.png with CSS parallax

Option B (temporary, use when no GLB provided):
  - CSS 3D card with dark matte front, subtle gradient sheen
  - Dimensions: standard business card ratio (3.5:2 = 340px × 194px at desktop)
  - Front: "Unitouch" logo + NFC symbol + subtle "Tap." text
  - Back: clean dark surface with light reflection gradient
  - CSS transform-style: preserve-3d with mouse parallax

IMPORTANT: GLB drop-in path is locked at /public/card-model.glb — do not hardcode a different path.
```

```
╔══════════════════════════════════════════════════════════════════╗
║  [USER INPUT REQUIRED] — Hero Card                               ║
║                                                                  ║
║  Q1: Do you have the GLB model file ready to drop in, or should  ║
║      I build the CSS 3D placeholder card first?                  ║
║      (Answer: "GLB ready" → use Option A from day one.           ║
║       Answer: "Not yet" → build Option B, GLB swaps in later.)   ║
║  Q2: If using CSS placeholder card — what should appear on the   ║
║      card face? Options:                                          ║
║      a) Just "Unitouch" wordmark + NFC symbol                    ║
║      b) A mock profile (name, title, NFC icon)                   ║
║      c) Completely blank dark card with only a subtle sheen       ║
║  Q3: Do you have a card-placeholder.png to use as the 2D         ║
║      fallback image, or should I generate a placeholder?          ║
║                                                                  ║
║  → Wait for answers before building HeroCard component.          ║
╚══════════════════════════════════════════════════════════════════╝
```

**Hero Headline:**
```
Line 1: "Tap. Connect."
Line 2: "Impress Instantly."

Sub: "One NFC card. Your entire professional world. No app needed."

CTA Primary: "Order Your Card →" (--color-accent-green bg, dark text)
CTA Secondary: "See a Live Profile" (ghost button, links to sample profile)
```

```
╔══════════════════════════════════════════════════════════════════╗
║  [USER INPUT REQUIRED] — Hero Copy                               ║
║                                                                  ║
║  Q1: Are you happy with this headline copy, or do you want to    ║
║      change the wording before I hard-code it?                   ║
║      Current: "Tap. Connect. / Impress Instantly."               ║
║  Q2: What should "See a Live Profile" link to?                   ║
║      a) A real published profile at /u/username                  ║
║      b) The ProfileDemo section on the same page (#profile-demo) ║
║      c) A separate /demo page we build later                     ║
║  Q3: Should the hero have any supporting stat or social proof     ║
║      element below the CTAs? Examples:                           ║
║      "500+ professionals already tapping" or "Ships in 5–7 days" ║
║      Or leave it clean with just the two CTAs?                   ║
║                                                                  ║
║  → Wait for answers before finalising hero copy.                 ║
╚══════════════════════════════════════════════════════════════════╝
```

**Hero Animations (GSAP timeline):**
```js
// Sequence on mount:
tl.from('.hero-headline', { y: 40, opacity: 0, duration: 1.2, ease: 'expo.out' })
  .from('.hero-sub', { y: 20, opacity: 0, duration: 0.75, ease: 'power2.out' }, '-=0.6')
  .from('.hero-ctas', { y: 20, opacity: 0, duration: 0.6, ease: 'power2.out' }, '-=0.4')
  .from('.hero-card', { y: 30, opacity: 0, scale: 0.96, duration: 1.0, ease: 'expo.out' }, '-=0.8')
```

**Scroll-triggered scroll indicator:**
- Small animated arrow/dots at bottom of hero
- GSAP fade out when user scrolls 50px

**Commit message:** `feat: phase-2 — navbar, hero, 3D card, light beam`

---

### PHASE 3 — Social Proof + Product Showcase + How It Works + Features
**Goal:** Build trust, show the product, explain the process.

**SocialProof (`components/marketing/SocialProof.tsx`):**
- Thin horizontal bar: "Trusted by professionals at →" followed by company/industry names
- Muted text, small caps, separated by thin vertical dividers
- GSAP horizontal scroll marquee (infinite loop, subtle)

```
╔══════════════════════════════════════════════════════════════════╗
║  [USER INPUT REQUIRED] — Social Proof Bar                        ║
║                                                                  ║
║  Q1: Do you have real company names of customers/clients to      ║
║      show here, or should I use placeholder industry labels?     ║
║      Examples: "Startups · Agencies · Consultants · Founders"    ║
║  Q2: Do you have any real logos/wordmarks to display, or just    ║
║      text names in a muted style?                                ║
║  Q3: If no real social proof yet — would you prefer:             ║
║      a) Industry/category labels (no specific names)             ║
║      b) Remove this section entirely for launch and add later    ║
║      c) Use "500+ cards shipped" type stat instead               ║
║                                                                  ║
║  → This is a trust signal — do not fabricate company names.      ║
║  → Wait for your answer before building this section.            ║
╚══════════════════════════════════════════════════════════════════╝
```

**ProductShowcase (`components/marketing/ProductShowcase.tsx`):**
- Section heading: "Three finishes. One standard."
- Show 3 card variants: Standard | Premium | Metal
- Layout: large card image/3D mockup center, variant switcher tabs below
- Each variant: card visual + brief description + price
- Depth effect: cards slightly stacked/overlapping to show physicality
- Floating UI elements overlaid on the card visual — small stat chips showing profile views, links, etc. to communicate the digital side of the product

```
╔══════════════════════════════════════════════════════════════════╗
║  [USER INPUT REQUIRED] — Product Showcase & Card Tiers           ║
║                                                                  ║
║  Q1: Confirm the 3 card tiers and their actual names:            ║
║      Currently: Standard | Premium | Metal                       ║
║      Are these final, or do you want different tier names?       ║
║  Q2: IMPORTANT — Can you actually deliver a Metal card in V1?    ║
║      You need a confirmed supplier for stainless steel/metal     ║
║      NFC cards before this tier goes live. Options:              ║
║      a) Yes — I have a metal card supplier confirmed             ║
║      b) No — replace Metal with a different tier (e.g. "Custom  ║
║         Design" or "Team Pack")                                  ║
║      c) Keep Metal on the page but mark as "Coming Soon"         ║
║  Q3: Do you have mockup images of the physical cards to show     ║
║      in this section, or should I build CSS card representations?║
║  Q4: What are the final confirmed prices for each tier?          ║
║      Currently: ₹999 | ₹1,499 | ₹2,999 — confirm or update.     ║
║                                                                  ║
║  → Pricing and tier availability are business decisions.         ║
║  → Wait for answers before building ProductShowcase.             ║
╚══════════════════════════════════════════════════════════════════╝
```

**HowItWorks (`components/marketing/HowItWorks.tsx`):**
- Section label chip: "THE PROCESS"
- Heading: "From order to first tap in 5–7 days."
- Layout: horizontal step-by-step flow on desktop, vertical stack on mobile
- Steps laid out horizontally on desktop, vertically on mobile
- Each step: number + icon + title + brief description + pill badge with duration
- Steps:
  ```
  1. Order Your Card       → "5 minutes"
  2. We Design It          → "24–48 hrs"
  3. Card is Printed       → "2–3 days"
  4. NFC Programmed        → "Same day"
  5. Shipped to You        → "1–2 days"
  6. Tap & Share           → "Forever"
  ```
- Connecting line between steps (GSAP draw-on animation on scroll)

```
╔══════════════════════════════════════════════════════════════════╗
║  [USER INPUT REQUIRED] — How It Works Timelines                  ║
║                                                                  ║
║  Q1: Are these delivery timelines realistic and accurate?         ║
║      "We Design It: 24–48 hrs" — is this what you can commit to? ║
║      "Card is Printed: 2–3 days" — confirmed with your supplier? ║
║      "Shipped to You: 1–2 days" — which courier are you using?   ║
║      These are public-facing promises. Confirm before building.  ║
║  Q2: For Step 1 ("If customer has no card design, Unitouch       ║
║      creates one") — do you want this called out on the website  ║
║      as a feature ("Free custom design included") or kept        ║
║      internal/admin-only?                                        ║
║                                                                  ║
║  → Wait for confirmation before setting these timelines in code. ║
╚══════════════════════════════════════════════════════════════════╝
```

**Features (`components/marketing/Features.tsx`):**
- Section heading: "Everything in one tap."
- 6 feature cards in 3×2 grid (desktop), 1 column (mobile)
- Features:
  ```
  ✦ Instant NFC Tap       — No QR, no fumbling, no app download
  ✦ Live Digital Profile  — Update anytime, card stays the same
  ✦ WhatsApp Direct Link  — One tap opens a chat
  ✦ vCard Download        — Contacts saved in 2 seconds
  ✦ Full Analytics         — See who viewed your profile
  ✦ Premium Physical Card  — Matte dark finish, metal option available
  ```
- Card styling: `--color-bg-elevated`, thin border, subtle inner glow on hover (accent-green)
- GSAP: stagger reveal on scroll

**Commit message:** `feat: phase-3 — social proof, product showcase, how it works, features`

---

### PHASE 4 — Profile Demo + Pricing + Testimonials + FAQ + Footer
**Goal:** Complete the marketing page below the fold.

**ProfileDemo (`components/marketing/ProfileDemo.tsx`):**
- Heading: "Your profile. Always ready to impress."
- Show a mock profile page embedded in a phone frame
- Phone frame: CSS/SVG dark mockup
- Inside: render a static version of the profile UI with sample data
- Show all profile actions: WhatsApp, Call, Email, Website, Instagram, LinkedIn
- CTA below: "Your profile looks this good. → Order Now"

```
╔══════════════════════════════════════════════════════════════════╗
║  [USER INPUT REQUIRED] — Profile Demo Section                    ║
║                                                                  ║
║  Q1: What sample name/designation/company should the mock        ║
║      profile display? Options:                                   ║
║      a) A fictional demo person ("Alex Kumar · Founder · Nexus") ║
║      b) Your own profile as the demo (Harsh / Motion by Harsh)  ║
║      c) A published Unitouch customer profile (once you have one)║
║  Q2: Should the phone mockup be:                                  ║
║      a) Static — just a screenshot/illustration of the profile   ║
║      b) Interactive — scrollable, clickable (live rendered UI)   ║
║      c) Animated — auto-scrolling to show different sections     ║
║                                                                  ║
║  → Wait for answers before building ProfileDemo.                 ║
╚══════════════════════════════════════════════════════════════════╝
```

**Pricing (`components/marketing/Pricing.tsx`):**
- Heading: "Simple pricing. No hidden fees."
- 3 tiers (see ProductShowcase USER INPUT above — resolve card tiers there first)
- [MOST POPULAR] badge on middle tier
- CTA on each card: "Order This Card →"

**Testimonials (`components/marketing/Testimonials.tsx`):**
- 4–6 testimonial cards in horizontal scroll (desktop) or stack (mobile)
- Each: avatar placeholder, name, company, testimonial text, star rating

```
╔══════════════════════════════════════════════════════════════════╗
║  [USER INPUT REQUIRED] — Testimonials                            ║
║                                                                  ║
║  Q1: Do you have real customer testimonials to use?              ║
║      Options:                                                    ║
║      a) Yes — I'll provide the testimonial content               ║
║      b) No real ones yet — use placeholder names and realistic   ║
║         placeholder copy that I can replace later                ║
║      c) Skip testimonials section for V1 launch                  ║
║  Q2: If using placeholder — should they look like real people    ║
║      (avatar photos) or abstract avatar icons?                   ║
║      Note: Do not use real person photos without permission.     ║
║                                                                  ║
║  → Never fabricate real company names or real people.            ║
║  → Wait for your answer before building Testimonials.            ║
╚══════════════════════════════════════════════════════════════════╝
```

**FAQ (`components/marketing/FAQ.tsx`):**
- Accordion style, 8 common questions:
  ```
  1. How does NFC work?
  2. Do I need an app?
  3. Can I update my profile after the card is made?
  4. What if I lose my card?
  5. How long does delivery take?
  6. Do you ship across India?
  7. Can I order for my entire team?
  8. What's the difference between plans?
  ```
- GSAP height animation on open/close
- Only one accordion item open at a time

```
╔══════════════════════════════════════════════════════════════════╗
║  [USER INPUT REQUIRED] — FAQ Answers                             ║
║                                                                  ║
║  Q1: The FAQ questions are listed above. Do you want me to write ║
║      the answers too, or will you provide the actual answers?    ║
║      (Answers to "Do you ship across India?" "What if I lose     ║
║      my card?" etc. are business policy decisions I can't        ║
║      make for you.)                                              ║
║  Q2: Are there additional questions you want in the FAQ that     ║
║      aren't in the list above?                                   ║
║                                                                  ║
║  → Provide the FAQ answers so I can hard-code accurate content.  ║
╚══════════════════════════════════════════════════════════════════╝
```

**Footer (`components/marketing/Footer.tsx`):**
- Dark, minimal
- Left: Unitouch logo + tagline
- Center: Quick links (Home, Features, Pricing, FAQ)
- Right: Social icons + "Made in India 🇮🇳"
- Bottom bar: Copyright + Privacy Policy + Terms of Service

```
╔══════════════════════════════════════════════════════════════════╗
║  [USER INPUT REQUIRED] — Footer                                  ║
║                                                                  ║
║  Q1: Which social profiles should be linked in the footer?       ║
║      (Instagram handle, LinkedIn URL, Twitter/X handle, etc.)   ║
║  Q2: Do you have a Privacy Policy and Terms of Service written?  ║
║      a) Yes — I'll provide the content / links                   ║
║      b) No — link to placeholder pages for now                   ║
║      c) No — skip those links for V1                             ║
║  Q3: Any additional footer links beyond:                         ║
║      Home | Features | Pricing | FAQ                             ║
║                                                                  ║
║  → Wait for answers before finalising Footer.                    ║
╚══════════════════════════════════════════════════════════════════╝
```

**Commit message:** `feat: phase-4 — profile demo, pricing, testimonials, FAQ, footer`

---

### PHASE 5 — Order + Profile Form
**Goal:** Full single-page order flow. This is the conversion critical path.

**Route:** `/order`

**OrderForm (`components/order/OrderForm.tsx`):**

Page layout: 2-column desktop (form left, summary right), 1-column mobile.

**Right sidebar (Order Summary):**
- Selected card type + price
- WhatsApp support link
- "Your data is secure" trust badge

**Left form — 3 steps with progress indicator:**

```
Step 1: Select Your Card
  - Card type selector (Standard / Premium / Metal) — visual cards, not dropdowns
  - Quantity (stepper, cap at 5)
  - Price updates dynamically

Step 2: Your Details (Profile + Shipping combined — per the workflow spec)
  Profile Information:
  ├── Full Name *
  ├── Designation *
  ├── Company Name *
  ├── Phone Number *
  ├── WhatsApp Number (autofill from Phone if same — checkbox)
  ├── Email Address *
  ├── Website URL
  ├── Instagram Handle
  ├── LinkedIn URL
  ├── Location (City, State)
  ├── Portfolio URL
  ├── YouTube Channel
  ├── Profile Photo (upload — Supabase Storage)
  └── Existing Card Design (upload, optional — Supabase Storage)

  Shipping Information:
  ├── Shipping Name (autofill from Full Name)
  ├── Address Line 1 *
  ├── Address Line 2
  ├── City *
  ├── State *
  ├── Pincode *
  └── Additional Notes

Step 3: Review & Pay
  - Summary of all details (read-only, editable via "Edit" link)
  - Payment button
```

```
╔══════════════════════════════════════════════════════════════════╗
║  [USER INPUT REQUIRED] — Order Form UX                           ║
║                                                                  ║
║  Q1: The form has a LOT of fields in Step 2 (15+ fields). Do you ║
║      want to split profile info and shipping into two separate   ║
║      steps (making it 4 steps total), or keep them combined in   ║
║      Step 2 with clear section headings?                         ║
║  Q2: For the profile photo upload — what is the max file size    ║
║      you want to allow? (Recommend: 5MB max, JPEG/PNG/WebP)     ║
║  Q3: For the existing card design upload — allowed file types?   ║
║      (Suggest: PDF, PNG, JPG, AI, PSD — or just PDF/PNG/JPG?)   ║
║  Q4: Should there be a "WhatsApp us before ordering" option      ║
║      for customers who have questions? And if yes, what is the   ║
║      Unitouch WhatsApp number to link?                           ║
║  Q5: Should the order form be accessible without the navbar      ║
║      (dedicated page) or keep the full site navigation visible?  ║
║                                                                  ║
║  → Decisions here affect conversion rate directly.               ║
║  → Wait for answers before building the form.                    ║
╚══════════════════════════════════════════════════════════════════╝
```

**Validation (Zod schema):**
```ts
// lib/validations.ts
const orderSchema = z.object({
  cardType: z.enum(['standard', 'premium', 'metal']),
  quantity: z.number().min(1).max(5),
  fullName: z.string().min(2).max(100),
  designation: z.string().optional(),
  company: z.string().optional(),
  phone: z.string().regex(/^[6-9]\d{9}$/, 'Valid Indian mobile number required'),
  whatsapp: z.string().optional(),
  email: z.string().email(),
  website: z.string().url().optional().or(z.literal('')),
  instagram: z.string().optional(),
  linkedin: z.string().url().optional().or(z.literal('')),
  location: z.string().optional(),
  portfolio: z.string().url().optional().or(z.literal('')),
  youtube: z.string().url().optional().or(z.literal('')),
  shipping: z.object({
    name: z.string().min(2),
    line1: z.string().min(5),
    line2: z.string().optional(),
    city: z.string().min(2),
    state: z.string().min(2),
    pincode: z.string().regex(/^\d{6}$/, '6-digit pincode required'),
  }),
  additionalNotes: z.string().max(500).optional(),
})
```

**Form submission flow:**
```
1. Client validates form → all OK
2. Upload profile photo → get URL
3. Upload card design (if any) → get URL
4. POST /api/razorpay/create-order → receive Razorpay order ID + amount
5. Store form data in sessionStorage (for recovery if payment fails)
6. Open Razorpay checkout modal
7. On success: POST /api/razorpay/verify with payment signature
8. If verified: INSERT into orders + INSERT into profiles (unpublished)
9. Redirect to /order/success?order=UTK-XXXXXX
```

```
╔══════════════════════════════════════════════════════════════════╗
║  [USER INPUT REQUIRED] — Order Success Page                      ║
║                                                                  ║
║  Q1: What should the /order/success page show after payment?     ║
║      Currently planned: order number + confirmation message.     ║
║      Should it also show:                                        ║
║      a) "We'll WhatsApp you within X hours" (and your WA number) ║
║      b) Expected delivery date estimate                          ║
║      c) A link to track order status (admin updates later)       ║
║      d) All of the above                                         ║
║  Q2: Should a confirmation email be sent to the customer         ║
║      automatically? If yes, provide:                             ║
║      - The "from" email address (e.g. orders@unitouch.in)        ║
║      - Should I write the email template copy?                   ║
║                                                                  ║
║  → Wait for answers before building the success page.            ║
╚══════════════════════════════════════════════════════════════════╝
```

**Commit message:** `feat: phase-5 — order form, profile form, multi-step flow, validation`

---

### PHASE 6 — Razorpay Integration
**Goal:** Secure payment processing end-to-end.

**`/api/razorpay/create-order/route.ts`:**
```ts
// POST handler
// Input: { cardType, quantity }
// 1. Calculate amount based on pricing config
// 2. Create Razorpay order via Razorpay Node SDK
// 3. Return { orderId, amount, currency: 'INR' }
// Authenticate: basic rate limiting (3 requests/min per IP)
```

**Pricing Config:**
```ts
const PRICES = {
  standard: 99900,   // ₹999 in paise
  premium:  149900,  // ₹1,499 in paise
  metal:    299900,  // ₹2,999 in paise — update if tiers change per Phase 3 USER INPUT
}
```

**`/api/razorpay/verify/route.ts`:**
```ts
// POST handler
// Input: { razorpay_order_id, razorpay_payment_id, razorpay_signature, orderData }
// 1. Verify HMAC signature using crypto module
// 2. If valid: save order + profile to Supabase
// 3. Generate order number: UTK-${Date.now().toString(36).toUpperCase()}
// 4. Send confirmation email via Resend
// 5. Return { success: true, orderNumber }
```

**`/api/webhook/razorpay/route.ts`:**
```ts
// Razorpay webhook for payment.captured event
// Verify webhook signature
// Update payment_status in orders table
// Fallback in case client-side verify didn't fire
```

```
╔══════════════════════════════════════════════════════════════════╗
║  [USER INPUT REQUIRED] — Razorpay Setup                          ║
║                                                                  ║
║  Q1: Do you have a Razorpay account created and Key ID/Secret    ║
║      ready, or do we need to set up the account first?           ║
║  Q2: Are you starting with Razorpay Test Mode or going straight  ║
║      to Live Mode? (Recommend: test mode first, go live after    ║
║      one end-to-end test order.)                                 ║
║  Q3: Do you want a Razorpay payment link fallback for customers  ║
║      whose payment modal fails to open? (Some mobile browsers    ║
║      block popups — a fallback link prevents lost orders.)       ║
║  Q4: Should failed payments be retryable from the same order     ║
║      form, or does the customer start from scratch?              ║
║                                                                  ║
║  → Provide Razorpay credentials in .env.local before this phase. ║
║  → Wait for answers before building payment flow.                ║
╚══════════════════════════════════════════════════════════════════╝
```

**Commit message:** `feat: phase-6 — razorpay payment integration, webhooks, order creation`

---

### PHASE 7 — Public Profile Pages
**Goal:** The end-product experience. Every tap of the NFC card lands here.

**Route:** `/u/[username]`

**Profile page design — mobile-first, premium dark:**
```
- Full screen, mobile-first
- Background: --color-bg-base
- Top section:
  ├── Cover area with subtle gradient
  ├── Profile photo (circle, border: 2px accent-green glow)
  ├── Full Name (Space Grotesk, 28px)
  ├── Designation + Company (Inter, muted)
  └── Location (small, muted, location pin icon)

- Primary Actions (large, full-width tap targets — 56px height min):
  ├── WhatsApp → opens wa.me/91XXXXXXXXXX
  ├── Call → tel: link
  ├── Email → mailto: link
  └── Save Contact → vCard download

- Digital Presence (icon + label rows):
  ├── Website
  ├── Instagram
  ├── LinkedIn
  ├── Twitter (if provided)
  ├── YouTube (if provided)
  └── Portfolio (if provided)

- vCard Download: generates RFC 6350 compliant .vcf
- Footer: "Powered by Unitouch" (subtle, links to homepage)
```

```
╔══════════════════════════════════════════════════════════════════╗
║  [USER INPUT REQUIRED] — Profile Page Design                     ║
║                                                                  ║
║  Q1: For the profile page cover area — what style do you want?   ║
║      a) Solid dark background with subtle radial gradient        ║
║      b) The profile photo blurred and stretched as the cover     ║
║         (common in music/contact apps)                           ║
║      c) Abstract animated background (GSAP particle or gradient) ║
║      d) Clean flat dark — minimal, no cover treatment            ║
║  Q2: Should the primary action buttons (WhatsApp, Call, etc.)    ║
║      use the accent green color, or stay dark/outlined?          ║
║  Q3: If a profile has no photo uploaded — what shows in the      ║
║      avatar circle?                                              ║
║      a) First letter of their name (initial, styled)             ║
║      b) A generic person icon                                    ║
║      c) The Unitouch NFC symbol/logo                             ║
║  Q4: Should the "Powered by Unitouch" footer link be visible     ║
║      or very subtle? This is a branding/marketing decision.      ║
║      On free tier it's standard — but on premium, hide it?       ║
║                                                                  ║
║  → Profile page is the product. Take time on these decisions.    ║
║  → Wait for answers before building ProfilePage.                 ║
╚══════════════════════════════════════════════════════════════════╝
```

**Profile page NOT found:** Custom 404 with "This profile doesn't exist or hasn't been published yet."

**Analytics tracking (non-blocking):**
```ts
// On page load: fire 'page_view' event
// On each action click: fire corresponding event
// POST /api/analytics with { username, event_type, metadata }
// Must not block or affect the user experience in any way
```

**vCard generation:**
```ts
// lib/generateVCard.ts
// Creates RFC 6350 compliant .vcf string
// Includes: name, phone, email, website, org, photo URL
// Triggers browser download
```

**OG Image for profile:**
- Dynamic `/u/[username]/opengraph-image.tsx` using Next.js ImageResponse
- Shows: name, company, photo, Unitouch branding
- Used when profile link is shared on WhatsApp/LinkedIn

```
╔══════════════════════════════════════════════════════════════════╗
║  [USER INPUT REQUIRED] — Username Assignment                     ║
║                                                                  ║
║  Q1: How is the username for a profile determined?               ║
║      Options:                                                    ║
║      a) Admin manually assigns it when creating the profile      ║
║         in the admin panel (most flexible)                       ║
║      b) Auto-generated from the customer's full name             ║
║         (e.g. "harsh-mehta" from "Harsh Mehta")                  ║
║      c) Customer chooses it during the order form                ║
║      (Current architecture assumes option a — confirm.)          ║
║  Q2: Should the username be editable after the profile is        ║
║      published? (Changing it breaks the NFC card's programmed    ║
║      URL permanently — needs a clear policy.)                    ║
║                                                                  ║
║  → This affects the NFC programming step. Important to confirm.  ║
╚══════════════════════════════════════════════════════════════════╝
```

**Commit message:** `feat: phase-7 — public profile pages, vCard, analytics tracking, OG image`

---

### PHASE 8 — Admin Panel
**Goal:** Internal tool for 3 admins. Functional over beautiful, but still on-brand.

**Auth:**
- Supabase email/password auth
- Middleware checks: authenticated AND email in `admins` table
- Protected routes: all `/admin/*`
- `/admin/login` → standard login form, redirect to `/admin/dashboard` on success

**Admin Dashboard (`/admin/dashboard`):**
```
- Stats cards: Total Orders | Paid Orders | Pending | Profiles Published
- Recent orders list (last 10)
- Quick action: "Create Profile Manually"
```

**Orders List (`/admin/orders`):**
```
- Table: Order # | Name | Card Type | Amount | Payment Status | Order Status | Date
- Filters: All | Paid | Pending | Failed
- Sort: Date (newest first)
- Click row → go to /admin/orders/[id]
```

**Single Order (`/admin/orders/[id]`):**
```
Left panel:
- Full order details (read-only)
- Payment status badge
- Shipping address
- Additional notes
- Uploaded assets (profile photo + card design previews)
- Admin notes textarea (editable, auto-save)

Right panel:
- Order Status selector (received → in_review → designing → printing → shipped → delivered)
- "Update Status" button
- Tracking number input (shows when status = shipped)
- Link to profile (if published)
- "Go to Profile Editor" button
```

**Profiles List (`/admin/profiles`):**
```
- Table: Username | Name | Company | Published | Order # | Created
- Filter: Published | Unpublished
- Click row → go to /admin/profiles/[id]
```

**Profile Editor (`/admin/profiles/[id]`):**
```
- All profile fields editable
- Photo upload/replace
- Preview pane: live preview of profile page
- "Publish Profile" toggle with confirmation modal
- "View Live Profile" link (opens /u/username in new tab)
```

**Analytics (`/admin/analytics`):**
```
- Simple table per profile: views | whatsapp | website | contact saves | instagram | linkedin
- Date range filter (last 7d / 30d / all time)
- Top 5 profiles by views
```

```
╔══════════════════════════════════════════════════════════════════╗
║  [USER INPUT REQUIRED] — Admin Panel                             ║
║                                                                  ║
║  Q1: Should admin receive a notification when a new order comes  ║
║      in? If yes, how?                                            ║
║      a) Email notification (via Resend) — which email address?   ║
║      b) WhatsApp notification (requires extra integration)       ║
║      c) Both                                                     ║
║      d) No notification — admin checks dashboard manually        ║
║  Q2: The admin panel currently has no visual design specified    ║
║      beyond "on-brand dark." Should it:                          ║
║      a) Match the marketing site exactly (same dark theme)       ║
║      b) Be a lighter, more functional theme (dark sidebar,       ║
║         lighter content area) for easier readability             ║
║      c) Keep it full dark, just simpler/denser than marketing    ║
║  Q3: Should there be a "Manual Profile Create" flow in admin     ║
║      (for walk-in customers, gift orders, or offline sales)?     ║
║      This would let admin create a profile without an order.     ║
║  Q4: For the profile preview pane in the editor — should it be   ║
║      a full live render (iframe) or a simplified preview card?   ║
║      Full render is more accurate but heavier to build.          ║
║                                                                  ║
║  → Wait for answers before building the admin panel.             ║
╚══════════════════════════════════════════════════════════════════╝
```

**Commit message:** `feat: phase-8 — admin panel, order management, profile editor, analytics`

---

### PHASE 9 — Animation Polish
**Goal:** Bring the site to Apple/Linear-level motion quality.

**GSAP ScrollTrigger setup:**
```ts
// Register plugins globally in app/layout.tsx:
gsap.registerPlugin(ScrollTrigger, SplitText)
```

**Section reveal system:**
- All sections use a consistent `useScrollAnimation` hook
- Default: `y: 60, opacity: 0` → `y: 0, opacity: 1`, `duration: 0.75`, `ease: 'power2.out'`
- Stagger for grid items: `stagger: 0.08`

**Hero SplitText:**
- Split headline by chars for staggered character animation
- Space Grotesk characters slide up from below

**Magnetic buttons:**
- Primary CTAs: subtle magnetic pull on hover
- Max offset: 6px
- Smooth return on mouseLeave

**Card float animation:**
- CSS card or GLB card: continuous gentle float
- `y: '-12px'` → `y: '0px'` loop, 3.5s duration, ease: `'sine.inOut'`
- Slight rotation: `rotateY: 2deg` → `rotateY: -2deg`

**Smooth scroll:**
- Implement Lenis integrated with GSAP ScrollTrigger

**Page transitions:**
- Fade in/out between routes (Framer Motion AnimatePresence)
- Duration: 0.3s

**Reduced motion:**
```ts
const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches
if (!prefersReducedMotion) { /* run animation */ }
```

```
╔══════════════════════════════════════════════════════════════════╗
║  [USER INPUT REQUIRED] — Animation Polish                        ║
║                                                                  ║
║  Q1: At this stage, review all animation implementations from    ║
║      Phases 2–4. Which ones feel off or too heavy?               ║
║      List any specific sections that need reworking.             ║
║  Q2: Should the HowItWorks connecting line between steps be:     ║
║      a) Drawn on with GSAP (line animates as you scroll)         ║
║      b) Static dashed line (simpler, less JS)                    ║
║      c) Animated dots traveling along the path                   ║
║  Q3: Do you want a custom cursor on desktop (e.g. a subtle       ║
║      glowing dot that follows the mouse)?                        ║
║      This is a detail but contributes to premium feel.           ║
║                                                                  ║
║  → This is a review-and-refine phase. Come in with notes on      ║
║      what felt right or wrong from the previous phases.          ║
╚══════════════════════════════════════════════════════════════════╝
```

**Commit message:** `feat: phase-9 — animation polish, GSAP ScrollTrigger, SplitText, magnetic buttons`

---

### PHASE 10 — SEO + Performance + Mobile
**Goal:** Ship-ready quality. Perfect Lighthouse score on mobile.

**SEO:**
```ts
export const metadata: Metadata = {
  title: 'Unitouch — Premium NFC Business Cards India',
  description: 'One tap. Your entire professional world. Premium NFC digital business cards starting ₹999. Instant digital profile. No app needed.',
  keywords: ['NFC business card', 'digital business card India', 'smart business card', 'NFC card'],
  openGraph: {
    title: 'Unitouch — Tap. Connect. Impress.',
    url: 'https://unitouch.in',
    siteName: 'Unitouch',
    images: [{ url: '/og-image.jpg', width: 1200, height: 630 }],
    locale: 'en_IN',
    type: 'website',
  },
  robots: { index: true, follow: true },
  alternates: { canonical: 'https://unitouch.in' },
}
```

**Performance checklist:**
- [ ] All images: Next/Image with explicit width/height
- [ ] Font: preload Space Grotesk and Inter in `<head>`
- [ ] 3D/GSAP: dynamic imports with `{ ssr: false }`
- [ ] Razorpay script: load only on /order page
- [ ] Bundle: check with `@next/bundle-analyzer`
- [ ] Images: WebP, compressed, lazy loaded below fold

**Mobile responsiveness:**
- Breakpoints: `sm: 640px`, `md: 768px`, `lg: 1024px`, `xl: 1280px`
- Minimum tap target: 44×44px on all interactive elements
- Test on: 375px (iPhone SE), 390px (iPhone 14), 768px (iPad), 1440px (desktop)

**Accessibility:**
- All images: `alt` text
- All buttons: keyboard accessible, visible focus ring
- Color contrast: minimum 4.5:1 ratio for body text
- Semantic HTML throughout

```
╔══════════════════════════════════════════════════════════════════╗
║  [USER INPUT REQUIRED] — Pre-Launch Checklist                    ║
║                                                                  ║
║  Q1: Do you have the OG image (1200×630px) ready for the site?   ║
║      This is what shows when the URL is shared on WhatsApp/      ║
║      LinkedIn. Should I generate a placeholder?                  ║
║  Q2: Is unitouch.in DNS configured and pointing to Vercel?       ║
║      Confirm before marking this phase complete.                 ║
║  Q3: Have you done one full end-to-end test order in             ║
║      Razorpay test mode? Do not go live without this.            ║
║  Q4: Do you want a sitemap.xml and robots.txt generated?         ║
║      (Recommended: yes for both)                                 ║
║  Q5: Google Search Console setup — do you want instructions      ║
║      for verifying the domain?                                   ║
║                                                                  ║
║  → All items above must be confirmed before marking V1 as done.  ║
╚══════════════════════════════════════════════════════════════════╝
```

**Commit message:** `feat: phase-10 — SEO, performance, mobile, accessibility, launch-ready`

---

## 8. COMPONENT API REFERENCE

### Button.tsx
```tsx
interface ButtonProps {
  variant: 'primary' | 'secondary' | 'ghost' | 'danger'
  size: 'sm' | 'md' | 'lg'
  loading?: boolean
  disabled?: boolean
  magnetic?: boolean // enables magnetic hover effect
  children: React.ReactNode
  onClick?: () => void
}
// primary: --color-accent-green bg, dark text, --radius-full
// secondary: transparent bg, --color-accent-green border, green text
// ghost: no border, muted text, hover underline
// danger: red-tinted
```

### Card.tsx
```tsx
interface CardProps {
  variant: 'default' | 'elevated' | 'outline'
  glow?: boolean // subtle green inner glow on hover
  className?: string
  children: React.ReactNode
}
```

### Badge.tsx
```tsx
interface BadgeProps {
  variant: 'default' | 'green' | 'purple' | 'muted'
  size: 'sm' | 'md'
  children: React.ReactNode
}
```

---

## 9. TYPESCRIPT INTERFACES

```ts
// types/index.ts

export interface Profile {
  id: string
  username: string
  fullName: string
  designation?: string
  company?: string
  phone?: string
  whatsapp?: string
  email?: string
  website?: string
  instagram?: string
  linkedin?: string
  twitter?: string
  youtube?: string
  portfolio?: string
  location?: string
  bio?: string
  avatarUrl?: string
  isPublished: boolean
  createdAt: string
  updatedAt: string
  orderId?: string
}

export interface Order {
  id: string
  orderNumber: string
  fullName: string
  email: string
  phone: string
  cardType: 'standard' | 'premium' | 'metal'
  quantity: number
  shippingAddress: ShippingAddress
  profilePhotoUrl?: string
  existingDesignUrl?: string
  additionalNotes?: string
  paymentStatus: 'pending' | 'paid' | 'failed'
  razorpayOrderId?: string
  razorpayPaymentId?: string
  orderStatus: OrderStatus
  amount: number
  trackingNumber?: string
  adminNotes?: string
  profileId?: string
  createdAt: string
}

export type OrderStatus =
  | 'received'
  | 'in_review'
  | 'designing'
  | 'printing'
  | 'shipped'
  | 'delivered'

export interface ShippingAddress {
  name: string
  line1: string
  line2?: string
  city: string
  state: string
  pincode: string
}

export interface AnalyticsEvent {
  id: string
  profileId: string
  username: string
  eventType: EventType
  metadata?: Record<string, unknown>
  createdAt: string
}

export type EventType =
  | 'page_view'
  | 'whatsapp_click'
  | 'website_click'
  | 'contact_save'
  | 'instagram_click'
  | 'linkedin_click'
  | 'email_click'
  | 'phone_click'
  | 'youtube_click'
  | 'portfolio_click'

export interface CardVariant {
  id: 'standard' | 'premium' | 'metal'
  name: string
  price: number
  priceInPaise: number
  features: string[]
  isPopular?: boolean
}
```

---

## 10. API REFERENCE SUMMARY

| Route | Method | Auth | Description |
|---|---|---|---|
| `/api/razorpay/create-order` | POST | None | Create Razorpay order |
| `/api/razorpay/verify` | POST | None | Verify payment + save to DB |
| `/api/webhook/razorpay` | POST | Webhook secret | Handle payment.captured |
| `/api/analytics` | POST | None | Log analytics event |

---

## 11. CUSTOMER WORKFLOW REFERENCE (for phase context)

The full 25-step customer journey is:

1. Customer lands on Unitouch website (Phase 2 & 3 — marketing site)
2–4. Explores product, pricing, sample profiles (Phase 3 & 4)
5. Clicks "Order Your Card" → `/order` (Phase 5)
6–7. Fills form including profile data + uploads (Phase 5)
8. Pays via Razorpay (Phase 6)
9–10. Order + profile auto-created in DB (Phase 6)
11–15. Admin reviews, creates design, generates profile (Phase 8)
16–20. NFC programmed, card shipped, tracking updated (Phase 8)
21–23. Customer taps card → profile opens (Phase 7)
24–25. Analytics tracked (Phase 7)

---

## 12. QUALITY STANDARDS

**Code quality:**
- TypeScript: no `any` types unless absolutely unavoidable
- Every component: typed props with interface
- All API routes: proper error handling, typed responses
- No `console.log` in production code

**Visual quality:**
- Every section: verified on mobile (375px) before moving to next
- Animations: must feel smooth, not janky — 60fps minimum
- No lorem ipsum in final code — use realistic Unitouch copy
- Spacing: use only the 8px grid system, no arbitrary values

**Performance:**
- LCP: < 2.5s on mobile 4G
- No layout shift from fonts (add `font-display: swap`)
- 3D card: must load with fallback if WebGL unsupported

---

## 13. WHAT TO AVOID (HARD RULES)

❌ Do NOT use glassmorphism everywhere — only allow in 1–2 specific places max
❌ Do NOT use bright saturated colors (no #00FF00, no #FF0000)
❌ Do NOT use generic SaaS component libraries (Shadcn defaults, MUI, Chakra)
❌ Do NOT use crypto/fintech dashboard patterns (candlesticks, price tickers, dark green P&L)
❌ Do NOT use gradients as the primary background — only as accent glows
❌ Do NOT add authentication for customers — no login, no accounts
❌ Do NOT skip mobile testing before committing any phase
❌ Do NOT combine multiple phases into one commit
❌ Do NOT add features not listed here without asking
❌ Do NOT use hardcoded color values — always reference CSS variables
❌ Do NOT skip [USER INPUT REQUIRED] blocks — always stop and ask

---

## 14. MASTER CLAUDE CODE PROMPT

> Copy this exactly into Claude Code at the start of each new session:

```
You are building the Unitouch V1 website — a premium NFC digital business card platform for the Indian market.

Your source of truth is the Unitouch_V1_Full_Architecture.md document. Read it completely before writing any code. Every design decision, DB schema, file structure, component API, and phase plan is defined there. Do not deviate from it.

Secondary reference: The original Unitouch_V1_Architecture.pdf is background context — this document supersedes it wherever there is a conflict.

Design references (3 images provided):
- These are visual mood references only — do NOT copy any layout, section structure, copy, UI component, or brand identity from them
- Extract only: lighting quality, depth feel, typographic contrast, accent restraint, spacing generosity
- Do not name or reference these products in the codebase, in comments, or in any component
- Build Unitouch's visual identity from scratch using the design system in this document; the references communicate feeling, not structure

3D Hero Card:
- Primary: load /public/card-model.glb via React Three Fiber (useGLTF)
- If GLB not yet provided: build CSS 3D card (standard business card ratio 3.5:2) with dark matte finish, Unitouch logo, NFC symbol, gentle float animation
- GLB drop-in path is locked at /public/card-model.glb — never change this path

[USER INPUT REQUIRED] blocks:
- This document contains multiple [USER INPUT REQUIRED] blocks inside each phase
- When you reach one, STOP. Present the questions clearly to Harsh. Wait for his answers.
- Do not guess, do not use defaults, do not skip the block.
- Only after receiving answers should you continue building that section.

Build rules:
1. One phase at a time. Complete, test, commit, then ask before continuing.
2. Commit message format: feat: phase-N — description
3. Confirm GitHub push before moving to next phase.
4. Mobile-first at every phase — test 375px before moving on.
5. No `any` TypeScript. No hardcoded color values. No lorem ipsum.
6. GSAP is primary animation library. Framer Motion only for page transitions.
7. Ask before adding any library not listed in the architecture document.
8. Visual quality > feature quantity. If unsure, do less better.
9. Never fabricate business data — prices, timelines, supplier capabilities.

We are currently starting Phase 1. Read the full architecture document first, then present the Phase 1 [USER INPUT REQUIRED] questions before writing any code.
```

---

*End of Unitouch V1 Full Architecture & Build Plan*
*Total phases: 10 | [USER INPUT REQUIRED] blocks: 18 | Version: 2.0 | Last updated: June 2026*
