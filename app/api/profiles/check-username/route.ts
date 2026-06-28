import { NextResponse } from "next/server";
import { createServiceRoleClient } from "@/lib/supabase/server";

/* Service-role check, not the public anon client — RLS on `profiles` only
   allows anon SELECT where is_published = true, which would silently
   report "available" for any unpublished or nonexistent username and
   defeat the point of this check. */
export async function POST(request: Request) {
  const json = await request.json().catch(() => null);
  const username = typeof json?.username === "string" ? json.username.trim().toLowerCase() : "";

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
    return NextResponse.json({ error: "Could not check username — please try again" }, { status: 500 });
  }

  return NextResponse.json({ available: !data });
}
