-- Unitouch schema — run once in a fresh Supabase project's SQL editor.
-- Reconstructed from application code (lib/profile.ts, lib/analytics.ts,
-- app/api/orders/route.ts, types/index.ts) since no migration had been
-- committed before; this file is now the source of truth going forward.

create extension if not exists "pgcrypto";

-- profiles ------------------------------------------------------------

create table public.profiles (
  id uuid primary key default gen_random_uuid(),
  username text not null unique,
  full_name text not null,
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
  order_id uuid,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

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

alter table public.orders enable row level security;
-- Same as analytics_events — service-role only, no anon policies.
