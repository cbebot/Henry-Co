"use client";

import type { ReactNode } from "react";

export function SkipLink({
  // Default aligns with the canonical landmark id rendered by the shared public
  // shells (`<main id="henryco-main">`, see public-shell-layout.tsx). The prior
  // `#main` default never matched a rendered landmark, so a zero-prop SkipLink
  // pointed at a dead anchor (V3-06 anchor audit). Consumers may still override.
  href = "#henryco-main",
  children = "Skip to main content",
  className,
}: {
  href?: string;
  children?: ReactNode;
  className?: string;
}) {
  const base =
    "absolute left-4 top-4 z-[100] -translate-y-24 rounded-md bg-zinc-900 px-3 py-2 text-sm font-semibold text-white shadow-lg transition-transform focus-visible:translate-y-0 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-400 focus-visible:ring-offset-2";
  return (
    <a href={href} className={className ? `${base} ${className}` : base}>
      {children}
    </a>
  );
}
