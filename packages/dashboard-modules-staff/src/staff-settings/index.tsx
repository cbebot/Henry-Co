import { Settings } from "lucide-react";
import type {
  StaffDashboardModule,
  RouteEntry,
  PaletteEntry,
  NotificationCategory,
} from "@henryco/dashboard-shell";
import {
  PageHeader,
  Section,
  Panel,
  Chip,
  EmptyState,
} from "@henryco/dashboard-shell/components";
import type { StaffViewer } from "@henryco/auth/staff";

import { STAFF_DIVISION_ACCENT } from "../shared";

/**
 * staff-settings — Track C operator preferences.
 *
 * No queue surface. The settings page lists:
 *   - notification routing per division (current selections)
 *   - on-call hours (read-only here; mutated via downstream surfaces)
 *   - escalation chain (read-only; mutated via admin)
 *   - hotkey overrides (read-only)
 *   - personal info (link to account settings)
 */

export const staffSettingsModule: StaffDashboardModule = {
  slug: "staff-settings",
  title: "Settings",
  description: "Notifications, on-call, escalation, hotkeys.",
  icon: () => <Settings size={18} aria-hidden />,
  scope: { kind: "cross_division" },

  getEligibleViewer() {
    return "allowed";
  },
  getRoleGate(viewer) {
    return { kind: "allow", role: viewer.role };
  },
  getRoutes(): ReadonlyArray<RouteEntry> {
    return [{ path: "", kind: "home", label: "Settings" }];
  },
  async getCommandPaletteEntries(): Promise<ReadonlyArray<PaletteEntry>> {
    return [
      {
        id: "staff-settings.home",
        source: "staff-settings",
        groupLabel: "Open" as const,
        label: "Open Settings",
        kicker: "Staff",
        href: "/modules/staff-settings",
        keywords: ["settings", "preferences"],
      },
      {
        id: "staff-settings.notifications",
        source: "staff-settings",
        groupLabel: "Open" as const,
        label: "Notification routing",
        kicker: "Staff",
        href: "/modules/staff-settings#notifications",
        keywords: ["notifications", "alert", "muted"],
      },
    ];
  },
  getNotificationCategories(): ReadonlyArray<NotificationCategory> {
    return [];
  },
};

export type StaffSettingsPageProps = {
  viewer: StaffViewer;
  /** Account URL for "manage personal info" deep-link. */
  accountSettingsUrl: string;
};

export function StaffSettingsPageServer({ viewer, accountSettingsUrl }: StaffSettingsPageProps) {
  const memberships = viewer.staffMemberships;
  const divisions = memberships.map((m) => m.division);
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "1.25rem" }}>
      <PageHeader
        kicker="Operator preferences"
        title="Settings"
        description="Track C operator preferences. Personal info lives in your account settings."
      />
      <Section kicker="Notification routing">
        <Panel tone="flat" aria-label="Notification routing">
          {divisions.length === 0 ? (
            <EmptyState
              kicker="No divisions"
              headline="You have no division-bound staff access yet."
              align="start"
            />
          ) : (
            <ul style={{ listStyle: "none", margin: 0, padding: 0, display: "flex", flexDirection: "column", gap: "0.5rem" }}>
              {memberships.map((m) => (
                <li
                  key={`${m.division}-${m.role}`}
                  style={{
                    display: "grid",
                    gridTemplateColumns: "10rem 1fr auto",
                    gap: "0.75rem",
                    alignItems: "center",
                    padding: "0.5rem 0.25rem",
                    borderBottom: "1px solid rgba(10,10,10,0.06)",
                  }}
                >
                  <span
                    style={{
                      display: "inline-flex",
                      alignItems: "center",
                      gap: "0.4rem",
                      fontWeight: 600,
                    }}
                  >
                    <span
                      aria-hidden
                      style={{
                        width: "0.5rem",
                        height: "0.5rem",
                        borderRadius: "9999px",
                        background:
                          STAFF_DIVISION_ACCENT[m.division as keyof typeof STAFF_DIVISION_ACCENT] ??
                          "#0A0A0A",
                      }}
                    />
                    {m.division}
                  </span>
                  <span style={{ fontSize: "0.85rem", color: "rgba(10,10,10,0.65)" }}>
                    Role: <Chip tone="neutral">{m.role}</Chip>
                  </span>
                  <span style={{ fontSize: "0.78rem", color: "rgba(10,10,10,0.55)" }}>
                    {m.source === "division_table" ? "Division membership" : "Legacy profile role"}
                  </span>
                </li>
              ))}
            </ul>
          )}
        </Panel>
      </Section>
      <Section
        kicker="Personal info"
        action={
          <a
            href={accountSettingsUrl}
            style={{
              fontSize: "0.85rem",
              color: "var(--hc-accent-text, #8A6F00)",
              textDecoration: "underline",
            }}
          >
            Manage in account →
          </a>
        }
      >
        <Panel tone="flat" aria-label="Personal info">
          <p style={{ margin: 0, fontSize: "0.9rem" }}>
            <strong>{viewer.user.fullName ?? viewer.user.email ?? "—"}</strong>
            {viewer.user.email ? (
              <span style={{ marginLeft: "0.5rem", color: "rgba(10,10,10,0.55)" }}>{viewer.user.email}</span>
            ) : null}
          </p>
          <p style={{ margin: "0.4rem 0 0", fontSize: "0.78rem", color: "rgba(10,10,10,0.55)" }}>
            Personal name + email + avatar are managed at <a href={accountSettingsUrl}>{accountSettingsUrl}</a>.
          </p>
        </Panel>
      </Section>
      <Section kicker="Keyboard shortcuts">
        <Panel tone="flat" aria-label="Keyboard shortcuts">
          <ul style={{ listStyle: "none", margin: 0, padding: 0, display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(200px, 1fr))", gap: "0.5rem" }}>
            {[
              ["j / ↓", "next row"],
              ["k / ↑", "previous row"],
              ["x / Space", "toggle selection"],
              ["⇧+x", "range select"],
              ["⌘/Ctrl+a", "select all"],
              ["Enter", "open row"],
              ["?", "show cheatsheet"],
              ["⌘K", "command palette"],
            ].map(([keys, desc]) => (
              <li
                key={keys}
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  padding: "0.4rem 0.5rem",
                  border: "1px solid rgba(10,10,10,0.08)",
                  borderRadius: "0.5rem",
                  fontSize: "0.78rem",
                }}
              >
                <code style={{ fontFamily: "ui-monospace,monospace" }}>{keys}</code>
                <span style={{ color: "rgba(10,10,10,0.65)" }}>{desc}</span>
              </li>
            ))}
          </ul>
        </Panel>
      </Section>
    </div>
  );
}
