import { ShieldCheck } from "lucide-react";
import Button from "@/components/ui/Button";

/* The checkout submit button (audit #01). Kept as its own component so the pay
   affordance — label, secure-payment icon, and processing state — lives in one
   place; the payment orchestration itself (create order -> Razorpay modal ->
   verify) runs in OrderStepShippingPayment on form submit, which also shows a
   ProgressNotice explaining each slow step. */
export default function PaymentButton({ total, paying }: { total: number; paying: boolean }) {
  return (
    <Button
      variant="primary"
      size="lg"
      type="submit"
      loading={paying}
      disabled={paying}
      className="sm:ml-auto"
    >
      {!paying && <ShieldCheck className="size-4" />}
      {paying ? "Please wait…" : `Pay ₹${total.toLocaleString("en-IN")}`}
    </Button>
  );
}
