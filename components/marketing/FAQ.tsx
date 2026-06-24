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
    <section id="faq" className="bg-bg-subtle px-6 py-24">
      <div className="mx-auto w-full max-w-3xl">
        <div className="mb-12 flex flex-col items-center gap-3 text-center">
          <span className="text-accent-amber border-accent-amber/30 rounded-full border px-3 py-1 text-xs">
            FAQ
          </span>
          <h2 className="font-display text-h2 text-text-primary font-[600]">
            Questions? We&apos;ve got answers.
          </h2>
        </div>

        <div className="flex flex-col gap-3">
          {FAQS.map((faq, i) => {
            const isOpen = openIndex === i;
            return (
              <div key={faq.question} className="border-bg-border bg-bg-elevated rounded-xl border">
                <button
                  className="flex w-full items-center justify-between px-5 py-4 text-left"
                  onClick={() => setOpenIndex(isOpen ? null : i)}
                >
                  <span className="font-display text-text-primary font-[500]">
                    {faq.question}
                  </span>
                  <ChevronDown
                    className={`text-text-muted size-4 shrink-0 transition-transform ${
                      isOpen ? "rotate-180" : ""
                    }`}
                  />
                </button>
                <div
                  className={`overflow-hidden transition-[max-height] duration-300 ${
                    isOpen ? "max-h-40" : "max-h-0"
                  }`}
                >
                  <p className="text-text-secondary px-5 pb-4 text-sm leading-relaxed">
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
