/* Card mockup images, keyed by card variant id. Import-free so both the
   marketing pricing section and the client-side checkout can use it.
   Files live in public/cards/ (1600×1100, landscape, WebP, transparent
   background). They are stills of the homepage's 3D card
   (components/marketing/card3d), not photographs; replace them in place
   with real product photos when there are some (HANDOFF.md Section 6). */
export const CARD_IMAGES: Record<"standard" | "premium", { src: string; alt: string }> = {
  standard: {
    src: "/cards/standard.webp",
    alt: "A Unitouch Standard NFC business card: matte black, the owner's name and title printed in white",
  },
  premium: {
    src: "/cards/premium.webp",
    alt: "A Unitouch Premium NFC business card: matte black, the owner's name and title in gold",
  },
};
