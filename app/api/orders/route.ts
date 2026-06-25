import { NextResponse } from "next/server";
import { orderFormSchema } from "@/lib/validations";
import { CARD_VARIANTS } from "@/lib/pricing";
import { createServiceRoleClient } from "@/lib/supabase/server";

function generateOrderNumber(): string {
  const random = Math.floor(100000 + Math.random() * 900000);
  return `UTK-${random}`;
}

export async function POST(request: Request) {
  const json = await request.json().catch(() => null);
  const parsed = orderFormSchema.safeParse(json);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.issues[0]?.message ?? "Invalid order" }, { status: 400 });
  }

  const { fullName, email, phone, cardType, quantity, line1, line2, city, state, pincode, additionalNotes } =
    parsed.data;

  const variant = CARD_VARIANTS.find((v) => v.id === cardType);
  if (!variant) {
    return NextResponse.json({ error: "Invalid card type" }, { status: 400 });
  }

  const supabase = createServiceRoleClient();
  const orderNumber = generateOrderNumber();

  const { error } = await supabase.from("orders").insert({
    order_number: orderNumber,
    full_name: fullName,
    email,
    phone,
    card_type: cardType,
    quantity,
    shipping_address: { line1, line2, city, state, pincode },
    additional_notes: additionalNotes || null,
    payment_status: "pending",
    order_status: "received",
    amount: variant.priceInPaise * quantity,
  });

  if (error) {
    return NextResponse.json({ error: "Could not save your order — please try again" }, { status: 500 });
  }

  return NextResponse.json({ orderNumber });
}
