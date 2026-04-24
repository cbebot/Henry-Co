import { ArrowRight } from "lucide-react";
import type { ReactNode } from "react";
import { PublicButton } from "./public-button";
import { cn } from "../lib/cn";

/**
 * Shared premium CTA band.
 *
 * One confident headline, one supporting line, one primary CTA (optional
 * secondary). Stays calm on both themes — the only accent is a single amber
 * whisper in the top corner.
 */
export function PublicCTA({
  eyebrow = "Ready when you are",
  title,
  description,
  primary,
  secondary,
  footnote,
  className,
}: {
  eyebrow?: string;
  title: string;
  description: string;
  primary: { label: string; href: string };
  secondary?: { label: string; href: string };
  /** Optional fine-print line below the CTA buttons (e.g. trust note). */
  footnote?: ReactNode;
  className?: string;
}) {
  return (
    <section
      className={cn(
        "mx-auto mt-20 max-w-7xl px-5 sm:px-8 lg:px-10",
        className
      )}
    >
      <div className="relative overflow-hidden rounded-[2.25rem] border border-zinc-200/80 bg-white px-6 py-12 shadow-[0_28px_80px_-44px_rgba(15,23,42,0.32)] dark:border-white/10 dark:bg-[#0b1018]/85 dark:shadow-[0_34px_94px_rgba(0,0,0,0.6)] sm:px-10 sm:py-14 lg:px-14">
        <div
          aria-hidden
          className="pointer-events-none absolute -top-24 right-0 h-56 w-56 rounded-full bg-amber-400/15 blur-3xl dark:bg-amber-300/10"
        />

        <div className="relative flex flex-col gap-8 lg:flex-row lg:items-center lg:justify-between">
          <div className="max-w-2xl">
            {eyebrow ? (
              <div className="text-[11px] font-semibold uppercase tracking-[0.26em] text-amber-700 dark:text-amber-300/85">
                {eyebrow}
              </div>
            ) : null}
            <h3 className="mt-3 text-balance text-[1.85rem] font-black tracking-[-0.03em] text-zinc-950 dark:text-white sm:text-[2.125rem] leading-[1.1]">
              {title}
            </h3>
            <p className="mt-4 max-w-xl text-sm leading-7 text-zinc-600 dark:text-white/70 sm:text-base">
              {description}
            </p>
            {footnote ? (
              <p className="mt-4 text-xs leading-5 text-zinc-500 dark:text-white/55">
                {footnote}
              </p>
            ) : null}
          </div>

          <div className="flex flex-wrap gap-3">
            <PublicButton href={primary.href} size="lg">
              {primary.label}
              <ArrowRight className="h-5 w-5" />
            </PublicButton>

            {secondary ? (
              <PublicButton href={secondary.href} variant="secondary" size="lg">
                {secondary.label}
              </PublicButton>
            ) : null}
          </div>
        </div>
      </div>
    </section>
  );
}
