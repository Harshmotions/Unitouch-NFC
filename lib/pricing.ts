import type { CardVariant } from "@/types";

export const CARD_VARIANTS: CardVariant[] = [
  {
    id: "standard",
    name: "Standard",
    price: 999,
    priceInPaise: 99900,
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
    price: 1499,
    priceInPaise: 149900,
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
