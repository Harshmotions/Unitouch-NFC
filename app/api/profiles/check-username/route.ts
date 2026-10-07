import { NextResponse } from "next/server";
import { createServiceRoleClient } from "@/lib/supabase/server";
import { checkUsernameLimiter, clientIp, rateLimitOrResponse } from "@/lib/rate-limit";

const USERNAME_PATTERN = /^[a-z0-9-]{3,30}$/;
const SUGGESTION_COUNT = 8;

/* "harsh" -> harsh-2 … harsh-9; "harsh-2" -> harsh-3 … (strips an existing
   numeric suffix first), trimmed so every candidate stays within 30 chars. */
function suggestionCandidates(username: string): string[] {
  const stem = username.replace(/-+\d+$/, "") || username;
  return Array.from({ length: SUGGESTION_COUNT }, (_, i) => {
    const suffix = `-${i + 2}`;
    return `${stem.slice(0, 30 - suffix.length).replace(/-+$/, "")}${suffix}`;
  }).filter((c) => c !== username && USERNAME_PATTERN.test(c));
}

/* Service-role check, not the public anon client — RLS on `profiles` only
   allows anon SELECT where is_published = true, which would silently
   report "available" for any unpublished or nonexistent username and
   defeat the point of this check.

   With `suggest: true`, a taken username also returns the first free
   numbered variant (one extra query, so the checkout form doesn't have to
   probe candidates one request at a time against the rate limit). */
export async function POST(request: Request) {
  const limited = await rateLimitOrResponse(checkUsernameLimiter, clientIp(request));
  if (limited) return limited;

  const json = await request.json().catch(() => null);
  const username = typeof json?.username === "string" ? json.username.trim().toLowerCase() : "";
  const suggest = json?.suggest === true;

  if (!username) {
    return NextResponse.json({ error: "Missing username" }, { status: 400 });
  }

  const supabase = createServiceRoleClient();
  const { data, error } = await supabase
    .from("profiles")
    .select("id")
    .eq("username", username)
    .maybeSingle();

  if (error) {
    return NextResponse.json({ error: "Could not check username. Please try again." }, { status: 500 });
  }

  if (!data) return NextResponse.json({ available: true });

  let suggestion: string | null = null;
  const candidates = suggest && USERNAME_PATTERN.test(username) ? suggestionCandidates(username) : [];
  if (candidates.length) {
    const { data: takenRows } = await supabase.from("profiles").select("username").in("username", candidates);
    if (takenRows) {
      const taken = new Set(takenRows.map((r) => r.username as string));
      suggestion = candidates.find((c) => !taken.has(c)) ?? null;
    }
  }

  return NextResponse.json({ available: false, suggestion });
}
