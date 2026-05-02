"use client";

import { useMemo, useState } from "react";
import { Filter, FilterX } from "lucide-react";
import { DownloadDocumentButton } from "./DownloadDocumentButton";

/**
 * Filter chips for the transaction history page. Filter selections are
 * carried into the PDF export via query params, so the downloaded document
 * always reflects the on-screen view.
 *
 * On-screen filtering is intentionally light here — the meaningful work is
 * teaching users that "what you see is what you download." The same
 * filter spec re-runs server-side in /api/documents/transaction-history.
 */

const TYPES = ["payment", "wallet_credit", "wallet_debit", "refund", "withdrawal", "fee"];
const STATUSES = ["completed", "pending", "failed", "refunded"];

type Props = {
  availableDivisions: string[];
};

export function ActivityFiltersClient({ availableDivisions }: Props) {
  const [from, setFrom] = useState("");
  const [to, setTo] = useState("");
  const [divisions, setDivisions] = useState<Set<string>>(new Set());
  const [types, setTypes] = useState<Set<string>>(new Set());
  const [statuses, setStatuses] = useState<Set<string>>(new Set());
  const [amountFrom, setAmountFrom] = useState("");
  const [amountTo, setAmountTo] = useState("");

  const reset = () => {
    setFrom("");
    setTo("");
    setDivisions(new Set());
    setTypes(new Set());
    setStatuses(new Set());
    setAmountFrom("");
    setAmountTo("");
  };

  const endpoint = useMemo(() => {
    const params = new URLSearchParams();
    if (from) params.set("from", new Date(from).toISOString());
    if (to) params.set("to", new Date(to).toISOString());
    if (divisions.size) params.set("division", Array.from(divisions).join(","));
    if (types.size) params.set("type", Array.from(types).join(","));
    if (statuses.size) params.set("status", Array.from(statuses).join(","));
    if (amountFrom) params.set("amountFrom", String(Number(amountFrom) * 100));
    if (amountTo) params.set("amountTo", String(Number(amountTo) * 100));
    const qs = params.toString();
    return `/api/documents/transaction-history/me${qs ? `?${qs}` : ""}`;
  }, [from, to, divisions, types, statuses, amountFrom, amountTo]);

  const toggle = (set: Set<string>, setSet: (next: Set<string>) => void, value: string) => () => {
    const next = new Set(set);
    if (next.has(value)) next.delete(value);
    else next.add(value);
    setSet(next);
  };

  return (
    <section className="acct-card mt-2 space-y-4 p-5">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2 text-[var(--acct-ink)]">
          <Filter size={16} />
          <h2 className="text-sm font-semibold">Filter & download</h2>
        </div>
        <button onClick={reset} className="acct-button-ghost rounded-xl text-xs">
          <FilterX size={14} /> Reset
        </button>
      </div>

      <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-4">
        <label className="text-xs font-medium text-[var(--acct-muted)]">
          <span className="block uppercase tracking-[0.16em]">From</span>
          <input
            type="date"
            value={from}
            onChange={(e) => setFrom(e.target.value)}
            className="mt-1 w-full rounded-lg border border-[var(--acct-line)] bg-[var(--acct-surface)] px-3 py-2 text-sm text-[var(--acct-ink)]"
          />
        </label>
        <label className="text-xs font-medium text-[var(--acct-muted)]">
          <span className="block uppercase tracking-[0.16em]">To</span>
          <input
            type="date"
            value={to}
            onChange={(e) => setTo(e.target.value)}
            className="mt-1 w-full rounded-lg border border-[var(--acct-line)] bg-[var(--acct-surface)] px-3 py-2 text-sm text-[var(--acct-ink)]"
          />
        </label>
        <label className="text-xs font-medium text-[var(--acct-muted)]">
          <span className="block uppercase tracking-[0.16em]">Amount from (₦)</span>
          <input
            type="number"
            inputMode="decimal"
            min={0}
            value={amountFrom}
            onChange={(e) => setAmountFrom(e.target.value)}
            className="mt-1 w-full rounded-lg border border-[var(--acct-line)] bg-[var(--acct-surface)] px-3 py-2 text-sm text-[var(--acct-ink)]"
          />
        </label>
        <label className="text-xs font-medium text-[var(--acct-muted)]">
          <span className="block uppercase tracking-[0.16em]">Amount to (₦)</span>
          <input
            type="number"
            inputMode="decimal"
            min={0}
            value={amountTo}
            onChange={(e) => setAmountTo(e.target.value)}
            className="mt-1 w-full rounded-lg border border-[var(--acct-line)] bg-[var(--acct-surface)] px-3 py-2 text-sm text-[var(--acct-ink)]"
          />
        </label>
      </div>

      {availableDivisions.length > 0 ? (
        <div>
          <p className="text-[0.65rem] font-semibold uppercase tracking-[0.16em] text-[var(--acct-muted)]">Division</p>
          <div className="mt-2 flex flex-wrap gap-2">
            {availableDivisions.map((d) => (
              <button
                key={d}
                type="button"
                onClick={toggle(divisions, setDivisions, d)}
                className={`acct-chip rounded-full px-3 py-1 text-[0.7rem] transition ${
                  divisions.has(d) ? "acct-chip-gold" : "acct-chip-ghost"
                }`}
              >
                {d}
              </button>
            ))}
          </div>
        </div>
      ) : null}

      <div>
        <p className="text-[0.65rem] font-semibold uppercase tracking-[0.16em] text-[var(--acct-muted)]">Type</p>
        <div className="mt-2 flex flex-wrap gap-2">
          {TYPES.map((t) => (
            <button
              key={t}
              type="button"
              onClick={toggle(types, setTypes, t)}
              className={`acct-chip rounded-full px-3 py-1 text-[0.7rem] transition ${
                types.has(t) ? "acct-chip-blue" : "acct-chip-ghost"
              }`}
            >
              {t.replace(/_/g, " ")}
            </button>
          ))}
        </div>
      </div>

      <div>
        <p className="text-[0.65rem] font-semibold uppercase tracking-[0.16em] text-[var(--acct-muted)]">Status</p>
        <div className="mt-2 flex flex-wrap gap-2">
          {STATUSES.map((s) => (
            <button
              key={s}
              type="button"
              onClick={toggle(statuses, setStatuses, s)}
              className={`acct-chip rounded-full px-3 py-1 text-[0.7rem] transition ${
                statuses.has(s) ? "acct-chip-green" : "acct-chip-ghost"
              }`}
            >
              {s}
            </button>
          ))}
        </div>
      </div>

      <div className="flex flex-wrap items-center justify-between gap-3 border-t border-[var(--acct-line)] pt-4">
        <p className="text-xs text-[var(--acct-muted)]">
          The PDF carries every filter you set above as part of the document header — what you see is what you download.
        </p>
        <DownloadDocumentButton
          endpoint={endpoint}
          suggestedFilename="HenryCo-Transaction-History.pdf"
          shareTitle="HenryCo Transaction History"
          label="Download statement"
        />
      </div>
    </section>
  );
}
