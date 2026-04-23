import { getDivisionUrl, getHqUrl } from "@henryco/config";
import { formatMoney } from "@henryco/i18n";
import { BanknoteArrowDown, DollarSign, Landmark, ReceiptText, Wallet, ArrowUpRight, ArrowDownRight } from "lucide-react";
import { requireStaff } from "@/lib/staff-auth";
import { viewerHasPermission } from "@/lib/roles";
import {
  StaffPageHeader,
  StaffEmptyState,
  StaffMetricCard,
  StaffPanel,
  StaffStatusBadge,
} from "@/components/StaffPrimitives";
import { StaffWorkspaceLaunchpad } from "@/components/StaffWorkspaceLaunchpad";
import { getFinanceSummary } from "@/lib/finance-data";

export const dynamic = "force-dynamic";

function formatNaira(kobo: number) {
  return formatMoney(kobo, "NGN");
}

function formatDate(iso: string) {
  if (!iso) return "";
  return new Intl.DateTimeFormat("en-NG", {
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(iso));
}

export default async function FinancePage() {
  const viewer = await requireStaff();
  const hasFinance = viewerHasPermission(viewer, "division.finance");

  if (!hasFinance) {
    return (
      <div className="staff-fade-in">
        <StaffPageHeader eyebrow="Operations" title="Finance" />
        <StaffEmptyState
          icon={DollarSign}
          title="Access restricted"
          description="You do not have finance permissions. Contact your manager if you need access to financial data."
        />
      </div>
    );
  }

  const summary = await getFinanceSummary();

  return (
    <div className="staff-fade-in">
      <StaffPageHeader
        eyebrow="Operations"
        title="Finance"
        description="Wallet funding verification, withdrawal processing, and cross-division financial operations."
      />

      <div className="mb-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StaffMetricCard
          label="Pending funding"
          value={formatNaira(summary.pendingFunding)}
          subtitle={`${summary.pendingFundingCount} request${summary.pendingFundingCount === 1 ? "" : "s"}`}
          icon={ArrowDownRight}
          href="#funding-queue"
        />
        <StaffMetricCard
          label="Pending withdrawals"
          value={formatNaira(summary.pendingWithdrawals)}
          subtitle={`${summary.pendingWithdrawalCount} request${summary.pendingWithdrawalCount === 1 ? "" : "s"}`}
          icon={ArrowUpRight}
          href="#withdrawal-queue"
        />
        <StaffMetricCard
          label="Funding queue"
          value={String(summary.pendingFundingCount)}
          subtitle="Awaiting proof verification"
          icon={Wallet}
          href="#funding-queue"
        />
        <StaffMetricCard
          label="Withdrawal queue"
          value={String(summary.pendingWithdrawalCount)}
          subtitle="Ready for processing"
          icon={DollarSign}
          href="#withdrawal-queue"
        />
      </div>

      <div className="grid gap-6 xl:grid-cols-2">
        <StaffPanel title="Funding requests awaiting verification" className="scroll-mt-24" id="funding-queue">
          {summary.recentFunding.length === 0 ? (
            <p className="text-sm text-[var(--staff-muted)]">
              No pending funding requests. All wallet top-ups have been processed.
            </p>
          ) : (
            <div className="space-y-3">
              {summary.recentFunding.map((req) => (
                <div
                  key={req.id}
                  className="rounded-xl border border-[var(--staff-line)] bg-[var(--staff-surface)] px-4 py-3"
                >
                  <div className="flex items-center justify-between gap-2">
                    <div>
                      <p className="text-sm font-semibold text-[var(--staff-ink)]">
                        {req.userName}
                      </p>
                      <p className="text-xs text-[var(--staff-muted)]">
                        {req.userEmail}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-bold text-[var(--staff-ink)]">
                        {formatNaira(req.amountKobo)}
                      </p>
                      <StaffStatusBadge label={req.status} tone="warning" />
                    </div>
                  </div>
                  <div className="mt-2 flex flex-wrap items-center justify-between gap-2 text-xs text-[var(--staff-muted)]">
                    <span>{formatDate(req.createdAt)}</span>
                    <span className="flex items-center gap-3">
                      <a
                        href={req.href}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="font-semibold text-[var(--staff-accent)] hover:underline"
                      >
                        Open request
                      </a>
                      {req.proofUrl ? (
                        <a
                          href={req.proofUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="font-semibold text-[var(--staff-accent)] hover:underline"
                        >
                          View proof
                        </a>
                      ) : (
                        <span className="text-[var(--staff-warning)]">No proof uploaded</span>
                      )}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </StaffPanel>

        <StaffPanel title="Withdrawal requests" className="scroll-mt-24" id="withdrawal-queue">
          {summary.recentWithdrawals.length === 0 ? (
            <p className="text-sm text-[var(--staff-muted)]">
              No pending withdrawal requests. All payout requests have been processed.
            </p>
          ) : (
            <div className="space-y-3">
              {summary.recentWithdrawals.map((req) => (
                <div
                  key={req.id}
                  className="rounded-xl border border-[var(--staff-line)] bg-[var(--staff-surface)] px-4 py-3"
                >
                  <div className="flex items-center justify-between gap-2">
                    <div>
                      <p className="text-sm font-semibold text-[var(--staff-ink)]">
                        {req.userName}
                      </p>
                      <p className="text-xs text-[var(--staff-muted)]">
                        {req.payoutMethodLabel}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-bold text-[var(--staff-ink)]">
                        {formatNaira(req.amountKobo)}
                      </p>
                      <StaffStatusBadge label={req.status} tone="info" />
                    </div>
                  </div>
                  <div className="mt-2 flex flex-wrap items-center justify-between gap-2 text-xs text-[var(--staff-muted)]">
                    <span>
                      {formatDate(req.createdAt)} · {req.userEmail}
                    </span>
                    <a
                      href={req.href}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="font-semibold text-[var(--staff-accent)] hover:underline"
                    >
                      Open request
                    </a>
                  </div>
                </div>
              ))}
            </div>
          )}
        </StaffPanel>
      </div>

      <StaffWorkspaceLaunchpad
        readiness="partial"
        overview="Division-specific finance routes provide deeper ledger access. Use these links to navigate to each division's finance controls."
        links={[
          {
            href: `${getHqUrl("/owner/finance")}`,
            label: "Group finance",
            description: "Owner-side finance overview for cross-company visibility.",
            icon: Landmark,
            readiness: "live",
          },
          {
            href: `${getDivisionUrl("care")}/owner/finance`,
            label: "Care finance",
            description: "Care payments, expenses, and finance-sensitive ops.",
            icon: ReceiptText,
            readiness: "live",
          },
          {
            href: `${getDivisionUrl("marketplace")}/finance`,
            label: "Marketplace finance",
            description: "Seller payouts, disputes, and revenue-sensitive cases.",
            icon: Wallet,
            readiness: "live",
          },
          {
            href: `${getDivisionUrl("studio")}/finance/invoices`,
            label: "Studio invoices",
            description: "Studio invoice truth and payment movement.",
            icon: BanknoteArrowDown,
            readiness: "live",
          },
        ]}
        notes={[
          "Approvals and reporting remain distributed across division finance routes.",
        ]}
      />
    </div>
  );
}
