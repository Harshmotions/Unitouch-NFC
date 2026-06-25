import { CheckCircle2 } from "lucide-react";
import Button from "@/components/ui/Button";

export default async function OrderSuccessPage({
  searchParams,
}: {
  searchParams: Promise<{ orderNumber?: string }>;
}) {
  const { orderNumber } = await searchParams;

  return (
    <main className="bg-bg-base flex min-h-screen flex-col items-center justify-center px-6 py-16 text-center">
      <CheckCircle2 className="text-success mb-5 size-12" />
      <h1 className="font-display text-h2 text-text-primary mb-2 font-[600]">Order received!</h1>
      {orderNumber && (
        <p className="text-text-secondary mb-1">
          Order number <span className="text-text-primary font-[600]">{orderNumber}</span>
        </p>
      )}
      <p className="text-text-secondary mb-8 max-w-md">
        Online payment isn&apos;t live on the site yet, so our team will reach out by phone or email
        shortly to confirm your order and arrange payment.
      </p>
      <Button variant="primary" size="md" href="/">
        Back to home
      </Button>
    </main>
  );
}
