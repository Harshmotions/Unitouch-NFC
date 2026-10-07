/* Skeleton shown instantly while a public profile renders on the server,
   shaped like PersonalProfile (photo hero, then name and details) so the page
   doesn't flash blank when someone taps a card. */
export default function ProfileLoading() {
  return (
    <main className="bg-bg-base min-h-screen" aria-busy="true" aria-label="Loading profile">
      <div className="lg:mx-auto lg:flex lg:min-h-screen lg:max-w-6xl">
        <div className="mx-auto w-full max-w-xl lg:mx-0 lg:w-1/2 lg:max-w-none">
          <div className="bg-white/[0.06] h-[52vh] max-h-[560px] w-full animate-pulse md:rounded-b-[2.5rem] lg:h-screen lg:max-h-none lg:rounded-none" />
        </div>
        <div className="mx-auto flex w-full max-w-xl animate-pulse flex-col gap-4 px-6 py-8 lg:w-1/2 lg:max-w-none lg:px-12 lg:py-20">
          <div className="bg-white/[0.06] h-8 w-2/3 rounded-lg" />
          <div className="bg-white/[0.06] h-4 w-1/3 rounded" />
          <div className="bg-white/[0.06] mt-4 h-4 w-full rounded" />
          <div className="bg-white/[0.06] h-4 w-5/6 rounded" />
          <div className="mt-6 grid grid-cols-2 gap-3">
            {[0, 1, 2, 3].map((i) => (
              <div key={i} className="bg-white/[0.06] h-14 rounded-2xl" />
            ))}
          </div>
        </div>
      </div>
    </main>
  );
}
