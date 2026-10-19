import type { Metadata } from "next";

// The page itself is a client component, so its metadata lives here.
export const metadata: Metadata = {
  title: "Sign in",
  description: "Sign in with the email you ordered with to set up and edit your Unitouch profile.",
  robots: { index: false, follow: true },
};

export default function LoginLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return children;
}
