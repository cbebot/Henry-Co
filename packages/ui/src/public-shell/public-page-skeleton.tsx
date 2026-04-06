import { cn } from "../lib/cn";

/**
 * Neutral skeleton placeholder for async public page content.
 * Renders card-shaped shimmer blocks in a grid — works in light and dark themes.
 */
export function PublicPageSkeleton({
  cards = 3,
  columns = 3,
  className,
}: {
  cards?: number;
  /** Grid columns at lg breakpoint */
  columns?: 2 | 3 | 4;
  className?: string;
}) {
  const colClass =
    columns === 4
      ? "lg:grid-cols-4"
      : columns === 2
        ? "lg:grid-cols-2"
        : "lg:grid-cols-3";

  return (
    <div
      className={cn(
        "mx-auto grid w-full max-w-7xl gap-5 px-4 pb-12 sm:px-6 lg:px-8",
        colClass,
        className
      )}
      aria-hidden
    >
      {Array.from({ length: cards }).map((_, i) => (
        <div
          key={i}
          className="space-y-4 rounded-[1.75rem] border border-zinc-200/90 bg-white/80 p-6 shadow-sm dark:border-white/10 dark:bg-zinc-900/50"
        >
          <div className="h-3 w-24 animate-pulse rounded-full bg-zinc-200 dark:bg-white/10" />
          <div className="h-8 w-2/3 animate-pulse rounded-full bg-zinc-200 dark:bg-white/10" />
          <div className="space-y-2 pt-2">
            <div className="h-2.5 w-full animate-pulse rounded-full bg-zinc-200 dark:bg-white/10" />
            <div className="h-2.5 w-[88%] animate-pulse rounded-full bg-zinc-200 dark:bg-white/10" />
            <div className="h-2.5 w-[72%] animate-pulse rounded-full bg-zinc-200 dark:bg-white/10" />
          </div>
        </div>
      ))}
    </div>
  );
}
