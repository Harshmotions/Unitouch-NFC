import { NextResponse } from "next/server";
import { identitySchema, shippingPaymentSchema } from "@/lib/validations";
import { CARD_VARIANTS } from "@/lib/pricing";
import { createServiceRoleClient, createServerSupabaseClient } from "@/lib/supabase/server";
import { processImageUpload, UploadRejected } from "@/lib/uploads";
import { verifyOrigin } from "@/lib/csrf";

function generateOrderNumber(): string {
  const random = Math.floor(100000 + Math.random() * 900000);
  return `UTK-${random}`;
}

const MAX_PHOTO_BYTES = 5 * 1024 * 1024;

/* Buy-Now-Build-Later checkout. Requires an authenticated user; creates the
   order + a placeholder profile atomically via the create_order_with_profile
   RPC (one transaction — a paid order can never exist without its profile).
   The digital profile is filled in later in the studio. */
export async function POST(request: Request) {
  if (!verifyOrigin(request)) {
    return NextResponse.json({ error: "Invalid request origin." }, { status: 403 });
  }

  // 1. Must be signed in. Identity of the buyer comes from the session, never
  //    from the client payload.
  const authClient = await createServerSupabaseClient();
  const {
    data: { user },
  } = await authClient.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: "Please sign in to complete your order." }, { status: 401 });
  }

  const form = await request.formData().catch(() => null);
  if (!form) {
    return NextResponse.json({ error: "Invalid request" }, { status: 400 });
  }

  const identityRaw = form.get("identity");
  const shippingRaw = form.get("shippingPayment");
  const logo = form.get("logo");

  if (typeof identityRaw !== "string" || typeof shippingRaw !== "string") {
    return NextResponse.json({ error: "Invalid request" }, { status: 400 });
  }

  const idParsed = identitySchema.safeParse(JSON.parse(identityRaw));
  if (!idParsed.success) {
    return NextResponse.json({ error: idParsed.error.issues[0]?.message ?? "Invalid details" }, { status: 400 });
  }
  const spParsed = shippingPaymentSchema.safeParse(JSON.parse(shippingRaw));
  if (!spParsed.success) {
    return NextResponse.json({ error: spParsed.error.issues[0]?.message ?? "Invalid details" }, { status: 400 });
  }

  const identity = idParsed.data;
  const sp = spParsed.data;
  const username = identity.username.trim().toLowerCase();

  const variant = CARD_VARIANTS.find((v) => v.id === sp.cardType);
  if (!variant) {
    return NextResponse.json({ error: "Invalid card type" }, { status: 400 });
  }

  // A logo is mandatory for business cards.
  if (identity.accountType === "business" && !(logo instanceof File)) {
    return NextResponse.json({ error: "A logo is required for business cards." }, { status: 400 });
  }

  if (logo instanceof File && logo.size > MAX_PHOTO_BYTES) {
    return NextResponse.json({ error: "Image must be under 5MB" }, { status: 400 });
  }

  const supabase = createServiceRoleClient();

  // Pre-flight username check — UX only; the unique index inside the RPC is
  // the real guard against a race between two simultaneous checkouts.
  const { data: existing, error: existingError } = await supabase
    .from("profiles")
    .select("id")
    .eq("username", username)
    .maybeSingle();

  if (existingError) {
    return NextResponse.json({ error: "Could not verify username. Please try again." }, { status: 500 });
  }
  if (existing) {
    return NextResponse.json({ error: "That username was just taken. Please pick another." }, { status: 409 });
  }

  // Upload the print image (logo / profile picture) before the write.
  let avatarUrl: string | null = null;
  let uploadedPhotoPath: string | null = null;
  if (logo instanceof File) {
    let processed;
    try {
      processed = await processImageUpload(logo);
    } catch (err) {
      const message = err instanceof UploadRejected ? err.message : "Could not process that image.";
      return NextResponse.json({ error: message }, { status: 400 });
    }

    const path = `${username}-${Date.now()}.${processed.ext}`;
    const { error: uploadError } = await supabase.storage
      .from("profile-photos")
      .upload(path, processed.buffer, { contentType: processed.contentType, upsert: false });

    if (uploadError) {
      return NextResponse.json({ error: "Could not upload image. Please try again." }, { status: 500 });
    }
    uploadedPhotoPath = path;
    avatarUrl = supabase.storage.from("profile-photos").getPublicUrl(path).data.publicUrl;
  }

  const orderNumber = generateOrderNumber();
  const amount = variant.priceInPaise * sp.quantity;
  const profileStyle = identity.accountType === "business" ? "standard" : "personal";

  const { error: rpcError } = await supabase.rpc("create_order_with_profile", {
    p_user_id: user.id,
    p_order_number: orderNumber,
    p_full_name: identity.displayName,
    p_email: user.email ?? "",
    p_phone: sp.phone,
    p_card_type: sp.cardType,
    p_quantity: sp.quantity,
    p_shipping_address: {
      line1: sp.line1,
      line2: sp.line2 ?? "",
      city: sp.city,
      state: sp.state,
      pincode: sp.pincode,
    },
    p_amount: amount,
    p_additional_notes: sp.additionalNotes ?? "",
    p_username: username,
    p_avatar_url: avatarUrl,
    p_profile_style: profileStyle,
  });

  if (rpcError) {
    // The RPC is atomic on the DB side, but the uploaded file isn't part of
    // that transaction — remove it so a failed order leaves no orphaned image.
    if (uploadedPhotoPath) {
      await supabase.storage.from("profile-photos").remove([uploadedPhotoPath]);
    }
    // 23505 = unique violation: the username was taken between the pre-flight
    // check and the insert. Report it the same friendly way.
    if (rpcError.code === "23505") {
      return NextResponse.json({ error: "That username was just taken. Please pick another." }, { status: 409 });
    }
    return NextResponse.json({ error: "Could not complete your order. Please try again." }, { status: 500 });
  }

  return NextResponse.json({ orderNumber, username });
}
