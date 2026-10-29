import Image from "next/image";
import Reveal from "@/components/motion/Reveal";

const STEPS = [
  {
    name: "You order",
    text: "Pick Standard or Premium, choose your profile link and pay. About five minutes, no account needed.",
    image: { src: "/home/order-form.webp", alt: "The first step of the Unitouch order form: account type, name and email", w: 732, h: 980 },
    img: "w-[52%]",
  },
  {
    name: "We make it",
    text: "We design your card with you, print it and program its chip. It reaches you in 5 to 7 days.",
    image: { src: "/cards/card-front.webp", alt: "A Unitouch card printed with its owner's name and title", w: 1200, h: 900 },
    img: "w-[96%]",
  },
  {
    name: "You tap",
    text: "Hold it to the back of any phone. Your profile opens, and your contact is one tap from saved.",
    image: { src: "/home/phone-tap.webp", alt: "A Unitouch card tapped on the back of an iPhone", w: 900, h: 1000 },
    img: "w-[78%]",
  },
];

/* Three equal steps on one line, read left to right: a numbered marker with
   a rule running on to the next step, a picture of the step, then a few
   words. The section sits on its own darker band with rounded top corners,
   which peeks up under the hero on the first screen. */
export default function HowItWorks() {
  return (
    <section id="how-it-works" aria-labelledby="how-heading" className="bg-bg-subtle scroll-mt-16 rounded-t-[32px] py-14 md:rounded-t-[48px] md:py-28">
      <div className="container-page">
        <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
          <h2 id="how-heading" className="font-display text-[length:var(--text-h2)] leading-[1.1] font-[600]">
            How it works
          </h2>
          <p className="text-text-secondary max-w-[40ch] text-[1.0625rem] leading-relaxed md:text-right">
            From your order to your first tap in about a week.
          </p>
        </div>

        {/* On a phone the steps sit in a row you swipe through, the next one
            peeking in at the edge, so the section is one screen tall rather
            than three; from tablet up they're three equal columns. */}
        <Reveal
          as="ol"
          className="-mx-[clamp(1.25rem,4vw,2.5rem)] mt-10 flex snap-x snap-mandatory scroll-px-[clamp(1.25rem,4vw,2.5rem)] gap-4 overflow-x-auto px-[clamp(1.25rem,4vw,2.5rem)] pb-2 [scrollbar-width:none] md:mx-0 md:mt-16 md:grid md:grid-cols-3 md:gap-6 md:overflow-visible md:px-0 md:pb-0 [&::-webkit-scrollbar]:hidden"
        >
          {STEPS.map((step, i) => (
            <li key={step.name} className="flex w-[80%] shrink-0 snap-start flex-col sm:w-[46%] md:w-auto">
              <div className="flex items-center gap-4">
                <span className="font-display bg-bg-ink text-text-on-ink grid size-9 shrink-0 place-items-center rounded-full text-[0.9375rem] font-[600]">
                  {i + 1}
                </span>
                {/* The rule that leads on to the next step (drawn in as the row appears). */}
                <span aria-hidden className={`step-rule bg-bg-border h-px flex-1 ${i === STEPS.length - 1 ? "invisible" : ""}`} />
              </div>
              <div className="bg-bg-elevated mt-5 flex aspect-[5/4] md:mt-6 items-center justify-center overflow-hidden rounded-[20px]">
                <Image
                  src={step.image.src}
                  alt={step.image.alt}
                  width={step.image.w}
                  height={step.image.h}
                  sizes="(min-width: 768px) 30vw, 90vw"
                  className={`h-auto max-h-[86%] max-w-none object-contain ${step.img}`}
                />
              </div>
              <h3 className="font-display mt-5 text-[1.25rem] font-[600] md:mt-6 md:text-[1.375rem]">{step.name}</h3>
              <p className="text-text-secondary mt-2 max-w-[34ch] text-[1rem] leading-relaxed">{step.text}</p>
            </li>
          ))}
        </Reveal>
      </div>
    </section>
  );
}
