-- Unitouch schema — run once in a fresh Supabase project's SQL editor.
-- Reconstructed from application code (lib/profile.ts, lib/analytics.ts,
-- app/api/orders/route.ts, types/index.ts) since no migration had been
-- committed before; this file is now the source of truth going forward.

create extension if not exists "pgcrypto";

-- profiles ------------------------------------------------------------

create table public.profiles (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete cascade,
  username text not null unique,
  -- Optional so a placeholder profile can be created at payment with just
  -- username + print image; the studio fills the rest in later.
  full_name text,
  designation text,
  company text,
  phone text,
  whatsapp text,
  email text,
  website text,
  instagram text,
  linkedin text,
  twitter text,
  youtube text,
  portfolio text,
  location text,
  bio text,
  avatar_url text,
  interests text[],
  extra_links jsonb not null default '[]',
  is_published boolean not null default false,
  profile_style text not null default 'personal'
    check (profile_style in ('standard', 'personal')),
  represents text check (represents in ('me', 'company', 'both')),
  -- false = paid placeholder awaiting the digital studio; true = user finished.
  studio_completed boolean not null default false,
  order_id uuid,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists profiles_user_id_idx on public.profiles(user_id);

create or replace function public.set_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

create trigger profiles_set_updated_at
before update on public.profiles
for each row execute function public.set_updated_at();

alter table public.profiles enable row level security;

-- Anon/public can only ever read published profiles. All writes go
-- through the service-role key (seed script, future admin dashboard).
create policy "Public can read published profiles"
on public.profiles for select
to anon
using (is_published = true);

-- analytics_events -----------------------------------------------------

create table public.analytics_events (
  id uuid primary key default gen_random_uuid(),
  profile_id uuid references public.profiles(id) on delete set null,
  username text not null,
  event_type text not null check (event_type in (
    'page_view', 'whatsapp_click', 'website_click', 'contact_save',
    'instagram_click', 'linkedin_click', 'email_click', 'phone_click',
    'youtube_click', 'portfolio_click'
  )),
  metadata jsonb,
  created_at timestamptz not null default now()
);

alter table public.analytics_events enable row level security;
-- Intentionally no anon/authenticated policies — only the service-role
-- key (which bypasses RLS) reads or writes this table.

-- orders ----------------------------------------------------------------

create table public.orders (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete set null,
  order_number text not null unique,
  full_name text not null,
  email text not null,
  phone text not null,
  card_type text not null check (card_type in ('standard', 'premium', 'team')),
  quantity integer not null,
  shipping_address jsonb not null,
  profile_photo_url text,
  existing_design_url text,
  additional_notes text,
  payment_status text not null default 'pending'
    check (payment_status in ('pending', 'paid', 'failed')),
  razorpay_order_id text,
  razorpay_payment_id text,
  order_status text not null default 'received'
    check (order_status in ('received', 'in_review', 'designing', 'printing', 'shipped', 'delivered')),
  amount integer not null,
  tracking_number text,
  admin_notes text,
  profile_id uuid references public.profiles(id) on delete set null,
  created_at timestamptz not null default now()
);

create index if not exists orders_user_id_idx on public.orders(user_id);

alter table public.orders enable row level security;
-- Same as analytics_events — service-role only, no anon policies.

-- Atomic order + placeholder-profile creation ---------------------------
-- Wraps both inserts in one transaction so a paid order can never exist
-- without its profile. Called only by the service-role checkout route.
create or replace function public.create_order_with_profile(
  p_user_id uuid,
  p_order_number text,
  p_full_name text,
  p_email text,
  p_phone text,
  p_card_type text,
  p_quantity integer,
  p_shipping_address jsonb,
  p_amount integer,
  p_additional_notes text,
  p_username text,
  p_avatar_url text,
  p_profile_style text
)
returns table (order_number text, username text)
language plpgsql
security definer
set search_path = public
as $$
declare
  v_order_id uuid;
  v_profile_id uuid;
begin
  insert into public.orders (
    user_id, order_number, full_name, email, phone, card_type, quantity,
    shipping_address, additional_notes, payment_status, order_status, amount
  ) values (
    p_user_id, p_order_number, p_full_name, p_email, p_phone, p_card_type, p_quantity,
    p_shipping_address, nullif(p_additional_notes, ''), 'paid', 'received', p_amount
  )
  returning id into v_order_id;

  insert into public.profiles (
    user_id, username, full_name, avatar_url, phone, email,
    profile_style, is_published, studio_completed, order_id
  ) values (
    p_user_id, p_username, p_full_name, p_avatar_url, p_phone, p_email,
    p_profile_style, false, false, v_order_id
  )
  returning id into v_profile_id;

  update public.orders set profile_id = v_profile_id where id = v_order_id;

  return query select p_order_number, p_username;
end;
$$;

revoke execute on function public.create_order_with_profile(
  uuid, text, text, text, text, text, integer, jsonb, integer, text, text, text, text
) from anon, authenticated;

-- admin_audit_log --------------------------------------------------------
-- One row per admin edit to any profile, for accountability — admins skip
-- the normal OTP + ownership check the customer studio route enforces, so
-- there's no other trail of who changed what.

create table public.admin_audit_log (
  id uuid primary key default gen_random_uuid(),
  admin_email text not null,
  profile_id uuid not null references public.profiles(id) on delete cascade,
  username text not null,
  changes jsonb not null,
  published boolean,
  created_at timestamptz not null default now()
);

create index if not exists admin_audit_log_profile_id_idx on public.admin_audit_log(profile_id);

alter table public.admin_audit_log enable row level security;
-- Same as analytics_events/orders — service-role only, no anon policies.
