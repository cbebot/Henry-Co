import type { CSSProperties, ReactNode } from "react";
import { CSS_VARS } from "../tokens/color";
import { RADIUS, SPACING } from "../tokens/spacing";

/**
 * Panel — the canonical surface primitive.
 *
 * Replaces every `bg-white rounded-lg shadow` placeholder across the
 * shell. Closes anti-pattern #14 (default Tailwind/shadcn cards). Each
 * Panel uses HenryCo geometry: hairline border, subtle inset shadow,
 * 1.75rem (28px) corner radius matching V2-PAYMENT-UNIFICATION's
 * HenryCoHeroCard family.
 *
 * Does NOT default to `tone="raised"` — every consumer picks one of
 * three intents on purpose:
 *   - `flat` — no shadow, hairline border, sits in-flow
 *   - `raised` — soft shadow, lifted feel, primary content surface
 *   - `inset` — recessed, used for inline forms or quiet sections
 */
export type PanelProps = {
  tone: "flat" | "raised" | "inset";
  children: ReactNode;
  /** Adjust the corner radius. Defaults to `xl` (24px). */
  radius?: keyof typeof RADIUS;
  /** Adjust the inset padding. Defaults to `xl` (24px). */
  padding?: keyof typeof SPACING.inset;
  /** Pass-through className for layout-side concerns. */
  className?: string;
  /** Pass-through inline style. Merged AFTER token defaults. */
  style?: CSSProperties;
  /** Optional aria-label when the panel acts as a landmark. */
  "aria-label"?: string;
};

export function Panel({
  tone,
  children,
  radius = "xl",
  padding = "xl",
  className = "",
  style,
  ...rest
}: PanelProps) {
  const baseStyle: CSSProperties = {
    backgroundColor: tone === "inset"
      ? `var(${CSS_VARS.surfaceElevated})`
      : `var(${CSS_VARS.surface})`,
    borderRadius: RADIUS[radius],
    border: `1px solid var(${CSS_VARS.hairline})`,
    padding: SPACING.inset[padding],
    boxShadow: tone === "raised"
      ? "0 1px 2px rgba(0,0,0,0.04), 0 8px 24px rgba(0,0,0,0.04)"
      : tone === "inset"
        ? "inset 0 1px 0 rgba(0,0,0,0.02)"
        : "none",
    color: `var(${CSS_VARS.ink})`,
    ...style,
  };

  return (
    <section className={className} style={baseStyle} {...rest}>
      {children}
    </section>
  );
}
