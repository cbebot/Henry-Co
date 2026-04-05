import { HenryCoActivityIndicator } from "@henryco/ui";

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
  kicker = "HenryCo Jobs",
  title = "Gathering this page for you",
  body = "We’re loading the latest jobs and updates. You can keep this tab open—nothing is wrong on your side.",
}: {
  kicker?: string;
  title?: string;
  body?: string;
}) {
  return (
    <div className="mx-auto flex min-h-[72vh] max-w-7xl items-center px-4 py-12 sm:px-6 lg:px-8">
      <div className="jobs-panel w-full rounded-[2.8rem] p-8 sm:p-10">
        <div className="flex flex-col items-center gap-3 sm:flex-row sm:items-start sm:gap-6">
          <HenryCoActivityIndicator
            className="text-[var(--jobs-accent)] dark:text-[var(--jobs-accent)]"
            label="Loading"
          />
          <div className="min-w-0 flex-1 text-center sm:text-left">
            <p className="jobs-kicker">{kicker}</p>
            <h1 className="mt-4 jobs-heading max-w-3xl">{title}</h1>
            <p className="mt-4 max-w-3xl text-sm leading-8 text-[var(--jobs-muted)]">{body}</p>
          </div>
        </div>
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
  kicker = "Loading",
  title = "Preparing your workspace.",
  body = "Loading applications, job postings, and activity.",
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
