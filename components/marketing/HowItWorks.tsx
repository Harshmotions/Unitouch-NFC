import Image from "next/image";
import Reveal from "@/components/motion/Reveal";

/* Three stages, ordered by size: each tile is taller than the one before,
   bottom-aligned, so the row reads left to right like something growing.
   The words sit under each tile on its left edge. */
const STAGES = [
  {
    name: "You order",
    text: "Pick Standard or Premium, choose your profile link and pay. About five minutes, no account needed.",
    image: { src: "/home/order-form.webp", alt: "The first step of the Unitouch order form: account type, name and email", w: 732, h: 980 },
    span: "md:col-span-3",
    tile: "bg-bg-subtle md:h-[30vh] md:min-h-[15rem]",
    img: "w-[78%] md:w-[82%]",
  },
  {
    name: "We make it",
    text: "We design your card with you, print it and program its chip. It reaches you in 5 to 7 days.",
    image: { src: "/cards/card-front.webp", alt: "The front of a Unitouch card: the fingerprint U and the wordmark", w: 1200, h: 900 },
    span: "md:col-span-4",
    tile: "bg-bg-border md:h-[44vh] md:min-h-[21rem]",
    img: "w-[92%]",
  },
  {
    name: "You tap",
    text: "Hold it to the back of any phone. Your profile opens, and your contact is one tap from saved.",
    image: { src: "/cards/card-back.webp", alt: "The back of a Unitouch card with the owner's name and title", w: 1200, h: 900 },
    span: "md:col-span-5",
    tile: "bg-bg-field md:h-[60vh] md:min-h-[28rem]",
    img: "w-[96%]",
  },
];

export default function HowItWorks() {
  return (
    <section id="how-it-works" className="scroll-mt-20 px-[var(--margin)] pt-28 pb-24 md:pt-40 md:pb-36">
      {/* On desktop the heading sits in the empty ground above the two
          smaller tiles, level with the top of the tallest one. */}
      <Reveal className="relative grid gap-y-12 md:grid-cols-12 md:items-end md:gap-x-[10px]">
        <h2 className="font-display -mb-4 text-[clamp(2rem,1.3rem+3.2vw,3.75rem)] font-[650] md:absolute md:top-0 md:left-0 md:mb-0 md:w-[58%]">
          How it works
        </h2>
        {STAGES.map((stage) => (
          <div key={stage.name} className={stage.span}>
            <div className={`flex aspect-[4/3] items-center justify-center overflow-hidden md:aspect-auto ${stage.tile}`}>
              <Image
                src={stage.image.src}
                alt={stage.image.alt}
                width={stage.image.w}
                height={stage.image.h}
                sizes="(min-width: 768px) 40vw, 90vw"
                className={`h-auto max-h-[90%] object-contain ${stage.img}`}
              />
            </div>
            <h3 className="mt-5 text-[1.5rem] font-[600]">{stage.name}</h3>
            <p className="mt-1.5 max-w-[34ch] text-[1.0625rem]">{stage.text}</p>
          </div>
        ))}
      </Reveal>
    </section>
  );
}
