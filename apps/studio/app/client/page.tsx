import Link from "next/link";
import { formatCurrency } from "@/lib/env";
import { requireStudioUser } from "@/lib/studio/auth";
import { studioClientSnapshot } from "@/lib/studio/data";
import { clientNav } from "@/lib/studio/navigation";
import { getStudioSnapshot } from "@/lib/studio/store";
import { clientProjectStatusLabel, friendlyMilestoneStatus } from "@/lib/studio/project-workspace-copy";
import {
  StudioEmptyState,
  StudioMetricCard,
  StudioWorkspaceShell,
} from "@/components/studio/workspace/shell";

export default async function ClientDashboardPage() {
  const viewer = await requireStudioUser("/client");
  const snapshot = await getStudioSnapshot();
  const clientData = studioClientSnapshot(viewer, snapshot);

  return (
    <StudioWorkspaceShell
      kicker="Client workspace"
      title="Track active proposals, payments, files, and delivery checkpoints."
      description="This is the Studio surface clients use to see what is happening, what is due, and what the team needs next."
      nav={clientNav("/client")}
      actions={
        <Link href="/request" className="studio-button-primary rounded-full px-5 py-3 text-sm font-semibold">
          Request another project
        </Link>
      }
    >
      <section className="grid gap-4 md:grid-cols-3">
        <StudioMetricCard
          label="Projects"
          value={String(clientData.projects.length)}
          hint="Every active or recently delivered Studio engagement tied to your account."
        />
        <StudioMetricCard
          label="Open payments"
          value={String(clientData.payments.filter((payment) => payment.status !== "paid").length)}
          hint="Deposit and milestone checkpoints still awaiting confirmation."
        />
        <StudioMetricCard
          label="Deliverables"
          value={String(clientData.deliverables.length)}
          hint="Shared file batches and handoff packages already released into the workspace."
        />
      </section>

      {clientData.projects.length === 0 && clientData.proposals.length === 0 ? (
        <StudioEmptyState
          title="No Studio activity yet"
          body="Once you submit a brief or accept a proposal, your workspace will show project progress, milestone status, payment rails, files, and conversations here."
          action={
            <Link href="/request" className="studio-button-primary rounded-full px-5 py-3 text-sm font-semibold">
              Open the brief builder
            </Link>
          }
        />
      ) : null}

      {clientData.projects.length > 0 ? (
        <section className="studio-panel rounded-[1.75rem] p-6">
          <div className="studio-kicker">Projects</div>
          <div className="mt-5 space-y-4">
            {clientData.projects.map((project) => (
              <article key={project.id} className="rounded-[1.5rem] border border-[var(--studio-line)] bg-black/10 p-5">
                <div className="flex flex-wrap items-start justify-between gap-4">
                  <div className="max-w-3xl">
                    <h3 className="text-2xl font-semibold tracking-[-0.04em] text-[var(--studio-ink)]">
                      {project.title}
                    </h3>
                    <p className="mt-2 text-sm leading-7 text-[var(--studio-ink-soft)]">{project.summary}</p>
                    <p className="mt-3 text-sm text-[var(--studio-signal)]">{project.nextAction}</p>
                  </div>
                  <div className="rounded-full border border-[var(--studio-line)] px-3 py-1 text-xs uppercase tracking-[0.16em] text-[var(--studio-ink-soft)]">
                    {clientProjectStatusLabel(project.status)}
                  </div>
                </div>
                <div className="mt-5 flex flex-wrap gap-2">
                  {project.milestones.map((milestone) => (
                    <span key={milestone.id} className="rounded-full border border-[var(--studio-line)] px-3 py-1 text-xs text-[var(--studio-ink-soft)]">
                      {milestone.name} · {friendlyMilestoneStatus(milestone.status)}
                    </span>
                  ))}
                </div>
                <div className="mt-5">
                  <Link href={`/project/${project.id}?access=${project.accessKey}`} className="studio-button-primary rounded-full px-5 py-3 text-sm font-semibold">
                    Open project
                  </Link>
                </div>
              </article>
            ))}
          </div>
        </section>
      ) : null}

      {clientData.proposals.length > 0 ? (
        <section className="studio-panel rounded-[1.75rem] p-6">
          <div className="studio-kicker">Proposals</div>
          <div className="mt-5 grid gap-4 lg:grid-cols-2">
            {clientData.proposals.map((proposal) => (
              <article key={proposal.id} className="rounded-[1.5rem] border border-[var(--studio-line)] bg-black/10 p-5">
                <h3 className="text-xl font-semibold text-[var(--studio-ink)]">{proposal.title}</h3>
                <p className="mt-2 text-sm leading-7 text-[var(--studio-ink-soft)]">{proposal.summary}</p>
                <div className="mt-4 text-2xl font-semibold text-[var(--studio-ink)]">
                  {formatCurrency(proposal.investment, proposal.currency)}
                </div>
                <div className="mt-4">
                  <Link href={`/proposals/${proposal.id}?access=${proposal.accessKey}`} className="studio-button-secondary rounded-full px-5 py-3 text-sm font-semibold">
                    Review proposal
                  </Link>
                </div>
              </article>
            ))}
          </div>
        </section>
      ) : null}
    </StudioWorkspaceShell>
  );
}
