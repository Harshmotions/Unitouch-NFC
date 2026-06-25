import { z } from "zod";

export const orderFormSchema = z.object({
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
export type OrderFormValues = z.input<typeof orderFormSchema>;
