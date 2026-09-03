/**
 * V3-38 — the "see what is available near you" CTA (S4). A plain anchor so it
 * works under any router; the host passes an INTERNAL href (division catalog —
 * cross-division hrefs go through `henryDomain()` at the call site, never a
 * literal) plus the localized label, and may observe clicks via `onClick`
 * (the care host uses it for the `find_similar.clicked` beacon).
 */

import type { MouseEventHandler, ReactNode } from "react";
import { cn } from "../lib/cn";

export interface FindSimilarCtaProps {
  href: string;
  /** Localized CTA label, resolved by the host. */
  label: string;
  onClick?: MouseEventHandler<HTMLAnchorElement>;
  /** Optional trailing icon node (the host owns its icon set). */
  icon?: ReactNode;
  className?: string;
}

export function FindSimilarCta({ href, label, onClick, icon, className }: FindSimilarCtaProps) {
  return (
    <a
      href={href}
      onClick={onClick}
      data-availability-cta="find-similar"
      className={cn("inline-flex items-center gap-2", className)}
    >
      {label}
      {icon}
    </a>
  );
}
