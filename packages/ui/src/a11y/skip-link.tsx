"use client";

import type { ReactNode } from "react";

export function SkipLink({
  href = "#main",
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
