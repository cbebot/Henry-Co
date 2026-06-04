"use client";

import { useState, useMemo } from "react";
import {
  visibleItems,
  ownerViewer,
  staffViewer,
  customerViewer,
  summarizeForOwner,
  prioritySort,
  moneyAtStake,
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
  PriorityBadge,
  PRIORITY_META,
  formatMoney,
} from "@henryco/command-surface";

type SessionKey = "owner" | "staff-mkt" | "staff-learn" | "customer";

const SESSIONS: { key: SessionKey; label: string }[] = [
  { key: "owner", label: "Owner" },
  { key: "staff-mkt", label: "Staff: Mkt" },
  { key: "staff-learn", label: "Staff: Learn" },
  { key: "customer", label: "Customer" },
];

function viewerFor(session: SessionKey) {
  if (session === "owner") return ownerViewer();
  if (session === "staff-mkt") return staffViewer(["marketplace" as StaffDivision]);
  if (session === "staff-learn") return staffViewer(["learn" as StaffDivision]);
  return customerViewer();
}

function sessionLabel(session: SessionKey): string {
  if (session === "owner") return "Owner (super_admin)";
  if (session === "staff-mkt") return "Staff (marketplace only)";
  if (session === "staff-learn") return "Staff (learn only)";
  return "Customer";
}

function DivisionRollup({ items }: { items: readonly AttentionItem[] }) {
  const summary = summarizeForOwner(items);
  if (summary.divisions.length === 0) return null;
  return (
    <div className="grid gap-2 sm:grid-cols-2 xl:grid-cols-3">
      {summary.divisions.map((d) => (
        <div
          key={d.division}
          className="rounded-[14px] border border-[var(--cc-line)] bg-[var(--cc-panel)] px-4 py-3"
        >
          <div className="flex items-center justify-between gap-2">
            <DivisionBadge division={d.division} />
            {d.critical > 0 ? <PriorityBadge priority="critical" /> : null}
          </div>
          <div className="mt-2.5 grid grid-cols-3 gap-2 text-xs">
            <div>
              <span className="block text-[11px] text-[var(--cc-faint)]">total</span>
              <span className="font-semibold tabular-nums text-[var(--cc-ink)]">{d.total}</span>
            </div>
            <div>
              <span className="block text-[11px] text-[var(--cc-faint)]">open</span>
              <span className="font-semibold tabular-nums text-[var(--cc-ink)]">{d.open}</span>
            </div>
            <div>
              <span className="block text-[11px] text-[var(--cc-faint)]">critical</span>
              <span
                className="font-semibold tabular-nums"
                style={{ color: d.critical > 0 ? "var(--cc-critical)" : "var(--cc-faint)" }}
              >
                {d.critical}
              </span>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}

function PriorityLegend({ items }: { items: readonly AttentionItem[] }) {
  const sorted = prioritySort(items);
  const counts: Record<string, number> = {};
  for (const item of sorted) counts[item.priority] = (counts[item.priority] ?? 0) + 1;
  return (
    <div className="flex flex-wrap gap-3">
      {(["critical", "high", "medium", "low"] as const).map((p) => {
        const meta = PRIORITY_META[p];
        const count = counts[p] ?? 0;
        return (
          <div
            key={p}
            className="inline-flex items-center gap-2 rounded-[9px] border px-3 py-1.5"
            style={{ borderColor: `${meta.color}44`, background: meta.soft }}
          >
            <span className="text-[13px] font-semibold tabular-nums" style={{ color: meta.color }}>
              {count}
            </span>
            <span className="text-[12px] text-[var(--cc-muted)]">{meta.label}</span>
          </div>
        );
      })}
    </div>
  );
}

export function CommandConsole({
  initialFeed,
  stagingHost,
}: {
  initialFeed: AttentionItem[];
  stagingHost: string;
}) {
  const [session, setSession] = useState<SessionKey>("owner");
  const viewer = useMemo(() => viewerFor(session), [session]);
  const seen = useMemo(() => visibleItems(viewer, initialFeed), [viewer, initialFeed]);
  const summary = summarizeForOwner(seen);
  const money = moneyAtStake(seen);
  const hasAccess = viewer.hasOwnerAccess;

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
      surfaceLabel="Command Center"
      title="Owner Command Center"
      descriptor="Every attention-item across all divisions, sorted by urgency, with money-at-stake context. The owner firehose. Staged against mocks — V3-COMMAND-02."
      stagingHost={stagingHost}
      switcher={switcher}
    >
      {!hasAccess ? (
        <NoAccess surfaceLabel="Owner Command Center" viewerLabel={sessionLabel(session)} />
      ) : (
        <div className="space-y-7">
          {/* Summary strip */}
          <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
            <MetricStat
              label="Total items"
              value={summary.total}
              sublabel={`${summary.open} open`}
              accent="var(--cc-ink)"
            />
            <MetricStat
              label="Critical"
              value={summary.byPriority.critical}
              sublabel="needs action now"
              accent={summary.byPriority.critical > 0 ? "var(--cc-critical)" : undefined}
            />
            <MetricStat
              label="Escalated"
              value={seen.filter((i) => i.status === "escalated").length}
              sublabel="staff → owner bump"
              accent="var(--cc-gold-text)"
            />
            <MetricStat
              label="Divisions active"
              value={summary.divisions.length}
              sublabel="reporting items"
            />
          </div>

          {/* Priority mix */}
          <section>
            <h2 className="mb-3 text-[12px] font-semibold uppercase tracking-[0.18em] text-[var(--cc-muted)]">
              Priority breakdown
            </h2>
            <PriorityLegend items={seen} />
          </section>

          {/* Money at stake */}
          {money.length > 0 ? (
            <section>
              <h2 className="mb-3 text-[12px] font-semibold uppercase tracking-[0.18em] text-[var(--cc-muted)]">
                Money at stake
              </h2>
              <div className="flex flex-wrap gap-3">
                {money.map(({ currency, amountMinor }) => (
                  <div
                    key={currency}
                    className="rounded-[12px] border border-[var(--cc-line-strong)] bg-[var(--cc-panel)] px-4 py-3"
                  >
                    <div className="text-[11px] text-[var(--cc-muted)]">{currency}</div>
                    <div
                      className="cc-display mt-0.5 text-[22px] tabular-nums text-[var(--cc-gold-text)]"
                    >
                      {formatMoney(amountMinor, currency)}
                    </div>
                  </div>
                ))}
              </div>
            </section>
          ) : null}

          {/* Division rollup */}
          <section>
            <h2 className="mb-3 text-[12px] font-semibold uppercase tracking-[0.18em] text-[var(--cc-muted)]">
              Division rollup
            </h2>
            <DivisionRollup items={seen} />
          </section>

          {/* The firehose */}
          <section>
            <div className="mb-3 flex items-baseline justify-between gap-3">
              <h2 className="text-[12px] font-semibold uppercase tracking-[0.18em] text-[var(--cc-muted)]">
                Attention feed · priority order
              </h2>
              <span className="text-[12px] tabular-nums text-[var(--cc-faint)]">
                {seen.length} item{seen.length !== 1 ? "s" : ""}
              </span>
            </div>
            <AttentionFeed items={seen} emptyHint="No open items across any division." />
          </section>
        </div>
      )}
    </ConsoleShell>
  );
}
