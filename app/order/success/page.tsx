import { CheckCircle2 } from "lucide-react";
import Button from "@/components/ui/Button";

export default async function OrderSuccessPage({
  searchParams,
}: {
  searchParams: Promise<{ orderNumber?: string; username?: string }>;
}) {
  const { orderNumber, username } = await searchParams;

  return (
    <main className="bg-bg-base flex min-h-screen flex-col items-center justify-center px-6 py-16 text-center">
      <CheckCircle2 className="text-success mb-5 size-12" />
      <h1 className="font-display text-h2 text-text-primary mb-2 font-[600]">Payment received!</h1>
      {orderNumber && (
        <p className="text-text-secondary mb-1">
          Order number <span className="text-text-primary font-[600]">{orderNumber}</span>
        </p>
      )}
      <p className="text-text-secondary mb-8 max-w-md">
        Your profile is live and your card is on its way. We&apos;ll email you with shipping updates.
      </p>
      <div className="flex flex-col items-center gap-3 sm:flex-row">
        {username && (
          <Button variant="primary" size="md" href={`/u/${username}`}>
            View your profile
          </Button>
        )}
        <Button variant="secondary" size="md" href="/">
          Back to home
        </Button>
      </div>
    </main>
  );
}
