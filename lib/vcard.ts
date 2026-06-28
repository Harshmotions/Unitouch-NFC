import type { Profile } from "@/types";
import { withProtocol } from "@/lib/url";

function escapeVCardValue(value: string): string {
  return value.replace(/\\/g, "\\\\").replace(/,/g, "\\,").replace(/;/g, "\\;").replace(/\n/g, "\\n");
}

/* Builds a vCard 3.0 string (the version with the broadest phone/contacts-app
   support) from a profile's real contact fields. Lines use CRLF per spec. */
export function buildVCard(profile: Profile): string {
  const lines = ["BEGIN:VCARD", "VERSION:3.0", `FN:${escapeVCardValue(profile.fullName)}`];

  if (profile.company) lines.push(`ORG:${escapeVCardValue(profile.company)}`);
  if (profile.designation) lines.push(`TITLE:${escapeVCardValue(profile.designation)}`);
  if (profile.phone) lines.push(`TEL;TYPE=CELL:${escapeVCardValue(profile.phone)}`);
  if (profile.email) lines.push(`EMAIL:${escapeVCardValue(profile.email)}`);
  if (profile.website) lines.push(`URL:${escapeVCardValue(withProtocol(profile.website))}`);
  if (profile.location) lines.push(`ADR;TYPE=WORK:;;;${escapeVCardValue(profile.location)};;;`);
  if (profile.bio) lines.push(`NOTE:${escapeVCardValue(profile.bio)}`);

  lines.push(`URL;TYPE=Profile:${process.env.NEXT_PUBLIC_APP_URL}/u/${profile.username}`);
  lines.push("END:VCARD");

  return lines.join("\r\n");
}

export function downloadVCard(profile: Profile) {
  const vcard = buildVCard(profile);
  const blob = new Blob([vcard], { type: "text/vcard;charset=utf-8" });
  const url = URL.createObjectURL(blob);

  const link = document.createElement("a");
  link.href = url;
  link.download = `${profile.fullName.replace(/\s+/g, "_")}.vcf`;
  link.click();

  URL.revokeObjectURL(url);
}
