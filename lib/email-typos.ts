/* "Did you mean …?" for common email domain typos (gmial.com, hotmial.com,
   gmail.con). Import-free so client components can use it. Only suggests:
   callers show a one-click fix and never change what the customer typed on
   their own. Real domains like gmial.com pass the DNS check in
   lib/email-domain.ts, which is why this list exists. */

const DOMAIN_FIXES: Record<string, string> = {
  // Gmail
  "gmial.com": "gmail.com",
  "gmal.com": "gmail.com",
  "gmali.com": "gmail.com",
  "gmaill.com": "gmail.com",
  "gamil.com": "gmail.com",
  "gnail.com": "gmail.com",
  "gmai.com": "gmail.com",
  "gmil.com": "gmail.com",
  "gmsil.com": "gmail.com",
  "gmaul.com": "gmail.com",
  "gemail.com": "gmail.com",
  "gmail.co": "gmail.com",
  "gmail.cm": "gmail.com",
  // Yahoo
  "yaho.com": "yahoo.com",
  "yahooo.com": "yahoo.com",
  "yhoo.com": "yahoo.com",
  "yahho.com": "yahoo.com",
  "yaoo.com": "yahoo.com",
  "yaho.co.in": "yahoo.co.in",
  "yahooo.co.in": "yahoo.co.in",
  "yahoo.co.on": "yahoo.co.in",
  "yahoo.coin": "yahoo.co.in",
  // Hotmail
  "hotmial.com": "hotmail.com",
  "hotmal.com": "hotmail.com",
  "hotmil.com": "hotmail.com",
  "hotmai.com": "hotmail.com",
  "hotmaill.com": "hotmail.com",
  "hotamil.com": "hotmail.com",
  "hotmail.co": "hotmail.com",
  // Outlook
  "outlok.com": "outlook.com",
  "outloo.com": "outlook.com",
  "outlookk.com": "outlook.com",
  "otlook.com": "outlook.com",
  "outllook.com": "outlook.com",
  "outlook.co": "outlook.com",
  // iCloud
  "iclod.com": "icloud.com",
  "icoud.com": "icloud.com",
  "iclould.com": "icloud.com",
  "icluod.com": "icloud.com",
  "icloud.co": "icloud.com",
  // Rediffmail
  "rediffmial.com": "rediffmail.com",
  "redifmail.com": "rediffmail.com",
  "rediffmai.com": "rediffmail.com",
  "rediffmall.com": "rediffmail.com",
  "rediffmil.com": "rediffmail.com",
  "rediffmail.co": "rediffmail.com",
};

// Mistyped ".com" endings on any domain (gmail.con, company.cmo).
const COM_TYPO = /\.(con|cmo|comm|cpm|vom|xom|ocm)$/;

/* Returns the corrected full address, or null when there's nothing to
   suggest. With stillTyping (the field has focus), a fix that only extends
   what was typed (gmail.co -> gmail.com) is held back so it doesn't flash
   up mid-word. */
export function suggestEmailFix(email: string, stillTyping = false): string | null {
  const trimmed = email.trim();
  const at = trimmed.lastIndexOf("@");
  if (at < 1) return null;
  const local = trimmed.slice(0, at);
  const domain = trimmed.slice(at + 1).toLowerCase();
  if (!domain.includes(".")) return null;

  let fixed = domain.replace(COM_TYPO, ".com");
  fixed = DOMAIN_FIXES[fixed] ?? fixed;
  if (fixed === domain) return null;
  if (stillTyping && fixed.startsWith(domain)) return null;
  return `${local}@${fixed}`;
}
