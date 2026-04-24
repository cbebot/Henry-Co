import Link from "next/link";
import type { ReactNode } from "react";
import { cn } from "../lib/cn";

/**
 * Standardized empty / error state for public pages.
 * Calm, premium, light+dark parity — shared across every HenryCo public surface.
 */
export function PublicEmptyState({
  icon,
  eyebrow,
  title,
  body,
  ctaHref,
  ctaLabel,
  secondaryCtaHref,
  secondaryCtaLabel,
  tone = "default",
  className,
  children,
}: {
  icon?: ReactNode;
  eyebrow?: string;
  title: string;
  body: string;
  ctaHref?: string;
  ctaLabel?: string;
  secondaryCtaHref?: string;
  secondaryCtaLabel?: string;
  tone?: "default" | "onDark";
  className?: string;
  children?: ReactNode;
}) {
  const onDark = tone === "onDark";
  return (
    <section
      className={cn(
        "mx-auto max-w-2xl rounded-[2rem] border px-6 py-10 text-center shadow-[0_20px_60px_-40px_rgba(15,23,42,0.32)]",
        onDark
          ? "border-white/10 bg-white/[0.04] text-white"
          : "border-zinc-200/80 bg-white/95 dark:border-white/10 dark:bg-[#0b1018]/80",
        className
      )}
    >
      {icon ? (
        <div
          className={cn(
            "mx-auto mb-4 inline-flex h-12 w-12 items-center justify-center rounded-2xl",
            onDark
              ? "bg-amber-400/12 text-amber-200"
              : "bg-amber-500/12 text-amber-700 dark:bg-amber-400/12 dark:text-amber-200"
          )}
        >
          {icon}
        </div>
      ) : null}
      {eyebrow ? (
        <p
          className={cn(
            "text-[11px] font-semibold uppercase tracking-[0.24em]",
            onDark ? "text-amber-300/85" : "text-amber-700 dark:text-amber-300/85"
          )}
        >
          {eyebrow}
        </p>
      ) : null}
      <p
        className={cn(
          "text-xl font-semibold tracking-[-0.015em]",
          eyebrow ? "mt-2" : "",
          onDark ? "text-white" : "text-zinc-900 dark:text-white"
        )}
      >
        {title}
      </p>
      <p
        className={cn(
          "mx-auto mt-3 max-w-lg text-sm leading-7",
          onDark ? "text-white/65" : "text-zinc-600 dark:text-white/65"
        )}
      >
        {body}
      </p>
      {(ctaHref && ctaLabel) || (secondaryCtaHref && secondaryCtaLabel) ? (
        <div className="mt-6 flex flex-wrap justify-center gap-3">
          {ctaHref && ctaLabel ? (
            <Link
              href={ctaHref}
              className="inline-flex items-center gap-2 rounded-full bg-amber-600 px-5 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-amber-700 dark:bg-amber-500 dark:text-zinc-950 dark:hover:bg-amber-400"
            >
              {ctaLabel}
            </Link>
          ) : null}
          {secondaryCtaHref && secondaryCtaLabel ? (
            <Link
              href={secondaryCtaHref}
              className={cn(
                "inline-flex items-center gap-2 rounded-full border px-5 py-2.5 text-sm font-semibold transition",
                onDark
                  ? "border-white/15 text-white hover:bg-white/5"
                  : "border-zinc-200 text-zinc-800 hover:bg-zinc-50 dark:border-white/15 dark:text-white dark:hover:bg-white/5"
              )}
            >
              {secondaryCtaLabel}
            </Link>
          ) : null}
        </div>
      ) : null}
      {children ? <div className="mt-6">{children}</div> : null}
    </section>
  );
}

export function PublicErrorState({
  title = "Something went wrong",
  body = "We couldn\u2019t load this page. Please try again or contact support if it continues.",
  ctaHref,
  ctaLabel,
  secondaryCtaHref,
  secondaryCtaLabel,
  tone = "default",
  className,
}: {
  title?: string;
  body?: string;
  ctaHref?: string;
  ctaLabel?: string;
  secondaryCtaHref?: string;
  secondaryCtaLabel?: string;
  tone?: "default" | "onDark";
  className?: string;
}) {
  return (
    <PublicEmptyState
      eyebrow="Temporary issue"
      title={title}
      body={body}
      ctaHref={ctaHref}
      ctaLabel={ctaLabel}
      secondaryCtaHref={secondaryCtaHref}
      secondaryCtaLabel={secondaryCtaLabel}
      tone={tone}
      className={className}
    />
  );
}
