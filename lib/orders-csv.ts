/* Orders -> CSV for the admin export (accounting/GST). Pure and import-free.

   Cells are quoted per RFC 4180, and any value starting with = + - @ (or a
   tab/CR) gets a leading apostrophe: names and addresses are typed by
   customers, and a spreadsheet would otherwise run them as formulas (CSV
   injection). Starts with a UTF-8 BOM so Excel reads ₹ and non-English
   names correctly. */

export interface CsvOrderRow {
  order_number: string;
  created_at: string;
  full_name: string;
  email: string;
  phone: string;
  card_type: string;
  quantity: number;
  amount: number; // paise
  payment_status: string;
  razorpay_payment_id: string | null;
  order_status: string;
  shipping_address: { city?: string; state?: string; pincode?: string } | null;
  tracking_number: string | null;
}

const HEADERS = [
  "Order number",
  "Date (IST)",
  "Customer name",
  "Email",
  "Phone",
  "Card type",
  "Quantity",
  "Amount (INR)",
  "Payment status",
  "Razorpay payment ID",
  "Order status",
  "City",
  "State",
  "Pincode",
  "Tracking",
];

function cell(value: unknown): string {
  let s = value === null || value === undefined ? "" : String(value);
  if (/^[=+\-@\t\r]/.test(s)) s = `'${s}`;
  return /[",\r\n]/.test(s) || s !== s.trim() ? `"${s.replace(/"/g, '""')}"` : s;
}

// "2026-10-19 18:05" in India time, which accountants expect.
export function formatIst(iso: string): string {
  const d = new Date(new Date(iso).getTime() + 330 * 60 * 1000);
  return d.toISOString().slice(0, 16).replace("T", " ");
}

export function ordersToCsv(rows: CsvOrderRow[], cardName: (cardType: string) => string): string {
  const lines = [HEADERS.map(cell).join(",")];
  for (const r of rows) {
    const a = r.shipping_address ?? {};
    lines.push(
      [
        r.order_number,
        formatIst(r.created_at),
        r.full_name,
        r.email,
        r.phone,
        cardName(r.card_type),
        r.quantity,
        (r.amount / 100).toFixed(2),
        r.payment_status,
        r.razorpay_payment_id,
        r.order_status,
        a.city,
        a.state,
        a.pincode,
        r.tracking_number,
      ]
        .map(cell)
        .join(","),
    );
  }
  return "﻿" + lines.join("\r\n") + "\r\n";
}

/* "YYYY-MM-DD" (India dates, both inclusive) -> UTC ISO bounds [start, end). */
export function istDayRange(from: string, to: string): { start: string; end: string } | null {
  const ok = /^\d{4}-\d{2}-\d{2}$/;
  if (!ok.test(from) || !ok.test(to)) return null;
  const start = new Date(`${from}T00:00:00+05:30`);
  const end = new Date(`${to}T00:00:00+05:30`);
  if (Number.isNaN(start.getTime()) || Number.isNaN(end.getTime())) return null;
  end.setUTCDate(end.getUTCDate() + 1);
  if (end <= start) return null;
  return { start: start.toISOString(), end: end.toISOString() };
}
