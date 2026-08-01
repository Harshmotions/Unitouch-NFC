/* Shared helpers for the profile interest-tag suggestions and link labels,
   used by the digital studio. Client-side keyword matcher that stands in for
   a real AI call (no AI provider is configured) — scans free-text and
   proposes tags the user can accept, reorder, or discard. */

const INTEREST_KEYWORDS: { keywords: string[]; tag: string }[] = [
  { keywords: ["ui design", "ux design", "ui/ux"], tag: "💻 UI Design" },
  { keywords: ["public speaking"], tag: "🎤 Public Speaking" },
  { keywords: ["real estate"], tag: "🏠 Real Estate" },
  { keywords: ["branding", "brand"], tag: "🎨 Branding" },
  { keywords: ["photography", "photographer", "photo"], tag: "📷 Photography" },
  { keywords: ["coffee"], tag: "☕ Coffee" },
  { keywords: ["travel", "travelling", "traveling"], tag: "✈️ Travel" },
  { keywords: ["startup", "startups"], tag: "🚀 Startups" },
  { keywords: ["marketing"], tag: "📈 Marketing" },
  { keywords: ["fitness", "gym", "workout"], tag: "💪 Fitness" },
  { keywords: ["music"], tag: "🎵 Music" },
  { keywords: ["writing", "copywriting"], tag: "✍️ Writing" },
  { keywords: ["coding", "developer", "engineering", "software"], tag: "💻 Engineering" },
  { keywords: ["finance", "investing"], tag: "💰 Finance" },
  { keywords: ["fashion"], tag: "👗 Fashion" },
  { keywords: ["food", "cooking", "chef"], tag: "🍳 Food" },
  { keywords: ["yoga"], tag: "🧘 Yoga" },
  { keywords: ["film", "filmmaking", "video"], tag: "🎬 Film" },
  { keywords: ["consulting"], tag: "📊 Consulting" },
  { keywords: ["sales"], tag: "🤝 Sales" },
  { keywords: ["law", "legal"], tag: "⚖️ Law" },
  { keywords: ["education", "teaching"], tag: "📚 Education" },
  { keywords: ["health", "wellness"], tag: "🩺 Health" },
  { keywords: ["architecture"], tag: "🏛️ Architecture" },
  { keywords: ["art", "illustration"], tag: "🎨 Art" },
  { keywords: ["gaming"], tag: "🎮 Gaming" },
  { keywords: ["agency"], tag: "🏢 Agency" },
  { keywords: ["design"], tag: "🎨 Design" },
];

function escapeRegExp(input: string): string {
  return input.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

export function suggestTagsFromText(text: string): string[] {
  const lower = text.toLowerCase();
  if (!lower.trim()) return [];
  const matched: string[] = [];
  for (const { keywords, tag } of INTEREST_KEYWORDS) {
    if (matched.includes(tag)) continue;
    // Leading word-boundary only (not trailing) — a plain substring check
    // would let "art" match inside "startups"; requiring just the start of a
    // word still allows suffixes like "brand" -> "brands"/"branding".
    const hasMatch = keywords.some((kw) => new RegExp(`\\b${escapeRegExp(kw)}`).test(lower));
    if (hasMatch) matched.push(tag);
  }
  return matched;
}

export function labelFromUrl(url: string): string {
  try {
    const hostname = new URL(/^https?:\/\//.test(url) ? url : `https://${url}`).hostname.replace(/^www\./, "");
    const name = hostname.split(".")[0];
    return name ? name.charAt(0).toUpperCase() + name.slice(1) : "";
  } catch {
    return "";
  }
}
