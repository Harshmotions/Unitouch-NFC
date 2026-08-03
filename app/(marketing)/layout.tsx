import Navbar from "@/components/marketing/Navbar";
import StickyOrderBar from "@/components/marketing/StickyOrderBar";

export default function MarketingLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <>
      <Navbar />
      {children}
      <StickyOrderBar />
    </>
  );
}
