/* The business's public contact details, shown on the Contact page, footer,
   and Terms. The legal name must match the Razorpay KYC, since Razorpay's
   website verification checks the site against it. */
export const BUSINESS = {
  legalName: "Unitouch NFC",
  email: "support@unitouch.in",
  phone: "+919637006661",
  phoneDisplay: "+91 96370 06661",
  addressLines: ["Rajarampuri, Kolhapur", "Maharashtra 416008, India"],
} as const;
