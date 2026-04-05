import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowRight, ExternalLink } from "lucide-react";
import { OwnerPageHeader, OwnerPanel } from "@/components/owner/OwnerPrimitives";
import DivisionBadge from "@/components/owner/DivisionBadge";
import StatusBadge from "@/components/owner/StatusBadge";
import { getDivisionDetailData } from "@/lib/owner-data";
import { getDivisionExternalActions, isOwnerDivisionExternalHref } from "@/lib/owner-division-external";
import { formatCurrencyAmount, timeAgo } from "@/lib/format";

export const dynamic = "force-dynamic";

export default async function DivisionDetailPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const data = await getDivisionDetailData(slug);
  if (!data) notFound();

  const externalActions = getDivisionExternalActions(data.division.slug);

  return (
    <div className="space-y-6 acct-fade-in">
      <OwnerPageHeader
        eyebrow="Division Drill-Down"
        title={data.division.displayName}
        description={`Revenue, staffing, support, notifications, and audit visibility for ${data.division.displayName}. The owner no longer needs a separate division-specific dashboard to manage this surface.`}
      />

      {externalActions.length > 0 ? (
        <OwnerPanel
          title="Next steps"
          description="HQ routes stay in this tab. Subdomain links only when that app exposes a live owner or staff console — not a retired placeholder."
        >
          <ul className="grid gap-3 md:grid-cols-2">
            {externalActions.map((item) => {
              const offSite = isOwnerDivisionExternalHref(item.href);
              return (
                <li
                  key={`${item.label}-${item.href}`}
                  className="rounded-[1.2rem] border border-[var(--acct-line)] bg-[var(--acct-bg-soft)] p-4"
                >
                  <p className="text-sm font-semibold text-[var(--acct-ink)]">{item.label}</p>
                  <p className="mt-1 text-xs leading-relaxed text-[var(--acct-muted)]">{item.hint}</p>
                  <Link
                    href={item.href}
                    {...(offSite ? { target: "_blank", rel: "noreferrer" } : {})}
                    className="mt-3 inline-flex items-center gap-1.5 text-xs font-semibold text-[var(--owner-accent)]"
                  >
                    {offSite ? (
                      <>
                        Open division app
                        <ExternalLink className="h-3.5 w-3.5" aria-hidden />
                      </>
                    ) : (
                      <>
                        Open in HQ
                        <ArrowRight className="h-3.5 w-3.5" aria-hidden />
                      </>
                    )}
                  </Link>
                </li>
              );
            })}
          </ul>
        </OwnerPanel>
      ) : null}

      <div className="grid gap-6 xl:grid-cols-2">
        <OwnerPanel title="Division health" description="Current state from the central command center.">
          <div className="grid gap-3 text-sm text-[var(--acct-muted)] sm:grid-cols-2">
            <div>Health: {data.division.healthScore} / 100</div>
            <div>Revenue: {formatCurrencyAmount(data.finance.revenueNaira)}</div>
            <div>Open work: {data.division.workOpen}</div>
            <div>Support pressure: {data.division.supportOpen}</div>
            <div>Staff assigned: {data.division.staffingCount}</div>
            <div>Pending onboarding: {data.division.onboardingPending}</div>
          </div>
        </OwnerPanel>

        <OwnerPanel title="Local signals" description="Only this division’s evidence-backed alerts.">
          <div className="space-y-3">
            {data.division.signals.map((signal) => (
              <div key={signal.id} className="rounded-[1.2rem] border border-[var(--acct-line)] bg-[var(--acct-bg-soft)] p-4">
                <div className="flex items-center justify-between gap-3">
                  <div className="text-sm font-semibold text-[var(--acct-ink)]">{signal.title}</div>
                  <DivisionBadge division={data.division.slug} />
                </div>
                <p className="mt-2 text-sm leading-6 text-[var(--acct-muted)]">{signal.body}</p>
              </div>
            ))}
          </div>
        </OwnerPanel>
      </div>

      <div className="grid gap-6 xl:grid-cols-2">
        <OwnerPanel title="Assigned staff" description="Auth-backed workforce members currently scoped to this division.">
          <div className="space-y-3">
            {data.workforce.map((member) => (
              <div key={member.id} className="rounded-[1.2rem] border border-[var(--acct-line)] bg-[var(--acct-bg-soft)] px-4 py-3">
                <div className="flex items-center justify-between gap-3">
                  <div>
                    <div className="text-sm font-semibold text-[var(--acct-ink)]">{member.fullName}</div>
                    <div className="mt-1 text-xs uppercase tracking-wide text-[var(--acct-muted)]">{member.role}</div>
                  </div>
                  <StatusBadge status={member.status} />
                </div>
              </div>
            ))}
          </div>
        </OwnerPanel>

        <OwnerPanel title="Recent activity" description="Shared activity, support, and notification telemetry for this division.">
          <div className="space-y-3">
            {data.division.recentActivity.map((item) => (
              <div key={item.id} className="rounded-[1.2rem] border border-[var(--acct-line)] bg-[var(--acct-bg-soft)] px-4 py-3">
                <div className="text-sm font-semibold text-[var(--acct-ink)]">{item.title}</div>
                <p className="mt-1 text-sm text-[var(--acct-muted)]">{item.description}</p>
                <div className="mt-2 text-xs text-[var(--acct-muted)]">{item.createdAt ? timeAgo(item.createdAt) : "Unknown time"}</div>
              </div>
            ))}
          </div>
        </OwnerPanel>
      </div>
    </div>
  );
}
