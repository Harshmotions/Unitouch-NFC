import { createBrowserClient } from "@supabase/ssr";

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
