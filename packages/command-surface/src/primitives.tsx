import type { ReactNode } from "react";
import type {
  AttentionPriority,
  AttentionStatus,
  AttentionType,
  Division,
} from "@henryco/command-contract";
import {
  PRIORITY_META,
  STATUS_META,
  divisionAccent,
  divisionLabel,
  typeLabel,
} from "./format";

const badgeBase =
  "inline-flex items-center gap-1.5 rounded-full border px-2 py-[3px] text-[11px] font-semibold uppercase tracking-wide leading-none";

export function PriorityBadge({ priority }: { priority: AttentionPriority }) {
  const meta = PRIORITY_META[priority];
  return (
    <span className={badgeBase} style={{ color: meta.color, background: meta.soft, borderColor: `${meta.color}55` }}>
      <span className="h-1.5 w-1.5 rounded-full" style={{ background: meta.color }} aria-hidden />
      {meta.label}
    </span>
  );
}

export function DivisionBadge({ division }: { division: Division }) {
  return (
    <span className="inline-flex items-center gap-1.5 text-[11px] font-semibold text-[var(--cc-ink-soft)]">
      <span className="h-2 w-2 rounded-[3px]" style={{ background: divisionAccent(division) }} aria-hidden />
      {divisionLabel(division)}
    </span>
  );
}

export function TypeChip({ type }: { type: AttentionType }) {
  return (
    <span className="rounded-md border border-[var(--cc-line)] bg-[var(--cc-panel-2)] px-1.5 py-[2px] text-[10px] font-semibold uppercase tracking-wider text-[var(--cc-muted)]">
      {typeLabel(type)}
    </span>
  );
}

export function StatusChip({ status }: { status: AttentionStatus }) {
  const meta = STATUS_META[status];
  return (
    <span className="inline-flex items-center gap-1.5 text-[11px] font-medium" style={{ color: meta.color }}>
      <span className="h-1.5 w-1.5 rounded-full" style={{ background: meta.color }} aria-hidden />
      {meta.label}
    </span>
  );
}

export function MetricStat({
  label,
  value,
  sublabel,
  accent,
}: {
  label: string;
  value: ReactNode;
  sublabel?: string;
  accent?: string;
}) {
  return (
    <div className="rounded-[var(--cc-radius)] border border-[var(--cc-line)] bg-[var(--cc-panel)] px-4 py-3">
      <div className="text-[11px] font-semibold uppercase tracking-[0.14em] text-[var(--cc-muted)]">
        {label}
      </div>
      <div
        className="cc-display mt-1 text-[26px] leading-none tabular-nums"
        style={accent ? { color: accent } : undefined}
      >
        {value}
      </div>
      {sublabel ? <div className="mt-1 text-xs text-[var(--cc-faint)]">{sublabel}</div> : null}
    </div>
  );
}
