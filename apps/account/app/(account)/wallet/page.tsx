import Link from "next/link";
import {
  Wallet,
  Plus,
  ArrowDownLeft,
  ArrowUpRight,
  RefreshCcw,
  Gift,
  Clock,
} from "lucide-react";
import { requireAccountUser } from "@/lib/auth";
import { getWalletSummary, getWalletTransactions } from "@/lib/account-data";
import { formatNaira, formatDateTime, divisionLabel } from "@/lib/format";
import PageHeader from "@/components/layout/PageHeader";
import EmptyState from "@/components/layout/EmptyState";

export const dynamic = "force-dynamic";

const typeIcons: Record<string, typeof ArrowDownLeft> = {
  credit: ArrowDownLeft,
  debit: ArrowUpRight,
  refund: RefreshCcw,
  bonus: Gift,
  cashback: Gift,
  transfer: ArrowUpRight,
};

const typeColors: Record<string, string> = {
  credit: "var(--acct-green)",
  debit: "var(--acct-red)",
  refund: "var(--acct-blue)",
  bonus: "var(--acct-purple)",
  cashback: "var(--acct-orange)",
  transfer: "var(--acct-muted)",
};

export default async function WalletPage() {
  const user = await requireAccountUser();
  const wallet = await getWalletSummary(user.id);
  const transactions = await getWalletTransactions(user.id, 50);

  return (
    <div className="space-y-6 acct-fade-in">
      <PageHeader
        title="Wallet"
        description="Your HenryCo ecosystem wallet — usable across all divisions."
        icon={Wallet}
        actions={
          <Link href="/wallet/add" className="acct-button-primary rounded-xl">
            <Plus size={16} /> Add money
          </Link>
        }
      />

      {/* Balance card */}
      <div className="acct-card overflow-hidden">
        <div className="bg-gradient-to-br from-[var(--acct-gold)] to-[#A08520] px-6 py-8 text-white">
          <p className="text-sm font-medium text-white/70">Available balance</p>
          <p className="mt-1 text-4xl font-bold">{formatNaira(wallet.balance_kobo)}</p>
          <p className="mt-2 text-sm text-white/60">
            HenryCo Wallet &middot; {wallet.currency} &middot; Use anywhere in the ecosystem
          </p>
        </div>
        <div className="grid grid-cols-3 divide-x divide-[var(--acct-line)] border-t border-[var(--acct-line)]">
          <Link
            href="/wallet/add"
            className="flex flex-col items-center gap-1 px-4 py-4 text-center transition-colors hover:bg-[var(--acct-surface)]"
          >
            <Plus size={18} className="text-[var(--acct-green)]" />
            <span className="text-xs font-medium">Add money</span>
          </Link>
          <Link
            href="/payments"
            className="flex flex-col items-center gap-1 px-4 py-4 text-center transition-colors hover:bg-[var(--acct-surface)]"
          >
            <ArrowUpRight size={18} className="text-[var(--acct-blue)]" />
            <span className="text-xs font-medium">Payments</span>
          </Link>
          <Link
            href="/wallet"
            className="flex flex-col items-center gap-1 px-4 py-4 text-center transition-colors hover:bg-[var(--acct-surface)]"
          >
            <Clock size={18} className="text-[var(--acct-muted)]" />
            <span className="text-xs font-medium">History</span>
          </Link>
        </div>
      </div>

      {/* Trust cues */}
      <div className="grid gap-3 sm:grid-cols-3">
        {[
          { label: "Instant top-up", desc: "Add money via card, bank transfer or USSD" },
          { label: "Ecosystem-wide", desc: "Pay for Care, Marketplace, and more" },
          { label: "Secure & tracked", desc: "Every transaction is logged and verifiable" },
        ].map((cue) => (
          <div key={cue.label} className="rounded-xl bg-[var(--acct-surface)] p-4">
            <p className="text-sm font-semibold text-[var(--acct-ink)]">{cue.label}</p>
            <p className="mt-0.5 text-xs text-[var(--acct-muted)]">{cue.desc}</p>
          </div>
        ))}
      </div>

      {/* Transactions */}
      <section className="acct-card p-5">
        <p className="acct-kicker mb-4">Transaction history</p>
        {transactions.length === 0 ? (
          <EmptyState
            icon={Wallet}
            title="No transactions yet"
            description="Your wallet transaction history will appear here once you start using your wallet."
          />
        ) : (
          <div className="space-y-2">
            {transactions.map((tx: Record<string, string | number>) => {
              const Icon = typeIcons[tx.type as string] || ArrowUpRight;
              const color = typeColors[tx.type as string] || "var(--acct-muted)";
              const isCredit = ["credit", "refund", "bonus", "cashback"].includes(tx.type as string);

              return (
                <div
                  key={tx.id as string}
                  className="flex items-center gap-3 rounded-xl bg-[var(--acct-surface)] px-4 py-3"
                >
                  <div
                    className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg"
                    style={{ backgroundColor: color + "18", color }}
                  >
                    <Icon size={18} />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-medium text-[var(--acct-ink)]">
                      {tx.description}
                    </p>
                    <p className="text-xs text-[var(--acct-muted)]">
                      {tx.division ? divisionLabel(tx.division as string) + " · " : ""}
                      {formatDateTime(tx.created_at as string)}
                    </p>
                  </div>
                  <p
                    className="shrink-0 text-sm font-semibold"
                    style={{ color: isCredit ? "var(--acct-green)" : "var(--acct-red)" }}
                  >
                    {isCredit ? "+" : "-"}{formatNaira(tx.amount_kobo as number)}
                  </p>
                </div>
              );
            })}
          </div>
        )}
      </section>
    </div>
  );
}
