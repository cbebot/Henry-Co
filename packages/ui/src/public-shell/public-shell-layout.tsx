import type { ReactNode } from "react";
import { cn } from "../lib/cn";

/**
 * Shared structural wrapper for all public HenryCo pages.
 * Provides min-height, background tokens, and children slots for
 * header, main content, and footer.
 */
export function PublicShellLayout({
  children,
  className,
}: {
  children: ReactNode;
  className?: string;
}) {
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
