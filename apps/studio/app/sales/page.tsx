import Link from "next/link";
import { formatCurrency } from "@/lib/env";
import { requireStudioRoles } from "@/lib/studio/auth";
import { salesNav } from "@/lib/studio/navigation";
import { getStudioSnapshot } from "@/lib/studio/store";
import {
  StudioMetricCard,
  StudioWorkspaceShell,
} from "@/components/studio/workspace/shell";

export default async function SalesDashboardPage() {
  await requireStudioRoles(["studio_owner", "sales_consultation"], "/sales");
  const snapshot = await getStudioSnapshot();

  return (
    <StudioWorkspaceShell
      kicker="Sales console"
      title="Manage leads, qualify briefs, and move proposals into funded projects."
      description="The sales surface turns raw demand into scoped, tracked, and payment-aware Studio engagements."
      nav={salesNav("/sales")}
      actions={
        <Link href="/request" className="studio-button-primary rounded-full px-5 py-3 text-sm font-semibold">
          New brief
        </Link>
      }
    >
      <section className="grid gap-4 md:grid-cols-4">
        <StudioMetricCard label="Leads" value={String(snapshot.leads.length)} hint="Every captured inquiry in the Studio pipeline." />
        <StudioMetricCard label="Proposal sent" value={String(snapshot.proposals.filter((item) => item.status === "sent").length)} hint="Active quotes awaiting client action." />
        <StudioMetricCard label="Won" value={String(snapshot.leads.filter((item) => item.status === "won").length)} hint="Leads already converted into paid or pending projects." />
        <StudioMetricCard label="Pipeline value" value={formatCurrency(snapshot.proposals.reduce((sum, item) => sum + item.investment, 0))} hint="Aggregate visible proposal value across the current pipeline." />
      </section>

      <section className="studio-panel rounded-[1.75rem] p-6">
        <div className="studio-kicker">Priority leads</div>
        <div className="mt-5 space-y-4">
          {snapshot.leads
            .slice()
            .sort((left, right) => right.readinessScore - left.readinessScore)
            .map((lead) => {
              const proposal = snapshot.proposals.find((item) => item.leadId === lead.id);
              return (
                <article key={lead.id} className="rounded-[1.5rem] border border-[var(--studio-line)] bg-black/10 p-5">
                  <div className="flex flex-wrap items-start justify-between gap-4">
                    <div>
                      <h3 className="text-xl font-semibold text-[var(--studio-ink)]">{lead.customerName}</h3>
                      <p className="mt-2 text-sm text-[var(--studio-ink-soft)]">
                        {lead.serviceKind.replaceAll("_", " ")} · {lead.businessType} · {lead.budgetBand}
                      </p>
                    </div>
                    <div className="rounded-full border border-[var(--studio-line)] px-3 py-1 text-xs uppercase tracking-[0.16em] text-[var(--studio-signal)]">
                      Readiness {lead.readinessScore}
                    </div>
                  </div>
                  <div className="mt-4 flex flex-wrap gap-2">
                    <span className="rounded-full border border-[var(--studio-line)] px-3 py-1 text-xs text-[var(--studio-ink-soft)]">
                      Status · {lead.status.replaceAll("_", " ")}
                    </span>
                    {lead.matchedTeamId ? (
                      <span className="rounded-full border border-[var(--studio-line)] px-3 py-1 text-xs text-[var(--studio-ink-soft)]">
                        Matched team · {lead.matchedTeamId}
                      </span>
                    ) : null}
                  </div>
                  {proposal ? (
                    <div className="mt-5">
                      <Link href={`/proposals/${proposal.id}?access=${proposal.accessKey}`} className="studio-button-secondary rounded-full px-5 py-3 text-sm font-semibold">
                        Open proposal
                      </Link>
                    </div>
                  ) : null}
                </article>
              );
            })}
        </div>
      </section>
    </StudioWorkspaceShell>
  );
}
