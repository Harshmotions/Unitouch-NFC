import OrderForm from "@/components/order/OrderForm";

export default async function OrderPage({
  searchParams,
}: {
  searchParams: Promise<{ card?: string }>;
}) {
  const { card } = await searchParams;

  return (
    <main className="bg-bg-base min-h-screen px-6 py-16">
      <div className="mx-auto w-full max-w-2xl">
        <h1 className="font-display text-h2 text-text-primary mb-2 font-[600]">Order your card</h1>
        <p className="text-text-secondary mb-10">
          Fill in your details below and we&apos;ll get your NFC card designed and shipped.
        </p>
        <OrderForm defaultCardType={card} />
      </div>
    </main>
  );
}
