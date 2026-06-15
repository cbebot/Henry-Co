"use client";

import { useMemo, useState } from "react";

import {
  divisionPalette,
  formatKoboMajor,
  formatTxRelative,
  groupTransactionsByDay,
  txSign,
  txTone,
  type WalletTransaction,
} from "./helpers";

/**
 * StatementLedger — the wallet's statement, the way a bank shows one.
 *
 * Date-grouped (Today / Yesterday / dated), each row signed and carrying the
 * running balance the ledger recorded, with an All / In / Out filter. Display
 * only: it formats and filters server-fetched transactions, never computes
 * money. The filter is the single reason this is a client component.
 */
export type StatementLedgerCopy = {
  title: string;
  metaTemplate: string;
  filterAll: string;
  filterIn: string;
  filterOut: string;
  today: string;
  yesterday: string;
  runningLabel: string;
  emptyFiltered: string;
  ariaLabel: string;
  statusLabels: Record<string, string>;
};

type StatementLedgerProps = {
  transactions: ReadonlyArray<WalletTransaction>;
  copy: StatementLedgerCopy;
};

type Filter = "all" | "in" | "out";

const TONE_GLYPH: Record<string, string> = {
  credit: "↓",
  refund: "↺",
  bonus: "★",
  cashback: "%",
  debit: "↑",
  transfer: "⇄",
};

function statusLabel(copy: StatementLedgerCopy, status: string): string {
  if (!status) return "";
  if (copy.statusLabels[status]) return copy.statusLabels[status];
  return status.replaceAll("_", " ").replace(/^./, (c) => c.toUpperCase());
}

export function StatementLedger({ transactions, copy }: StatementLedgerProps) {
  const [filter, setFilter] = useState<Filter>("all");

  const filtered = useMemo(() => {
    if (filter === "all") return transactions;
    return transactions.filter((tx) => {
      const sign = txSign(tx.type);
      return filter === "in" ? sign === "credit" : sign === "debit";
    });
  }, [transactions, filter]);

  const groups = useMemo(() => groupTransactionsByDay(filtered), [filtered]);

  const filters: ReadonlyArray<{ key: Filter; label: string }> = [
    { key: "all", label: copy.filterAll },
    { key: "in", label: copy.filterIn },
    { key: "out", label: copy.filterOut },
  ];

  return (
    <section className="acct-wal__statement" aria-label={copy.ariaLabel}>
      <header className="acct-wal__statement-head">
        <div>
          <p className="acct-wal__panel-title">{copy.title}</p>
          <p className="acct-wal__panel-sub">
            {copy.metaTemplate.replaceAll("{count}", String(transactions.length))}
          </p>
        </div>
        <div className="acct-wal__statement-filters" role="tablist" aria-label={copy.ariaLabel}>
          {filters.map((f) => (
            <button
              key={f.key}
              type="button"
              role="tab"
              aria-selected={filter === f.key}
              className="acct-wal__statement-filter"
              data-active={filter === f.key ? "true" : "false"}
              onClick={() => setFilter(f.key)}
            >
              {f.label}
            </button>
          ))}
        </div>
      </header>

      {groups.length === 0 ? (
        <p className="acct-wal__statement-empty">{copy.emptyFiltered}</p>
      ) : (
        <div className="acct-wal__statement-body">
          {groups.map((group) => {
            const dayLabel =
              group.dayKind === "today"
                ? copy.today
                : group.dayKind === "yesterday"
                  ? copy.yesterday
                  : group.dateLabel;
            return (
              <div className="acct-wal__statement-group" key={group.key}>
                <p className="acct-wal__statement-day">{dayLabel}</p>
                <ul className="acct-wal__statement-rows">
                  {group.transactions.map((tx) => {
                    const tone = txTone(tx.type);
                    const sign = txSign(tx.type);
                    const division = divisionPalette(tx.division);
                    const prefix = sign === "credit" ? "+" : sign === "debit" ? "−" : "";
                    const status = statusLabel(copy, tx.status);
                    const running = Number(tx.balance_after_kobo);
                    return (
                      <li className="acct-wal__entry" key={tx.id}>
                        <span className="acct-wal__entry-icon" data-tone={tone} aria-hidden="true">
                          {TONE_GLYPH[tone] ?? "•"}
                        </span>
                        <span className="acct-wal__entry-meta">
                          <span className="acct-wal__entry-title">{tx.description}</span>
                          <span className="acct-wal__entry-sub">
                            <span>{formatTxRelative(tx.created_at)}</span>
                            {tx.division ? (
                              <span className="acct-wal__entry-tag">
                                <span
                                  className="acct-wal__entry-tag-dot"
                                  style={{ background: division.color }}
                                  aria-hidden="true"
                                />
                                {division.label}
                              </span>
                            ) : null}
                            {status ? (
                              <span className="acct-wal__entry-status">{status}</span>
                            ) : null}
                          </span>
                        </span>
                        <span className="acct-wal__entry-amounts">
                          <span className="acct-wal__entry-amount" data-sign={sign}>
                            {prefix}₦{formatKoboMajor(tx.amount_kobo)}
                          </span>
                          {Number.isFinite(running) ? (
                            <span className="acct-wal__entry-running">
                              <span className="acct-wal__entry-running-label">
                                {copy.runningLabel}
                              </span>{" "}
                              ₦{formatKoboMajor(running)}
                            </span>
                          ) : null}
                        </span>
                      </li>
                    );
                  })}
                </ul>
              </div>
            );
          })}
        </div>
      )}
    </section>
  );
}

export default StatementLedger;
