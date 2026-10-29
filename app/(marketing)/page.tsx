import type { Metadata } from "next";
import Hero from "@/components/marketing/Hero";
import HowItWorks from "@/components/marketing/HowItWorks";
import ProfileShowcase from "@/components/marketing/ProfileShowcase";
import MakeItYours from "@/components/marketing/MakeItYours";
import Features from "@/components/marketing/Features";
import Pricing from "@/components/marketing/Pricing";
import FAQ, { FAQS } from "@/components/marketing/FAQ";
import Footer from "@/components/marketing/Footer";
import { CARD_VARIANTS } from "@/lib/pricing";
import { BUSINESS } from "@/lib/business";

// Title, description and share picture come from the root layout defaults.
export const metadata: Metadata = { alternates: { canonical: "/" } };

/* Structured data for search engines: the business, the product with both
   prices, and the FAQ. Only facts that are on the page itself. */
const JSON_LD = [
  {
    "@context": "https://schema.org",
    "@type": "Organization",
    name: "Unitouch",
    legalName: BUSINESS.legalName,
    url: BUSINESS.siteUrl,
    logo: `${BUSINESS.siteUrl}/icon.png`,
    email: BUSINESS.email,
    telephone: BUSINESS.phone,
    address: {
      "@type": "PostalAddress",
      streetAddress: "Rajarampuri",
      addressLocality: "Kolhapur",
      addressRegion: "Maharashtra",
      postalCode: "416008",
      addressCountry: "IN",
    },
  },
  {
    "@context": "https://schema.org",
    "@type": "Product",
    name: "Unitouch NFC business card",
    description:
      "An NFC business card that opens your live digital profile on any phone and saves your contact. No app needed.",
    image: `${BUSINESS.siteUrl}/cards/hero-card.webp`,
    brand: { "@type": "Brand", name: "Unitouch" },
    offers: CARD_VARIANTS.map((v) => ({
      "@type": "Offer",
      name: v.name,
      price: v.price,
      priceCurrency: "INR",
      availability: "https://schema.org/InStock",
      url: `${BUSINESS.siteUrl}/order?card=${v.id}`,
      shippingDetails: {
        "@type": "OfferShippingDetails",
        shippingRate: { "@type": "MonetaryAmount", value: 0, currency: "INR" },
        shippingDestination: { "@type": "DefinedRegion", addressCountry: "IN" },
      },
    })),
  },
  {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: FAQS.map((f) => ({
      "@type": "Question",
      name: f.question,
      acceptedAnswer: { "@type": "Answer", text: f.answer },
    })),
  },
];

export default function Home() {
  return (
    <main>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(JSON_LD) }} />
      <Hero />
      <HowItWorks />
      <ProfileShowcase />
      <MakeItYours />
      <Features />
      <Pricing />
      <FAQ />
      <Footer />
    </main>
  );
}
