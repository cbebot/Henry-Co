/**
 * V3-38 — graceful "not available here yet" block (S4). Never a dead end: the
 * host always passes a working CTA (usually `FindSimilarCta`) as children.
 * Copy-blind and token-only like the badge — localized strings and colour
 * classes arrive from the host; the resolved area name is already interpolated
 * into `body` by the caller (no area names live in components or copy files).
 */

import type { ReactNode } from "react";
import { cn } from "../lib/cn";

export interface UnavailableStateProps {
  /** Localized heading ("Not available here yet"). */
  title: string;
  /** Localized body with the viewer's own coarse area already interpolated. */
  body: string;
  /** Localized approximate-location disclosure, when the area was IP-inferred. */
  disclosure?: string;
  /** The escape hatch — typically `<FindSimilarCta />`. Required by contract. */
  children: ReactNode;
  className?: string;
  titleClassName?: string;
  bodyClassName?: string;
}

export function UnavailableState({
  title,
  body,
  disclosure,
  children,
  className,
  titleClassName,
  bodyClassName,
}: UnavailableStateProps) {
  return (
    <div data-availability="unavailable" role="note" className={cn("block", className)}>
      <p className={titleClassName}>{title}</p>
      <p className={bodyClassName}>
        {body}
        {disclosure ? <span className="sr-only"> {disclosure}</span> : null}
      </p>
      {children}
    </div>
  );
}
