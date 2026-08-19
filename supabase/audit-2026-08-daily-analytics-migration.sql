-- Security audit #03 — Harden Analytics.
-- Run manually in the Supabase SQL editor. Adds the new aggregate table and
-- switches the write path off analytics_events (deprecated, not dropped).
-- This mirrors what's now in supabase/schema.sql — run this against the
-- live project since schema.sql is only applied fresh, not diffed.

create table if not exists public.daily_analytics (
  id uuid primary key default gen_random_uuid(),
  username text not null,
  event_date date not null default current_date,
  event_type text not null check (event_type in (
    'page_view', 'whatsapp_click', 'website_click', 'contact_save',
    'instagram_click', 'linkedin_click', 'email_click', 'phone_click',
    'youtube_click', 'portfolio_click'
  )),
  count integer not null default 0,
  unique (username, event_date, event_type)
);

create index if not exists daily_analytics_username_idx on public.daily_analytics(username);

alter table public.daily_analytics enable row level security;
-- Service-role only — same as analytics_events, no anon/authenticated policies.

create or replace function public.increment_daily_analytics(
  p_username text,
  p_event_type text
)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.daily_analytics (username, event_date, event_type, count)
  values (p_username, current_date, p_event_type, 1)
  on conflict (username, event_date, event_type)
  do update set count = public.daily_analytics.count + 1;
end;
$$;

revoke execute on function public.increment_daily_analytics(text, text)
from anon, authenticated;

-- Verify:
select tablename, rowsecurity from pg_tables where tablename = 'daily_analytics';
select routine_name from information_schema.routines where routine_name = 'increment_daily_analytics';

-- Optional — once you've confirmed the new path works in production and no
-- longer need historical per-event rows, you can drop the old table:
-- drop table public.analytics_events;
