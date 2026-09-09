import { NextResponse } from "next/server";
import { identitySchema, shippingPaymentSchema } from "@/lib/validations";
import { CARD_VARIANTS } from "@/lib/pricing";
import { createServiceRoleClient, createServerSupabaseClient } from "@/lib/supabase/server";
import { processImageUpload, UploadRejected } from "@/lib/uploads";
import { verifyOrigin } from "@/lib/csrf";
import { checkoutLimiter, clientIp, rateLimitOrResponse } from "@/lib/rate-limit";
import { getRazorpayClient } from "@/lib/razorpay/client";

function generateOrderNumber(): string {
  const random = Math.floor(100000 + Math.random() * 900000);
  return `UTK-${random}`;
}

const MAX_PHOTO_BYTES = 5 * 1024 * 1024;

/* Razorpay create-order (audit #01 — real payment flow). Replaces the old
   fake "instant paid order" checkout.

   Does everything that must happen BEFORE the customer pays:
     - authenticate, validate, reserve the username, upload the print image
     - create a Razorpay order server-side (amount computed here, never trusted
       from the client)
     - write a PENDING order + placeholder profile atomically, storing the
       razorpay_order_id

   The order stays payment_status = 'pending' until a verified payment flips it
   (the /razorpay/verify route or the payment.captured webhook). The client
   response carries only what checkout.js needs to open the payment modal.

   NOTE: imports lib/uploads.ts (sharp) — this route MUST be listed in
   next.config.ts -> outputFileTracingIncludes or its Vercel function ships
   without sharp's native binary and 500s. */
export async function POST(request: Request) {
  if (!verifyOrigin(request)) {
    return NextResponse.json({ error: "Invalid request origin." }, { status: 403 });
  }

  const limited = await rateLimitOrResponse(checkoutLimiter, clientIp(request));
  if (limited) return limited;

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
  // Amount is authoritative here — derived from server-side pricing and the
  // validated quantity, never taken from the client. The Razorpay order and
  // the DB row are created with this exact same value.
  const amount = variant.priceInPaise * sp.quantity;
  const profileStyle = identity.accountType === "business" ? "standard" : "personal";

  // Create the Razorpay order first — we need its id to store on the DB row so
  // /verify and the webhook can find this order when the payment comes back.
  let razorpayOrder;
  try {
    razorpayOrder = await getRazorpayClient().orders.create({
      amount,
      currency: "INR",
      receipt: orderNumber,
      notes: {
        order_number: orderNumber,
        username,
        user_id: user.id,
      },
    });
  } catch {
    // Razorpay order creation failed — don't leave the just-uploaded image
    // orphaned in storage.
    if (uploadedPhotoPath) {
      await supabase.storage.from("profile-photos").remove([uploadedPhotoPath]);
    }
    return NextResponse.json(
      { error: "Could not start the payment. Please try again." },
      { status: 502 },
    );
  }

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
    p_razorpay_order_id: razorpayOrder.id,
  });

  if (rpcError) {
    // The RPC is atomic on the DB side, but the uploaded file isn't part of
    // that transaction — remove it so a failed order leaves no orphaned image.
    // (The Razorpay order is harmless if left unpaid — it simply expires.)
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

  // Everything checkout.js needs to open the modal. keyId is the public key id
  // (safe to expose); amount/currency echo what Razorpay recorded.
  return NextResponse.json({
    keyId: process.env.RAZORPAY_KEY_ID,
    razorpayOrderId: razorpayOrder.id,
    amount: razorpayOrder.amount,
    currency: razorpayOrder.currency,
    orderNumber,
    username,
    prefill: {
      name: identity.displayName,
      email: user.email ?? "",
      contact: sp.phone,
    },
  });
}
