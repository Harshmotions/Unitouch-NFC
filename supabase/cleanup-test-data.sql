-- Security audit #13 — Remove Test Data
--
-- Run this MANUALLY in the Supabase SQL editor, one step at a time.
-- Deliberately not automated: this deletes production rows.
--
-- Target (verified 2026-08-13, both rows confirmed linked to each other):
--   orders.order_number   = 'UTK-324849'            id cdf45a81-c14f-45ed-8027-4bb95bf837eb
--   profiles.username     = 'unitouch-test-20260810' id a66310ef-7879-4a90-8781-ad1bfb06da2d
--   analytics_events      = 2 rows for that username
--
-- DO NOT delete the auth user (ebafe955-9d72-42de-9183-43ce1537c4de).
-- That same account also owns the real 'harshw' profile.


-- ── STEP 1 — look before you delete ────────────────────────────────────────
-- Run this first and eyeball the rows. Expect exactly one order, one profile
-- (both named "Unitouch Test"), and 2 analytics rows. If you see anything
-- else, stop.

select 'order' as kind, id::text, order_number as label, full_name, created_at
from public.orders
where order_number = 'UTK-324849'
union all
select 'profile', id::text, username, full_name, created_at
from public.profiles
where username = 'unitouch-test-20260810'
union all
select 'analytics', id::text, username, event_type, created_at
from public.analytics_events
where username = 'unitouch-test-20260810';


-- ── STEP 2 — delete ───────────────────────────────────────────────────────
-- Wrapped in a transaction so a surprise (e.g. a row count you didn't expect)
-- can be rolled back instead of half-applied.
--
-- Order matters only for tidiness: deleting the profile sets
-- orders.profile_id to NULL (FK is ON DELETE SET NULL) and cascades any
-- admin_audit_log rows; analytics_events.profile_id likewise nulls out, which
-- is why the analytics rows are removed explicitly by username first.

begin;

delete from public.analytics_events
where username = 'unitouch-test-20260810';

delete from public.profiles
where username = 'unitouch-test-20260810';

delete from public.orders
where order_number = 'UTK-324849';

-- Check the reported row counts above look right (1 / 1, plus 2 analytics),
-- then:
commit;
-- ...or, if anything looked wrong:
-- rollback;


-- ── STEP 3 — confirm it's gone ────────────────────────────────────────────
-- All three counts must come back 0.

select
  (select count(*) from public.orders   where order_number = 'UTK-324849')             as leftover_orders,
  (select count(*) from public.profiles where username = 'unitouch-test-20260810')      as leftover_profiles,
  (select count(*) from public.analytics_events where username = 'unitouch-test-20260810') as leftover_analytics;
