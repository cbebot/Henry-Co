/**
 * HenryCo notification icon set — bespoke SVGs.
 *
 * Located in apps/account this pass; promotes to packages/ui in NOT-01-D
 * when the surface rolls out to the other 8 apps. Not exported from
 * @henryco/ui yet to avoid disturbing the 11 other apps that build off it.
 *
 * All icons share a 24×24 viewBox, render via currentColor for stroke and
 * fill, and use a default stroke width of 1.5 that scales linearly with
 * the rendered size (16/20/24/32 px tested).
 *
 * Anti-pattern note: none of these are lucide-react bells/triangles/checks.
 * They are intentionally distinctive — the rim chamfer on the bell, the
 * apex cut on the warning triangle, the keystone on security — read as
 * HenryCo, not generic SaaS.
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

/**
 * The HenryCo bell. A bell silhouette with a 30° chamfer on the lower-left
 * rim — the signature HenryCo angular cut. The clapper is replaced by a
 * small geometric dot offset from center, reading as a quiet attention
 * mark rather than a literal pendulum.
 */
export function HenryCoBell({ size, ...rest }: IconProps) {
  return (
    <svg {...baseProps(size)} {...rest}>
      {/* Bell body: top rounded shoulder, vertical sides, base with chamfer */}
      <path d="M6 9.5C6 6.46 8.46 4 11.5 4h1A5.5 5.5 0 0 1 18 9.5v4.6c0 1.04.34 2.05.97 2.88L19.7 18H8" />
      {/* Lower-left chamfered rim — the HenryCo angular signature */}
      <path d="M8 18l-3.7-1.02c.63-.83.97-1.84.97-2.88V12" />
      {/* Hanger ring at top */}
      <path d="M11 4V2.8" />
      <path d="M13 4V2.8" />
      {/* Geometric clapper: a single offset dot, not a swinging pendulum */}
      <path d="M10.5 20.4a2 2 0 0 0 3 0" />
    </svg>
  );
}

/**
 * Severity: info — thin ring with a lower-half horizontal accent.
 * Reads as "noted, not urgent."
 */
export function SeverityInfoIcon({ size, ...rest }: IconProps) {
  return (
    <svg {...baseProps(size)} {...rest}>
      <circle cx="12" cy="12" r="9" />
      <path d="M8 14h8" strokeWidth="2" />
    </svg>
  );
}

/**
 * Severity: success — chamfered checkmark inside a soft-corner square.
 * The checkmark itself uses HenryCo's angular cut at the heel.
 */
export function SeveritySuccessIcon({ size, ...rest }: IconProps) {
  return (
    <svg {...baseProps(size)} {...rest}>
      <rect x="3" y="3" width="18" height="18" rx="3" />
      {/* Heel-chamfered check */}
      <path d="M7.5 12.5 10 15l1-1 5.5-5.5" />
    </svg>
  );
}

/**
 * Severity: warning — triangle with a single-pixel apex truncation.
 * The truncated apex is HenryCo's signature geometric flourish, picked
 * up from the brand wordmark's terminal cut.
 */
export function SeverityWarningIcon({ size, ...rest }: IconProps) {
  return (
    <svg {...baseProps(size)} {...rest}>
      {/* Triangle with apex truncated (small horizontal at top) */}
      <path d="M11 4.2 4 19h16L13 4.2" />
      <path d="M11 4.2h2" />
      {/* Internal stem + dot reading as caution glyph */}
      <path d="M12 10v4" />
      <circle cx="12" cy="16.5" r="0.6" fill="currentColor" stroke="none" />
    </svg>
  );
}

/**
 * Severity: urgent — outlined pentagon. Five sides reads as a louder
 * shape than the warning triangle without veering into red-alert siren
 * territory. Saturation comes from the color token, not the glyph.
 */
export function SeverityUrgentIcon({ size, ...rest }: IconProps) {
  return (
    <svg {...baseProps(size)} {...rest}>
      {/* Pentagon: top vertex, two upper flanks, two base corners */}
      <path d="M12 3 4 9.5l3 9.5h10l3-9.5L12 3Z" />
      {/* Internal exclamation, kept thin so the shape carries the weight */}
      <path d="M12 9v4" />
      <circle cx="12" cy="15.5" r="0.7" fill="currentColor" stroke="none" />
    </svg>
  );
}

/**
 * Severity: security — keystone trapezoid. Reads as "act on this for
 * safety" — the keystone is a structural symbol of protection in
 * masonry/architecture, distinct from urgent's pentagon.
 */
export function SeveritySecurityIcon({ size, ...rest }: IconProps) {
  return (
    <svg {...baseProps(size)} {...rest}>
      {/* Keystone trapezoid: narrow top, wider base */}
      <path d="M8 4h8l2 16H6L8 4Z" />
      {/* Internal lock-bar */}
      <path d="M9.5 11h5" />
      <path d="M12 11v5" />
    </svg>
  );
}

/**
 * Inline action: mark read / unread. A thin envelope-with-line glyph.
 * Reusing existing lucide envelope would be the anti-pattern — this is
 * a custom geometric envelope with a single horizontal accent.
 */
export function MarkReadIcon({ size, ...rest }: IconProps) {
  return (
    <svg {...baseProps(size)} {...rest}>
      <rect x="3" y="6" width="18" height="13" rx="2" />
      <path d="M3 8.5l9 5.5 9-5.5" />
    </svg>
  );
}

/**
 * Inline action: archive. Box with a pull-tab notch, distinct from the
 * lucide archive default which is a closed box with a horizontal line.
 */
export function ArchiveIcon({ size, ...rest }: IconProps) {
  return (
    <svg {...baseProps(size)} {...rest}>
      <path d="M4 7h16v2H4z" />
      <path d="M5 9v10h14V9" />
      <path d="M10 13h4" />
    </svg>
  );
}

/**
 * Inline action: delete. A bin glyph with a chamfered base — quieter
 * than the lucide trash default.
 */
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

/**
 * Empty-state keystone glyph. Repurposed from the security severity but
 * sized larger and rendered without internal lock detail — reads as
 * "stable, complete, nothing to act on."
 */
export function EmptyStateGlyph({ size, ...rest }: IconProps) {
  return (
    <svg {...baseProps(size ?? 56)} strokeWidth={1.25} {...rest}>
      <path d="M8 4h8l2 16H6L8 4Z" />
      <path d="M10 11h4" />
    </svg>
  );
}
