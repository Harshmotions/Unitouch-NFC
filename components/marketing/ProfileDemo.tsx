import Image from "next/image";
import Button from "@/components/ui/Button";

/* Hand-drawn-style curved arrow doodle — swoops down through a small loop
   before pointing into the demo image, echoing the "annotate a screenshot"
   sketch style. marker-end handles the arrowhead rotation automatically so
   it always points along the path's own direction. */
function DoodleArrow({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 160 190" fill="none" className={className} aria-hidden="true">
      <defs>
        <marker
          id="doodle-arrowhead"
          markerWidth="8"
          markerHeight="8"
          refX="4.5"
          refY="4"
          orient="auto-start-reverse"
        >
          <path d="M0 0 L8 4 L0 8 Z" fill="currentColor" />
        </marker>
      </defs>
      <path
        d="M22 8 C -8 48, 6 112, 42 134 C 64 148, 82 120, 60 110 C 40 101, 36 132, 60 140 C 92 151, 122 141, 146 130"
        stroke="currentColor"
        strokeWidth="7"
        strokeLinecap="round"
        strokeDasharray="13 11"
        markerEnd="url(#doodle-arrowhead)"
      />
    </svg>
  );
}

export default function ProfileDemo() {
  return (
    <section id="profile-demo" className="px-6 py-24 md:py-28">
      <div className="mx-auto flex w-full max-w-[1400px] flex-col items-center gap-12 lg:flex-row lg:justify-center lg:gap-20">
        <div className="flex shrink-0 flex-col items-center gap-5 text-center lg:items-start lg:text-left">
          <span className="eyebrow">Demo Profile</span>
          <h2 className="font-display text-h2 text-text-primary max-w-md font-[600]">
            Your profile. Always ready to impress.
          </h2>
          <p className="text-text-secondary max-w-sm">
            This is a sample profile so you can see what your card opens. Every Unitouch
            profile is fully editable after your card ships.
          </p>
          <Button variant="primary" size="lg" href="/order" className="mt-2">
            Order Now
          </Button>
        </div>

        <div className="relative w-full max-w-[300px] md:max-w-[360px] lg:max-w-[300px] xl:max-w-[340px] 2xl:max-w-[380px] min-[1920px]:max-w-[420px]!">
          <div className="pointer-events-none absolute -top-16 left-2 z-10 hidden flex-col items-start lg:flex">
            <span className="font-display text-text-secondary -rotate-3 whitespace-nowrap text-base italic">
              Your Profile looks this good
            </span>
            <DoodleArrow className="text-text-secondary/60 mt-1 h-28 w-24" />
          </div>
          <Image
            src="/Hero Page.png"
            alt="A phone showing a live Unitouch profile page for Priya Anand"
            width={941}
            height={1672}
            className="h-auto w-full"
          />
        </div>
      </div>
    </section>
  );
}
