import { NextResponse } from "next/server";
import { studioUpdateSchema } from "@/lib/validations";
import { createServiceRoleClient, createServerSupabaseClient } from "@/lib/supabase/server";

const MAX_PHOTO_BYTES = 5 * 1024 * 1024;

/* Digital studio save. UPDATEs an existing (placeholder) profile the signed-in
   user owns — never inserts. Optionally overrides the profile image, and when
   `publish` is set marks the profile published + studio-complete so it goes
   live at /u/[username]. Ownership is enforced by matching the row's user_id
   to the session user (the service-role client bypasses RLS). */
export async function POST(request: Request) {
  const authClient = await createServerSupabaseClient();
  const {
    data: { user },
  } = await authClient.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: "Please sign in to edit your profile." }, { status: 401 });
  }

  const form = await request.formData().catch(() => null);
  if (!form) {
    return NextResponse.json({ error: "Invalid request" }, { status: 400 });
  }

  const usernameRaw = form.get("username");
  const profileRaw = form.get("profile");
  const image = form.get("image");
  const publish = form.get("publish") === "true";

  if (typeof usernameRaw !== "string" || typeof profileRaw !== "string") {
    return NextResponse.json({ error: "Invalid request" }, { status: 400 });
  }

  const parsed = studioUpdateSchema.safeParse(JSON.parse(profileRaw));
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.issues[0]?.message ?? "Invalid details" }, { status: 400 });
  }
  const p = parsed.data;
  const username = usernameRaw.trim().toLowerCase();

  const supabase = createServiceRoleClient();

  // Load the target profile and confirm it belongs to this user.
  const { data: existing, error: loadError } = await supabase
    .from("profiles")
    .select("id, user_id, avatar_url")
    .eq("username", username)
    .maybeSingle();

  if (loadError) {
    return NextResponse.json({ error: "Could not load your profile. Please try again." }, { status: 500 });
  }
  if (!existing || existing.user_id !== user.id) {
    return NextResponse.json({ error: "Profile not found." }, { status: 404 });
  }

  // Optional image override — keep the existing avatar if none supplied.
  let avatarUrl: string | null = existing.avatar_url;
  if (image instanceof File) {
    if (image.size > MAX_PHOTO_BYTES) {
      return NextResponse.json({ error: "Image must be under 5MB" }, { status: 400 });
    }
    if (!image.type.startsWith("image/")) {
      return NextResponse.json({ error: "Image must be an image file" }, { status: 400 });
    }
    const ext = image.name.split(".").pop() || "jpg";
    const path = `${username}-${Date.now()}.${ext}`;
    const { error: uploadError } = await supabase.storage
      .from("profile-photos")
      .upload(path, image, { contentType: image.type, upsert: false });
    if (uploadError) {
      return NextResponse.json({ error: "Could not upload image. Please try again." }, { status: 500 });
    }
    avatarUrl = supabase.storage.from("profile-photos").getPublicUrl(path).data.publicUrl;
  }

  // profile_style is deliberately not written here — it's set from the account
  // type at checkout, not chosen in the studio.
  const update: Record<string, unknown> = {
    full_name: p.fullName,
    designation: p.designation || null,
    company: p.company || null,
    bio: p.bio || null,
    location: p.location || null,
    website: p.website || null,
    whatsapp: p.whatsapp || null,
    instagram: p.instagram || null,
    linkedin: p.linkedin || null,
    twitter: p.twitter || null,
    youtube: p.youtube || null,
    portfolio: p.portfolio || null,
    represents: p.represents || null,
    interests: p.interests ?? [],
    extra_links: p.extraLinks ?? [],
    avatar_url: avatarUrl,
  };
  if (publish) {
    update.is_published = true;
    update.studio_completed = true;
  }

  const { error: updateError } = await supabase
    .from("profiles")
    .update(update)
    .eq("id", existing.id)
    .eq("user_id", user.id);

  if (updateError) {
    return NextResponse.json({ error: "Could not save your profile. Please try again." }, { status: 500 });
  }

  return NextResponse.json({ username, published: publish });
}
