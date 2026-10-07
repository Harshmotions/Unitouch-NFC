import Hero from "@/components/marketing/Hero";
import SocialProof from "@/components/marketing/SocialProof";
import ProductShowcase from "@/components/marketing/ProductShowcase";
import HowItWorks from "@/components/marketing/HowItWorks";
import Features from "@/components/marketing/Features";
import Pricing from "@/components/marketing/Pricing";
import FAQ from "@/components/marketing/FAQ";
import Footer from "@/components/marketing/Footer";

export default function Home() {
  return (
    <main>
      <Hero />
      <SocialProof />
      <ProductShowcase />
      <HowItWorks />
      <Features />
      <Pricing />
      <FAQ />
      <Footer />
    </main>
  );
}
