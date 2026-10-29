import { ChevronDown } from "lucide-react";
import Reveal from "@/components/motion/Reveal";

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
    <section id="faq" aria-labelledby="faq-heading" className="scroll-mt-16 px-[var(--margin)] py-28 md:py-40">
      <h2
        id="faq-heading"
        className="font-display max-w-[14ch] text-[clamp(2.5rem,1rem+5.4vw,5.5rem)] leading-[0.98] font-[700]"
      >
        Questions, answered
      </h2>

      <Reveal className="mt-14 flex flex-col gap-2 md:mt-20 md:ml-[33.333%]">
        {FAQS.map((faq) => (
          <details
            key={faq.question}
            className="group -mx-[var(--margin)] px-[var(--margin)] py-1 transition-colors duration-[240ms] open:bg-bg-subtle md:mx-[calc(var(--margin)*-0.75)] md:rounded-[14px] md:px-[calc(var(--margin)*0.75)]"
          >
            <summary className="flex cursor-pointer list-none items-center justify-between gap-6 py-4 text-[1.25rem] md:text-[1.5rem] [&::-webkit-details-marker]:hidden">
              {faq.question}
              <ChevronDown
                aria-hidden
                strokeWidth={2}
                className="size-5 shrink-0 transition-transform duration-[240ms] ease-[var(--ease-out)] group-open:rotate-180"
              />
            </summary>
            <p className="max-w-[48ch] pb-6 text-[1.0625rem]">{faq.answer}</p>
          </details>
        ))}
      </Reveal>
    </section>
  );
}
