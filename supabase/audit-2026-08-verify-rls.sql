-- Security audit #07 — Supabase production RLS verification.
-- Run manually in the Supabase SQL editor (read-only, no writes).
-- Note: this schema has no `draft_profiles` table — the audit mentioned one,
-- but placeholder-then-published profiles live in `profiles` itself.

-- 1. RLS must be enabled (rowsecurity = true) on every one of these.
select tablename, rowsecurity
from pg_tables
where schemaname = 'public'
  and tablename in ('profiles', 'analytics_events', 'orders', 'admin_audit_log');

-- 2. List every policy. Expected: exactly one policy total —
--    "Public can read published profiles" (anon, select, on profiles,
--    using is_published = true). analytics_events, orders, and
--    admin_audit_log should have ZERO rows here (service-role bypasses RLS
--    entirely and was never meant to need an explicit policy).
select schemaname, tablename, policyname, roles, cmd, qual
from pg_policies
where schemaname = 'public';

-- 3. Storage bucket policies — confirm no unauthenticated write/delete.
--    profile-photos and assets are public buckets (read-only exposure is
--    intentional); card-designs is private. Storage policies are RLS
--    policies on storage.objects, scoped by bucket via the `qual`/`with_check`
--    expression — review each one for INSERT/UPDATE/DELETE open to `public`
--    or `anon` with no bucket_id or ownership condition.
select policyname, roles, cmd, qual, with_check
from pg_policies
where schemaname = 'storage' and tablename = 'objects';

-- Also confirm the buckets are configured as expected (public flag):
select id, name, public
from storage.buckets
where id in ('profile-photos', 'card-designs', 'assets');

-- 4. Manual checks (not queryable from SQL):
--    - Supabase dashboard > Project Settings > API: confirm the
--      service-role key is used only in Vercel's server-side env vars,
--      never in NEXT_PUBLIC_* or any client bundle.
--    - Supabase dashboard > Database > Audit Logs: enable logging for
--      profiles, orders, and admin_audit_log if not already on.
