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
      <p className="text-text-secondary mb-3 max-w-md">
        Your card is on its way. Next, finish building your digital profile
        {username && (
          <>
            {" "}
            at{" "}
            <a
              href={`/u/${encodeURIComponent(username)}`}
              target="_blank"
              rel="noopener noreferrer"
              className="text-text-primary font-[600] underline decoration-white/30 underline-offset-4 hover:decoration-white"
            >
              unitouch.in/u/{username}
            </a>
          </>
        )}
        .
      </p>
      <p className="text-text-secondary mb-8 max-w-md text-sm">
        To get started, sign in with the email you used at checkout. We&apos;ll send you a one-time
        code. You can do it now or come back anytime.
      </p>
      <div className="flex flex-col items-center gap-3 sm:flex-row">
        <Button variant="primary" size="md" href={username ? `/studio?username=${encodeURIComponent(username)}` : "/studio"}>
          Build your profile
        </Button>
        <Button variant="secondary" size="md" href="/">
          Back to home
        </Button>
      </div>
    </main>
  );
}
