import { BrandMark } from "@/components/learn/ui";
import { cn } from "@/lib/utils";

function LearnLoadingLine({ className }: { className?: string }) {
  return <div className={cn("learn-skeleton rounded-full", className)} />;
}

function LearnLoadingCard() {
  return (
    <div className="learn-panel rounded-[2rem] p-6">
      <div className="flex items-start justify-between gap-4">
        <div className="space-y-3">
          <LearnLoadingLine className="h-3 w-28" />
          <LearnLoadingLine className="h-8 w-24" />
        </div>
        <div className="learn-skeleton h-12 w-12 rounded-2xl" />
      </div>
      <div className="mt-5 space-y-3">
        <LearnLoadingLine className="h-3 w-full" />
        <LearnLoadingLine className="h-3 w-[86%]" />
        <LearnLoadingLine className="h-3 w-[70%]" />
      </div>
    </div>
  );
}

export function LearnPageLoading({
  kicker = "Preparing HenryCo Learn",
  title = "Loading your next academy view.",
  body = "Pulling live academy records, structured paths, and polished learning surfaces into place.",
}: {
  kicker?: string;
  title?: string;
  body?: string;
}) {
  return (
    <div className="mx-auto flex min-h-[70vh] max-w-[92rem] items-center px-5 py-16 sm:px-8 xl:px-10">
      <div className="learn-panel learn-mesh w-full rounded-[2.8rem] p-8 sm:p-10 xl:p-12">
        <div className="flex flex-col gap-5 sm:flex-row sm:items-start">
          <BrandMark />
          <div className="max-w-3xl">
            <p className="learn-kicker">{kicker}</p>
            <h1 className="mt-4 text-4xl font-semibold tracking-[-0.05em] text-[var(--learn-ink)] sm:text-5xl">
              {title}
            </h1>
            <p className="mt-4 text-sm leading-8 text-[var(--learn-ink-soft)] sm:text-[15px]">{body}</p>
          </div>
        </div>
        <div className="mt-8 grid gap-5 lg:grid-cols-3">
          <LearnLoadingCard />
          <LearnLoadingCard />
          <LearnLoadingCard />
        </div>
      </div>
    </div>
  );
}

export function LearnWorkspaceLoading({
  kicker = "Preparing your academy",
  title = "Bringing your dashboard into view.",
  body = "Loading progress, enrollments, reminders, and the next actions that matter most.",
}: {
  kicker?: string;
  title?: string;
  body?: string;
}) {
  return (
    <div className="mx-auto grid max-w-[92rem] gap-6 px-5 py-8 sm:px-8 xl:grid-cols-[280px,1fr] xl:px-10">
      <aside className="learn-panel rounded-[2rem] p-4 xl:sticky xl:top-24 xl:self-start">
        <LearnLoadingLine className="h-3 w-24" />
        <LearnLoadingLine className="mt-5 h-8 w-40" />
        <div className="mt-6 space-y-3">
          {Array.from({ length: 6 }).map((_, index) => (
            <div key={index} className="learn-skeleton h-12 rounded-[1.35rem]" />
          ))}
        </div>
      </aside>
      <main className="space-y-6">
        <div className="learn-panel learn-mesh rounded-[2rem] p-7 sm:p-8">
          <div className="learn-kicker">{kicker}</div>
          <h2 className="mt-4 text-4xl font-semibold tracking-[-0.05em] text-[var(--learn-ink)]">{title}</h2>
          <p className="mt-3 max-w-3xl text-sm leading-8 text-[var(--learn-ink-soft)]">{body}</p>
        </div>
        <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-4">
          <LearnLoadingCard />
          <LearnLoadingCard />
          <LearnLoadingCard />
          <LearnLoadingCard />
        </div>
        <LearnLoadingCard />
      </main>
    </div>
  );
}
