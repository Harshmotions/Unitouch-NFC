/* Card mockup images, keyed by card variant id. Import-free so both the
   marketing pricing section and the client-side checkout can use it.
   Files live in public/cards/ (1600×915, 7:4 landscape, WebP). Replace the
   files in place to update the artwork; see HANDOFF.md Section 6. */
export const CARD_IMAGES: Record<"standard" | "premium", { src: string; alt: string }> = {
  standard: {
    src: "/cards/standard.webp",
    alt: "Unitouch Standard NFC business card in a matte black finish",
  },
  premium: {
    src: "/cards/premium.webp",
    alt: "Unitouch Premium NFC business card in a soft-touch matte finish",
  },
};
