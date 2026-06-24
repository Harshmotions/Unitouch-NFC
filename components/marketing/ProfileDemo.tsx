import { Phone, Mail, Globe, Camera, Briefcase } from "lucide-react";
import Button from "@/components/ui/Button";

const ACTIONS = [
  { icon: Phone, label: "WhatsApp" },
  { icon: Mail, label: "Email" },
  { icon: Globe, label: "Website" },
  { icon: Camera, label: "Instagram" },
  { icon: Briefcase, label: "LinkedIn" },
];

export default function ProfileDemo() {
  return (
    <section id="profile-demo" className="px-6 py-24">
      <div className="mx-auto flex w-full max-w-6xl flex-col items-center gap-12 md:flex-row md:justify-between">
        <div className="flex flex-col items-center gap-4 text-center md:items-start md:text-left">
          <span className="text-accent-amber border-accent-amber/30 rounded-full border px-3 py-1 text-xs">
            Demo Profile
          </span>
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

        <div className="border-bg-border bg-bg-elevated w-full max-w-[300px] rounded-[2rem] border p-3 shadow-2xl">
          <div className="bg-bg-base flex flex-col items-center gap-4 rounded-[1.5rem] p-6 pt-10">
            <div className="bg-accent-amber/15 border-accent-amber/30 flex size-20 items-center justify-center rounded-full border text-2xl font-[700] text-accent-amber">
              RM
            </div>
            <div className="text-center">
              <p className="font-display text-text-primary font-[600]">Rohan Mehta</p>
              <p className="text-text-secondary text-sm">Creative Director, Studio North</p>
            </div>
            <div className="flex w-full flex-col gap-2">
              {ACTIONS.map(({ icon: Icon, label }) => (
                <div
                  key={label}
                  className="border-bg-border flex items-center gap-3 rounded-xl border px-4 py-3"
                >
                  <Icon className="text-accent-amber size-4" />
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
