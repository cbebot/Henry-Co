"use client";

import { useState, useMemo } from "react";
import {
  visibleItems,
  ownerViewer,
  staffViewer,
  customerViewer,
  canViewStaffWorkspace,
  type AttentionItem,
  type StaffDivision,
} from "@henryco/command-contract";
import {
  ConsoleShell,
  AttentionFeed,
  MetricStat,
  NoAccess,
  SessionSwitcher,
  PRIORITY_META,
} from "@henryco/command-surface";

type SessionKey = "staff-mkt" | "staff-learn" | "staff-multi" | "owner" | "customer";

const SESSIONS: { key: SessionKey; label: string }[] = [
  { key: "staff-mkt", label: "Staff: Mkt" },
  { key: "staff-learn", label: "Staff: Learn" },
  { key: "staff-multi", label: "Staff: Multi" },
  { key: "owner", label: "Owner" },
  { key: "customer", label: "Customer" },
];

function viewerFor(session: SessionKey) {
  if (session === "staff-mkt") return staffViewer(["marketplace" as StaffDivision]);
  if (session === "staff-learn") return staffViewer(["learn" as StaffDivision]);
  if (session === "staff-multi")
    return staffViewer(["marketplace", "learn", "logistics"] as StaffDivision[]);
  if (session === "owner") return ownerViewer();
  return customerViewer();
}

function sessionLabel(session: SessionKey): string {
  if (session === "staff-mkt") return "Staff (marketplace only)";
  if (session === "staff-learn") return "Staff (learn only)";
  if (session === "staff-multi") return "Staff (marketplace + learn + logistics)";
  if (session === "owner") return "Owner (super_admin — no staff access)";
  return "Customer";
}

function ScopeBanner({ session }: { session: SessionKey }) {
  const descriptions: Record<SessionKey, string> = {
    "staff-mkt": "This session holds is_staff_in('marketplace'). Sees marketplace staff/both items only.",
    "staff-learn": "This session holds is_staff_in('learn'). Sees learn staff/both items only.",
    "staff-multi": "This session holds is_staff_in(['marketplace','learn','logistics']). Union of all three.",
    owner:
      "Owner access (super_admin) is NOT a staff-workspace credential — the Staff Workspace gates on hasStaffAccess, not hasOwnerAccess.",
    customer:
      "A customer session has neither hasStaffAccess nor hasOwnerAccess. Sees nothing.",
  };
  return (
    <div className="rounded-[14px] border border-[var(--cc-line)] bg-[var(--cc-panel-2)] px-4 py-3 text-[13px] leading-relaxed text-[var(--cc-muted)]">
      <span className="font-semibold text-[var(--cc-ink-soft)]">Session scope: </span>
      {descriptions[session]}
    </div>
  );
}

export function WorkConsole({
  initialFeed,
  stagingHost,
}: {
  initialFeed: AttentionItem[];
  stagingHost: string;
}) {
  const [session, setSession] = useState<SessionKey>("staff-mkt");
  const viewer = useMemo(() => viewerFor(session), [session]);
  const hasAccess = canViewStaffWorkspace(viewer);
  const seen = useMemo(() => visibleItems(viewer, initialFeed), [viewer, initialFeed]);

  const byPriority: Record<string, number> = {};
  for (const item of seen) byPriority[item.priority] = (byPriority[item.priority] ?? 0) + 1;
  const openCount = seen.filter((i) => !["resolved", "dismissed"].includes(i.status)).length;

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
      descriptor="Operational items scoped to your staff divisions — staff/both items from each division you belong to. Owner-only signals are excluded. Staged against mocks — V3-COMMAND-02."
      stagingHost={stagingHost}
      switcher={switcher}
    >
      {!hasAccess ? (
        <NoAccess surfaceLabel="Staff Workspace" viewerLabel={sessionLabel(session)} />
      ) : (
        <div className="space-y-7">
          <ScopeBanner session={session} />

          {/* Summary strip */}
          <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
            <MetricStat
              label="Visible items"
              value={seen.length}
              sublabel={`${openCount} open`}
            />
            <MetricStat
              label="Critical"
              value={byPriority.critical ?? 0}
              sublabel="needs action now"
              accent={(byPriority.critical ?? 0) > 0 ? "var(--cc-critical)" : undefined}
            />
            <MetricStat
              label="Escalated"
              value={seen.filter((i) => i.status === "escalated").length}
              sublabel="bumped to owner"
              accent="var(--cc-gold-text)"
            />
            <MetricStat
              label="In progress"
              value={seen.filter((i) => i.status === "in_progress").length}
              sublabel="being worked"
              accent="var(--cc-medium)"
            />
          </div>

          {/* Priority mix for this scope */}
          <div className="flex flex-wrap gap-2.5">
            {(["critical", "high", "medium", "low"] as const).map((p) => {
              const meta = PRIORITY_META[p];
              const count = byPriority[p] ?? 0;
              return (
                <div
                  key={p}
                  className="inline-flex items-center gap-2 rounded-[9px] border px-3 py-1.5"
                  style={{ borderColor: `${meta.color}44`, background: meta.soft }}
                >
                  <span
                    className="text-[13px] font-semibold tabular-nums"
                    style={{ color: meta.color }}
                  >
                    {count}
                  </span>
                  <span className="text-[12px] text-[var(--cc-muted)]">{meta.label}</span>
                </div>
              );
            })}
          </div>

          {/* The scoped queue */}
          <section>
            <div className="mb-3 flex items-baseline justify-between gap-3">
              <h2 className="text-[12px] font-semibold uppercase tracking-[0.18em] text-[var(--cc-muted)]">
                Your queue · priority order
              </h2>
              <span className="text-[12px] tabular-nums text-[var(--cc-faint)]">
                {seen.length} item{seen.length !== 1 ? "s" : ""}
              </span>
            </div>
            <AttentionFeed
              items={seen}
              emptyHint="Nothing in your divisions needs attention right now."
            />
          </section>
        </div>
      )}
    </ConsoleShell>
  );
}
