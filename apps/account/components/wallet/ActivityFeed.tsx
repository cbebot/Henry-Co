import {
  ArrowDownLeft,
  ArrowUpRight,
  Gift,
  RefreshCcw,
  type LucideIcon,
} from "lucide-react";
import type { AccountCopy } from "@henryco/i18n/server";
import {
  divisionPalette,
  formatKoboMajor,
  formatTxRelative,
  txSign,
  txTone,
  type WalletTransaction,
} from "./helpers";

const TX_ICONS: Record<string, LucideIcon> = {
  credit: ArrowDownLeft,
  debit: ArrowUpRight,
  refund: RefreshCcw,
  bonus: Gift,
  cashback: Gift,
  transfer: ArrowUpRight,
};

type Props = {
  transactions: ReadonlyArray<WalletTransaction>;
  copy: AccountCopy["wallet"]["activity"];
};

export function ActivityFeed({ transactions, copy }: Props) {
  if (transactions.length === 0) {
    return (
      <div className="acct-wal__empty">
        <span className="acct-wal__empty-icon" aria-hidden>
          <ArrowUpRight size={18} />
        </span>
        <h3 className="acct-wal__empty-title">{copy.emptyTitle}</h3>
        <p className="acct-wal__empty-body">{copy.emptyBody}</p>
      </div>
    );
  }
  return (
    <div className="acct-wal__activity" role="list" aria-label={copy.ariaLabel}>
      {transactions.map((tx) => {
        const tone = txTone(tx.type);
        const Icon = TX_ICONS[tone];
        const sign = txSign(tx.type);
        const palette = divisionPalette(tx.division);
        return (
          <div className="acct-wal__tx" role="listitem" key={tx.id}>
            <span className="acct-wal__tx-icon" data-tone={tone} aria-hidden>
              {Icon ? <Icon size={18} aria-hidden /> : null}
            </span>
            <span className="acct-wal__tx-meta">
              <span className="acct-wal__tx-title">{tx.description || copy.fallbackTitle}</span>
              <span className="acct-wal__tx-sub">
                <span style={{ color: palette.color, fontWeight: 600 }}>{palette.label}</span>
                {" · "}
                {formatTxRelative(tx.created_at)}
              </span>
            </span>
            <span className="acct-wal__tx-amount" data-sign={sign}>
              {sign === "credit" ? "+" : sign === "debit" ? "−" : ""}₦
              {formatKoboMajor(tx.amount_kobo)}
            </span>
          </div>
        );
      })}
    </div>
  );
}
