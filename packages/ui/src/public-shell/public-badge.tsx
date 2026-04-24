import type { ReactNode } from "react";
import { cn } from "../lib/cn";

type BadgeTone =
  | "neutral"
  | "accent"
  | "success"
  | "warning"
  | "danger"
  | "info"
  | "trust"
  | "outline";

type BadgeSize = "sm" | "md";

const TONE: Record<BadgeTone, string> = {
  neutral:
    "bg-zinc-100 text-zinc-700 ring-1 ring-inset ring-zinc-200/80 dark:bg-white/5 dark:text-white/75 dark:ring-white/10",
  accent:
    "bg-amber-500/10 text-amber-700 ring-1 ring-inset ring-amber-500/25 dark:bg-amber-400/10 dark:text-amber-300 dark:ring-amber-400/25",
  success:
    "bg-emerald-500/10 text-emerald-700 ring-1 ring-inset ring-emerald-500/25 dark:bg-emerald-400/10 dark:text-emerald-300 dark:ring-emerald-400/25",
  warning:
    "bg-amber-600/10 text-amber-700 ring-1 ring-inset ring-amber-600/25 dark:bg-amber-400/10 dark:text-amber-300 dark:ring-amber-400/25",
  danger:
    "bg-rose-500/10 text-rose-700 ring-1 ring-inset ring-rose-500/25 dark:bg-rose-400/10 dark:text-rose-300 dark:ring-rose-400/25",
  info:
    "bg-sky-500/10 text-sky-700 ring-1 ring-inset ring-sky-500/25 dark:bg-sky-400/10 dark:text-sky-300 dark:ring-sky-400/25",
  trust:
    "bg-gradient-to-r from-amber-500/12 via-amber-500/8 to-amber-500/12 text-amber-700 ring-1 ring-inset ring-amber-500/28 dark:from-amber-400/10 dark:via-amber-400/6 dark:to-amber-400/10 dark:text-amber-200 dark:ring-amber-400/30",
  outline:
    "text-zinc-700 ring-1 ring-inset ring-zinc-300/80 dark:text-white/75 dark:ring-white/15",
};

const SIZE: Record<BadgeSize, string> = {
  sm: "h-[22px] px-2 text-[11px] tracking-[0.05em]",
  md: "h-[26px] px-2.5 text-xs tracking-[0.05em]",
};

/**
 * PublicBadge — small, calm, premium. Use sparingly.
 *
 * Tones are semantic. `trust` is reserved for verification / compliance callouts
 * where HenryCo wants to signal credibility without shouting.
 */
export function PublicBadge({
  tone = "neutral",
  size = "md",
  icon,
  children,
  className,
  title,
}: {
  tone?: BadgeTone;
  size?: BadgeSize;
  icon?: ReactNode;
  children: ReactNode;
  className?: string;
  title?: string;
}) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full font-semibold whitespace-nowrap",
        SIZE[size],
        TONE[tone],
        className
      )}
      title={title}
    >
      {icon ? <span className="inline-flex shrink-0">{icon}</span> : null}
      {children}
    </span>
  );
}

/**
 * Compact dot indicator — e.g. "live", "pending", "draft".
 * Use alongside text rather than inside `PublicBadge` when space is tight.
 */
export function PublicStatusDot({
  tone = "accent",
  pulse = false,
  className,
}: {
  tone?: "accent" | "success" | "warning" | "danger" | "info" | "neutral";
  pulse?: boolean;
  className?: string;
}) {
  const map: Record<string, string> = {
    accent: "bg-amber-500 dark:bg-amber-300",
    success: "bg-emerald-500 dark:bg-emerald-400",
    warning: "bg-amber-600 dark:bg-amber-400",
    danger: "bg-rose-500 dark:bg-rose-400",
    info: "bg-sky-500 dark:bg-sky-400",
    neutral: "bg-zinc-400 dark:bg-white/40",
  };
  return (
    <span className={cn("relative inline-flex h-2 w-2 items-center justify-center", className)}>
      {pulse ? (
        <span
          aria-hidden
          className={cn(
            "absolute inset-0 rounded-full opacity-60 motion-reduce:hidden animate-ping",
            map[tone]
          )}
        />
      ) : null}
      <span className={cn("relative h-2 w-2 rounded-full", map[tone])} aria-hidden />
    </span>
  );
}
