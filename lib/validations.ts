import { z } from "zod";

/* --- "Buy Now, Build Later" checkout (Phase 4) --------------------------- */

// Step 1 — identity captured before payment. Contact email comes from the
// authenticated session, not this form.
export const identitySchema = z.object({
  accountType: z.enum(["personal", "business"]),
  displayName: z.string().min(2, "Enter your name"),
  username: z
    .string()
    .min(3, "Username must be at least 3 characters")
    .max(30, "Username must be 30 characters or fewer")
    .regex(/^[a-z0-9-]+$/, "Lowercase letters, numbers, and hyphens only"),
});
export type IdentityValues = z.input<typeof identitySchema>;

// Step 2 — shipping, contact phone, and the card being purchased. Team-size
// orders aren't self-serve — they're scoped and priced manually, so "team"
// is intentionally not a selectable cardType here.
export const shippingPaymentSchema = z.object({
  phone: z.string().min(8, "Enter a valid phone number"),
  cardType: z.enum(["standard", "premium"]),
  quantity: z.coerce.number().int().min(1).max(50),
  line1: z.string().min(3, "Enter your address"),
  line2: z.string().optional(),
  city: z.string().min(2, "Enter your city"),
  state: z.string().min(2, "Enter your state"),
  pincode: z.string().regex(/^\d{6}$/, "Enter a valid 6-digit pincode"),
  additionalNotes: z.string().optional(),
});
export type ShippingPaymentValues = z.input<typeof shippingPaymentSchema>;

export const profileSetupSchema = z.object({
  username: z
    .string()
    .min(3, "Username must be at least 3 characters")
    .max(30, "Username must be 30 characters or fewer")
    .regex(/^[a-z0-9-]+$/, "Lowercase letters, numbers, and hyphens only"),
  fullName: z.string().min(2, "Enter your full name"),
  designation: z.string().optional(),
  company: z.string().optional(),
  bio: z.string().max(280, "Keep it under 280 characters").optional(),
  location: z.string().optional(),
  website: z.string().optional(),
  whatsapp: z.string().optional(),
  instagram: z.string().optional(),
  linkedin: z.string().optional(),
  twitter: z.string().optional(),
  youtube: z.string().optional(),
  portfolio: z.string().optional(),
  profileStyle: z.enum(["standard", "personal"]).default("personal"),
  // Internal-only, informs the manual design review — never shown on the
  // public profile page.
  represents: z.enum(["me", "company", "both"]).optional(),
  interests: z.array(z.string().min(1).max(30)).max(6, "Up to 6 tags").optional(),
  extraLinks: z
    .array(z.object({ label: z.string().min(1, "Add a label").max(40), url: z.string().url("Enter a valid URL") }))
    .max(8, "Up to 8 extra links")
    .optional(),
});

export type ProfileSetupValues = z.input<typeof profileSetupSchema>;

// Step 3 — the digital studio edits an existing profile. Same fields as the
// original profile setup, minus username (fixed at checkout, not editable
// here). profileStyle is accepted but ignored by the update route — the
// layout is set from the account type at checkout, not chosen in the studio.
export const studioUpdateSchema = profileSetupSchema.omit({ username: true }).extend({
  // A radio group with nothing selected yields null (or ""), neither of which
  // a bare optional enum accepts — normalize both to "not set".
  represents: z.preprocess(
    (v) => (v === "" || v === null ? undefined : v),
    z.enum(["me", "company", "both"]).optional(),
  ),
});
export type StudioUpdateValues = z.input<typeof studioUpdateSchema>;
