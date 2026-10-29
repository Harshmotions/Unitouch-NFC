import Navbar from "@/components/marketing/Navbar";

/* Inner pages (policies, contact, order) use the same navigation as the
   homepage; its section links point at "/#…" off the homepage. */
export default function SiteHeader() {
  return <Navbar />;
}
