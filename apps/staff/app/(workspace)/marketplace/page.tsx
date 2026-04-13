import { ExternalLink, ShieldCheck, ShoppingBag, Siren, Wallet } from "lucide-react";
import { requireStaff } from "@/lib/staff-auth";
import { getMarketplaceOpsSnapshot } from "@/lib/marketplace-ops";
import {
  StaffEmptyState,
  StaffMetricCard,
  StaffPageHeader,
  StaffPanel,
  StaffStatusBadge,
} from "@/components/StaffPrimitives";

export const dynamic = "force-dynamic";

const MARKETPLACE_LANES = [
  { id: "all", label: "All queues" },
  { id: "seller", label: "Seller and catalog" },
  { id: "finance", label: "Finance and disputes" },
  { id: "alerts", label: "Owner alerts" },
] as const;

function QueueCard({
  title,
  items,
}: {
  title: string;
  items: Awaited<ReturnType<typeof getMarketplaceOpsSnapshot>>["sellerQueue"];
}) {
  return (
    <StaffPanel title={title}>
      <div className="space-y-3">
        {items.length === 0 ? (
          <p className="text-sm text-[var(--staff-muted)]">No queue items are currently visible in this lane.</p>
        ) : (
          items.map((item) => (
            <a
              key={item.id}
              href={item.href}
              className="block rounded-2xl border border-[var(--staff-line)] bg-[var(--staff-surface)] px-4 py-3 transition-colors hover:border-[var(--staff-gold)]/35"
            >
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="text-sm font-semibold text-[var(--staff-ink)]">{item.title}</p>
                  <p className="mt-1 text-xs leading-relaxed text-[var(--staff-muted)]">{item.detail}</p>
                </div>
                <StaffStatusBadge label={item.statusLabel} tone={item.tone} />
              </div>
              <div className="mt-3 flex flex-wrap items-center gap-3 text-[0.72rem] uppercase tracking-[0.14em] text-[var(--staff-muted)]">
                <span>{item.ownerRole}</span>
                <span>{item.actionLabel}</span>
                {item.meta ? <span>{item.meta}</span> : null}
              </div>
            </a>
          ))
        )}
      </div>
    </StaffPanel>
  );
}

export default async function MarketplacePage({
  searchParams,
}: {
  searchParams: Promise<{ lane?: string }>;
}) {
  const viewer = await requireStaff();
  const hasMarketplace = viewer.divisions.some((division) => division.division === "marketplace");

  if (!hasMarketplace) {
    return (
      <div className="staff-fade-in">
        <StaffPageHeader eyebrow="Workspace" title="Marketplace Operations" />
        <StaffEmptyState
          icon={ShoppingBag}
          title="Access restricted"
          description="You do not have access to the Marketplace division. Contact your manager if you believe this is an error."
        />
      </div>
    );
  }

  const laneValue = (await searchParams).lane || "all";
  const lane = MARKETPLACE_LANES.some((item) => item.id === laneValue) ? laneValue : "all";
  const snapshot = await getMarketplaceOpsSnapshot();
  const showSeller = lane === "all" || lane === "seller";
  const showFinance = lane === "all" || lane === "finance";
  const showAlerts = lane === "all" || lane === "alerts";

  return (
    <div className="staff-fade-in">
      <StaffPageHeader
        eyebrow="Workspace"
        title="Marketplace Operations"
        description="Seller review, catalog moderation, payment verification, payout control, and owner-visible trust pressure now stay tied to the real Marketplace workflows."
      />

      <div className="mb-6 rounded-2xl border border-[var(--staff-line)] bg-[var(--staff-surface)] px-5 py-4">
        <div className="flex flex-wrap items-center gap-3">
          <p className="text-xs uppercase tracking-[0.14em] text-[var(--staff-muted)]">Operational model</p>
          <StaffStatusBadge label="Actionable queues" tone="warning" />
          <StaffStatusBadge label="Trust-linked" tone="critical" />
        </div>
        <p className="mt-2 max-w-4xl text-sm leading-relaxed text-[var(--staff-muted)]">{snapshot.summary}</p>
      </div>

      <div className="mb-8 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {snapshot.metrics.map((metric) => (
          <StaffMetricCard
            key={metric.label}
            label={metric.label}
            value={metric.value}
            subtitle={metric.hint}
            icon={ShoppingBag}
          />
        ))}
      </div>

      <div className="mb-6 flex flex-wrap gap-3">
        {MARKETPLACE_LANES.map((item) => {
          const active = item.id === lane;
          return (
            <a
              key={item.id}
              href={item.id === "all" ? "/marketplace" : `/marketplace?lane=${item.id}`}
              className={`rounded-full px-4 py-2 text-sm font-semibold transition-colors ${
                active
                  ? "bg-[var(--staff-gold-soft)] text-[var(--staff-ink)]"
                  : "border border-[var(--staff-line)] bg-[var(--staff-surface)] text-[var(--staff-muted)] hover:border-[var(--staff-gold)]/35"
              }`}
            >
              {item.label}
            </a>
          );
        })}
      </div>

      <div className="grid gap-6 xl:grid-cols-2">
        {showSeller ? <QueueCard title="Seller and catalog queue" items={snapshot.sellerQueue} /> : null}
        {showFinance ? <QueueCard title="Finance, payout, and dispute queue" items={snapshot.financeQueue} /> : null}
      </div>

      {showAlerts ? (
        <StaffPanel title="Owner-visible marketplace alerts" className="mt-6">
          <div className="space-y-3">
            {snapshot.alerts.length === 0 ? (
              <p className="text-sm text-[var(--staff-muted)]">No owner-visible marketplace alerts are active right now.</p>
            ) : (
              snapshot.alerts.map((item) => (
                <a
                  key={item.id}
                  href={item.href}
                  className="block rounded-2xl border border-[var(--staff-line)] bg-[var(--staff-surface)] px-4 py-3 transition-colors hover:border-[var(--staff-gold)]/35"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <p className="text-sm font-semibold text-[var(--staff-ink)]">{item.title}</p>
                      <p className="mt-1 text-xs leading-relaxed text-[var(--staff-muted)]">{item.detail}</p>
                    </div>
                    <StaffStatusBadge label={item.statusLabel} tone={item.tone} />
                  </div>
                  {item.meta ? (
                    <p className="mt-2 text-[0.7rem] uppercase tracking-[0.14em] text-[var(--staff-muted)]">{item.meta}</p>
                  ) : null}
                </a>
              ))
            )}
          </div>
        </StaffPanel>
      ) : null}

      <div className="mt-6 grid gap-6 xl:grid-cols-[1.05fr,0.95fr]">
        <StaffPanel title="Daily owner summary">
          <div className="space-y-3">
            {snapshot.dailyBriefs.map((brief) => (
              <div key={brief} className="rounded-2xl border border-[var(--staff-line)] bg-[var(--staff-surface)] px-4 py-3 text-sm leading-relaxed text-[var(--staff-muted)]">
                {brief}
              </div>
            ))}
          </div>
        </StaffPanel>

        <StaffPanel title="Weekly owner summary">
          <div className="space-y-3">
            {snapshot.weeklyBriefs.map((brief) => (
              <div key={brief} className="rounded-2xl border border-[var(--staff-line)] bg-[var(--staff-surface)] px-4 py-3 text-sm leading-relaxed text-[var(--staff-muted)]">
                {brief}
              </div>
            ))}
          </div>
        </StaffPanel>
      </div>

      <StaffPanel title="Exact workflows" className="mt-6">
        <div className="grid gap-3 xl:grid-cols-2">
          {snapshot.links.map((link) => (
            <a
              key={link.href}
              href={link.href}
              target="_blank"
              rel="noreferrer"
              className="rounded-2xl border border-[var(--staff-line)] bg-[var(--staff-surface)] px-4 py-3 transition-colors hover:border-[var(--staff-gold)]/35"
            >
              <div className="flex items-center justify-between gap-3">
                <p className="text-sm font-semibold text-[var(--staff-ink)]">{link.label}</p>
                <ExternalLink className="h-4 w-4 text-[var(--staff-muted)]" />
              </div>
              <p className="mt-1 text-xs leading-relaxed text-[var(--staff-muted)]">{link.description}</p>
            </a>
          ))}
        </div>
      </StaffPanel>

      <div className="mt-6 grid gap-4 sm:grid-cols-3">
        <div className="rounded-2xl border border-[var(--staff-line)] bg-[var(--staff-surface)] px-4 py-4">
          <div className="flex items-center gap-3">
            <ShieldCheck className="h-5 w-5 text-[var(--staff-warning)]" />
            <div>
              <p className="text-sm font-semibold text-[var(--staff-ink)]">Review authenticity</p>
              <p className="text-xs text-[var(--staff-muted)]">Pending unverified reviews stay in moderation instead of inflating trust immediately.</p>
            </div>
          </div>
        </div>
        <div className="rounded-2xl border border-[var(--staff-line)] bg-[var(--staff-surface)] px-4 py-4">
          <div className="flex items-center gap-3">
            <Wallet className="h-5 w-5 text-[var(--staff-critical)]" />
            <div>
              <p className="text-sm font-semibold text-[var(--staff-ink)]">Finance control</p>
              <p className="text-xs text-[var(--staff-muted)]">Payment verification and payout decisions stay linked to disputes and owner-visible exception handling.</p>
            </div>
          </div>
        </div>
        <div className="rounded-2xl border border-[var(--staff-line)] bg-[var(--staff-surface)] px-4 py-4">
          <div className="flex items-center gap-3">
            <Siren className="h-5 w-5 text-[var(--staff-critical)]" />
            <div>
              <p className="text-sm font-semibold text-[var(--staff-ink)]">Owner command</p>
              <p className="text-xs text-[var(--staff-muted)]">Notification failures, stalled orders, and trust anomalies remain visible before they spill into reputation damage.</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
