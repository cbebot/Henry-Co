import type { ReactNode } from "react";
import { cn } from "../lib/cn";

type SectionAlign = "left" | "center";
type SectionSpacing = "tight" | "default" | "loose" | "none";

/**
 * Premium shared section container.
 *
 * Provides consistent page rhythm across the ecosystem — one eyebrow, one
 * strong title, one calm lede, one content slab. Use for every marketing /
 * informational block to keep spacing and typography in lockstep.
 */
export function PublicSection({
  id,
  eyebrow,
  title,
  subtitle,
  children,
  className,
  headerClassName,
  align = "left",
  spacing = "default",
  actions,
}: {
  id?: string;
  eyebrow?: string;
  title?: string;
  subtitle?: string;
  children: ReactNode;
  className?: string;
  headerClassName?: string;
  align?: SectionAlign;
  spacing?: SectionSpacing;
  /** Optional CTA row rendered beside the heading on large screens. */
  actions?: ReactNode;
}) {
  const paddingY =
    spacing === "none"
      ? ""
      : spacing === "tight"
        ? "py-10 sm:py-14"
        : spacing === "loose"
          ? "py-16 sm:py-20 lg:py-24"
          : "py-12 sm:py-16 lg:py-20";

  const headerAlign = align === "center" ? "text-center" : "";
  const headerContainer = align === "center" ? "mx-auto max-w-2xl" : "max-w-2xl";

  return (
    <section
      id={id}
      className={cn(
        "mx-auto w-full max-w-7xl px-4 sm:px-6 lg:px-8",
        paddingY,
        className
      )}
    >
      {(eyebrow || title || subtitle || actions) && (
        <div
          className={cn(
            "mb-10",
            actions ? "flex flex-col gap-5 sm:flex-row sm:items-end sm:justify-between" : ""
          )}
        >
          <div className={cn(headerContainer, headerAlign, headerClassName)}>
            {eyebrow ? (
              <p className="text-[11px] font-semibold uppercase tracking-[0.24em] text-amber-700 dark:text-amber-300/85">
                {eyebrow}
              </p>
            ) : null}
            {title ? (
              <h2 className="mt-3 text-balance text-[1.75rem] font-black tracking-[-0.028em] text-zinc-950 dark:text-white sm:text-[2rem] md:text-[2.25rem] leading-[1.1]">
                {title}
              </h2>
            ) : null}
            {subtitle ? (
              <p className="mt-3 text-pretty text-sm leading-7 text-zinc-600 dark:text-white/65 sm:text-base">
                {subtitle}
              </p>
            ) : null}
          </div>
          {actions ? (
            <div className="flex flex-wrap gap-3 sm:shrink-0">{actions}</div>
          ) : null}
        </div>
      )}

      {children}
    </section>
  );
}
