"use client";

import { useId, useState } from "react";
import { ChevronDown } from "lucide-react";

/* One question. Opening it slides the answer open smoothly (the row's grid
   track animates from 0fr to 1fr, so the height is never measured) while
   the words fade and rise in. The answer stays in the page for search
   engines; while closed it's inert, so it can't be focused or read out. */
export default function FaqItem({ question, answer }: { question: string; answer: string }) {
  const [open, setOpen] = useState(false);
  const id = useId();

  return (
    <div
      className={`rounded-[16px] px-5 transition-colors duration-300 md:px-6 ${
        open ? "bg-bg-elevated" : "bg-bg-elevated/60"
      }`}
    >
      <h3>
        <button
          type="button"
          aria-expanded={open}
          aria-controls={id}
          onClick={() => setOpen((o) => !o)}
          className="flex w-full cursor-pointer items-center justify-between gap-6 py-5 text-left text-[1.0625rem] font-[500] md:text-[1.125rem]"
        >
          {question}
          <ChevronDown
            aria-hidden
            strokeWidth={2}
            className={`text-text-secondary size-5 shrink-0 transition-transform duration-500 ease-[var(--ease-expo)] ${
              open ? "rotate-180" : ""
            }`}
          />
        </button>
      </h3>
      <div
        id={id}
        role="region"
        inert={!open}
        className={`grid transition-[grid-template-rows] duration-500 ease-[var(--ease-expo)] motion-reduce:transition-none ${
          open ? "grid-rows-[1fr]" : "grid-rows-[0fr]"
        }`}
      >
        <div className="overflow-hidden">
          <p
            className={`text-text-secondary max-w-[60ch] pb-5 text-[0.9375rem] leading-relaxed transition-[opacity,transform] duration-500 ease-[var(--ease-out)] motion-reduce:transition-none ${
              open ? "translate-y-0 opacity-100 delay-75" : "-translate-y-1.5 opacity-0"
            }`}
          >
            {answer}
          </p>
        </div>
      </div>
    </div>
  );
}
