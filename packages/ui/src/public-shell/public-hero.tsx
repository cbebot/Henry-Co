import type { ReactNode } from "react";
import { cn } from "../lib/cn";

type HeroTone = "default" | "onDark" | "spotlight";
type HeroAlign = "left" | "center";

/**
 * Shared premium hero composition.
 *
 * Rules:
 *  - one eyebrow (optional, short, all caps)
 *  - one strong headline (short, confident, no startup-kit fluff)
 *  - one supporting line (one sentence, optional)
 *  - one or two calls-to-action (slot)
 *  - optional media slot on the right for split heroes
 *
 * Tones:
 *  - `default` — light page hero
 *  - `onDark` — division shell with navy / black background
 *  - `spotlight` — adds a calm radial spotlight behind the headline (for home heroes)
 */
export function PublicHero({
  eyebrow,
  title,
  subtitle,
  actions,
  media,
  meta,
  tone = "default",
  align = "left",
  className,
  innerClassName,
  id,
}: {
  eyebrow?: ReactNode;
  title: ReactNode;
  subtitle?: ReactNode;
  actions?: ReactNode;
  media?: ReactNode;
  /** small meta row above the title — trust badge or route location */
  meta?: ReactNode;
  tone?: HeroTone;
  align?: HeroAlign;
  className?: string;
  innerClassName?: string;
  id?: string;
}) {
  const onDark = tone === "onDark";
  const centered = align === "center";
  const hasMedia = Boolean(media);

  return (
    <section
      id={id}
      className={cn(
        "relative overflow-hidden",
        onDark ? "text-white" : "text-zinc-950 dark:text-white",
        className
      )}
    >
      {tone === "spotlight" ? (
        <div
          aria-hidden
          className="pointer-events-none absolute inset-0 -z-10 opacity-90 [background:radial-gradient(900px_circle_at_50%_-10%,rgba(201,162,39,0.16),transparent_55%),radial-gradient(700px_circle_at_20%_110%,rgba(201,162,39,0.08),transparent_60%)]"
        />
      ) : null}

      <div
        className={cn(
          "mx-auto w-full max-w-7xl px-5 pt-14 pb-14 sm:px-8 sm:pt-18 sm:pb-18 lg:px-10 lg:pt-24 lg:pb-24",
          innerClassName
        )}
      >
        <div
          className={cn(
            "grid gap-10 lg:items-center",
            hasMedia ? "lg:grid-cols-[1.1fr_0.9fr]" : "",
            centered && !hasMedia && "text-center"
          )}
        >
          <div
            className={cn(
              "max-w-2xl",
              centered && !hasMedia && "mx-auto"
            )}
          >
            {meta ? (
              <div className={cn("mb-5 flex flex-wrap items-center gap-2", centered && !hasMedia && "justify-center")}>
                {meta}
              </div>
            ) : null}
            {eyebrow ? (
              <p
                className={cn(
                  "text-[11px] font-semibold uppercase tracking-[0.26em]",
                  onDark ? "text-amber-300/85" : "text-amber-700 dark:text-amber-300/85"
                )}
              >
                {eyebrow}
              </p>
            ) : null}
            <h1
              className={cn(
                "mt-3 text-balance text-[2.1rem] font-black tracking-[-0.035em] sm:text-[2.75rem] md:text-[3.25rem] leading-[1.05]",
                onDark ? "text-white" : "text-zinc-950 dark:text-white"
              )}
            >
              {title}
            </h1>
            {subtitle ? (
              <p
                className={cn(
                  "mt-5 text-pretty max-w-xl text-base leading-8",
                  onDark ? "text-white/72" : "text-zinc-600 dark:text-white/70",
                  centered && !hasMedia && "mx-auto"
                )}
              >
                {subtitle}
              </p>
            ) : null}
            {actions ? (
              <div className={cn("mt-8 flex flex-wrap gap-3", centered && !hasMedia && "justify-center")}>
                {actions}
              </div>
            ) : null}
          </div>
          {media ? <div className="relative min-w-0">{media}</div> : null}
        </div>
      </div>
    </section>
  );
}

/** Hero CTA row helper — consistent gap and wrap behaviour. */
export function PublicHeroActions({
  children,
  className,
}: {
  children: ReactNode;
  className?: string;
}) {
  return (
    <div className={cn("flex flex-wrap items-center gap-3", className)}>{children}</div>
  );
}
