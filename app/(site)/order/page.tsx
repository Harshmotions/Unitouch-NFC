import OrderWizard from "@/components/order/OrderWizard";
import { pageMetadata } from "@/lib/seo";

export const metadata = pageMetadata({
  title: "Order your card",
  description: "Order your Unitouch NFC business card: pick Standard or Premium, claim your profile link and pay securely. No account needed.",
  path: "/order",
});

export default async function OrderPage({
  searchParams,
}: {
  searchParams: Promise<{ card?: string }>;
}) {
  const { card } = await searchParams;

  return (
    <main className="bg-bg-base min-h-screen px-6 py-16">
      <div className="mx-auto w-full max-w-xl">
        <h1 className="font-display text-h2 text-text-primary mb-2 text-center font-[600]">Order your card</h1>
        <p className="text-text-secondary mb-10 text-center">
          Set up your card, your profile page, and pay in two quick steps.
        </p>
        <OrderWizard defaultCardType={card} />
      </div>
    </main>
  );
}
