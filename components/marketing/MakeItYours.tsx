"use client";

import { useId, useState } from "react";
import Image from "next/image";
import Button from "@/components/ui/Button";
import Reveal from "@/components/motion/Reveal";

/* Same rule the checkout uses for profile links (lowercase letters, digits
   and hyphens, 3 to 30 characters), so the preview shows a link that could
   really exist. Availability is checked for real at checkout. */
function toSlug(name: string) {
  return name
    .toLowerCase()
    .normalize("NFKD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 30)
    .replace(/-+$/, "");
}

const SAMPLE_NAME = "Priya Anand";
const SAMPLE_TITLE = "Portrait & Brand Photographer";

/* The page's one live thing: type a name and a title and see them on the
   back of the card, with the profile link the card would open. Purely in
   the browser; nothing is saved or sent. */
export default function MakeItYours() {
  const [name, setName] = useState("");
  const [title, setTitle] = useState("");
  const nameId = useId();
  const titleId = useId();

  const shownName = name.trim() || SAMPLE_NAME;
  const shownTitle = title.trim() || SAMPLE_TITLE;
  const slug = toSlug(shownName) || "your-name";

  return (
    <section id="make-it-yours" aria-labelledby="make-heading" className="px-[var(--margin)] py-28 md:py-40">
      <div className="grid gap-12 md:grid-cols-12 md:items-center md:gap-x-6">
        <Reveal className="flex flex-col gap-6 md:col-span-5">
          <h2 id="make-heading" className="font-display text-[clamp(2rem,1.3rem+3.2vw,3.75rem)] font-[650]">
            Make it yours
          </h2>
          <p className="max-w-[40ch] text-[1.0625rem]">
            Type your name and see it on your card, with the profile link it opens. We finish the design with you
            before anything is printed.
          </p>

          <div className="flex flex-col gap-4">
            <div className="flex flex-col gap-1.5">
              <label htmlFor={nameId} className="text-[0.9375rem] font-[550]">
                Your name
              </label>
              <input
                id={nameId}
                value={name}
                onChange={(e) => setName(e.target.value.slice(0, 40))}
                placeholder={SAMPLE_NAME}
                autoComplete="name"
                className="bg-bg-elevated placeholder:text-text-muted h-12 rounded-[10px] px-4 text-[1.0625rem] outline-none focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--color-accent)]"
              />
            </div>
            <div className="flex flex-col gap-1.5">
              <label htmlFor={titleId} className="text-[0.9375rem] font-[550]">
                What you do
              </label>
              <input
                id={titleId}
                value={title}
                onChange={(e) => setTitle(e.target.value.slice(0, 48))}
                placeholder={SAMPLE_TITLE}
                autoComplete="organization-title"
                className="bg-bg-elevated placeholder:text-text-muted h-12 rounded-[10px] px-4 text-[1.0625rem] outline-none focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--color-accent)]"
              />
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-x-6 gap-y-3">
            <Button variant="primary" size="md" href="/order">
              Order your card
            </Button>
            <p className="text-text-secondary text-[0.9375rem]" aria-live="polite">
              Your link: <span className="text-text-primary font-[550] break-all">unitouch.in/u/{slug}</span>
            </p>
          </div>
        </Reveal>

        {/* The back of the card, drawn flat at full width of its column, in
            the same layout as the 3D card's back face. */}
        <div className="md:col-span-7">
          <div
            className="bg-bg-ink text-text-on-ink relative mx-auto aspect-[85.6/54] w-full max-w-[44rem] overflow-hidden rounded-[clamp(14px,2.4vw,26px)] p-[7%]"
            aria-label={`Card preview: ${shownName}, ${shownTitle}`}
            role="img"
          >
            <p className="font-display truncate text-[clamp(1.5rem,0.6rem+3.4vw,3.25rem)] font-[650]">{shownName}</p>
            <p className="mt-[2%] truncate text-[clamp(0.9375rem,0.6rem+1.2vw,1.375rem)] opacity-75">{shownTitle}</p>
            <p className="absolute bottom-[12%] left-[7%] text-[clamp(0.8125rem,0.5rem+1vw,1.125rem)] font-[550]">
              Tap to connect
            </p>
            <Image
              src="/brand/u-mark-white.webp"
              alt=""
              width={512}
              height={582}
              className="absolute right-[7%] bottom-[10%] h-[24%] w-auto opacity-90"
            />
          </div>
          <p className="text-text-secondary mx-auto mt-4 max-w-[44rem] text-[0.9375rem]">
            A preview of the back of your card. The front carries the Unitouch mark.
          </p>
        </div>
      </div>
    </section>
  );
}
