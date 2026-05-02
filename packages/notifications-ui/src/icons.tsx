/**
 * HenryCo notification icon set — bespoke SVGs.
 *
 * All icons share a 24×24 viewBox, render via currentColor for stroke and
 * fill, and use a default stroke width of 1.5 that scales linearly with
 * the rendered size (16/20/24/32 px tested).
 *
 * Anti-pattern note: none of these are lucide-react bells/triangles/checks.
 * The rim chamfer on the bell, the apex cut on the warning triangle, the
 * keystone on security read as HenryCo, not generic SaaS.
 */

import { type SVGProps } from "react";

type IconProps = SVGProps<SVGSVGElement> & { size?: number };

function baseProps(size?: number): SVGProps<SVGSVGElement> {
  return {
    width: size ?? 20,
    height: size ?? 20,
    viewBox: "0 0 24 24",
    fill: "none",
    stroke: "currentColor",
    strokeWidth: 1.5,
    strokeLinecap: "round" as const,
    strokeLinejoin: "round" as const,
    "aria-hidden": true,
    focusable: false,
  };
}

export function HenryCoBell({ size, ...rest }: IconProps) {
  return (
    <svg {...baseProps(size)} {...rest}>
      <path d="M6 9.5C6 6.46 8.46 4 11.5 4h1A5.5 5.5 0 0 1 18 9.5v4.6c0 1.04.34 2.05.97 2.88L19.7 18H8" />
      <path d="M8 18l-3.7-1.02c.63-.83.97-1.84.97-2.88V12" />
      <path d="M11 4V2.8" />
      <path d="M13 4V2.8" />
      <path d="M10.5 20.4a2 2 0 0 0 3 0" />
    </svg>
  );
}

export function SeverityInfoIcon({ size, ...rest }: IconProps) {
  return (
    <svg {...baseProps(size)} {...rest}>
      <circle cx="12" cy="12" r="9" />
      <path d="M8 14h8" strokeWidth="2" />
    </svg>
  );
}

export function SeveritySuccessIcon({ size, ...rest }: IconProps) {
  return (
    <svg {...baseProps(size)} {...rest}>
      <rect x="3" y="3" width="18" height="18" rx="3" />
      <path d="M7.5 12.5 10 15l1-1 5.5-5.5" />
    </svg>
  );
}

export function SeverityWarningIcon({ size, ...rest }: IconProps) {
  return (
    <svg {...baseProps(size)} {...rest}>
      <path d="M11 4.2 4 19h16L13 4.2" />
      <path d="M11 4.2h2" />
      <path d="M12 10v4" />
      <circle cx="12" cy="16.5" r="0.6" fill="currentColor" stroke="none" />
    </svg>
  );
}

export function SeverityUrgentIcon({ size, ...rest }: IconProps) {
  return (
    <svg {...baseProps(size)} {...rest}>
      <path d="M12 3 4 9.5l3 9.5h10l3-9.5L12 3Z" />
      <path d="M12 9v4" />
      <circle cx="12" cy="15.5" r="0.7" fill="currentColor" stroke="none" />
    </svg>
  );
}

export function SeveritySecurityIcon({ size, ...rest }: IconProps) {
  return (
    <svg {...baseProps(size)} {...rest}>
      <path d="M8 4h8l2 16H6L8 4Z" />
      <path d="M9.5 11h5" />
      <path d="M12 11v5" />
    </svg>
  );
}

export function MarkReadIcon({ size, ...rest }: IconProps) {
  return (
    <svg {...baseProps(size)} {...rest}>
      <rect x="3" y="6" width="18" height="13" rx="2" />
      <path d="M3 8.5l9 5.5 9-5.5" />
    </svg>
  );
}

export function ArchiveIcon({ size, ...rest }: IconProps) {
  return (
    <svg {...baseProps(size)} {...rest}>
      <path d="M4 7h16v2H4z" />
      <path d="M5 9v10h14V9" />
      <path d="M10 13h4" />
    </svg>
  );
}

export function DeleteIcon({ size, ...rest }: IconProps) {
  return (
    <svg {...baseProps(size)} {...rest}>
      <path d="M4 6h16" />
      <path d="M9 6V4h6v2" />
      <path d="M6 6l1 14h10l1-14" />
      <path d="M10 11v5" />
      <path d="M14 11v5" />
    </svg>
  );
}

export function EmptyStateGlyph({ size, ...rest }: IconProps) {
  return (
    <svg {...baseProps(size ?? 56)} strokeWidth={1.25} {...rest}>
      <path d="M8 4h8l2 16H6L8 4Z" />
      <path d="M10 11h4" />
    </svg>
  );
}

/**
 * Restore icon — used in the recently-deleted page. A counterclockwise
 * arrow looping back into a card silhouette, reading as "return".
 */
export function RestoreIcon({ size, ...rest }: IconProps) {
  return (
    <svg {...baseProps(size)} {...rest}>
      <rect x="6" y="9" width="13" height="11" rx="2" />
      <path d="M9 9V6h7l3 3" />
      <path d="M3 13l2-2 2 2" />
      <path d="M5 11v3a4 4 0 0 0 4 4h1" />
    </svg>
  );
}

/**
 * Delete-forever icon — bin glyph with an inset cross. Distinct from the
 * regular Delete icon to flag the irreversibility.
 */
export function DeleteForeverIcon({ size, ...rest }: IconProps) {
  return (
    <svg {...baseProps(size)} {...rest}>
      <path d="M4 6h16" />
      <path d="M9 6V4h6v2" />
      <path d="M6 6l1 14h10l1-14" />
      <path d="M10 10l4 4" />
      <path d="M14 10l-4 4" />
    </svg>
  );
}
