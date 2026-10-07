/* The business's public contact details, shown on the Contact page, footer,
   and Terms. The legal name must match the Razorpay KYC, since Razorpay's
   website verification checks the site against it. */
export const BUSINESS = {
  legalName: "Unitouch NFC",
  // Canonical public URL (unitouch.in redirects here). Used for absolute
  // links and images in emails.
  siteUrl: "https://www.unitouch.in",
  email: "support@unitouch.in",
  // The shared admin account (admin login, new-order and payment alerts).
  // Not the customer support address.
  adminEmail: "unitouchnfc@gmail.com",
  phone: "+919637006661",
  phoneDisplay: "+91 96370 06661",
  addressLines: ["Rajarampuri, Kolhapur", "Maharashtra 416008, India"],
} as const;
