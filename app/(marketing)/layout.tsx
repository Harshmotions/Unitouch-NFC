import Navbar from "@/components/marketing/Navbar";

/* The sticky navigation carries the Order button on every screen size, so
   there's no separate floating order bar covering the page. */
export default function MarketingLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <>
      <Navbar />
      {children}
    </>
  );
}
