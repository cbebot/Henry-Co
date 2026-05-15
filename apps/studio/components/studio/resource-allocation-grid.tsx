"use client";

import { useMemo } from "react";

import { getStudioCopy } from "@henryco/i18n";
import type { AppLocale } from "@henryco/i18n";

export type ResourceAllocationRow = {
  teamMemberId: string;
  teamMemberLabel: string;
  weekStarting: string;
  allocatedPct: number;
  projectId?: string | null;
  projectLabel?: string | null;
  roleLabel?: string | null;
};

export type ResourceAllocationGridProps = {
  rows: ResourceAllocationRow[];
  weekStartIsos: string[];
  locale?: AppLocale;
};

/**
 * V3 PASS 21 — <ResourceAllocationGrid>.
 *
 * Rows = team members. Columns = weeks. Cell = aggregated allocated %
 * across all projects for that (member, week). Cells above 100 % render
 * in warning tone; cells at exactly 100 % in accent-soft; cells below
 * in paper. Hovering surfaces the per-project breakdown via title.
 *
 * Driven by studio_resource_allocations (one row per
 * member × project × week).
 */
export function ResourceAllocationGrid({
  rows,
  weekStartIsos,
  locale = "en",
}: ResourceAllocationGridProps) {
  const copy = getStudioCopy(locale);

  type CellAgg = {
    total: number;
    breakdown: { label: string; pct: number }[];
  };

  const grid = useMemo(() => {
    const map = new Map<string, Map<string, CellAgg>>();
    for (const row of rows) {
      let week = map.get(row.teamMemberId);
      if (!week) {
        week = new Map();
        map.set(row.teamMemberId, week);
      }
      const cell = week.get(row.weekStarting) ?? { total: 0, breakdown: [] };
      cell.total += Number(row.allocatedPct);
      cell.breakdown.push({
        label: row.projectLabel || row.roleLabel || "—",
        pct: Number(row.allocatedPct),
      });
      week.set(row.weekStarting, cell);
    }
    return map;
  }, [rows]);

  const memberOrder = useMemo(() => {
    const labels = new Map<string, string>();
    for (const row of rows) labels.set(row.teamMemberId, row.teamMemberLabel);
    return [...labels.entries()].map(([id, label]) => ({ id, label }));
  }, [rows]);

  return (
    <section
      className="rounded-2xl border border-[color:var(--hc-line)] bg-[color:var(--hc-paper-elev)] p-5"
      data-testid="resource-allocation-grid"
    >
      <header className="mb-4">
        <p className="hc-kicker">{copy.pm.overviewTitle}</p>
        <h3 className="hc-heading-3 mt-1">{copy.pm.resourceAllocationTitle}</h3>
      </header>

      <div className="hc-scroll-x">
        <table className="min-w-full border-separate" style={{ borderSpacing: 0 }}>
          <thead>
            <tr>
              <th className="hc-label sticky left-0 z-10 bg-[color:var(--hc-paper-elev)] px-3 py-2 text-left">
                {copy.pm.resourceMemberColumn}
              </th>
              {weekStartIsos.map((iso) => {
                const date = new Date(iso);
                return (
                  <th
                    key={iso}
                    className="hc-label px-3 py-2 text-center text-[11px] font-semibold uppercase text-[color:var(--hc-ink-muted)]"
                  >
                    {date.toLocaleDateString(locale, { month: "short", day: "numeric" })}
                  </th>
                );
              })}
            </tr>
          </thead>
          <tbody>
            {memberOrder.map(({ id, label }) => (
              <tr key={id}>
                <th
                  scope="row"
                  className="hc-body sticky left-0 z-10 bg-[color:var(--hc-paper-elev)] px-3 py-2 text-left text-sm font-semibold text-[color:var(--hc-ink)]"
                >
                  {label}
                </th>
                {weekStartIsos.map((weekIso) => {
                  const cell = grid.get(id)?.get(weekIso);
                  const total = Math.round(cell?.total ?? 0);
                  const tone =
                    total > 100
                      ? "bg-[color:var(--hc-warning-soft)] text-[color:var(--hc-warning-text)]"
                      : total === 100
                        ? "bg-[color:var(--hc-accent-soft)] text-[color:var(--hc-accent-text)]"
                        : total > 0
                          ? "bg-[color:var(--hc-paper)] text-[color:var(--hc-ink)]"
                          : "bg-transparent text-[color:var(--hc-ink-muted)]";
                  const title = cell?.breakdown
                    .map((b) => `${b.label}: ${Math.round(b.pct)}%`)
                    .join(" · ");
                  return (
                    <td
                      key={`${id}-${weekIso}`}
                      className={`px-3 py-2 text-center text-xs ${tone}`}
                      title={title || `${total}%`}
                    >
                      {total > 0 ? `${total}%` : "—"}
                    </td>
                  );
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  );
}
