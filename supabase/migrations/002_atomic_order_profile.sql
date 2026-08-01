-- Migration 002 — atomic order + placeholder-profile creation (Phase 4).
--
-- Run ONCE in the Supabase SQL editor. Safe to re-run (CREATE OR REPLACE).
--
-- Supabase's REST client can't run a multi-statement transaction from JS, so
-- the order insert + profile insert are wrapped in a single plpgsql function.
-- A plpgsql function body runs in one transaction: if the profile insert
-- fails (e.g. the username unique index rejects a duplicate), the order insert
-- is rolled back too — we can never end up with a paid order and no profile.
--
-- The profile is created as a PLACEHOLDER: only user_id, username, display
-- name and the print image are set; is_published/studio_completed stay false
-- until the customer finishes the digital studio (Phase 5).

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

-- Only the service-role key (used by the server checkout route, and which
-- bypasses RLS) should invoke this. Keep it off the public PostgREST surface.
revoke execute on function public.create_order_with_profile(
  uuid, text, text, text, text, text, integer, jsonb, integer, text, text, text, text
) from anon, authenticated;
