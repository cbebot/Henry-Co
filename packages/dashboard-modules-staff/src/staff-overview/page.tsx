import type { StaffViewer } from "@henryco/auth/staff";
import {
  Panel,
  PageHeader,
  Section,
  MetricCard,
  Chip,
  EmptyState,
} from "@henryco/dashboard-shell/components";

import { STAFF_DIVISION_ACCENT, formatRelative } from "../shared";
import { loadStaffOverviewSnapshot } from "./data";

/**
 * staff-overview — server-rendered home page.
 *
 * Composition (top to bottom):
 *   1. PageHeader — kicker "Operator briefing", title "Track C overview".
 *   2. Metric tiles — assigned-to-me, escalations, divisions, recent.
 *      (anti-#18: counts paired with SLA context).
 *   3. Accessible divisions section — one tile per division the viewer
 *      has staff access in.
 *   4. Recent activity stream (audit_logs scoped by RLS).
 */

export type StaffOverviewPageProps = {
  viewer: StaffViewer;
  supabase: Parameters<typeof loadStaffOverviewSnapshot>[1];
};

export async function StaffOverviewPage({
  viewer,
  supabase,
}: StaffOverviewPageProps) {
  const snapshot = await loadStaffOverviewSnapshot(viewer, supabase);
  const divisionCount = viewer.staffMemberships.length;

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "1.25rem" }}>
      <PageHeader
        kicker="Operator briefing"
        title="Track C overview"
        description={
          divisionCount === 1
            ? `Single-division operator (${viewer.staffMemberships[0]?.division ?? "—"}) — focused queues only.`
            : `${divisionCount} divisions accessible — cross-division aggregation below.`
        }
      />

      <Section kicker="At a glance">
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fill, minmax(220px, 1fr))",
            gap: "0.75rem",
          }}
        >
          <MetricCard
            label="Assigned to me"
            value={String(snapshot.assignedToMe.pendingCount)}
            context={{
              kind: "comparison",
              vs:
                snapshot.assignedToMe.slaBreachCount > 0
                  ? "SLA breaches"
                  : snapshot.assignedToMe.slaWarningCount > 0
                    ? "SLA warnings"
                    : "all on track",
              delta:
                snapshot.assignedToMe.slaBreachCount > 0
                  ? `${snapshot.assignedToMe.slaBreachCount} breach`
                  : snapshot.assignedToMe.slaWarningCount > 0
                    ? `${snapshot.assignedToMe.slaWarningCount} warning`
                    : "0 issues",
            }}
          />
          <MetricCard
            label="Escalations"
            value={String(snapshot.escalations.pendingCount)}
            context={{
              kind: "comparison",
              vs: snapshot.escalations.pendingCount === 0 ? "none pending" : "open",
              delta:
                snapshot.escalations.slaBreachCount > 0
                  ? `${snapshot.escalations.slaBreachCount} breach`
                  : `${snapshot.escalations.slaWarningCount} warning`,
            }}
          />
          <MetricCard
            label="Divisions accessible"
            value={String(divisionCount)}
            context={{
              kind: "comparison",
              vs: divisionCount === 1 ? "focused" : "cross-division",
              delta: `${divisionCount} surface${divisionCount === 1 ? "" : "s"}`,
            }}
          />
          <MetricCard
            label="Recent activity"
            value={String(snapshot.recentActivity.length)}
            context={{
              kind: "trend",
              direction: snapshot.recentActivity.length > 0 ? "up" : "flat",
              magnitude: "last 20 audit events",
            }}
          />
        </div>
      </Section>

      <Section kicker="Accessible divisions">
        {snapshot.divisions.length === 0 ? (
          <EmptyState
            kicker="No divisions"
            headline="You don't have division-bound staff access yet."
            body="If this is unexpected, ask an admin to grant a division role membership."
            align="start"
          />
        ) : (
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fill, minmax(220px, 1fr))",
              gap: "0.75rem",
            }}
          >
            {snapshot.divisions.map((tile) => {
              const accent =
                STAFF_DIVISION_ACCENT[tile.division as keyof typeof STAFF_DIVISION_ACCENT] ??
                "#0A0A0A";
              return (
                <Panel
                  key={tile.division}
                  tone="raised"
                  aria-label={`${tile.division} division tile`}
                >
                  <div
                    style={{
                      display: "flex",
                      flexDirection: "column",
                      gap: "0.5rem",
                    }}
                  >
                    <div
                      style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}
                    >
                      <span
                        aria-hidden
                        style={{
                          width: "0.5rem",
                          height: "0.5rem",
                          borderRadius: "9999px",
                          background: accent,
                        }}
                      />
                      <span style={{ fontSize: "0.95rem", fontWeight: 600 }}>
                        {tile.division.charAt(0).toUpperCase() + tile.division.slice(1)}
                      </span>
                    </div>
                    <div
                      style={{ display: "flex", gap: "0.4rem", flexWrap: "wrap" }}
                    >
                      <Chip tone="neutral">{tile.pendingCount} pending</Chip>
                      {tile.slaBreachCount > 0 ? (
                        <Chip tone="urgent">{tile.slaBreachCount} breach</Chip>
                      ) : null}
                      {tile.slaWarningCount > 0 ? (
                        <Chip tone="warning">{tile.slaWarningCount} warning</Chip>
                      ) : null}
                    </div>
                    <a
                      href={`/modules/staff-${tile.division}`}
                      style={{
                        fontSize: "0.8rem",
                        color: "var(--hc-ink-soft, rgba(10,10,10,0.65))",
                      }}
                    >
                      Open queue →
                    </a>
                  </div>
                </Panel>
              );
            })}
          </div>
        )}
      </Section>

      <Section kicker="Recent operator activity">
        {snapshot.recentActivity.length === 0 ? (
          <EmptyState
            kicker="No activity yet"
            headline="No recent audit-log events visible to you."
            body="Audit events appear here when other operators take state-changing actions in your accessible divisions."
            align="start"
          />
        ) : (
          <Panel tone="flat" aria-label="Recent audit events">
            <ul
              style={{
                margin: 0,
                padding: 0,
                listStyle: "none",
                display: "flex",
                flexDirection: "column",
                gap: "0.4rem",
              }}
            >
              {snapshot.recentActivity.map((row) => (
                <li
                  key={row.id}
                  style={{
                    display: "grid",
                    gridTemplateColumns: "auto 1fr auto auto",
                    alignItems: "baseline",
                    gap: "0.5rem",
                    padding: "0.4rem 0",
                    borderBottom: "1px solid rgba(10,10,10,0.06)",
                  }}
                >
                  <span
                    style={{
                      fontSize: "0.7rem",
                      color: "rgba(10,10,10,0.45)",
                      fontVariantNumeric: "tabular-nums",
                    }}
                  >
                    {formatRelative(row.timestamp)}
                  </span>
                  <span style={{ fontSize: "0.85rem" }}>
                    <strong>{row.actor}</strong> · {row.action}
                  </span>
                  <span
                    style={{
                      fontSize: "0.7rem",
                      color: "rgba(10,10,10,0.55)",
                      textTransform: "uppercase",
                      letterSpacing: "0.1em",
                    }}
                  >
                    {row.entityType}
                  </span>
                  {row.division ? <Chip tone="neutral">{row.division}</Chip> : null}
                </li>
              ))}
            </ul>
          </Panel>
        )}
      </Section>
    </div>
  );
}
