/* Shared helpers for the profile interest-tag suggestions and link labels,
   used by the digital studio. Client-side keyword matcher (no AI call) over
   the emoji dictionary in lib/interest-emojis.ts: scans free text and
   proposes "emoji Label" tags the user can accept, reorder, or discard. */

import { INTEREST_DICTIONARY, POPULAR_INTEREST_LABELS, type InterestEntry } from "@/lib/interest-emojis";

const MAX_SUGGESTIONS = 12;
const MAX_TAG_LENGTH = 30; // profile schema limit
const FALLBACK_EMOJI = "✨";

function escapeRegExp(input: string): string {
  return input.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

/* Whole-word match that also accepts common English endings, so "cook"
   matches "cooking"/"cooks" and "photograph" matches "photography" and
   "photographer", while "ai" doesn't fire inside "air" and "art" doesn't fire
   inside "startups". */
const ENDINGS = "(?:s|es|ing|ed|er|ers|ist|ists|y|ies)?";
const COMPILED = INTEREST_DICTIONARY.map((entry) => ({
  entry,
  patterns: entry.keywords.map((kw) => new RegExp(`\\b${escapeRegExp(kw)}${ENDINGS}\\b`, "gi")),
}));

type Hit = { entry: InterestEntry; start: number; end: number };

function findHits(text: string): Hit[] {
  const hits: Hit[] = [];
  for (const { entry, patterns } of COMPILED) {
    for (const re of patterns) {
      re.lastIndex = 0;
      let m: RegExpExecArray | null;
      while ((m = re.exec(text))) {
        hits.push({ entry, start: m.index, end: m.index + m[0].length });
        if (m[0].length === 0) re.lastIndex++;
      }
    }
  }
  return hits;
}

export function suggestTagsFromText(text: string): string[] {
  if (!text.trim()) return [];
  // Longest matches win: "ui design" claims its span, so the plain "design"
  // inside it doesn't also produce a separate Design tag.
  const hits = findHits(text).sort((a, b) => b.end - b.start - (a.end - a.start) || a.start - b.start);
  const taken: [number, number][] = [];
  const firstSeen = new Map<string, number>();
  for (const hit of hits) {
    if (taken.some(([s, e]) => hit.start >= s && hit.end <= e)) continue;
    taken.push([hit.start, hit.end]);
    const prev = firstSeen.get(hit.entry.tag);
    if (prev === undefined || hit.start < prev) firstSeen.set(hit.entry.tag, hit.start);
  }
  // In the order the person wrote them.
  return [...firstSeen.entries()]
    .sort((a, b) => a[1] - b[1])
    .map(([tag]) => tag)
    .slice(0, MAX_SUGGESTIONS);
}

const STARTS_WITH_EMOJI = /^\p{Extended_Pictographic}/u;

/* What a typed custom tag becomes: "guitar" -> "🎸 Guitar". Uses the
   dictionary entry whose keyword matches the whole input best; anything
   unknown gets ✨. Input that already starts with an emoji is kept as is. */
export function tagForCustomInput(input: string): string {
  const text = input.trim().replace(/\s+/g, " ");
  if (!text) return "";
  if (STARTS_WITH_EMOJI.test(text)) return text.slice(0, MAX_TAG_LENGTH);

  const lower = text.toLowerCase();
  const exact = INTEREST_DICTIONARY.find((e) => e.keywords.includes(lower));
  if (exact) return exact.tag;

  const hits = findHits(text);
  const whole = hits.find((h) => h.start === 0 && h.end === text.length);
  if (whole) return whole.entry.tag;

  // Not in the dictionary: keep their words, with the first word's emoji if
  // any word matched (e.g. "Indie Guitar" -> "🎸 Indie Guitar"), else ✨.
  const emoji = hits.length ? hits.sort((a, b) => a.start - b.start)[0].entry.emoji : FALLBACK_EMOJI;
  const label = text.charAt(0).toUpperCase() + text.slice(1);
  return `${emoji} ${label}`.slice(0, MAX_TAG_LENGTH);
}

/* Quick picks shown before the customer types anything. */
export const POPULAR_INTEREST_TAGS: string[] = POPULAR_INTEREST_LABELS.map(
  (label) => INTEREST_DICTIONARY.find((e) => e.label === label)?.tag,
).filter((t): t is string => Boolean(t));

export function labelFromUrl(url: string): string {
  try {
    const hostname = new URL(/^https?:\/\//.test(url) ? url : `https://${url}`).hostname.replace(/^www\./, "");
    const name = hostname.split(".")[0];
    return name ? name.charAt(0).toUpperCase() + name.slice(1) : "";
  } catch {
    return "";
  }
}
