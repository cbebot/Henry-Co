import type { ReactNode } from "react";
import { typeStyle } from "../tokens/type";
import { CSS_VARS } from "../tokens/color";
import { RADIUS, SPACING } from "../tokens/spacing";
import { Chip } from "./chip";

/**
 * SignalCard — a single row in the Smart Home signal feed (DASH-4
 * consumes) and in the ContextDrawer notification list (DASH-6
 * consumes).
 *
 * Shape: kicker + title + body + meta row. Premium signature: hairline
 * border (no shadow), accent dot keyed off the source's division
 * accent, calm body type.
 *
 * `priority='security'` adds a left-edge accent strip and an `urgent`
 * chip; `priority='urgent'` does the same with `urgent` accent.
 */
export type SignalCardProps = {
  /** Short label for the signal source — e.g. division name. */
  kicker: string;
  /** Headline. */
  title: string;
  /** Optional body — one or two lines. */
  body?: string;
  /** Priority — drives the visual urgency. */
  priority?: "info" | "warning" | "urgent" | "security";
  /** Source accent color — typically the division accent. */
  accent?: string;
  /** Optional leading icon. */
  icon?: ReactNode;
  /** Optional timestamp — rendered in the meta row. */
  timestamp?: string;
  /** Optional action chip — rendered as a Chip in the meta row. */
  action?: { label: string; tone?: "accent" | "neutral" };
  /** Make the entire card a deep link. */
  href?: string;
  /** Optional onClick — preferred over href for action-on-click. */
  onClick?: () => void;
  /** Has the user already read/acknowledged this signal? */
  read?: boolean;
};

export function SignalCard({
  kicker,
  title,
  body,
  priority = "info",
  accent,
  icon,
  timestamp,
  action,
  href,
  onClick,
  read,
}: SignalCardProps) {
  const accentBar = priority === "security" || priority === "urgent" ? accent ?? "currentColor" : null;
  const baseStyle = {
    display: "block",
    position: "relative" as const,
    backgroundColor: read ? `var(${CSS_VARS.surface})` : `var(${CSS_VARS.surfaceElevated})`,
    border: `1px solid var(${CSS_VARS.hairline})`,
    borderRadius: RADIUS.lg,
    padding: SPACING.inset.lg,
    color: `var(${CSS_VARS.ink})`,
    textDecoration: "none",
    overflow: "hidden" as const,
  };

  const inner = (
    <>
      {accentBar ? (
        <span
          aria-hidden
          style={{
            position: "absolute",
            left: 0,
            top: 0,
            bottom: 0,
            width: "3px",
            backgroundColor: accentBar,
          }}
        />
      ) : null}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          gap: "0.5rem",
        }}
      >
        <p
          style={{
            ...typeStyle("kicker"),
            color: accent ?? `var(${CSS_VARS.accentText})`,
            margin: 0,
          }}
        >
          {kicker}
        </p>
        {priority === "security" || priority === "urgent" ? (
          <Chip tone={priority === "security" ? "urgent" : "warning"}>{priority}</Chip>
        ) : null}
      </div>
      <div style={{ display: "flex", alignItems: "flex-start", gap: "0.75rem", marginTop: "0.5rem" }}>
        {icon ? (
          <span aria-hidden style={{ color: accent ?? `var(${CSS_VARS.accentText})`, display: "inline-flex", marginTop: "0.1rem" }}>
            {icon}
          </span>
        ) : null}
        <div style={{ flex: 1, minWidth: 0 }}>
          <p
            style={{
              ...typeStyle("bodyStrong"),
              color: `var(${CSS_VARS.ink})`,
              margin: 0,
            }}
          >
            {title}
          </p>
          {body ? (
            <p
              style={{
                ...typeStyle("body"),
                color: `var(${CSS_VARS.inkSoft})`,
                marginTop: "0.25rem",
                marginBottom: 0,
              }}
            >
              {body}
            </p>
          ) : null}
        </div>
      </div>
      {timestamp || action ? (
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            gap: "0.5rem",
            marginTop: "0.5rem",
          }}
        >
          {timestamp ? (
            <p
              style={{
                ...typeStyle("micro"),
                color: `var(${CSS_VARS.inkMuted})`,
                margin: 0,
              }}
            >
              {timestamp}
            </p>
          ) : <span />}
          {action ? <Chip tone={action.tone ?? "neutral"}>{action.label}</Chip> : null}
        </div>
      ) : null}
    </>
  );

  if (href) {
    return (
      <a href={href} style={baseStyle}>
        {inner}
      </a>
    );
  }
  if (onClick) {
    return (
      <button
        type="button"
        onClick={onClick}
        style={{ ...baseStyle, textAlign: "left", cursor: "pointer" }}
      >
        {inner}
      </button>
    );
  }
  return <article style={baseStyle}>{inner}</article>;
}
