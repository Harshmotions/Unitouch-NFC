/* The physical card's colour, chosen at checkout. Import-free so the
   checkout form, server routes, admin and emails can all use it.
   Stored on orders.card_color (supabase/schema.sql); orders from before the
   choice existed are black. Same price for both. */

export const CARD_COLORS = [
  { id: "black", label: "Black", description: "Matte black card" },
  { id: "white", label: "White", description: "Matte white card" },
] as const;

export type CardColor = (typeof CARD_COLORS)[number]["id"];

export const DEFAULT_CARD_COLOR: CardColor = "black";

export function isCardColor(value: unknown): value is CardColor {
  return CARD_COLORS.some((c) => c.id === value);
}

export function cardColorLabel(value: string | null | undefined): string {
  return CARD_COLORS.find((c) => c.id === value)?.label ?? "Black";
}
