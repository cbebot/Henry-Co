import Link from "next/link";
import { cn } from "../lib/cn";

/**
 * Standardized empty/error state for public pages.
 * Consistent across all HenryCo public surfaces.
 */
export function PublicEmptyState({
  title,
  body,
  ctaHref,
  ctaLabel,
  tone = "default",
  className,
}: {
  title: string;
  body: string;
  ctaHref?: string;
  ctaLabel?: string;
  tone?: "default" | "onDark";
  className?: string;
}) {
  const onDark = tone === "onDark";
  return (
    <section
      className={cn(
        "mx-auto max-w-2xl rounded-[1.85rem] border p-8 text-center",
        onDark
          ? "border-white/10 bg-white/[0.04]"
          : "border-zinc-200/80 bg-zinc-50/90 dark:border-white/10 dark:bg-zinc-900/40",
        className
      )}
    >
      <p
        className={cn(
          "text-2xl font-semibold tracking-tight",
          onDark
            ? "text-white"
            : "text-zinc-900 dark:text-white"
        )}
      >
        {title}
      </p>
      <p
        className={cn(
          "mx-auto mt-3 max-w-lg text-sm leading-7",
          onDark
            ? "text-white/62"
            : "text-zinc-600 dark:text-white/60"
        )}
      >
        {body}
      </p>
      {ctaHref && ctaLabel ? (
        <Link
          href={ctaHref}
          className="mt-5 inline-flex items-center gap-2 rounded-full border border-amber-600/20 bg-amber-600 px-5 py-3 text-sm font-semibold text-white shadow-sm transition hover:bg-amber-700 dark:border-amber-400/30 dark:bg-amber-500 dark:text-zinc-950 dark:hover:bg-amber-400"
        >
          {ctaLabel}
        </Link>
      ) : null}
    </section>
  );
}

export function PublicErrorState({
  title = "Something went wrong",
  body = "We couldn\u2019t load this page. Please try again later or contact support.",
  ctaHref,
  ctaLabel,
  tone = "default",
  className,
}: {
  title?: string;
  body?: string;
  ctaHref?: string;
  ctaLabel?: string;
  tone?: "default" | "onDark";
  className?: string;
}) {
  return (
    <PublicEmptyState
      title={title}
      body={body}
      ctaHref={ctaHref}
      ctaLabel={ctaLabel}
      tone={tone}
      className={className}
    />
  );
}
