"use client";

import type { ReactNode } from "react";

function cn(...classes: Array<string | false | null | undefined>) {
  return classes.filter(Boolean).join(" ");
}

export function CareLoadingGlyph({
  className,
  size = "md",
}: {
  className?: string;
  size?: "sm" | "md" | "lg";
}) {
  const shellSize =
    size === "sm" ? "h-4 w-4" : size === "lg" ? "h-8 w-8" : "h-5 w-5";
  const dotSize =
    size === "sm" ? "h-1.5 w-1.5" : size === "lg" ? "h-2.5 w-2.5" : "h-2 w-2";

  return (
    <span
      aria-hidden="true"
      className={cn("relative inline-flex items-center justify-center", shellSize, className)}
    >
      <span className="absolute inset-0 rounded-full border border-current/18" />
      <span className="absolute inset-[2px] rounded-full border border-transparent border-t-current/80 border-r-current/35 animate-spin" />
      <span className={cn("rounded-full bg-current/80 shadow-[0_0_18px_currentColor]", dotSize)} />
    </span>
  );
}

export function CareLoadingPill({
  label,
  className,
}: {
  label: string;
  className?: string;
}) {
  return (
    <div
      role="status"
      aria-live="polite"
      className={cn(
        "inline-flex items-center gap-3 rounded-full border border-white/10 bg-[#091220]/78 px-4 py-2 text-sm font-medium text-white/78 shadow-[0_18px_48px_rgba(3,8,17,0.34)] backdrop-blur-xl",
        className
      )}
    >
      <CareLoadingGlyph size="sm" className="text-[color:var(--accent)]" />
      <span>{label}</span>
      <span className="flex items-center gap-1.5 text-[color:var(--accent)]/78">
        <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-current" />
        <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-current [animation-delay:120ms]" />
        <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-current [animation-delay:240ms]" />
      </span>
    </div>
  );
}

export function CareLoadingStage({
  eyebrow = "Henry & Co. Care",
  title = "Preparing your Care experience",
  description = "Pulling the latest booking, pricing, and support context so the next screen opens cleanly.",
  bullets,
  variant = "route",
  footer,
  className,
}: {
  eyebrow?: string;
  title?: string;
  description?: string;
  bullets?: string[];
  variant?: "route" | "panel";
  footer?: ReactNode;
  className?: string;
}) {
  const shellClass =
    variant === "panel"
      ? "rounded-[2rem] border border-white/10 bg-[#07111F]/88 px-6 py-7 shadow-[0_24px_80px_rgba(3,8,17,0.34)]"
      : "min-h-[56vh] rounded-[2.7rem] border border-white/10 bg-[#07111F]/90 px-7 py-10 shadow-[0_28px_120px_rgba(3,8,17,0.34)] sm:px-10 sm:py-12";

  return (
    <div
      role="status"
      aria-live="polite"
      aria-busy="true"
      className={cn("relative overflow-hidden text-white", shellClass, className)}
    >
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top,rgba(93,188,255,0.12),transparent_34%),radial-gradient(circle_at_bottom_right,rgba(116,96,255,0.12),transparent_28%),linear-gradient(180deg,rgba(255,255,255,0.03),rgba(255,255,255,0))]" />
      <div className="pointer-events-none absolute -left-14 top-8 h-40 w-40 rounded-full bg-[color:var(--accent)]/14 blur-3xl" />
      <div className="pointer-events-none absolute -right-10 bottom-0 h-44 w-44 rounded-full bg-cyan-300/10 blur-3xl" />

      <div className="relative mx-auto flex max-w-4xl flex-col gap-8">
        <div className="inline-flex w-fit items-center gap-3 rounded-full border border-white/10 bg-white/[0.05] px-4 py-2 text-[11px] font-semibold uppercase tracking-[0.24em] text-white/62">
          <span className="rounded-full bg-[color:var(--accent)]/12 px-2 py-1 text-[color:var(--accent)]">
            H&C
          </span>
          <span>{eyebrow}</span>
        </div>

        <div className="max-w-3xl">
          <div className="flex items-center gap-4">
            <div className="inline-flex h-14 w-14 items-center justify-center rounded-[1.35rem] border border-white/10 bg-white/[0.05] text-[color:var(--accent)] shadow-[inset_0_1px_0_rgba(255,255,255,0.06)]">
              <CareLoadingGlyph size="lg" />
            </div>
            <div className="h-px flex-1 bg-gradient-to-r from-[color:var(--accent)]/40 via-white/12 to-transparent" />
          </div>

          <h2 className="mt-6 text-balance text-3xl font-black tracking-[-0.05em] text-white sm:text-5xl">
            {title}
          </h2>
          <p className="mt-4 max-w-2xl text-sm leading-7 text-white/62 sm:text-base">
            {description}
          </p>
        </div>

        <div className="grid gap-3 sm:grid-cols-3">
          {(bullets && bullets.length > 0
            ? bullets
            : ["Loading your bookings", "Checking delivery status", "Preparing your dashboard"]
          ).map((item, index) => (
            <div
              key={`${item}-${index}`}
              className="rounded-[1.35rem] border border-white/10 bg-white/[0.04] px-4 py-4 text-sm font-medium text-white/74 shadow-[inset_0_1px_0_rgba(255,255,255,0.04)]"
            >
              <div className="flex items-center gap-3">
                <span className="inline-flex h-8 w-8 items-center justify-center rounded-full border border-white/10 bg-white/[0.05] text-[11px] font-semibold text-[color:var(--accent)]">
                  0{index + 1}
                </span>
                <span>{item}</span>
              </div>
              <div className="mt-3 h-1.5 overflow-hidden rounded-full bg-white/[0.06]">
                <div
                  className="h-full rounded-full bg-gradient-to-r from-[color:var(--accent)] via-cyan-200/80 to-white/72 animate-pulse"
                  style={{ width: `${72 - index * 10}%` }}
                />
              </div>
            </div>
          ))}
        </div>

        <div className="flex flex-wrap items-center justify-between gap-4 text-xs uppercase tracking-[0.18em] text-white/42">
          <span>Premium live workspace</span>
          {footer ? footer : <CareLoadingPill label="Finishing the handoff" className="text-[10px]" />}
        </div>
      </div>
    </div>
  );
}
