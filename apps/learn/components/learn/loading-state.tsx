import type { AppLocale } from "@henryco/i18n";
import { BrandMark } from "@/components/learn/ui";
import { cn } from "@/lib/utils";

/**
 * V3-05 — Learn loading-state primitives.
 *
 * Previously these surfaces painted theater hero copy like "Loading your
 * next academy view." and "Preparing Henry Onyx Learn" + body text as the
 * LOUDEST element on the loading screen. That fakes activity instead of
 * signalling shape.
 *
 * Refactored to render only the BrandMark + content-shaped skeleton
 * blocks. The `kicker` / `title` / `body` / `locale` props are kept on
 * the signature for back-compat with the existing call sites (learn
 * loading.tsx files), but ignored at the visible layer — the components
 * now signify "loading" with SHAPE, not language.
 */

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

export function LearnPageLoading(_props: {
  kicker?: string;
  title?: string;
  body?: string;
  locale?: AppLocale;
}) {
  return (
    <div
      className="mx-auto flex min-h-[70vh] max-w-[92rem] items-center px-5 py-16 sm:px-8 xl:px-10"
      role="status"
      aria-busy="true"
      aria-live="polite"
    >
      <div className="learn-panel learn-mesh w-full rounded-[2.8rem] p-8 sm:p-10 xl:p-12">
        <div className="flex flex-col gap-5 sm:flex-row sm:items-start">
          <BrandMark />
          <div className="max-w-3xl space-y-3">
            <LearnLoadingLine className="h-3 w-28" />
            <LearnLoadingLine className="h-10 w-3/4 max-w-2xl" />
            <LearnLoadingLine className="h-4 w-2/3 max-w-xl" />
          </div>
        </div>
        <div className="mt-8 grid gap-5 lg:grid-cols-3">
          <LearnLoadingCard />
          <LearnLoadingCard />
          <LearnLoadingCard />
        </div>
        <span className="sr-only">Loading content.</span>
      </div>
    </div>
  );
}

export function LearnWorkspaceLoading(_props: {
  kicker?: string;
  title?: string;
  body?: string;
  locale?: AppLocale;
}) {
  return (
    <div
      className="mx-auto grid max-w-[92rem] gap-6 px-5 py-8 sm:px-8 xl:grid-cols-[280px,1fr] xl:px-10"
      role="status"
      aria-busy="true"
      aria-live="polite"
    >
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
          <LearnLoadingLine className="h-3 w-24" />
          <LearnLoadingLine className="mt-4 h-10 w-3/4 max-w-2xl" />
          <LearnLoadingLine className="mt-3 h-4 w-2/3 max-w-xl" />
        </div>
        <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-4">
          <LearnLoadingCard />
          <LearnLoadingCard />
          <LearnLoadingCard />
          <LearnLoadingCard />
        </div>
        <LearnLoadingCard />
        <span className="sr-only">Loading content.</span>
      </main>
    </div>
  );
}
