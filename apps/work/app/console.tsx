"use client";

import { useState, useMemo } from "react";
import {
  visibleItems,
  ownerViewer,
  staffViewer,
  customerViewer,
  summarizeForOwner,
  type AttentionItem,
  type StaffDivision,
} from "@henryco/command-contract";
import {
  ConsoleShell,
  AttentionFeed,
  MetricStat,
  NoAccess,
  SessionSwitcher,
  DivisionBadge,
} from "@henryco/command-surface";

type SessionKey = "staff-all" | "staff-mkt" | "staff-learn" | "staff-care" | "owner" | "customer";

const SESSIONS: { key: SessionKey; label: string }[] = [
  { key: "staff-all", label: "Staff (all)" },
  { key: "staff-mkt", label: "Staff: Mkt" },
  { key: "staff-learn", label: "Staff: Learn" },
  { key: "staff-care", label: "Staff: Care" },
  { key: "owner", label: "Owner" },
  { key: "customer", label: "Customer" },
];

const ALL_STAFF: StaffDivision[] = [
  "marketplace", "studio", "property", "learn", "logistics", "jobs", "care", "hub",
];

function viewerFor(session: SessionKey) {
  if (session === "staff-all") return staffViewer(ALL_STAFF);
  if (session === "staff-mkt") return staffViewer(["marketplace"]);
  if (session === "staff-learn") return staffViewer(["learn"]);
  if (session === "staff-care") return staffViewer(["care"]);
  if (session === "owner") return ownerViewer();
  return customerViewer();
}

function sessionDescription(session: SessionKey): string {
  if (session === "owner") return "Owner: you see all items (firehose mode).";
  if (session === "customer") return "Customer: access denied — use the session switcher.";
  if (session === "staff-all") return "All-division staff: operational queue across every division in your scope.";
  return "Single-division staff: operational queue for your division only. Other divisions are invisible.";
}

export function WorkConsole({
  initialFeed,
  stagingHost,
}: {
  initialFeed: AttentionItem[];
  stagingHost: string;
}) {
  const [session, setSession] = useState<SessionKey>("staff-all");
  const viewer = useMemo(() => viewerFor(session), [session]);
  const seen = useMemo(() => visibleItems(viewer, initialFeed), [viewer, initialFeed]);
  const summary = summarizeForOwner(seen);
  const hasAccess = viewer.hasOwnerAccess || viewer.hasStaffAccess;

  const switcher = (
    <SessionSwitcher
      value={session}
      options={SESSIONS}
      onChange={setSession}
      label="Mock session"
    />
  );

  return (
    <ConsoleShell
      surfaceLabel="Staff Workspace"
      title="Staff Workspace"
      descriptor={sessionDescription(session)}
      stagingHost={stagingHost}
      switcher={switcher}
    >
      {!hasAccess ? (
        <NoAccess surfaceLabel="Staff Workspace" viewerLabel="Customer" />
      ) : (
        <div className="space-y-7">
          {/* KPI row */}
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            <MetricStat
              label="Visible items"
              value={seen.length}
              sublabel={`${summary.open} open`}
            />
            <MetricStat
              label="Critical"
              value={summary.byPriority.critical}
              sublabel="immediate action"
              accent={summary.byPriority.critical > 0 ? "var(--cc-critical)" : undefined}
            />
            <MetricStat
              label="Escalated"
              value={seen.filter((i) => i.status === "escalated").length}
              sublabel="bumped to owner"
              accent="var(--cc-gold-text)"
            />
            <MetricStat
              label="Divisions in scope"
              value={summary.divisions.length}
              sublabel={viewer.hasOwnerAccess ? "owner firehose" : "your divisions"}
            />
          </div>

          {/* Division scope indicator */}
          {!viewer.hasOwnerAccess && viewer.staffDivisions.length > 0 ? (
            <div className="flex flex-wrap items-center gap-2 rounded-[var(--cc-radius)] border border-[var(--cc-line)] bg-[var(--cc-panel)] px-4 py-3">
              <span className="text-[11px] font-semibold uppercase tracking-[0.14em] text-[var(--cc-muted)] mr-1">
                Your scope
              </span>
              {viewer.staffDivisions.map((d) => (
                <DivisionBadge key={d} division={d as never} />
              ))}
              <span className="ml-auto text-[11px] text-[var(--cc-faint)]">
                {seen.filter((i) => i.surface === "both" || i.surface === "staff").length} staff/both items ·{" "}
                owner-only items invisible
              </span>
            </div>
          ) : null}

          <div className="grid gap-7 xl:grid-cols-[1fr_260px]">
            {/* Feed */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <h2 className="cc-display text-[18px] text-[var(--cc-ink)]">
                  Operational queue
                </h2>
                <span className="text-[12px] text-[var(--cc-faint)]">
                  {seen.length} item{seen.length !== 1 ? "s" : ""} · priority order
                </span>
              </div>
              <AttentionFeed
                items={seen}
                emptyHint={
                  viewer.hasOwnerAccess
                    ? "No items in the firehose."
                    : "No open staff items in your divisions. Switch session to see other scopes."
                }
              />
            </div>

            {/* Sidebar */}
            <aside className="space-y-4">
              {summary.divisions.length > 0 ? (
                <div className="rounded-[var(--cc-radius)] border border-[var(--cc-line)] bg-[var(--cc-panel)] p-4">
                  <h3 className="text-[11px] font-semibold uppercase tracking-[0.16em] text-[var(--cc-muted)]">
                    Active divisions
                  </h3>
                  <div className="mt-3 space-y-2">
                    {summary.divisions.map((d) => (
                      <div
                        key={d.division}
                        className="flex items-center justify-between text-[13px]"
                      >
                        <DivisionBadge division={d.division} />
                        <span className="tabular-nums text-[var(--cc-faint)]">
                          {d.open} open
                          {d.critical > 0 ? (
                            <span className="ml-1.5 text-[var(--cc-critical)]">
                              · {d.critical} crit
                            </span>
                          ) : null}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              ) : null}

              <div className="rounded-[var(--cc-radius)] border border-dashed border-[var(--cc-line)] p-4 text-[12px] leading-relaxed text-[var(--cc-faint)]">
                <p className="font-semibold text-[var(--cc-muted)]">Scoping (staged)</p>
                <p className="mt-1">
                  Staff see <code className="font-mono text-[11px]">staff</code> /
                  <code className="font-mono text-[11px]"> both</code> items only,
                  intersected with their division memberships.
                  Owner-only items are invisible to staff.
                </p>
                <p className="mt-2 font-mono text-[10px]">
                  V3-COMMAND-03: real is_staff_in() SQL predicate.
                </p>
              </div>
            </aside>
          </div>
        </div>
      )}
    </ConsoleShell>
  );
}