import Button from "@/components/ui/Button";
import { PlatformBadge, type PlatformKey } from "@/components/profile/PlatformIcons";

const ACTIONS: { platform: PlatformKey; label: string }[] = [
  { platform: "whatsapp", label: "WhatsApp" },
  { platform: "email", label: "Email" },
  { platform: "website", label: "Website" },
  { platform: "instagram", label: "Instagram" },
  { platform: "linkedin", label: "LinkedIn" },
];

export default function ProfileDemo() {
  return (
    <section id="profile-demo" className="px-6 py-24 md:py-28">
      <div className="mx-auto flex w-full max-w-6xl flex-col items-center gap-12 md:flex-row md:justify-between md:gap-16">
        <div className="flex flex-col items-center gap-5 text-center md:items-start md:text-left">
          <span className="eyebrow">Demo Profile</span>
          <h2 className="font-display text-h2 text-text-primary max-w-md font-[600]">
            Your profile. Always ready to impress.
          </h2>
          <p className="text-text-secondary max-w-sm">
            This is a sample profile so you can see what your card opens — every Unitouch
            profile is fully editable after your card ships.
          </p>
          <Button variant="primary" size="lg" href="/order" className="mt-2">
            Your profile looks this good. Order Now →
          </Button>
        </div>

        <div className="w-full max-w-[300px] rounded-[2.2rem] border border-white/10 bg-bg-elevated p-2.5 shadow-[0_30px_80px_-32px_rgba(0,0,0,0.9),inset_0_1px_0_rgba(255,255,255,0.08)]">
          <div className="bg-bg-base flex flex-col items-center gap-4 rounded-[1.8rem] p-6 pt-10">
            <div className="bg-accent-purple/15 border-accent-purple/30 flex size-20 items-center justify-center rounded-full border text-2xl font-[700] text-accent-purple">
              RM
            </div>
            <div className="text-center">
              <p className="font-display text-text-primary font-[600]">Rohan Mehta</p>
              <p className="text-text-secondary text-sm">Creative Director, Studio North</p>
            </div>
            <div className="flex w-full flex-col gap-2">
              {ACTIONS.map(({ platform, label }) => (
                <div
                  key={label}
                  className="flex items-center gap-3 rounded-xl border border-white/[0.06] bg-white/[0.02] px-3 py-2.5"
                >
                  <PlatformBadge platform={platform} className="size-8" />
                  <span className="text-text-secondary text-sm">{label}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
