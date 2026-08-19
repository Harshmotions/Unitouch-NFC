import { NextResponse } from "next/server";
import { studioUpdateSchema } from "@/lib/validations";
import { isAdminEmail } from "@/lib/admin";
import { createServiceRoleClient, createServerSupabaseClient } from "@/lib/supabase/server";
import { processImageUpload, UploadRejected } from "@/lib/uploads";
import { verifyOrigin } from "@/lib/csrf";

const MAX_PHOTO_BYTES = 5 * 1024 * 1024;

/* Admin equivalent of /api/profiles/update — same field set and validation,
   but gated on the caller being an allow-listed admin (lib/admin.ts) instead
   of owning the row, and with no OTP re-entry required. Every successful
   write is logged to admin_audit_log for accountability, since this route
   deliberately skips the ownership check the customer route enforces. */
export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }) {
  if (!verifyOrigin(request)) {
    return NextResponse.json({ error: "Invalid request origin." }, { status: 403 });
  }

  const { id } = await params;

  const authClient = await createServerSupabaseClient();
  const {
    data: { user },
  } = await authClient.auth.getUser();
  if (!user || !isAdminEmail(user.email)) {
    return NextResponse.json({ error: "Not authorized." }, { status: 403 });
  }

  const form = await request.formData().catch(() => null);
  if (!form) {
    return NextResponse.json({ error: "Invalid request" }, { status: 400 });
  }

  const profileRaw = form.get("profile");
  const image = form.get("image");
  const publish = form.get("publish") === "true";

  if (typeof profileRaw !== "string") {
    return NextResponse.json({ error: "Invalid request" }, { status: 400 });
  }

  const parsed = studioUpdateSchema.safeParse(JSON.parse(profileRaw));
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.issues[0]?.message ?? "Invalid details" }, { status: 400 });
  }
  const p = parsed.data;

  const supabase = createServiceRoleClient();

  const { data: existing, error: loadError } = await supabase
    .from("profiles")
    .select("id, username, avatar_url")
    .eq("id", id)
    .maybeSingle();

  if (loadError) {
    return NextResponse.json({ error: "Could not load this profile. Please try again." }, { status: 500 });
  }
  if (!existing) {
    return NextResponse.json({ error: "Profile not found." }, { status: 404 });
  }

  // Optional image override — keep the existing avatar if none supplied.
  let avatarUrl: string | null = existing.avatar_url;
  if (image instanceof File) {
    if (image.size > MAX_PHOTO_BYTES) {
      return NextResponse.json({ error: "Image must be under 5MB" }, { status: 400 });
    }

    let processed;
    try {
      processed = await processImageUpload(image);
    } catch (err) {
      const message = err instanceof UploadRejected ? err.message : "Could not process that image.";
      return NextResponse.json({ error: message }, { status: 400 });
    }

    const path = `${existing.username}-${Date.now()}.${processed.ext}`;
    const { error: uploadError } = await supabase.storage
      .from("profile-photos")
      .upload(path, processed.buffer, { contentType: processed.contentType, upsert: false });
    if (uploadError) {
      return NextResponse.json({ error: "Could not upload image. Please try again." }, { status: 500 });
    }
    avatarUrl = supabase.storage.from("profile-photos").getPublicUrl(path).data.publicUrl;
  }

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

  const { error: updateError } = await supabase.from("profiles").update(update).eq("id", existing.id);

  if (updateError) {
    return NextResponse.json({ error: "Could not save this profile. Please try again." }, { status: 500 });
  }

  await supabase.from("admin_audit_log").insert({
    admin_email: user.email,
    profile_id: existing.id,
    username: existing.username,
    changes: update,
    published: publish || null,
  });

  return NextResponse.json({ username: existing.username, published: publish });
}
