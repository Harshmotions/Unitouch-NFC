import { createClient } from "@supabase/supabase-js";
import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import { ADMIN_AUTH_COOKIE } from "@/lib/supabase/admin-cookie";

/* Auth-aware server client for Server Components and Route Handlers. Reads
   the signed-in user's session from the request cookies (kept fresh by the
   middleware). Use this to know *who* is making a request; use the
   service-role client below only for trusted writes that must bypass RLS. */
export async function createServerSupabaseClient(cookieName?: string) {
  const cookieStore = await cookies();
  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      ...(cookieName ? { cookieOptions: { name: cookieName } } : {}),
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) => cookieStore.set(name, value, options));
          } catch {
            /* Called from a Server Component, where cookies are read-only —
               the middleware is what actually refreshes the session cookie,
               so this is safe to ignore. */
          }
        },
      },
    },
  );
}

/* Server client for the admin session (separate cookie, see
   lib/supabase/admin-cookie.ts). Use only in admin auth code. */
export function createAdminServerSupabaseClient() {
  return createServerSupabaseClient(ADMIN_AUTH_COOKIE);
}

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
