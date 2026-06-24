const LABELS = ["Founders", "Agencies", "Consultants", "Creatives", "Sales Teams", "Freelancers"];

export default function SocialProof() {
  return (
    <section className="border-bg-border border-y px-6 py-8">
      <div className="mx-auto flex w-full max-w-6xl flex-wrap items-center justify-center gap-x-3 gap-y-2">
        <span className="text-text-muted text-xs tracking-wide uppercase">Built for</span>
        {LABELS.map((label, i) => (
          <span key={label} className="flex items-center gap-3">
            {i > 0 && <span className="text-bg-border">·</span>}
            <span className="text-text-secondary text-sm">{label}</span>
          </span>
        ))}
      </div>
    </section>
  );
}
