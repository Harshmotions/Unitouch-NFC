import FaqItem from "@/components/marketing/FaqItem";
import Reveal from "@/components/motion/Reveal";
import { BUSINESS } from "@/lib/business";

export const FAQS = [
  {
    question: "How does NFC work?",
    answer:
      "Tap the card against the back of any NFC-enabled smartphone (most phones since around 2015). Your profile opens instantly in the browser, no app, no pairing.",
  },
  {
    question: "Do I need an app?",
    answer:
      "No. Everything works through the phone's browser via NFC, with a QR code as a fallback for older devices.",
  },
  {
    question: "Can I update my profile after the card is made?",
    answer:
      "Yes. Your card just links to your profile page, so you can update your details, photo, or links anytime. The physical card never needs to change.",
  },
  {
    question: "What if I lose my card?",
    answer: "Reach out to support and we'll get a replacement card programmed with your existing profile.",
  },
  {
    question: "How long does delivery take?",
    answer: "Roughly 5 to 7 days from order to delivery. Delivery is free anywhere in India.",
  },
  {
    question: "Do you ship across India?",
    answer: "Yes, we ship pan-India.",
  },
  {
    question: "Can I order for my entire team?",
    answer:
      "Yes. For groups we put together a custom package with bulk pricing and centralized setup. Reach out and we'll scope it, or place multiple individual orders yourself.",
  },
  {
    question: "What's the difference between plans?",
    answer:
      "Standard covers the essentials. Premium adds a premium matte finish and priority design turnaround, plus a profile analytics dashboard showing your views, contact saves and link taps. Ordering for a whole team? We'll set up a custom package for you.",
  },
];

/* A wide heading and the questions indented beneath it to the right, so the
   empty ground under the heading is the composition. Native <details>, so
   it works without script and with the keyboard. The page also publishes
   these as FAQPage structured data (app/(marketing)/page.tsx). */
export default function FAQ() {
  return (
    <section id="faq" aria-labelledby="faq-heading" className="scroll-mt-16 py-24 md:py-32">
      <div className="container-page grid gap-10 lg:grid-cols-12 lg:gap-8">
        <div className="lg:col-span-4">
          <h2 id="faq-heading" className="font-display text-[length:var(--text-h2)] font-[600]">
            Questions, answered
          </h2>
          <p className="text-text-secondary mt-4 max-w-[30ch] text-[0.9375rem] leading-relaxed">
            Anything else? Write to us at{" "}
            <a href={`mailto:${BUSINESS.email}`} className="text-text-primary underline underline-offset-4">
              {BUSINESS.email}
            </a>
            .
          </p>
        </div>

        <Reveal className="flex flex-col gap-2 lg:col-span-8">
          {FAQS.map((faq) => (
            <FaqItem key={faq.question} question={faq.question} answer={faq.answer} />
          ))}
        </Reveal>
      </div>
    </section>
  );
}
