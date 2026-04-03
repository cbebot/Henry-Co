function JobsLoadingLine({ className }: { className: string }) {
  return <div className={`animate-pulse rounded-full bg-[var(--jobs-line)]/80 ${className}`} />;
}

function JobsLoadingCard() {
  return (
    <div className="jobs-panel rounded-[2rem] p-6">
      <div className="flex items-start justify-between gap-4">
        <div className="space-y-3">
          <JobsLoadingLine className="h-3 w-24" />
          <JobsLoadingLine className="h-8 w-40" />
        </div>
        <div className="h-12 w-12 animate-pulse rounded-2xl bg-[var(--jobs-line)]/70" />
      </div>
      <div className="mt-5 space-y-3">
        <JobsLoadingLine className="h-3 w-full" />
        <JobsLoadingLine className="h-3 w-[86%]" />
        <JobsLoadingLine className="h-3 w-[68%]" />
      </div>
    </div>
  );
}

export function JobsPageLoading({
  kicker = "Preparing HenryCo Jobs",
  title = "Loading a calmer hiring surface.",
  body = "Pulling live jobs, verified employers, candidate context, and the latest hiring activity into place.",
}: {
  kicker?: string;
  title?: string;
  body?: string;
}) {
  return (
    <div className="mx-auto flex min-h-[72vh] max-w-7xl items-center px-4 py-12 sm:px-6 lg:px-8">
      <div className="jobs-panel w-full rounded-[2.8rem] p-8 sm:p-10">
        <p className="jobs-kicker">{kicker}</p>
        <h1 className="mt-4 jobs-heading max-w-3xl">{title}</h1>
        <p className="mt-4 max-w-3xl text-sm leading-8 text-[var(--jobs-muted)]">{body}</p>
        <div className="mt-8 grid gap-5 lg:grid-cols-3">
          <JobsLoadingCard />
          <JobsLoadingCard />
          <JobsLoadingCard />
        </div>
      </div>
    </div>
  );
}

export function JobsWorkspaceLoading({
  kicker = "Preparing your console",
  title = "Loading live hiring data.",
  body = "Bringing the latest applications, trust signals, queues, and account-linked activity into view.",
}: {
  kicker?: string;
  title?: string;
  body?: string;
}) {
  return (
    <div className="jobs-page px-4 py-4 sm:px-6 lg:px-8">
      <div className="mx-auto grid max-w-[1600px] gap-4 lg:grid-cols-[280px_minmax(0,1fr)_320px]">
        <aside className="jobs-panel rounded-[2rem] p-5">
          <div className="space-y-3 rounded-[1.7rem] bg-[var(--jobs-paper-soft)] p-4">
            <JobsLoadingLine className="h-3 w-24" />
            <JobsLoadingLine className="h-9 w-44" />
            <JobsLoadingLine className="h-3 w-full" />
            <JobsLoadingLine className="h-3 w-[82%]" />
          </div>
          <div className="mt-5 space-y-3">
            {Array.from({ length: 6 }).map((_, index) => (
              <div key={index} className="h-12 animate-pulse rounded-[1.1rem] bg-[var(--jobs-line)]/70" />
            ))}
          </div>
        </aside>
        <main className="space-y-4">
          <div className="jobs-panel rounded-[2rem] p-6 sm:p-7">
            <p className="jobs-kicker">{kicker}</p>
            <h2 className="mt-4 jobs-heading max-w-3xl">{title}</h2>
            <p className="mt-4 max-w-3xl text-sm leading-8 text-[var(--jobs-muted)]">{body}</p>
          </div>
          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
            <JobsLoadingCard />
            <JobsLoadingCard />
            <JobsLoadingCard />
            <JobsLoadingCard />
          </div>
          <JobsLoadingCard />
        </main>
        <aside className="space-y-4">
          <JobsLoadingCard />
          <JobsLoadingCard />
        </aside>
      </div>
    </div>
  );
}
