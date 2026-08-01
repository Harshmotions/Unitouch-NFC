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

## Next: Phase 5 — Digital Studio (HEAVY)
Post-payment builder where the signed-in user completes the placeholder
profile and publishes it. Scope:
- Studio UI: bio, socials, tags/interests, extra links, profile style/theme,
  full smartphone live preview (adapt existing `OrderStepProfile`).
- Image override (different image for the digital profile vs print asset).
- New `/api/profiles/update` route: auth + ownership check, `UPDATE` (not
  insert) on the user's placeholder profile; publish = set `is_published` +
  `studio_completed` true.
- Load the signed-in user's placeholder profile into the studio.
- A studio route/page, returnable later (user is authenticated).
- Then clean up now-dead `OrderStepDetails` / `OrderStepPayment`.

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
