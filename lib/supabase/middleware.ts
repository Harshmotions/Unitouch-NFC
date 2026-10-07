import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";
import { ADMIN_AUTH_COOKIE } from "@/lib/supabase/admin-cookie";

/* Refreshes the Supabase auth sessions on every matched request and writes
   the rotated cookies back onto the response, so Server Components always
   see valid sessions. Standard @supabase/ssr pattern: calling getUser() is
   what triggers the token refresh.

   There are two independent sessions (lib/supabase/admin-cookie.ts): the
   customer one (default cookie) and the admin one (ADMIN_AUTH_COOKIE). Each
   is refreshed only if its cookie is present, and their cookie writes are
   collected and applied to a single response so neither overwrites the
   other's.

   No Supabase auth cookie at all means no session to refresh: skip the
   network round trip entirely. That's nearly every public visitor (home,
   profile pages, checkout). */
export async function updateSession(request: NextRequest) {
  const names = request.cookies.getAll().map((c) => c.name);
  const hasAdmin = names.some((n) => n.startsWith(ADMIN_AUTH_COOKIE));
  const hasCustomer = names.some((n) => n.startsWith("sb-") && !n.startsWith(ADMIN_AUTH_COOKIE));
  if (!hasAdmin && !hasCustomer) return NextResponse.next({ request });

  type CookieWrite = { name: string; value: string; options: Parameters<NextResponse["cookies"]["set"]>[2] };
  const writes: CookieWrite[] = [];

  const refresh = async (cookieName?: string) => {
    const supabase = createServerClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!, {
      ...(cookieName ? { cookieOptions: { name: cookieName } } : {}),
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value, options }) => {
            request.cookies.set(name, value);
            writes.push({ name, value, options });
          });
        },
      },
    });
    await supabase.auth.getUser();
  };

  await Promise.all([hasCustomer ? refresh() : null, hasAdmin ? refresh(ADMIN_AUTH_COOKIE) : null]);

  // Built after both refreshes so it carries every updated request cookie.
  const response = NextResponse.next({ request });
  writes.forEach(({ name, value, options }) => response.cookies.set(name, value, options));
  return response;
}
