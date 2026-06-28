import { NextResponse } from "next/server";
import { orderDetailsSchema, profileSetupSchema } from "@/lib/validations";
import { CARD_VARIANTS } from "@/lib/pricing";
import { createServiceRoleClient } from "@/lib/supabase/server";

function generateOrderNumber(): string {
  const random = Math.floor(100000 + Math.random() * 900000);
  return `UTK-${random}`;
}

const MAX_PHOTO_BYTES = 5 * 1024 * 1024;

/* The only route in the app that writes to `orders` or `profiles`. Called
   once, after the (currently mock) payment step reports success — nothing
   upstream of this point has touched the database or Storage. */
export async function POST(request: Request) {
  const form = await request.formData().catch(() => null);
  if (!form) {
    return NextResponse.json({ error: "Invalid request" }, { status: 400 });
  }

  const orderDetailsRaw = form.get("orderDetails");
  const profileSetupRaw = form.get("profileSetup");
  const photo = form.get("photo");

  if (typeof orderDetailsRaw !== "string" || typeof profileSetupRaw !== "string") {
    return NextResponse.json({ error: "Invalid request" }, { status: 400 });
  }

  const orderParsed = orderDetailsSchema.safeParse(JSON.parse(orderDetailsRaw));
  if (!orderParsed.success) {
    return NextResponse.json({ error: orderParsed.error.issues[0]?.message ?? "Invalid order details" }, { status: 400 });
  }

  const profileParsed = profileSetupSchema.safeParse(JSON.parse(profileSetupRaw));
  if (!profileParsed.success) {
    return NextResponse.json({ error: profileParsed.error.issues[0]?.message ?? "Invalid profile details" }, { status: 400 });
  }

  const order = orderParsed.data;
  const profile = profileParsed.data;
  const username = profile.username.trim().toLowerCase();

  const variant = CARD_VARIANTS.find((v) => v.id === order.cardType);
  if (!variant) {
    return NextResponse.json({ error: "Invalid card type" }, { status: 400 });
  }

  if (photo instanceof File) {
    if (photo.size > MAX_PHOTO_BYTES) {
      return NextResponse.json({ error: "Photo must be under 5MB" }, { status: 400 });
    }
    if (!photo.type.startsWith("image/")) {
      return NextResponse.json({ error: "Photo must be an image" }, { status: 400 });
    }
  }

  const supabase = createServiceRoleClient();

  // Re-check availability server-side — the client-side check is just UX,
  // this is the actual guard against a race between two checkouts.
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

  let avatarUrl: string | null = null;
  if (photo instanceof File) {
    const ext = photo.name.split(".").pop() || "jpg";
    const path = `${username}-${Date.now()}.${ext}`;
    const { error: uploadError } = await supabase.storage
      .from("profile-photos")
      .upload(path, photo, { contentType: photo.type, upsert: false });

    if (uploadError) {
      return NextResponse.json({ error: "Could not upload photo. Please try again." }, { status: 500 });
    }

    const { data: publicUrlData } = supabase.storage.from("profile-photos").getPublicUrl(path);
    avatarUrl = publicUrlData.publicUrl;
  }

  const orderNumber = generateOrderNumber();
  const amount = variant.priceInPaise * order.quantity;

  const { data: orderRow, error: orderError } = await supabase
    .from("orders")
    .insert({
      order_number: orderNumber,
      full_name: order.fullName,
      email: order.email,
      phone: order.phone,
      card_type: order.cardType,
      quantity: order.quantity,
      shipping_address: {
        line1: order.line1,
        line2: order.line2,
        city: order.city,
        state: order.state,
        pincode: order.pincode,
      },
      additional_notes: order.additionalNotes || null,
      payment_status: "paid",
      order_status: "received",
      amount,
    })
    .select("id")
    .single();

  if (orderError || !orderRow) {
    return NextResponse.json({ error: "Could not save your order. Please try again." }, { status: 500 });
  }

  const { data: profileRow, error: profileError } = await supabase
    .from("profiles")
    .insert({
      username,
      full_name: profile.fullName,
      designation: profile.designation || null,
      company: profile.company || null,
      phone: order.phone,
      whatsapp: profile.whatsapp || null,
      email: order.email,
      website: profile.website || null,
      instagram: profile.instagram || null,
      linkedin: profile.linkedin || null,
      twitter: profile.twitter || null,
      youtube: profile.youtube || null,
      portfolio: profile.portfolio || null,
      location: profile.location || null,
      bio: profile.bio || null,
      avatar_url: avatarUrl,
      interests: profile.interests ?? [],
      extra_links: profile.extraLinks ?? [],
      is_published: true,
      profile_style: profile.profileStyle,
      order_id: orderRow.id,
    })
    .select("id")
    .single();

  if (profileError || !profileRow) {
    return NextResponse.json({ error: "Order was placed but profile setup failed. We'll follow up." }, { status: 500 });
  }

  await supabase.from("orders").update({ profile_id: profileRow.id }).eq("id", orderRow.id);

  return NextResponse.json({ orderNumber, username });
}
