import Link from "next/link";
import {
  Wallet,
  Plus,
  ArrowDownLeft,
  ArrowUpRight,
  RefreshCcw,
  Gift,
  Clock,
  ShieldCheck,
} from "lucide-react";
import { requireAccountUser } from "@/lib/auth";
import {
  getPendingWithdrawalHoldKobo,
  getWalletFundingContext,
  getWalletTransactions,
  getWithdrawalRequests,
} from "@/lib/account-data";
import { formatNaira, formatDateTime, divisionLabel } from "@/lib/format";
import PageHeader from "@/components/layout/PageHeader";
import EmptyState from "@/components/layout/EmptyState";
import {
  isPendingWithdrawalStatus,
  LEGACY_WITHDRAWAL_REQUEST_REFERENCE_TYPE,
} from "@/lib/wallet-storage";

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
  const [{ wallet, pending_kobo, requests }, withdrawalRequests] = await Promise.all([
    getWalletFundingContext(user.id),
    getWithdrawalRequests(user.id),
  ]);
  const pendingWithdrawalKobo = getPendingWithdrawalHoldKobo(withdrawalRequests as never);
  const availableBalanceKobo = Math.max(0, Number(wallet.balance_kobo) - pendingWithdrawalKobo);
  const transactions = (await getWalletTransactions(user.id, 50)).filter(
    (transaction: Record<string, string | number>) =>
      (
        transaction.reference_type !== "wallet_funding_request" ||
        transaction.status === "completed" ||
        transaction.status === "verified"
      ) &&
      (
        transaction.reference_type !== LEGACY_WITHDRAWAL_REQUEST_REFERENCE_TYPE ||
        !isPendingWithdrawalStatus(String(transaction.status || ""))
      )
  );

  return (
    <div className="space-y-6 acct-fade-in">
      <PageHeader
        title="Wallet"
        description="Your HenryCo wallet for payments across Care, Marketplace, Studio, and more."
        icon={Wallet}
        actions={
          <div className="flex flex-wrap gap-2">
            <Link href="/wallet/funding" className="acct-button-primary rounded-xl">
              <Plus size={16} /> Fund wallet
            </Link>
            <Link href="/wallet/withdrawals" className="acct-button-secondary rounded-xl">
              <ArrowUpRight size={16} /> Withdraw
            </Link>
          </div>
        }
      />

      {/* Balance card */}
      <div className="acct-card overflow-hidden">
        <div className="bg-gradient-to-br from-[var(--acct-gold)] to-[#A08520] px-6 py-8 text-white">
          <p className="text-sm font-medium text-white/70">Available balance</p>
          <p className="mt-1 text-4xl font-bold">{formatNaira(availableBalanceKobo)}</p>
          <p className="mt-2 text-sm text-white/60">
            HenryCo Wallet &middot; {wallet.currency} &middot; Available across HenryCo services
          </p>
          {pendingWithdrawalKobo > 0 ? (
            <p className="mt-2 text-xs font-semibold uppercase tracking-[0.16em] text-white/72">
              {formatNaira(pendingWithdrawalKobo)} held in pending withdrawal review
            </p>
          ) : null}
        </div>
        <div className="grid grid-cols-2 divide-x divide-[var(--acct-line)] border-t border-[var(--acct-line)] sm:grid-cols-4">
          <Link
            href="/wallet/funding"
            className="flex flex-col items-center gap-1 px-4 py-4 text-center transition-colors hover:bg-[var(--acct-surface)]"
          >
            <Plus size={18} className="text-[var(--acct-green)]" />
            <span className="text-xs font-medium">Fund wallet</span>
          </Link>
          <Link
            href="/wallet/withdrawals"
            className="flex flex-col items-center gap-1 px-4 py-4 text-center transition-colors hover:bg-[var(--acct-surface)]"
          >
            <ArrowDownLeft size={18} className="text-[var(--acct-orange)]" />
            <span className="text-xs font-medium">Withdraw</span>
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
          { label: "Pending review stays separate", desc: "Funding only moves into available balance after confirmation." },
          { label: "Works across HenryCo", desc: "Use the same wallet for Care, Marketplace, Studio, and more." },
          { label: "Secure and traceable", desc: "Every funding request, proof upload, and balance change is recorded." },
        ].map((cue) => (
          <div key={cue.label} className="rounded-xl bg-[var(--acct-surface)] p-4">
            <p className="text-sm font-semibold text-[var(--acct-ink)]">{cue.label}</p>
            <p className="mt-0.5 text-xs text-[var(--acct-muted)]">{cue.desc}</p>
          </div>
        ))}
      </div>

      <section className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_minmax(0,1fr)]">
        <div className="acct-card p-5">
          <div className="flex items-start justify-between gap-4">
            <div>
              <p className="acct-kicker">Pending funding</p>
              <p className="mt-2 text-2xl font-semibold text-[var(--acct-ink)]">
                {formatNaira(pending_kobo)}
              </p>
              <p className="mt-2 text-sm leading-6 text-[var(--acct-muted)]">
                Money stays here until transfer proof is uploaded and the HenryCo team confirms the payment.
              </p>
            </div>
            <ShieldCheck className="h-5 w-5 text-[var(--acct-blue)]" />
          </div>
          <Link href="/wallet/funding" className="acct-button-secondary mt-5 rounded-xl">
            Open funding lane
          </Link>
        </div>

        <div className="acct-card p-5">
          <div className="flex items-start justify-between gap-4">
            <div>
              <p className="acct-kicker">Pending withdrawals</p>
              <p className="mt-2 text-lg font-semibold text-[var(--acct-ink)]">
                {pendingWithdrawalKobo > 0
                  ? `${formatNaira(pendingWithdrawalKobo)} awaiting finance review`
                  : "No pending withdrawals"}
              </p>
            </div>
            <ArrowUpRight className="h-5 w-5 text-[var(--acct-orange)]" />
          </div>
          <p className="mt-4 text-sm leading-6 text-[var(--acct-muted)]">
            Requests under review stay off your withdrawable balance so the wallet never promises cash twice.
          </p>
          <Link href="/wallet/withdrawals" className="acct-button-secondary mt-5 rounded-xl">
            Open withdrawal lane
          </Link>
        </div>
      </section>

      <section className="acct-card p-5 sm:p-6">
        <div className="mb-4 flex items-center justify-between gap-3">
          <div>
            <p className="acct-kicker">Recent funding requests</p>
            <h2 className="mt-2 text-lg font-semibold text-[var(--acct-ink)]">Recent requests</h2>
          </div>
        </div>

        <div className="space-y-3">
          {requests.slice(0, 3).map((request) => (
            <Link
              key={request.id}
              href={`/wallet/funding/${request.id}`}
              className="block rounded-xl bg-[var(--acct-surface)] px-4 py-3 transition hover:bg-[var(--acct-bg)]"
            >
              <p className="text-sm font-semibold text-[var(--acct-ink)]">
                {formatNaira(request.amount_kobo)} · {request.reference || request.id}
              </p>
              <p className="mt-1 text-xs text-[var(--acct-muted)]">
                {request.status.replaceAll("_", " ")}
                {request.proof_url ? " · proof uploaded" : " · awaiting proof"}
              </p>
            </Link>
          ))}
          {requests.length === 0 ? (
            <p className="text-sm leading-6 text-[var(--acct-muted)]">
              Create your first funding request to unlock the bank-transfer flow.
            </p>
          ) : null}
        </div>
      </section>

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
