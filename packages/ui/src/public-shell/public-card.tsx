import type { ReactNode, HTMLAttributes } from "react";
import Link from "next/link";
import { cn } from "../lib/cn";

type CardTone = "default" | "quiet" | "elevated" | "glass";

const TONE: Record<CardTone, string> = {
  default:
    "border border-zinc-200/80 bg-white dark:border-white/10 dark:bg-[#0b1018]/85",
  quiet:
    "border border-zinc-200/70 bg-zinc-50/70 dark:border-white/8 dark:bg-white/[0.03]",
  elevated:
    "border border-zinc-200/80 bg-white shadow-[0_22px_60px_-36px_rgba(15,23,42,0.36),0_8px_20px_rgba(15,23,42,0.06)] dark:border-white/10 dark:bg-[#0b1018]/90 dark:shadow-[0_30px_84px_rgba(0,0,0,0.6)]",
  glass:
    "border border-white/50 bg-white/75 shadow-[0_24px_72px_-36px_rgba(15,23,42,0.32)] backdrop-blur-xl supports-[backdrop-filter]:bg-white/55 dark:border-white/10 dark:bg-white/[0.05]",
};

const RADIUS = {
  md: "rounded-[1.5rem]",
  lg: "rounded-[1.75rem]",
  xl: "rounded-[1.95rem]",
} as const;

const INTERACTIVE =
  "transition duration-200 ease-out hover:-translate-y-0.5 hover:border-zinc-300 hover:shadow-[0_26px_64px_-32px_rgba(15,23,42,0.38),0_8px_18px_rgba(15,23,42,0.08)] motion-reduce:transition-none motion-reduce:hover:translate-y-0 dark:hover:border-white/15 dark:hover:bg-[#0b1018]/95";

const FOCUS_RING =
  "outline-none focus-visible:ring-2 focus-visible:ring-amber-500/55 focus-visible:ring-offset-2 focus-visible:ring-offset-white dark:focus-visible:ring-amber-400/50 dark:focus-visible:ring-offset-[#0a0f14]";

/**
 * Shared public card — the single surface primitive all divisions should use for
 * panel / tile / feature rows. Tones stay calm, dark mode avoids washed whites,
 * and interactive variants honour reduced motion.
 */
export function PublicCard({
  tone = "default",
  radius = "lg",
  interactive = false,
  href,
  as,
  padded = true,
  padding = "default",
  className,
  children,
  ...rest
}: {
  tone?: CardTone;
  radius?: keyof typeof RADIUS;
  interactive?: boolean;
  href?: string;
  as?: "section" | "article" | "div" | "li";
  padded?: boolean;
  padding?: "tight" | "default" | "roomy";
  className?: string;
  children: ReactNode;
} & Omit<HTMLAttributes<HTMLElement>, "children">) {
  const Padding =
    padded === false
      ? ""
      : padding === "tight"
        ? "p-5"
        : padding === "roomy"
          ? "p-7 sm:p-8 md:p-10"
          : "p-6 sm:p-7";

  const classes = cn(
    "relative",
    RADIUS[radius],
    TONE[tone],
    Padding,
    (interactive || href) && INTERACTIVE,
    href && FOCUS_RING,
    className
  );

  if (href) {
    return (
      <Link href={href} className={classes} {...(rest as HTMLAttributes<HTMLAnchorElement>)}>
        {children}
      </Link>
    );
  }

  const Tag = (as ?? "div") as "div";
  return (
    <Tag className={classes} {...(rest as HTMLAttributes<HTMLDivElement>)}>
      {children}
    </Tag>
  );
}

/**
 * Grid wrapper that keeps card rhythm consistent across divisions.
 * Prefer `columns={3}` for feature/value props, `columns={2}` for story
 * + CTA pairs, and `columns={4}` for compact trust rows.
 */
export function PublicCardGrid({
  columns = 3,
  gap = "default",
  className,
  children,
}: {
  columns?: 1 | 2 | 3 | 4;
  gap?: "tight" | "default" | "loose";
  className?: string;
  children: ReactNode;
}) {
  const colClass =
    columns === 1
      ? "grid-cols-1"
      : columns === 2
        ? "grid-cols-1 md:grid-cols-2"
        : columns === 4
          ? "grid-cols-1 sm:grid-cols-2 lg:grid-cols-4"
          : "grid-cols-1 sm:grid-cols-2 lg:grid-cols-3";
  const gapClass = gap === "tight" ? "gap-3 sm:gap-4" : gap === "loose" ? "gap-6 sm:gap-8" : "gap-4 sm:gap-5";
  return <div className={cn("grid", colClass, gapClass, className)}>{children}</div>;
}

/** Small branded header area inside a card (icon + title + optional eyebrow). */
export function PublicCardHeader({
  icon,
  eyebrow,
  title,
  subtitle,
  className,
}: {
  icon?: ReactNode;
  eyebrow?: string;
  title: string;
  subtitle?: string;
  className?: string;
}) {
  return (
    <div className={cn("flex items-start gap-4", className)}>
      {icon ? (
        <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-amber-500/10 text-amber-600 dark:bg-amber-400/10 dark:text-amber-300">
          {icon}
        </div>
      ) : null}
      <div className="min-w-0">
        {eyebrow ? (
          <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-amber-600/90 dark:text-amber-300/80">
            {eyebrow}
          </p>
        ) : null}
        <p className="text-base font-semibold tracking-[-0.01em] text-zinc-950 dark:text-white">
          {title}
        </p>
        {subtitle ? (
          <p className="mt-1 text-sm leading-6 text-zinc-600 dark:text-white/65">{subtitle}</p>
        ) : null}
      </div>
    </div>
  );
}
