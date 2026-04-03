import type { ReactNode } from "react";
import { cn } from "../lib/cn";

export function PublicSection({
  id,
  eyebrow,
  title,
  subtitle,
  children,
  className,
}: {
  id?: string;
  eyebrow?: string;
  title?: string;
  subtitle?: string;
  children: ReactNode;
  className?: string;
}) {
  return (
    <section id={id} className={cn("mx-auto max-w-7xl px-6 sm:px-8 lg:px-10", className)}>
      {(eyebrow || title || subtitle) && (
        <div className="mb-8 max-w-3xl">
          {eyebrow ? (
            <div className="text-xs font-semibold uppercase tracking-[0.18em] text-[#C9A227]">
              {eyebrow}
            </div>
          ) : null}
          {title ? (
            <h2 className="mt-3 text-3xl font-black tracking-[-0.03em] text-zinc-950 dark:text-white sm:text-4xl">
              {title}
            </h2>
          ) : null}
          {subtitle ? (
            <p className="mt-3 text-sm leading-7 text-zinc-600 dark:text-white/65 sm:text-base">
              {subtitle}
            </p>
          ) : null}
        </div>
      )}

      {children}
    </section>
  );
}