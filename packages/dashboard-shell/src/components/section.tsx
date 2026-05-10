import type { ReactNode } from "react";
import { typeStyle } from "../tokens/type";
import { CSS_VARS } from "../tokens/color";

/**
 * Section — sub-region within a page, with kicker + headline.
 *
 * Used inside Panel for grouping related widgets. The visual signature
 * is calmer than PageHeader (smaller type scale, no full margin reset).
 *
 * V5-4: optional `divisionAccent` prop renders a 28×2 px rule above the
 * kicker, color-keyed to the dominant division of the section's content.
 * Falls back to the default gold accent. The rule sits in the global CSS
 * (`.hc-section-marker` in apps/account/app/globals.css) — hosts that
 * use this prop must mount that stylesheet.
 */
export type SectionDivisionAccent =
  | "hub"
  | "account"
  | "staff"
  | "care"
  | "marketplace"
  | "property"
  | "logistics"
  | "jobs"
  | "learn"
  | "studio"
  | "security"
  | "system";

export type SectionProps = {
  kicker?: string;
  headline?: string;
  description?: string;
  action?: ReactNode;
  /** Render an editorial division-accent rule above the kicker. */
  divisionAccent?: SectionDivisionAccent;
  children: ReactNode;
};

export function Section({
  kicker,
  headline,
  description,
  action,
  divisionAccent,
  children,
}: SectionProps) {
  return (
    <section style={{ marginBottom: "1.5rem" }}>
      {(kicker || headline || action) ? (
        <header
          style={{
            display: "flex",
            alignItems: "flex-end",
            justifyContent: "space-between",
            gap: "0.75rem",
            marginBottom: "0.75rem",
          }}
        >
          <div>
            {divisionAccent ? (
              <span
                aria-hidden
                className="hc-section-marker"
                style={{
                  ["--hc-section-accent" as string]: `var(--acct-div-${divisionAccent})`,
                }}
              />
            ) : null}
            {kicker ? (
              <p
                style={{
                  ...typeStyle("kicker"),
                  color: `var(${CSS_VARS.textTertiary})`,
                }}
              >
                {kicker}
              </p>
            ) : null}
            {headline ? (
              <h2
                style={{
                  ...typeStyle("h2"),
                  color: `var(${CSS_VARS.textPrimary})`,
                  margin: 0,
                  marginTop: kicker ? "0.25rem" : 0,
                }}
              >
                {headline}
              </h2>
            ) : null}
            {description ? (
              <p
                style={{
                  ...typeStyle("body"),
                  color: `var(${CSS_VARS.textSecondary})`,
                  marginTop: "0.375rem",
                  maxWidth: "65ch",
                }}
              >
                {description}
              </p>
            ) : null}
          </div>
          {action}
        </header>
      ) : null}
      {children}
    </section>
  );
}
