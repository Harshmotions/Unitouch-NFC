import ProgressNotice from "@/components/ui/ProgressNotice";

/* Shown instantly while /studio renders on the server (session check,
   claiming guest orders, loading profiles), so arriving from sign-in or the
   order success page never looks frozen. */
export default function StudioLoading() {
  return (
    <main className="bg-bg-base min-h-screen px-6 py-16">
      <div className="mx-auto w-full max-w-2xl">
        <h1 className="font-display text-h2 text-text-primary mb-2 font-[600]">Build your profile</h1>
        <p className="text-text-secondary mb-10">
          Add your details and links, preview it, then publish when you&apos;re ready.
        </p>
        <ProgressNotice title="Loading your profile…" hint="Fetching your order and profile details. This takes a few seconds." />
        <div className="mt-8 flex animate-pulse flex-col gap-6" aria-hidden>
          {[0, 1, 2, 3].map((i) => (
            <div key={i}>
              <div className="bg-white/[0.06] mb-2 h-3 w-24 rounded" />
              <div className="bg-white/[0.06] h-11 rounded-xl" />
            </div>
          ))}
        </div>
      </div>
    </main>
  );
}
