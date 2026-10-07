/* Order fulfilment statuses and admin list views. Import-free so the
   browser (admin status form) can use it without pulling in server code;
   lib/orders.ts re-exports it. */

/* Fulfilment pipeline, in order. Values match the orders.order_status check
   constraint in supabase/schema.sql ("in_review" = design sent to the
   customer for approval). */
export const ORDER_STATUSES = [
  { value: "received", label: "Received" },
  { value: "designing", label: "Designing" },
  { value: "in_review", label: "Awaiting approval" },
  { value: "printing", label: "Printing" },
  { value: "shipped", label: "Shipped" },
  { value: "delivered", label: "Delivered" },
] as const;
export type OrderStatus = (typeof ORDER_STATUSES)[number]["value"];

export function statusLabel(status: string): string {
  return ORDER_STATUSES.find((s) => s.value === status)?.label ?? status;
}

export const ORDER_VIEWS = [
  { value: "to-fulfil", label: "To fulfil" },
  { value: "shipped", label: "Shipped" },
  { value: "unpaid", label: "Unpaid checkouts" },
  { value: "all", label: "All" },
] as const;
export type OrderView = (typeof ORDER_VIEWS)[number]["value"];
