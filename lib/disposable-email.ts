import { disposableEmailBlocklistSet } from "disposable-email-domains-js";

/* Throwaway inboxes (mailinator, 10minutemail, mailto.plus, …) vanish within
   minutes, so a customer who orders with one can never sign in to manage
   their card. Server-side check against the community-maintained list
   (disposable-email-domains-js, ~8.9k domains, pinned in package.json; bump
   it now and then to pick up new services).

   Subdomains count too: x.mailinator.com is blocked via mailinator.com. */

export const DISPOSABLE_EMAIL_ERROR =
  "Please use a permanent email address. You'll need it to manage your card.";

// Seen in test sign-ups on unitouch.in but missing from the upstream list.
const EXTRA_DOMAINS = ["watchyio.com", "gmail10p.com"];

let blocklist: Set<string> | null = null;

export function isDisposableEmail(email: string): boolean {
  blocklist ??= new Set([...disposableEmailBlocklistSet(), ...EXTRA_DOMAINS]);
  const domain = email.trim().toLowerCase().split("@").pop()?.replace(/\.$/, "") ?? "";
  const labels = domain.split(".");
  // mail.mailinator.com -> mail.mailinator.com, mailinator.com (never just "com").
  for (let i = 0; i < labels.length - 1; i++) {
    if (blocklist.has(labels.slice(i).join("."))) return true;
  }
  return false;
}
