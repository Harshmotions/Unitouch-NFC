const LABELS = ["Founders", "Agencies", "Consultants", "Creatives", "Sales Teams", "Freelancers"];

export default function SocialProof() {
  return (
    <section className="border-y border-white/[0.06] px-6 py-10">
      <div className="mx-auto flex w-full max-w-6xl flex-wrap items-center justify-center gap-x-4 gap-y-2">
        <span className="text-text-muted text-xs font-[500] tracking-[0.2em] uppercase">
          Built for
        </span>
        {LABELS.map((label, i) => (
          <span key={label} className="flex items-center gap-4">
            {i > 0 && <span className="text-bg-border">·</span>}
            <span className="text-text-secondary text-sm">{label}</span>
          </span>
        ))}
      </div>
    </section>
  );
}
