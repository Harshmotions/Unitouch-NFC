import { z } from "zod";

export const orderDetailsSchema = z.object({
  fullName: z.string().min(2, "Enter your full name"),
  email: z.string().email("Enter a valid email"),
  phone: z.string().min(8, "Enter a valid phone number"),
  cardType: z.enum(["standard", "premium", "team"]),
  quantity: z.coerce.number().int().min(1).max(50),
  line1: z.string().min(3, "Enter your address"),
  line2: z.string().optional(),
  city: z.string().min(2, "Enter your city"),
  state: z.string().min(2, "Enter your state"),
  pincode: z.string().regex(/^\d{6}$/, "Enter a valid 6-digit pincode"),
  additionalNotes: z.string().optional(),
});

/* react-hook-form types fields by the schema's *input* shape (pre-coercion),
   not its output — quantity is typed as unknown/string here until zod
   coerces it on submit. */
export type OrderDetailsValues = z.input<typeof orderDetailsSchema>;

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
  profileStyle: z.enum(["standard", "personal"]),
  extraLinks: z
    .array(z.object({ label: z.string().min(1, "Add a label").max(40), url: z.string().url("Enter a valid URL") }))
    .max(8, "Up to 8 extra links")
    .optional(),
});

export type ProfileSetupValues = z.input<typeof profileSetupSchema>;
