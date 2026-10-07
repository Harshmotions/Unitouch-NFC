import type { CardVariant } from "@/types";

// TEMP (live payment test): both variants dropped to ₹1 so a real end-to-end
// payment costs ~nothing. REVERT to 999/99900 and 1499/149900 after the test.
export const CARD_VARIANTS: CardVariant[] = [
  {
    id: "standard",
    name: "Standard",
    price: 1,
    priceInPaise: 100,
    features: [
      "NFC-enabled card",
      "Live digital profile",
      "vCard download",
      "Standard shipping",
    ],
  },
  {
    id: "premium",
    name: "Premium",
    price: 1,
    priceInPaise: 100,
    isPopular: true,
    features: [
      "Everything in Standard",
      "Premium matte finish",
      "Priority design turnaround",
      "Profile analytics dashboard",
    ],
  },
];

/* Teams don't self-serve through checkout — larger/bulk orders are scoped
   and priced manually. Rendered as a third "let's talk" card alongside the
   two purchasable variants on the marketing pricing section. */
export const CUSTOM_PACKAGE = {
  title: "Need a custom package for your team?",
  description: "Bulk pricing, centralized setup, and dedicated support — tailored to your team's size.",
  cta: "Let's discuss",
  href: "mailto:unitouchnfc@gmail.com?subject=Custom%20team%20package",
};
