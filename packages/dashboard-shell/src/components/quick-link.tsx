import type { ReactNode } from "react";
import { ChevronRight } from "lucide-react";
import { typeStyle } from "../tokens/type";
import { CSS_VARS } from "../tokens/color";
import { RADIUS, SPACING } from "../tokens/spacing";

/**
 * QuickLink — single-row deep-link with optional leading icon and
 * optional trailing meta (count, status, time).
 *
 * Used in the WorkspaceRail entries, WorkspaceSlot section action
 * lists, and "view all" surfaces.
 */
export type QuickLinkProps = {
  href: string;
  /** The visible label. */
  label: string;
  /** Optional kicker shown above the label. */
  kicker?: string;
  /** Leading icon. */
  icon?: ReactNode;
  /** Trailing meta — count, status, time, etc. */
  meta?: ReactNode;
  /** Visual intent. */
  tone?: "default" | "muted" | "accent";
};

export function QuickLink({
  href,
  label,
  kicker,
  icon,
  meta,
  tone = "default",
}: QuickLinkProps) {
  return (
    <a
      href={href}
      style={{
        display: "flex",
        alignItems: "center",
        gap: "0.75rem",
        padding: SPACING.inset.md,
        borderRadius: RADIUS.md,
        backgroundColor: "transparent",
        border: `1px solid var(${CSS_VARS.hairline})`,
        color: `var(${CSS_VARS.ink})`,
        textDecoration: "none",
        transition: "background-color 200ms ease-out",
      }}
    >
      {icon ? (
        <span
          aria-hidden
          style={{
            display: "inline-flex",
            color:
              tone === "accent"
                ? `var(${CSS_VARS.accentText})`
                : tone === "muted"
                  ? `var(${CSS_VARS.inkMuted})`
                  : `var(${CSS_VARS.ink})`,
          }}
        >
          {icon}
        </span>
      ) : null}
      <div style={{ flex: 1, minWidth: 0 }}>
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
            ...typeStyle("bodyStrong"),
            color: tone === "muted" ? `var(${CSS_VARS.inkSoft})` : `var(${CSS_VARS.ink})`,
            margin: 0,
            overflow: "hidden",
            textOverflow: "ellipsis",
            whiteSpace: "nowrap",
          }}
        >
          {label}
        </p>
      </div>
      {meta ? <span style={{ ...typeStyle("micro"), color: `var(${CSS_VARS.inkMuted})` }}>{meta}</span> : null}
      <ChevronRight size={14} aria-hidden style={{ color: `var(${CSS_VARS.inkMuted})` }} />
    </a>
  );
}
