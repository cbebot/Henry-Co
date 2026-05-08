import type { ReactNode } from "react";
import type { StaffViewer } from "@henryco/auth/staff";
import type { DashboardOption } from "@henryco/auth";

import { typeStyle } from "../tokens/type";
import { CSS_VARS } from "../tokens/color";
import { RADIUS, SPACING } from "../tokens/spacing";
import { IdentityBar } from "./identity-bar";

/**
 * StaffShell — Track C (staff dashboard) chrome composition.
 *
 * Density-first treatment: queue-first WorkspaceRail with division
 * grouping, sticky filter strip, ContextDrawer same primitive but
 * loaded with staff-notifications + assigned-to-me + SLA-warning
 * fan-out.
 *
 * The shell is intentionally LIGHTER chrome than Track B's owner
 * dashboard (which can saturate with finance density) and TIGHTER
 * than Track A's customer dashboard (which must stay calm). The
 * goal: every queue row's SLA timer + division accent + assignee
 * is visible without scrolling.
 *
 * SHIPS WITH DASH-9.
 */

export type StaffShellProps = {
  viewer: StaffViewer;
  /** Role-switcher options — pass loadDashboardOptions(user) result. */
  roleOptions?: ReadonlyArray<DashboardOption>;
  /** Server action invoked when role switcher picks a lane. */
  onSelectRoleOption?: (key: DashboardOption["key"]) => void;
  /** Server action for sign-out. */
  onSignOut?: () => void;
  /** Optional notifications trigger slot — drawer host wires here. */
  notificationsTrigger?: ReactNode;
  /** Workspace rail (left) — host passes the composed rail with module entries. */
  rail: ReactNode;
  /** Context drawer (right) — host passes the staff-notifications/assigned-to-me/SLA-warning composition. */
  contextDrawer?: ReactNode;
  /** Optional filter strip — sticky below IdentityBar. */
  filterStrip?: ReactNode;
  /** Cheatsheet trigger — IdentityBar trailing slot. Caller decides what (button, modal, page link). */
  cheatsheetTrigger?: ReactNode;
  /** Trailing IdentityBar slot (theme toggle). */
  trailing?: ReactNode;
  /** Main content. */
  children: ReactNode;
};

export function StaffShell({
  viewer,
  roleOptions,
  onSelectRoleOption,
  onSignOut,
  notificationsTrigger,
  rail,
  contextDrawer,
  filterStrip,
  cheatsheetTrigger,
  trailing,
  children,
}: StaffShellProps) {
  return (
    <div
      style={{
        minHeight: "100vh",
        background: `var(${CSS_VARS.surfaceElevated})`,
        color: `var(${CSS_VARS.ink})`,
        display: "flex",
        flexDirection: "column",
      }}
    >
      <IdentityBar
        viewer={viewer}
        options={roleOptions}
        onSelectOption={onSelectRoleOption}
        onSignOut={onSignOut}
        notificationsTrigger={notificationsTrigger}
        trailing={
          <span style={{ display: "inline-flex", alignItems: "center", gap: "0.5rem" }}>
            {cheatsheetTrigger}
            {trailing}
          </span>
        }
      />
      {filterStrip ? (
        <div
          role="region"
          aria-label="Active filters"
          style={{
            position: "sticky",
            top: SPACING.chrome.identityBarHeight,
            zIndex: 80,
            padding: "0.5rem 1rem",
            background: `var(${CSS_VARS.surface})`,
            borderBottom: `1px solid var(${CSS_VARS.hairline})`,
          }}
        >
          {filterStrip}
        </div>
      ) : null}
      <div
        style={{
          flex: 1,
          minHeight: 0,
          display: "flex",
          alignItems: "stretch",
        }}
      >
        <aside
          aria-label="Track C workspace navigation"
          className="hc-staff-rail"
          style={{
            flexShrink: 0,
            width: SPACING.chrome.railWidth,
            borderRight: `1px solid var(${CSS_VARS.hairline})`,
            background: `var(${CSS_VARS.surface})`,
            padding: "1rem 0.75rem",
            display: "flex",
            flexDirection: "column",
            gap: "0.75rem",
            overflowY: "auto",
            position: "sticky",
            top: SPACING.chrome.identityBarHeight,
            maxHeight: `calc(100vh - ${SPACING.chrome.identityBarHeight})`,
          }}
        >
          {rail}
        </aside>
        <main
          style={{
            flex: 1,
            minWidth: 0,
            padding: "1.25rem",
            display: "flex",
            flexDirection: "column",
            gap: "1rem",
          }}
        >
          {children}
        </main>
        {contextDrawer ? (
          <aside
            aria-label="Track C context drawer"
            className="hc-staff-drawer"
            style={{
              flexShrink: 0,
              width: SPACING.chrome.drawerWidth,
              borderLeft: `1px solid var(${CSS_VARS.hairline})`,
              background: `var(${CSS_VARS.surface})`,
              padding: "1rem 0.875rem",
              overflowY: "auto",
              position: "sticky",
              top: SPACING.chrome.identityBarHeight,
              maxHeight: `calc(100vh - ${SPACING.chrome.identityBarHeight})`,
            }}
          >
            {contextDrawer}
          </aside>
        ) : null}
      </div>
    </div>
  );
}

/**
 * StaffWorkspaceRailGroup — division-grouped rail entry.
 *
 * The Track C rail groups module entries by division so a multi-
 * division operator (e.g. Care + Marketplace) sees clear separation
 * with division accent. Cross-division modules (staff-overview,
 * staff-support, staff-moderation, staff-finance-operator,
 * staff-settings) appear at the top in a separate "Org" group.
 */
export type StaffRailGroupProps = {
  label: string;
  /** Optional kicker accent. */
  accent?: string;
  children: ReactNode;
};

export function StaffRailGroup({ label, accent, children }: StaffRailGroupProps) {
  return (
    <div
      role="group"
      aria-label={label}
      style={{
        display: "flex",
        flexDirection: "column",
        gap: "0.25rem",
      }}
    >
      <p
        style={{
          ...typeStyle("kicker"),
          margin: 0,
          padding: "0 0.25rem",
          color: accent ?? `var(${CSS_VARS.inkMuted})`,
        }}
      >
        {label}
      </p>
      {children}
    </div>
  );
}

/**
 * StaffRailEntry — a single module row in the Track C rail.
 *
 * Each entry shows the module title + optional pending-count chip +
 * optional SLA-breach mini-dot. Click-active state is browser
 * default + the focused outline variant.
 */
export type StaffRailEntryProps = {
  href: string;
  label: string;
  /** Optional pending-count badge. */
  pendingCount?: number;
  /** Optional SLA-breach indicator (renders the small red dot). */
  slaBreach?: boolean;
  /** Optional active state — drives the active-row affordance. */
  active?: boolean;
  /** Optional accent color (division accent stripe). */
  accent?: string;
};

export function StaffRailEntry({
  href,
  label,
  pendingCount,
  slaBreach,
  active,
  accent,
}: StaffRailEntryProps) {
  return (
    <a
      href={href}
      aria-current={active ? "page" : undefined}
      style={{
        ...typeStyle("body"),
        textDecoration: "none",
        color: `var(${CSS_VARS.ink})`,
        padding: "0.4rem 0.5rem",
        borderRadius: RADIUS.sm,
        background: active
          ? `color-mix(in oklab, var(${CSS_VARS.accent}) 12%, var(${CSS_VARS.surface}))`
          : "transparent",
        display: "flex",
        alignItems: "center",
        gap: "0.5rem",
        position: "relative",
        minHeight: "2.25rem",
        outline: active ? `1px solid color-mix(in oklab, var(${CSS_VARS.accent}) 36%, var(${CSS_VARS.hairline}))` : undefined,
      }}
    >
      {accent ? (
        <span
          aria-hidden
          style={{
            position: "absolute",
            left: 0,
            top: "0.4rem",
            bottom: "0.4rem",
            width: "2px",
            background: accent,
            borderRadius: "2px",
          }}
        />
      ) : null}
      <span style={{ flex: 1, minWidth: 0, paddingLeft: accent ? "0.4rem" : 0 }}>{label}</span>
      {slaBreach ? (
        <span
          aria-label="SLA breach"
          style={{
            display: "inline-block",
            width: "0.5rem",
            height: "0.5rem",
            borderRadius: "9999px",
            background: "#B91C1C",
            boxShadow: "0 0 0 2px rgba(185,28,28,0.18)",
          }}
        />
      ) : null}
      {typeof pendingCount === "number" && pendingCount > 0 ? (
        <span
          style={{
            ...typeStyle("kicker"),
            display: "inline-flex",
            alignItems: "center",
            justifyContent: "center",
            minWidth: "1.5rem",
            height: "1.25rem",
            padding: "0 0.4rem",
            borderRadius: RADIUS.pill,
            background: `color-mix(in oklab, var(${CSS_VARS.accent}) 24%, var(${CSS_VARS.surface}))`,
            color: `var(${CSS_VARS.ink})`,
            fontVariantNumeric: "tabular-nums",
          }}
        >
          {pendingCount > 99 ? "99+" : pendingCount}
        </span>
      ) : null}
    </a>
  );
}
