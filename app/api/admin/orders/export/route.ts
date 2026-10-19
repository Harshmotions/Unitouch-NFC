import { NextResponse } from "next/server";
import { getAdminUser } from "@/lib/admin";
import { profileWriteLimiter, rateLimitOrResponse } from "@/lib/rate-limit";
import { createServiceRoleClient } from "@/lib/supabase/server";
import { CARD_VARIANTS } from "@/lib/pricing";
import { istDayRange, ordersToCsv, type CsvOrderRow } from "@/lib/orders-csv";

/* Admin: download orders as CSV for accounting/GST.
   GET ?from=YYYY-MM-DD&to=YYYY-MM-DD (India dates, inclusive)
       &includeUnpaid=1 (optional; paid orders only by default)

   Read-only, so a plain GET from the export form (a download link can't
   carry a JSON body). No origin check needed: it changes nothing, and
   another site can't read the response. Admin session + 2FA cookie
   required; contains customer personal data, so never cached. */

const PAGE = 1000;

export async function GET(request: Request) {
  const admin = await getAdminUser();
  if (!admin) {
    return NextResponse.json({ error: "Your admin session expired. Please sign in again." }, { status: 401 });
  }
  const limited = await rateLimitOrResponse(profileWriteLimiter, admin.id);
  if (limited) return limited;

  const params = new URL(request.url).searchParams;
  const from = params.get("from") ?? "";
  const to = params.get("to") ?? "";
  const includeUnpaid = params.get("includeUnpaid") === "1";
  const range = istDayRange(from, to);
  if (!range) {
    return NextResponse.json({ error: "Pick a valid From and To date (From must not be after To)." }, { status: 400 });
  }

  const supabase = createServiceRoleClient();
  const rows: CsvOrderRow[] = [];
  for (let offset = 0; ; offset += PAGE) {
    let query = supabase
      .from("orders")
      .select(
        "order_number, created_at, full_name, email, phone, card_type, quantity, amount, payment_status, razorpay_payment_id, order_status, shipping_address, tracking_number",
      )
      .gte("created_at", range.start)
      .lt("created_at", range.end)
      .order("created_at", { ascending: true })
      .range(offset, offset + PAGE - 1);
    if (!includeUnpaid) query = query.eq("payment_status", "paid");
    const { data, error } = await query;
    if (error) {
      console.error("orders export failed", error.message);
      return NextResponse.json({ error: "Could not read orders. Please try again." }, { status: 500 });
    }
    rows.push(...(data as CsvOrderRow[]));
    if (data.length < PAGE) break;
  }

  const csv = ordersToCsv(rows, (t) => CARD_VARIANTS.find((v) => v.id === t)?.name ?? t);
  return new NextResponse(csv, {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="unitouch-orders-${from}-to-${to}${includeUnpaid ? "-incl-unpaid" : ""}.csv"`,
      "Cache-Control": "no-store",
    },
  });
}
