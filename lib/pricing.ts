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
  {
    id: "team",
    name: "Team Pack",
    price: 3999,
    priceInPaise: 399900,
    features: [
      "5x NFC cards",
      "Bulk team pricing",
      "Centralized profile setup",
      "Dedicated WhatsApp support",
    ],
  },
];
