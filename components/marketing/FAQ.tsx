"use client";

import { useState } from "react";
import { ChevronDown } from "lucide-react";

const FAQS = [
  {
    question: "How does NFC work?",
    answer:
      "Tap the card against the back of any NFC-enabled smartphone (most phones since around 2015). Your profile opens instantly in the browser — no app, no pairing.",
  },
  {
    question: "Do I need an app?",
    answer:
      "No. Everything works through the phone's browser via NFC, with a QR code as a fallback for older devices.",
  },
  {
    question: "Can I update my profile after the card is made?",
    answer:
      "Yes. Your card just links to your profile page, so you can update your details, photo, or links anytime — the physical card never needs to change.",
  },
  {
    question: "What if I lose my card?",
    answer:
      "Reach out to support and we'll get a replacement card programmed with your existing profile.",
  },
  {
    question: "How long does delivery take?",
    answer: "Roughly 5–7 days from order to delivery — see the full process timeline above.",
  },
  {
    question: "Do you ship across India?",
    answer: "Yes, we ship pan-India.",
  },
  {
    question: "Can I order for my entire team?",
    answer:
      "Yes — the Team Pack bundles 5 cards for groups, or you can place multiple individual orders.",
  },
  {
    question: "What's the difference between plans?",
    answer:
      "Standard covers the essentials. Premium adds a priority design turnaround and profile analytics. Team Pack bundles 5 cards at a lower per-card price.",
  },
];

export default function FAQ() {
  const [openIndex, setOpenIndex] = useState<number | null>(null);

  return (
    <section id="faq" className="bg-bg-subtle px-6 py-24 md:py-28">
      <div className="mx-auto w-full max-w-3xl">
        <div className="mb-16 flex flex-col items-center gap-4 text-center">
          <span className="eyebrow">FAQ</span>
          <h2 className="font-display text-h2 text-text-primary font-[600]">
            Questions? We&apos;ve got answers.
          </h2>
        </div>

        <div className="flex flex-col gap-3">
          {FAQS.map((faq, i) => {
            const isOpen = openIndex === i;
            return (
              <div
                key={faq.question}
                className={`surface-card rounded-2xl transition-colors duration-200 ${
                  isOpen ? "border-accent-purple/25" : ""
                }`}
              >
                <button
                  className="flex w-full items-center justify-between gap-4 px-6 py-5 text-left"
                  onClick={() => setOpenIndex(isOpen ? null : i)}
                >
                  <span className="font-display text-text-primary font-[500]">
                    {faq.question}
                  </span>
                  <ChevronDown
                    className={`size-4 shrink-0 transition-transform duration-300 ${
                      isOpen ? "text-accent-purple rotate-180" : "text-text-muted"
                    }`}
                  />
                </button>
                <div
                  className={`grid overflow-hidden transition-[grid-template-rows,opacity] duration-[400ms] ease-[cubic-bezier(0.16,1,0.3,1)] ${
                    isOpen ? "opacity-100" : "opacity-0"
                  }`}
                  style={{ gridTemplateRows: isOpen ? "1fr" : "0fr" }}
                >
                  <p className="text-text-secondary min-h-0 px-6 pb-5 text-sm leading-relaxed">
                    {faq.answer}
                  </p>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
