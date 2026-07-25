-- Migration 001 — "Buy Now, Build Later" checkout refactor (Phase 2).
--
-- Run ONCE in the Supabase SQL editor for this project. Every statement is
-- guarded (IF NOT EXISTS / DROP NOT NULL is idempotent), so re-running it is
-- safe and does nothing the second time.
--
-- What it does:
--   1. Ties orders + profiles to the authenticated user (user_id).
--   2. Makes profiles.full_name optional, so a "placeholder" profile can be
--      created at payment time with only username + print image.
--   3. Adds profiles.studio_completed to distinguish a finished digital
--      profile from a not-yet-built placeholder.
--
-- The atomic order+profile insert (RPC) is intentionally NOT here — it ships
-- in a later migration alongside the route that calls it, so its signature
-- matches exactly and this file never needs re-running.

-- 1. Ownership --------------------------------------------------------------
-- Nullable at the DB level on purpose: the existing fictional seed profiles
-- (rohan, priya, ...) predate auth and have no owner, so a hard NOT NULL would
-- reject them and fail the migration. The application enforces user_id on
-- every new order/profile. Deleting a user removes their profiles but keeps
-- their order records (set null) for accounting history.
alter table public.profiles
  add column if not exists user_id uuid references auth.users(id) on delete cascade;

alter table public.orders
  add column if not exists user_id uuid references auth.users(id) on delete set null;

create index if not exists profiles_user_id_idx on public.profiles(user_id);
create index if not exists orders_user_id_idx on public.orders(user_id);

-- 2. Placeholder-friendly profiles ------------------------------------------
-- The Buy-Now step inserts a profile with just username + print image; the
-- rest is filled in later in the studio. full_name can no longer be required.
alter table public.profiles
  alter column full_name drop not null;

-- 3. Studio completion flag -------------------------------------------------
-- false = paid placeholder awaiting the digital studio; true = user finished
-- building. The public page keys off is_published; this flag lets the studio
-- and admin tell a placeholder apart from a genuinely published profile.
alter table public.profiles
  add column if not exists studio_completed boolean not null default false;
