import type { ReactNode } from "react";
import { typeStyle } from "../tokens/type";
import { CSS_VARS } from "../tokens/color";
import { SPACING } from "../tokens/spacing";

/**
 * WorkspaceRail — left-side module navigation rail.
 *
 * DASH-1 ships the chrome — empty list. DASH-2 fills it with module
 * registry entries via `getEligibleModules(viewer)`.
 *
 * The rail is visually present at desktop breakpoints (≥1024px); on
 * mobile it collapses into the bottom action bar (DASH-7 ships).
 */
export type WorkspaceRailProps = {
  /** Optional rail content — populated by DASH-2 module entries. */
  children?: ReactNode;
  /** Optional kicker shown at the top of the rail. */
  label?: string;
};

export function WorkspaceRail({ children, label }: WorkspaceRailProps) {
  return (
    <nav
      aria-label="Workspace navigation"
      style={{
        flexShrink: 0,
        width: SPACING.chrome.railWidth,
        borderRight: `1px solid var(${CSS_VARS.hairline})`,
        backgroundColor: `var(${CSS_VARS.surface})`,
        padding: "1rem",
        display: "flex",
        flexDirection: "column",
        gap: "0.5rem",
        // Hide on small screens — DASH-7's BottomActionBar replaces.
      }}
      className="hc-workspace-rail"
    >
      {label ? (
        <p
          style={{
            ...typeStyle("kicker"),
            color: `var(${CSS_VARS.inkMuted})`,
            margin: 0,
            marginBottom: "0.5rem",
          }}
        >
          {label}
        </p>
      ) : null}
      {children ?? (
        <p
          style={{
            ...typeStyle("body"),
            color: `var(${CSS_VARS.inkMuted})`,
            margin: 0,
          }}
        >
          {/* DASH-2 fills module entries. */}
        </p>
      )}
    </nav>
  );
}
