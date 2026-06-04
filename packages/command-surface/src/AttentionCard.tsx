import { ArrowUpRight } from "lucide-react";
import type { AttentionItem } from "@henryco/command-contract";
import { PRIORITY_META, clockLabel, divisionAccent, formatMoney } from "./format";
import { DivisionBadge, PriorityBadge, StatusChip, TypeChip } from "./primitives";

/**
 * One dense attention row: a priority stripe, the headline + summary, the
 * source division, type, money-at-stake, lifecycle status, and the single
 * action the operator takes (the deep link). Built for scanning, not reading.
 */
export function AttentionCard({ item }: { item: AttentionItem }) {
  const priority = PRIORITY_META[item.priority];
  const accent = divisionAccent(item.division);
  const money =
    item.amountMinor != null && item.currency
      ? formatMoney(item.amountMinor, item.currency)
      : null;

  return (
    <article
      className="group relative grid grid-cols-[3px_1fr_auto] overflow-hidden rounded-[var(--cc-radius)] border border-[var(--cc-line)] bg-[var(--cc-panel)] transition-colors hover:border-[var(--cc-line-strong)]"
      style={{ ["--row-accent" as string]: priority.color }}
    >
      <span aria-hidden className="block h-full" style={{ background: priority.color }} />

      <div className="min-w-0 px-4 py-3">
        <div className="flex flex-wrap items-center gap-x-2.5 gap-y-1.5">
          <PriorityBadge priority={item.priority} />
          <DivisionBadge division={item.division} />
          <TypeChip type={item.type} />
          {item.surface === "owner" ? (
            <span className="rounded-md px-1.5 py-[2px] text-[10px] font-semibold uppercase tracking-wider text-[var(--cc-gold-text)]">
              Owner
            </span>
          ) : null}
        </div>

        <h3 className="mt-2 truncate text-[15px] font-semibold text-[var(--cc-ink)]">
          {item.title}
        </h3>
        <p className="mt-1 line-clamp-2 text-[13px] leading-relaxed text-[var(--cc-muted)]">
          {item.summary}
        </p>

        <div className="mt-2.5 flex flex-wrap items-center gap-x-3 gap-y-1 text-[12px] text-[var(--cc-faint)]">
          <StatusChip status={item.status} />
          {money ? (
            <span className="font-semibold tabular-nums text-[var(--cc-ink-soft)]" style={{ color: accent }}>
              {money}
            </span>
          ) : null}
          <span className="tabular-nums">{clockLabel(item.createdAt)}</span>
          {item.source ? <span className="font-mono text-[11px] opacity-70">{item.source}</span> : null}
        </div>
      </div>

      <div className="flex items-center pr-3">
        <a
          href={item.deepLink}
          className="inline-flex items-center gap-1.5 whitespace-nowrap rounded-[var(--cc-radius-sm)] border border-[var(--cc-line-strong)] bg-[var(--cc-elevated)] px-3 py-2 text-[12px] font-semibold text-[var(--cc-ink-soft)] transition-colors hover:border-[var(--cc-gold)] hover:text-[var(--cc-gold-text)]"
        >
          {item.actionLabel}
          <ArrowUpRight className="h-3.5 w-3.5" aria-hidden />
        </a>
      </div>
    </article>
  );
}
