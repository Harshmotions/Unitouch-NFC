import { createClient } from "@supabase/supabase-js";

export function createServiceRoleClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );
}

/* Anon-key client for server-side reads of public data (e.g. published
   profiles). RLS restricts this to rows that are meant to be public —
   never use it for writes or for anything gated by ownership/admin role. */
export function createPublicServerClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );
}
