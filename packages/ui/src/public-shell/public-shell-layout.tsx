import type { ReactNode } from "react";
import { cn } from "../lib/cn";

/**
 * Shared structural wrapper for all public HenryCo pages.
 * Provides min-height and background tokens. The skip-to-content
 * primitive is now baked into PublicHeader so any app rendering
 * PublicHeader gets WCAG 2.4.1 compliance automatically; this layout
 * stays minimal and presentation-only.
 *
 * `skipLinkLabel` is retained for API compatibility with existing
 * consumers but is ignored at runtime. Per-app shells should still
 * mount `<main id="henryco-main" tabIndex={-1}>` so the skip target
 * exists.
 */
export function PublicShellLayout({
  children,
  className,
  skipLinkLabel: _skipLinkLabel,
}: {
  children: ReactNode;
  className?: string;
  skipLinkLabel?: string;
}) {
  void _skipLinkLabel;
  return (
    <div
      className={cn(
        "min-h-screen bg-white text-zinc-950 dark:bg-[var(--site-bg,#050816)] dark:text-[var(--site-text,#ffffff)]",
        className
      )}
    >
      {children}
    </div>
  );
}
