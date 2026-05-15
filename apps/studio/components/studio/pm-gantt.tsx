"use client";

import { useMemo } from "react";

import { getStudioCopy } from "@henryco/i18n";
import type { AppLocale } from "@henryco/i18n";

export type GanttRow = {
  id: string;
  projectName: string;
  milestoneName: string;
  startsAt: string;
  endsAt: string;
  status: "planned" | "active" | "review" | "completed";
  ownerLabel?: string | null;
};

export type PMGanttProps = {
  rows: GanttRow[];
  windowStartIso?: string;
  windowDays?: number;
  locale?: AppLocale;
};

function clampToWindow(
  startIso: string,
  endIso: string,
  windowStart: number,
  windowEnd: number
): { startPct: number; widthPct: number } | null {
  const start = new Date(startIso).getTime();
  const end = new Date(endIso).getTime();
  if (Number.isNaN(start) || Number.isNaN(end)) return null;
  if (end <= windowStart) return null;
  if (start >= windowEnd) return null;
  const clampedStart = Math.max(start, windowStart);
  const clampedEnd = Math.min(end, windowEnd);
  const totalSpan = windowEnd - windowStart;
  const startPct = ((clampedStart - windowStart) / totalSpan) * 100;
  const widthPct = ((clampedEnd - clampedStart) / totalSpan) * 100;
  return { startPct, widthPct: Math.max(widthPct, 1.5) };
}

/**
 * V3 PASS 21 — <PMGantt>.
 *
 * Lightweight horizontal-bar Gantt for /pm/projects. CSS-driven; no
 * external chart library. Each row is a (project, milestone) pair with
 * startsAt / endsAt timestamps positioned within a window (default 8
 * weeks from windowStartIso). Mobile: per UNIFORMITY rules, callers
 * gate behind tablet-and-up; we still render here but show a tablet+
 * note via a media-query guard at the caller side.
 *
 * The status colour drives the bar fill via inline class variants. We
 * use accent-soft for active, ink-soft for planned, success for
 * completed, danger-soft for review.
 */
export function PMGantt({
  rows,
  windowStartIso,
  windowDays = 56,
  locale = "en",
}: PMGanttProps) {
  const copy = getStudioCopy(locale);
  const windowStart = useMemo(
    () => (windowStartIso ? new Date(windowStartIso).getTime() : Date.now()),
    [windowStartIso]
  );
  const windowEnd = useMemo(
    () => windowStart + windowDays * 24 * 60 * 60 * 1000,
    [windowStart, windowDays]
  );

  const weekTicks = useMemo(() => {
    const ticks: { label: string; pct: number }[] = [];
    const totalSpan = windowEnd - windowStart;
    for (let i = 0; i <= windowDays; i += 7) {
      const date = new Date(windowStart + i * 24 * 60 * 60 * 1000);
      const pct = ((i * 24 * 60 * 60 * 1000) / totalSpan) * 100;
      ticks.push({
        label: date.toLocaleDateString(locale, { month: "short", day: "numeric" }),
        pct,
      });
    }
    return ticks;
  }, [windowStart, windowEnd, windowDays, locale]);

  return (
    <section
      className="rounded-2xl border border-[color:var(--hc-line)] bg-[color:var(--hc-paper-elev)] p-5"
      data-testid="pm-gantt"
    >
      <header className="mb-4">
        <p className="hc-kicker">{copy.pm.overviewTitle}</p>
        <h3 className="hc-heading-3 mt-1">{copy.pm.ganttTitle}</h3>
      </header>

      <div className="relative pl-44">
        <div className="absolute inset-y-0 left-0 w-44 border-r border-[color:var(--hc-line)]" />
        <div className="relative h-6 border-b border-[color:var(--hc-line)] text-[10px] text-[color:var(--hc-ink-muted)]">
          {weekTicks.map((tick, idx) => (
            <span
              key={`${tick.label}-${idx}`}
              className="absolute -translate-x-1/2"
              style={{ left: `${tick.pct}%` }}
            >
              {tick.label}
            </span>
          ))}
        </div>

        <ul className="space-y-2 pt-3" role="list">
          {rows.map((row) => {
            const pos = clampToWindow(row.startsAt, row.endsAt, windowStart, windowEnd);
            const statusClass =
              row.status === "completed"
                ? "bg-[color:var(--hc-success-soft)]"
                : row.status === "active"
                  ? "bg-[color:var(--hc-accent-soft)]"
                  : row.status === "review"
                    ? "bg-[color:var(--hc-warning-soft)]"
                    : "bg-[color:var(--hc-paper)]";
            return (
              <li key={row.id} className="relative h-8">
                <div className="absolute -left-44 top-0 w-44 px-2 py-1">
                  <p className="hc-body truncate text-xs font-semibold text-[color:var(--hc-ink)]">
                    {row.projectName}
                  </p>
                  <p className="hc-body-muted truncate text-[10px]">{row.milestoneName}</p>
                </div>
                {pos ? (
                  <div
                    className={`absolute top-1 h-6 rounded-md border border-[color:var(--hc-line)] px-2 py-0.5 text-[10px] text-[color:var(--hc-ink)] ${statusClass}`}
                    style={{ left: `${pos.startPct}%`, width: `${pos.widthPct}%` }}
                    title={`${row.milestoneName} — ${row.status}${row.ownerLabel ? ` · ${row.ownerLabel}` : ""}`}
                  >
                    <span className="truncate">{row.milestoneName}</span>
                  </div>
                ) : (
                  <div className="absolute right-0 top-1 px-2 py-0.5 text-[10px] text-[color:var(--hc-ink-muted)]">
                    —
                  </div>
                )}
              </li>
            );
          })}
        </ul>
      </div>
    </section>
  );
}
