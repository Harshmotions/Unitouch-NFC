import SiteHeader from "@/components/marketing/SiteHeader";
import Footer from "@/components/marketing/Footer";

/* Inner pages (policies, contact, order flow): a plain header and the full
   site footer, so every page links back home and to every policy. The
   route group doesn't change any URL. */
export default function SiteLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <>
      <SiteHeader />
      {children}
      <Footer />
    </>
  );
}
