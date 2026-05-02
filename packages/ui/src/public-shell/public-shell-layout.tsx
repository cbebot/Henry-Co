import type { ReactNode } from "react";
import { cn } from "../lib/cn";
import { SkipLink } from "../a11y/skip-link";

/**
 * Shared structural wrapper for all public HenryCo pages.
 * Provides min-height, background tokens, and children slots for
 * header, main content, and footer. Mounts a SkipLink that targets
 * id="henryco-main" — app shells should mount their main content as
 * <main id="henryco-main" tabIndex={-1}>.
 */
export function PublicShellLayout({
  children,
  className,
  skipLinkLabel,
}: {
  children: ReactNode;
  className?: string;
  skipLinkLabel?: string;
}) {
  return (
    <div
      className={cn(
        "min-h-screen bg-white text-zinc-950 dark:bg-[var(--site-bg,#050816)] dark:text-[var(--site-text,#ffffff)]",
        className
      )}
    >
      <SkipLink href="#henryco-main">{skipLinkLabel ?? "Skip to main content"}</SkipLink>
      {children}
    </div>
  );
}
