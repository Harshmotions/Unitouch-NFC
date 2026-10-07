/* Sets (or resets) the password of the shared Unitouch admin account.

   Run it yourself, from the project folder, in a terminal:

     node --env-file=.env.local scripts/set-admin-password.mjs

   It asks for the new password twice (nothing is shown as you type) and
   saves it in Supabase Auth for the admin email below, creating that user if
   it doesn't exist yet. Admin sign-in then needs this password AND a
   one-time code emailed to the admin inbox (see lib/admin.ts).

   Needs NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY in .env.local.
   Keep ADMIN_EMAIL in sync with BUSINESS.adminEmail in lib/business.ts. */

import { createClient } from "@supabase/supabase-js";

const ADMIN_EMAIL = "unitouchnfc@gmail.com";
const MIN_LENGTH = 12;

function askHidden(question) {
  return new Promise((resolve) => {
    const stdin = process.stdin;
    process.stdout.write(question);
    let value = "";
    stdin.setRawMode?.(true);
    stdin.resume();
    stdin.setEncoding("utf8");
    const onData = (ch) => {
      if (ch === "\r" || ch === "\n" || ch === "\u0004") {
        stdin.setRawMode?.(false);
        stdin.pause();
        stdin.removeListener("data", onData);
        process.stdout.write("\n");
        resolve(value);
      } else if (ch === "\u0003") {
        process.stdout.write("\n");
        process.exit(1);
      } else if (ch === "\u0008" || ch === "\u007f") {
        value = value.slice(0, -1);
      } else {
        value += ch;
      }
    };
    stdin.on("data", onData);
  });
}

async function findUser(admin) {
  for (let page = 1; page < 50; page++) {
    const { data, error } = await admin.listUsers({ page, perPage: 200 });
    if (error) throw error;
    const user = data.users.find((u) => u.email?.toLowerCase() === ADMIN_EMAIL);
    if (user) return user;
    if (data.users.length < 200) return null;
  }
  return null;
}

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
if (!url || !key) {
  console.error("Missing NEXT_PUBLIC_SUPABASE_URL / SUPABASE_SERVICE_ROLE_KEY. Run with --env-file=.env.local");
  process.exit(1);
}

console.log(`Set the shared admin password for ${ADMIN_EMAIL}`);
console.log(`At least ${MIN_LENGTH} characters. Use a password manager to store it.\n`);
const pw1 = await askHidden("New password: ");
const pw2 = await askHidden("Repeat password: ");
if (pw1 !== pw2) {
  console.error("Passwords don't match. Nothing changed.");
  process.exit(1);
}
if (pw1.length < MIN_LENGTH) {
  console.error(`Too short (${pw1.length} characters). Nothing changed.`);
  process.exit(1);
}

const admin = createClient(url, key, { auth: { persistSession: false, autoRefreshToken: false } }).auth.admin;
const existing = await findUser(admin);
if (existing) {
  const { error } = await admin.updateUserById(existing.id, { password: pw1 });
  if (error) throw error;
  console.log("Password updated. Sign in at /admin/login with the password + the emailed code.");
} else {
  const { error } = await admin.createUser({ email: ADMIN_EMAIL, password: pw1, email_confirm: true });
  if (error) throw error;
  console.log("Admin user created. Sign in at /admin/login with the password + the emailed code.");
}
