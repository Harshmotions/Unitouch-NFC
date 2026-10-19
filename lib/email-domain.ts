import { Resolver } from "node:dns/promises";

/* Does an email's domain accept mail? Catches typos and made-up domains
   (gmial.com, nonexistent.xyz) before an order confirmation bounces and the
   customer can't sign in to manage their profile.

   Server-only (node:dns). Fails OPEN: only a definitive DNS answer blocks an
   address — the domain doesn't exist (NXDOMAIN), publishes a null MX
   (RFC 7505), or has neither MX nor A/AAAA records. Timeouts, SERVFAIL and
   any other resolver trouble allow it, so a DNS hiccup never costs a sale. */

export type EmailDomainStatus = "ok" | "no_mail" | "unknown";

export const EMAIL_DOMAIN_ERROR =
  "We couldn't find that email's domain. Please check your email address for typos.";

const OVERALL_TIMEOUT_MS = 3000;
const CACHE_TTL_MS = 10 * 60 * 1000;
const CACHE_MAX = 500;

// Per function instance; saves repeat lookups (blur check, then create-order).
const cache = new Map<string, { status: EmailDomainStatus; expires: number }>();

function errorCode(err: unknown): string | undefined {
  return err && typeof err === "object" && "code" in err ? String((err as { code: unknown }).code) : undefined;
}

// "Definitely no such records": the name doesn't exist, or exists without them.
const NOT_FOUND = new Set(["ENOTFOUND", "ENODATA"]);

async function lookup(domain: string): Promise<EmailDomainStatus> {
  const resolver = new Resolver({ timeout: 1500, tries: 2 });

  try {
    const mx = await resolver.resolveMx(domain);
    if (mx.length === 0) throw Object.assign(new Error("no MX"), { code: "ENODATA" });
    // Null MX: a single record with an empty exchange means "accepts no mail".
    const usable = mx.some((r) => r.exchange && r.exchange !== ".");
    return usable ? "ok" : "no_mail";
  } catch (err) {
    const code = errorCode(err);
    if (code === "ENOTFOUND") return "no_mail";
    if (code !== "ENODATA") return "unknown";
  }

  // No MX: mail falls back to the domain's own address (RFC 5321 implicit MX).
  for (const resolve of [() => resolver.resolve4(domain), () => resolver.resolve6(domain)]) {
    try {
      if ((await resolve()).length > 0) return "ok";
    } catch (err) {
      if (!NOT_FOUND.has(errorCode(err) ?? "")) return "unknown";
    }
  }
  return "no_mail";
}

export async function checkEmailDomain(email: string): Promise<EmailDomainStatus> {
  const domain = email.trim().toLowerCase().split("@").pop()?.replace(/\.$/, "") ?? "";
  if (!domain || !domain.includes(".")) return "unknown";

  const cached = cache.get(domain);
  if (cached && cached.expires > Date.now()) return cached.status;

  let timer: ReturnType<typeof setTimeout> | undefined;
  const status = await Promise.race<EmailDomainStatus>([
    lookup(domain).catch(() => "unknown" as const),
    new Promise<EmailDomainStatus>((resolve) => {
      timer = setTimeout(() => resolve("unknown"), OVERALL_TIMEOUT_MS);
    }),
  ]);
  clearTimeout(timer);

  // Don't remember "unknown": the next attempt may get a real answer.
  if (status !== "unknown") {
    if (cache.size >= CACHE_MAX) cache.delete(cache.keys().next().value as string);
    cache.set(domain, { status, expires: Date.now() + CACHE_TTL_MS });
  }
  return status;
}
