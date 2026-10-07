import { createBrowserClient } from "@supabase/ssr";
import { ADMIN_AUTH_COOKIE } from "@/lib/supabase/admin-cookie";

/* Browser-side Supabase client for use in Client Components. Uses the anon
   key and reads/writes the auth session from cookies so it stays in sync
   with the server (middleware refreshes the same cookies). Never use the
   service-role key here — it would ship to the browser. */
export function createSupabaseBrowserClient() {
  return createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
  );
}

/* Admin-area browser client: same project, but the session lives in the
   separate admin cookie (lib/supabase/admin-cookie.ts). isSingleton: false,
   because createBrowserClient otherwise returns the cached customer client
   regardless of these options. */
export function createAdminBrowserClient() {
  return createBrowserClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!, {
    cookieOptions: { name: ADMIN_AUTH_COOKIE },
    isSingleton: false,
  });
}
