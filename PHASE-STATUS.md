# Checkout Refactor — status (resume here)

"Buy Now, Build Later" checkout refactor. Working branch:
**`feat/checkout-refactor`** (stacked on `feat/auth-foundation`, off `main`).
`main` is pristine; nothing merged yet.

## Done ✅
- **Phase 1 — Auth foundation** (`feat/auth-foundation`): `@supabase/ssr`
  browser/server clients, session-refresh middleware, email-OTP `OtpSignIn`
  component, `/login` test page. Readable error handling.
- **Phase 2 — DB migration 001** (applied to live DB): `user_id` on
  orders+profiles, `profiles.full_name` nullable, `profiles.studio_completed`.
- **Phase 3 — New Step 1** (`OrderStepIdentity` + `IdentityFields`): auth gate
  + account type (personal/business) + display name + logo (required for
  business) + username live-check + simplified preview (responsive). Dev
  harness at `/dev-identity` (guarded off in production).
- **Phase 4a — DB migration 002** (applied): atomic
  `create_order_with_profile(...)` RPC (order + placeholder profile in one
  transaction). Verified atomic.
- **Phase 4b — New flow wired** (`OrderWizard` → `OrderStepIdentity` →
  `OrderStepShippingPayment`): auth-gated checkout route calling the RPC;
  identity taken from session; image upload; success page reflects
  placeholder profile. Verified end-to-end with a temporary test user.

- **Phase 5 — Digital Studio**:
  - `/api/profiles/update` (5a): auth + ownership check, UPDATEs (never
    inserts) the user's profile; optional image override; publish sets
    is_published + studio_completed true.
  - Studio UI + page (5b): `components/studio/ProfileStudio.tsx` +
    `app/studio/page.tsx` (auth-gated, loads the user's profile via
    `getEditableProfile`). Save draft / Publish, live preview, image override.
    `lib/interests.ts` holds the shared tag-suggestion helpers.
  - Wiring + cleanup (5c): success page → "Build your profile"
    (`/studio?username=`); deleted now-dead `OrderStepDetails`,
    `OrderStepPayment`, `OrderStepProfile`.
  - Verified end-to-end with a temporary test user: placeholder → edit →
    publish → live `/u/[username]`.

## The refactor is functionally complete.
All five phases are built and verified. Remaining before merge to `main`:
email SMTP (so real sign-in works — see below), then a real human
click-through of the whole flow (incl. an actual image upload, which can't be
automated). Consider opening the PR for review now; hold the merge until the
click-through.

## Deferred / blocked
- **Email delivery for OTP sign-in** is NOT working. Supabase's built-in email
  only sends a magic *link* (template locked without SMTP) and is
  rate-limited. Decision: use Resend SMTP, but `onboarding@resend.dev` won't
  send over SMTP — needs a **verified domain** (DNS access) or a fallback
  SMTP. Until then, sign-in can't be completed through the UI. Auth *code* is
  correct and done; this is purely email delivery config.
- Verifying auth-gated flows locally without email: create a test user via
  the admin API + a temporary (uncommitted) `/api/dev-login` password route to
  set a session; delete both afterwards.

## Env / infra notes
- `.env.local` present (git-ignored). Supabase project ref: `kzifcvhzhbvojvetqcri`.
- JioFiber router cached a stale NXDOMAIN for the Supabase host; fixed by
  setting the PC's DNS to 8.8.8.8 / 1.1.1.1. If the app can't reach Supabase
  after a paused project resumes, flush DNS / re-check this.
- Razorpay + Resend app keys still empty; payment step is a mock.

## To resume
Say: "Continue the checkout refactor — Phase 5, Digital Studio, on branch
`feat/checkout-refactor`." Mention if email SMTP is sorted so we can do a real
click-through (incl. a logo upload, which can't be automated).
