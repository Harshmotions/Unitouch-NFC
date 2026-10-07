import { createHmac, timingSafeEqual } from "node:crypto";

/* Signed cookies for the two-factor admin login (lib/admin.ts).

   Supabase's session only proves the last sign-in method (here: the email
   one-time code). To require BOTH the shared password AND the code, the
   password step issues a short-lived proof cookie, and finishing the code
   step exchanges it for an "admin 2FA" cookie bound to that Supabase user.
   requireAdmin() demands the Supabase session AND a valid 2FA cookie.

   The signing key is derived from SUPABASE_SERVICE_ROLE_KEY (server-only,
   already required everywhere), so no extra secret has to be configured;
   rotating that key simply signs every admin out. */

export const ADMIN_PASSWORD_COOKIE = "ut_admin_pw";
export const ADMIN_2FA_COOKIE = "ut_admin_2fa";

export const PASSWORD_PROOF_TTL_SECONDS = 10 * 60; // time to enter the emailed code
export const ADMIN_SESSION_TTL_SECONDS = 12 * 60 * 60; // re-login twice a day

function key(): Buffer {
  const base = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!base) throw new Error("SUPABASE_SERVICE_ROLE_KEY is not configured.");
  return createHmac("sha256", base).update("unitouch-admin-2fa-v1").digest();
}

function sign(data: string): string {
  return createHmac("sha256", key()).update(data).digest("base64url");
}

export function issueToken(payload: Record<string, string>, ttlSeconds: number): string {
  const body = Buffer.from(JSON.stringify({ ...payload, exp: Date.now() + ttlSeconds * 1000 })).toString("base64url");
  return `${body}.${sign(body)}`;
}

export function readToken(token: string | undefined): Record<string, string> | null {
  if (!token) return null;
  const [body, sig] = token.split(".");
  if (!body || !sig) return null;
  const expected = Buffer.from(sign(body));
  const given = Buffer.from(sig);
  if (expected.length !== given.length || !timingSafeEqual(expected, given)) return null;
  try {
    const payload = JSON.parse(Buffer.from(body, "base64url").toString("utf8"));
    if (typeof payload.exp !== "number" || payload.exp < Date.now()) return null;
    return payload;
  } catch {
    return null;
  }
}

export const cookieOptions = (maxAge: number) => ({
  httpOnly: true,
  secure: process.env.NODE_ENV === "production",
  sameSite: "strict" as const,
  path: "/",
  maxAge,
});
