import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

/* Refreshes the Supabase auth session on every matched request and writes the
   rotated cookies back onto the response, so Server Components always see a
   valid session. This is the standard @supabase/ssr middleware pattern —
   calling getUser() is what triggers the token refresh. */
export async function updateSession(request: NextRequest) {
  let response = NextResponse.next({ request });

  // No Supabase auth cookie means no session to refresh: skip the network
  // round trip to Supabase Auth. That's nearly every public visitor (home,
  // profile pages, checkout), which previously paid for this call on every
  // request.
  if (!request.cookies.getAll().some((c) => c.name.startsWith("sb-"))) {
    return response;
  }

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value));
          response = NextResponse.next({ request });
          cookiesToSet.forEach(({ name, value, options }) => response.cookies.set(name, value, options));
        },
      },
    },
  );

  // Do not run code between createServerClient and getUser() — it must be the
  // first await so the session is refreshed before anything reads it.
  await supabase.auth.getUser();

  return response;
}
