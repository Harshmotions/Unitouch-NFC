/* The admin area keeps its Supabase session in its OWN cookie, separate from
   the customer session (the @supabase/ssr default "sb-<project>-auth-token").
   So signing in as admin never signs you in as a customer, and a customer
   sign-in (e.g. testing with another email) never replaces the admin
   session. Import-free so both browser and server code can use it.
   Starts with "sb-" so the middleware's "has an auth cookie" check sees it. */
export const ADMIN_AUTH_COOKIE = "sb-ut-admin-auth";
