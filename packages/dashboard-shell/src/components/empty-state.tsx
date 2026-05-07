import type { ReactNode } from "react";
import { typeStyle } from "../tokens/type";
import { CSS_VARS } from "../tokens/color";

/**
 * EmptyState — typographic minimalism.
 *
 * Closes anti-pattern #16 (friendly cartoon empty-state illustrations).
 * Three slots only: kicker (optional), headline, single action. NO
 * image. NO illustration. NO "We're sorry, you have no items :(" copy.
 *
 * Voice: declarative, premium, calm. Body teaches what the surface
 * holds rather than apologising for the empty state. Default copy is
 * `// TODO V2-COPY-01` placeholder until the voice pass lands.
 */
export type EmptyStateProps = {
  kicker?: string;
  /** The headline — short, declarative. */
  headline: string;
  /** Optional body — 1-2 sentences. */
  body?: string;
  /** Optional single action. Multiple actions == complexity == anti-pattern. */
  action?: ReactNode;
  /** Center horizontally. Defaults to true. */
  align?: "center" | "start";
};

export function EmptyState({ kicker, headline, body, action, align = "center" }: EmptyStateProps) {
  const alignment = align === "center" ? "center" : "flex-start";
  const textAlign = align === "center" ? "center" : "left";
  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        alignItems: alignment,
        gap: "0.5rem",
        padding: "1.5rem",
        textAlign: textAlign as "center" | "left",
      }}
    >
      {kicker ? (
        <p
          style={{
            ...typeStyle("kicker"),
            color: `var(${CSS_VARS.inkMuted})`,
            margin: 0,
          }}
        >
          {kicker}
        </p>
      ) : null}
      <p
        style={{
          ...typeStyle("headline"),
          color: `var(${CSS_VARS.ink})`,
          margin: 0,
          maxWidth: "40ch",
        }}
      >
        {headline}
      </p>
      {body ? (
        <p
          style={{
            ...typeStyle("body"),
            color: `var(${CSS_VARS.inkSoft})`,
            margin: 0,
            maxWidth: "60ch",
          }}
        >
          {body}
        </p>
      ) : null}
      {action ? <div style={{ marginTop: "0.5rem" }}>{action}</div> : null}
    </div>
  );
}
