import type { ReactNode } from "react";
import { typeStyle } from "../tokens/type";
import { CSS_VARS } from "../tokens/color";

/**
 * Section — sub-region within a page, with kicker + headline.
 *
 * Used inside Panel for grouping related widgets. The visual signature
 * is calmer than PageHeader (smaller type scale, no full margin reset).
 */
export type SectionProps = {
  kicker?: string;
  headline?: string;
  description?: string;
  action?: ReactNode;
  children: ReactNode;
};

export function Section({ kicker, headline, description, action, children }: SectionProps) {
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
            {kicker ? (
              <p
                style={{
                  ...typeStyle("kicker"),
                  color: `var(${CSS_VARS.inkMuted})`,
                }}
              >
                {kicker}
              </p>
            ) : null}
            {headline ? (
              <h2
                style={{
                  ...typeStyle("headline"),
                  color: `var(${CSS_VARS.ink})`,
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
                  color: `var(${CSS_VARS.inkSoft})`,
                  marginTop: "0.25rem",
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
