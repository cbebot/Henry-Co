import { DollarSign, ExternalLink } from "lucide-react";
import { requireStaff } from "@/lib/staff-auth";
import { viewerHasPermission } from "@/lib/roles";
import {
  StaffEmptyState,
  StaffMetricCard,
  StaffPageHeader,
  StaffPanel,
  StaffStatusBadge,
} from "@/components/StaffPrimitives";
import { getFinanceWorkspaceSnapshot } from "@/lib/finance-ops";

export const dynamic = "force-dynamic";

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

  const snapshot = await getFinanceWorkspaceSnapshot();

  return (
    <div className="staff-fade-in">
      <StaffPageHeader
        eyebrow="Operations"
        title="Finance"
        description="A live control surface for currency truth, pending finance work, and ledger publishing quality across HenryCo."
      />
      <div className="mb-8 rounded-2xl border border-[var(--staff-line)] bg-[var(--staff-surface)] px-5 py-4">
        <div className="flex flex-wrap items-center gap-3">
          <p className="text-xs uppercase tracking-[0.14em] text-[var(--staff-muted)]">Operational truth</p>
          <StaffStatusBadge label="NGN settlement live" tone="warning" />
        </div>
        <p className="mt-2 max-w-4xl text-sm leading-relaxed text-[var(--staff-muted)]">
          {snapshot.summary}
        </p>
      </div>

      <div className="mb-8 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {snapshot.metrics.map((metric) => (
          <StaffMetricCard
            key={metric.label}
            label={metric.label}
            value={metric.value}
            subtitle={metric.hint}
            icon={DollarSign}
          />
        ))}
      </div>

      <div className="grid gap-6 xl:grid-cols-[minmax(0,0.9fr)_minmax(0,1.1fr)]">
        <StaffPanel title="Display Currency Coverage">
          <div className="space-y-3">
            {snapshot.coverage.map((row) => (
              <div key={row.currency} className="rounded-2xl border border-[var(--staff-line)] bg-[var(--staff-surface)] px-4 py-3">
                <div className="flex items-center justify-between gap-3">
                  <p className="text-sm font-semibold text-[var(--staff-ink)]">{row.currency}</p>
                  <span className="text-xs font-semibold uppercase tracking-[0.14em] text-[var(--staff-muted)]">
                    {row.count} profiles
                  </span>
                </div>
                <p className="mt-1 text-xs leading-relaxed text-[var(--staff-muted)]">{row.detail}</p>
              </div>
            ))}
          </div>
        </StaffPanel>

        <StaffPanel title="Settlement Exceptions">
          <div className="space-y-3">
            {snapshot.settlementAlerts.length === 0 ? (
              <p className="text-sm text-[var(--staff-muted)]">No settlement exceptions are currently visible.</p>
            ) : (
              snapshot.settlementAlerts.map((item) => (
                <a key={item.id} href={item.href} className="block rounded-2xl border border-[var(--staff-line)] bg-[var(--staff-surface)] px-4 py-3 transition-colors hover:border-[var(--staff-gold)]/35">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <p className="text-sm font-semibold text-[var(--staff-ink)]">{item.title}</p>
                      <p className="mt-1 text-xs leading-relaxed text-[var(--staff-muted)]">{item.detail}</p>
                    </div>
                    <StaffStatusBadge label={item.tone} tone={item.tone} />
                  </div>
                  {item.meta ? <p className="mt-2 text-[0.7rem] uppercase tracking-[0.14em] text-[var(--staff-muted)]">{item.meta}</p> : null}
                </a>
              ))
            )}
          </div>
        </StaffPanel>
      </div>

      <div className="mt-6 grid gap-6 xl:grid-cols-2">
        <StaffPanel title="Pending Finance Queue">
          <div className="space-y-3">
            {snapshot.pendingQueue.length === 0 ? (
              <p className="text-sm text-[var(--staff-muted)]">No pending funding or withdrawal rows need finance action right now.</p>
            ) : (
              snapshot.pendingQueue.map((item) => (
                <a key={item.id} href={item.href} className="block rounded-2xl border border-[var(--staff-line)] bg-[var(--staff-surface)] px-4 py-3 transition-colors hover:border-[var(--staff-gold)]/35">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <p className="text-sm font-semibold text-[var(--staff-ink)]">{item.title}</p>
                      <p className="mt-1 text-xs leading-relaxed text-[var(--staff-muted)]">{item.detail}</p>
                    </div>
                    <StaffStatusBadge label={item.tone} tone={item.tone} />
                  </div>
                  {item.meta ? <p className="mt-2 text-[0.7rem] uppercase tracking-[0.14em] text-[var(--staff-muted)]">{item.meta}</p> : null}
                </a>
              ))
            )}
          </div>
        </StaffPanel>

        <StaffPanel title="Ledger Publishing Gaps">
          <div className="space-y-3">
            {snapshot.ledgerAlerts.length === 0 ? (
              <p className="text-sm text-[var(--staff-muted)]">Invoice and subscription rows are currently publishing explicit currency context.</p>
            ) : (
              snapshot.ledgerAlerts.map((item) => (
                <a key={item.id} href={item.href} className="block rounded-2xl border border-[var(--staff-line)] bg-[var(--staff-surface)] px-4 py-3 transition-colors hover:border-[var(--staff-gold)]/35">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <p className="text-sm font-semibold text-[var(--staff-ink)]">{item.title}</p>
                      <p className="mt-1 text-xs leading-relaxed text-[var(--staff-muted)]">{item.detail}</p>
                    </div>
                    <StaffStatusBadge label={item.tone} tone={item.tone} />
                  </div>
                  {item.meta ? <p className="mt-2 text-[0.7rem] uppercase tracking-[0.14em] text-[var(--staff-muted)]">{item.meta}</p> : null}
                </a>
              ))
            )}
          </div>
        </StaffPanel>
      </div>

      <StaffPanel title="Live Control Surfaces" className="mt-6">
        <div className="grid gap-3 xl:grid-cols-2">
          {snapshot.links.map((link) => (
            <a key={link.href} href={link.href} target="_blank" rel="noreferrer" className="rounded-2xl border border-[var(--staff-line)] bg-[var(--staff-surface)] px-4 py-3 transition-colors hover:border-[var(--staff-gold)]/35">
              <div className="flex items-center justify-between gap-3">
                <p className="text-sm font-semibold text-[var(--staff-ink)]">{link.label}</p>
                <ExternalLink className="h-4 w-4 text-[var(--staff-muted)]" />
              </div>
              <p className="mt-1 text-xs leading-relaxed text-[var(--staff-muted)]">{link.description}</p>
            </a>
          ))}
        </div>
      </StaffPanel>
    </div>
  );
}
