import type { SupabaseClient } from "@supabase/supabase-js";

/* Daily cleanup of abandoned sign-in accounts (run by the draft-reminders
   cron). Only a type import, and the Supabase client is passed in, so a
   read-only dry run (dryRun: true) can exercise exactly this code.

   Supabase creates an auth user as soon as someone REQUESTS a login code,
   even if the code is never entered. Such an account is removed only when
   ALL of these hold:
     - created more than MIN_AGE_HOURS ago
     - never signed in (last_sign_in_at is null)
     - not the admin account
     - no order and no profile points at it, by user id OR by email
       (profiles.user_id cascades on delete, so a profile owner must never
       match; an unpaid checkout's email counts too)
   Anyone removed can sign in again later with the same email. */

export const MIN_AGE_HOURS = 24;
// More than this in one run means something looks wrong: delete nothing.
export const MAX_DELETIONS_PER_RUN = 50;

export interface AuthUserLite {
  id: string;
  email?: string | null;
  created_at: string;
  last_sign_in_at?: string | null;
}

export function selectAbandonedAuthUsers(
  users: AuthUserLite[],
  opts: {
    adminEmail: string;
    protectedUserIds: Set<string>;
    // Lowercased emails found on any order or profile.
    protectedEmails: Set<string>;
    now?: Date;
  },
): AuthUserLite[] {
  const cutoff = (opts.now ?? new Date()).getTime() - MIN_AGE_HOURS * 60 * 60 * 1000;
  const admin = opts.adminEmail.trim().toLowerCase();

  return users.filter((u) => {
    const email = (u.email ?? "").trim().toLowerCase();
    const created = Date.parse(u.created_at);
    if (Number.isNaN(created) || created > cutoff) return false;
    if (u.last_sign_in_at) return false;
    if (!email || email === admin) return false;
    if (opts.protectedUserIds.has(u.id)) return false;
    if (opts.protectedEmails.has(email)) return false;
    return true;
  });
}

export interface AuthCleanupResult {
  checked: number;
  found: number;
  deleted: number;
  failed: number;
  // Set when the run deleted nothing on purpose.
  skipped?: "dry_run" | "over_cap";
  // The accounts that matched (dry runs only; never logged).
  matches?: { email: string | null | undefined; created_at: string }[];
}

const PER_PAGE = 1000;
const MAX_PAGES = 20;

/* Fails closed: if accounts, orders or profiles can't be read, it throws
   before deleting anything (the caller logs it). */
export async function cleanUpAbandonedAuthUsers(
  supabase: SupabaseClient,
  opts: { adminEmail: string; dryRun?: boolean; now?: Date },
): Promise<AuthCleanupResult> {
  const users: AuthUserLite[] = [];
  for (let page = 1; page <= MAX_PAGES; page++) {
    const { data, error } = await supabase.auth.admin.listUsers({ page, perPage: PER_PAGE });
    if (error) throw new Error(`listUsers failed: ${error.message}`);
    users.push(...data.users);
    if (data.users.length < PER_PAGE) break;
  }

  const [orders, profiles] = await Promise.all([
    supabase.from("orders").select("user_id, email"),
    supabase.from("profiles").select("user_id, email"),
  ]);
  if (orders.error) throw new Error(`orders read failed: ${orders.error.message}`);
  if (profiles.error) throw new Error(`profiles read failed: ${profiles.error.message}`);

  const protectedUserIds = new Set<string>();
  const protectedEmails = new Set<string>();
  for (const row of [...orders.data, ...profiles.data] as { user_id: string | null; email: string | null }[]) {
    if (row.user_id) protectedUserIds.add(row.user_id);
    if (row.email) protectedEmails.add(row.email.trim().toLowerCase());
  }

  const abandoned = selectAbandonedAuthUsers(users, {
    adminEmail: opts.adminEmail,
    protectedUserIds,
    protectedEmails,
    now: opts.now,
  });
  const result: AuthCleanupResult = { checked: users.length, found: abandoned.length, deleted: 0, failed: 0 };

  if (opts.dryRun) {
    return { ...result, skipped: "dry_run", matches: abandoned.map((u) => ({ email: u.email, created_at: u.created_at })) };
  }
  if (abandoned.length > MAX_DELETIONS_PER_RUN) {
    console.warn(
      `auth cleanup: ${abandoned.length} accounts matched, over the cap of ${MAX_DELETIONS_PER_RUN}; deleted nothing`,
    );
    return { ...result, skipped: "over_cap" };
  }

  for (const user of abandoned) {
    const { error } = await supabase.auth.admin.deleteUser(user.id);
    if (error) {
      result.failed++;
      console.error("auth cleanup: deleteUser failed", user.id, error.message);
    } else {
      result.deleted++;
    }
  }
  console.log(`auth cleanup: checked ${result.checked}, removed ${result.deleted}, failed ${result.failed}`);
  return result;
}
