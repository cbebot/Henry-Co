import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { formatCurrency } from "@/lib/env";
import {
  createProjectFromProposalAction,
} from "@/lib/studio/actions";
import { getStudioViewer, viewerHasRole } from "@/lib/studio/auth";
import { getProposalWorkspace } from "@/lib/studio/data";
import { StudioSubmitButton } from "@/components/studio/submit-button";

export default async function ProposalDetailPage({
  params,
  searchParams,
}: {
  params: Promise<{ proposalId: string }>;
  searchParams: Promise<{ access?: string }>;
}) {
  const viewer = await getStudioViewer();
  const { proposalId } = await params;
  const { access } = await searchParams;
  const workspace = await getProposalWorkspace({
    proposalId,
    accessKey: access || null,
    viewer,
  });

  if (!workspace) {
    if (!viewer.user && !access) {
      redirect(`/login?next=${encodeURIComponent(`/proposals/${proposalId}`)}`);
    }
    notFound();
  }

  const { proposal, lead, brief, customRequest, service, package: pkg, team, project } = workspace;

  return (
    <main className="mx-auto max-w-[88rem] px-5 py-10 sm:px-8 lg:px-10">
      <section className="studio-panel studio-mesh rounded-[2.4rem] px-7 py-10 sm:px-10 lg:px-14">
        <div className="flex flex-wrap items-start justify-between gap-5">
          <div className="max-w-3xl">
            <div className="studio-kicker">Proposal</div>
            <h1 className="studio-heading mt-4">{proposal.title}</h1>
            <p className="mt-5 text-lg leading-8 text-[var(--studio-ink-soft)]">{proposal.summary}</p>
          </div>
          <div className="rounded-[1.75rem] border border-[var(--studio-line)] bg-black/10 p-5">
            <div className="text-xs uppercase tracking-[0.16em] text-[var(--studio-signal)]">Investment</div>
            <div className="mt-2 text-3xl font-semibold text-[var(--studio-ink)]">
              {formatCurrency(proposal.investment, proposal.currency)}
            </div>
            <div className="mt-2 text-sm text-[var(--studio-ink-soft)]">
              Deposit {formatCurrency(proposal.depositAmount, proposal.currency)}
            </div>
          </div>
        </div>
      </section>

      <section className="mt-10 grid gap-6 lg:grid-cols-[0.72fr_1.28fr]">
        <article className="studio-panel rounded-[1.75rem] p-6">
          <div className="studio-kicker">Brief summary</div>
          <div className="mt-5 space-y-3 text-sm leading-7 text-[var(--studio-ink-soft)]">
            <div>Client: {lead?.customerName || "Studio client"}</div>
            <div>Service: {service?.name || proposal.serviceId}</div>
            <div>Recommended team: {team?.name || proposal.teamId || "Assigned during sales review"}</div>
            <div>Package: {pkg?.name || "Custom scope"}</div>
            <div>Status: {proposal.status.replaceAll("_", " ")}</div>
          </div>
          {brief ? (
            <div className="mt-6 rounded-[1.4rem] border border-[var(--studio-line)] bg-black/10 p-5">
              <div className="text-xs uppercase tracking-[0.16em] text-[var(--studio-signal)]">Goals</div>
              <p className="mt-2 text-sm leading-7 text-[var(--studio-ink-soft)]">{brief.goals}</p>
            </div>
          ) : null}
          {customRequest ? (
            <div className="mt-6 rounded-[1.4rem] border border-[var(--studio-line)] bg-black/10 p-5">
              <div className="text-xs uppercase tracking-[0.16em] text-[var(--studio-signal)]">Custom request profile</div>
              <div className="mt-3 space-y-2 text-sm leading-7 text-[var(--studio-ink-soft)]">
                <div>Project type: {customRequest.projectType}</div>
                <div>Platform: {customRequest.platformPreference}</div>
                <div>Design direction: {customRequest.designDirection}</div>
                {customRequest.pageRequirements.length > 0 ? (
                  <div>Pages and interfaces: {customRequest.pageRequirements.join(", ")}</div>
                ) : null}
                {customRequest.addonServices.length > 0 ? (
                  <div>Add-ons: {customRequest.addonServices.join(", ")}</div>
                ) : null}
              </div>
            </div>
          ) : null}
          <div className="mt-6 flex flex-wrap gap-3">
            {project ? (
              <Link href={`/project/${project.id}?access=${project.accessKey}`} className="studio-button-primary rounded-full px-5 py-3 text-sm font-semibold">
                Open active project
              </Link>
            ) : viewerHasRole(viewer, ["studio_owner", "sales_consultation"]) ? (
              <form action={createProjectFromProposalAction}>
                <input type="hidden" name="proposalId" value={proposal.id} />
                <StudioSubmitButton label="Create project workspace" pendingLabel="Creating workspace..." />
              </form>
            ) : (
              <Link href="/login" className="studio-button-primary rounded-full px-5 py-3 text-sm font-semibold">
                Sign in to continue
              </Link>
            )}
          </div>
        </article>

        <article className="studio-panel rounded-[1.75rem] p-6">
          <div className="studio-kicker">Scope and milestones</div>
          <div className="mt-5 grid gap-4 md:grid-cols-2">
            {proposal.milestones.map((milestone) => (
              <div key={milestone.id} className="rounded-[1.4rem] border border-[var(--studio-line)] bg-black/10 p-5">
                <div className="flex items-start justify-between gap-4">
                  <div className="font-semibold text-[var(--studio-ink)]">{milestone.name}</div>
                  <div className="text-sm text-[var(--studio-signal)]">
                    {formatCurrency(milestone.amount, proposal.currency)}
                  </div>
                </div>
                <p className="mt-3 text-sm leading-7 text-[var(--studio-ink-soft)]">{milestone.description}</p>
                <div className="mt-3 text-xs uppercase tracking-[0.16em] text-[var(--studio-ink-soft)]">
                  {milestone.dueLabel}
                </div>
              </div>
            ))}
          </div>

          <div className="mt-6 rounded-[1.4rem] border border-[var(--studio-line)] bg-black/10 p-5">
            <div className="text-xs uppercase tracking-[0.16em] text-[var(--studio-signal)]">Comparison notes</div>
            <div className="mt-4 space-y-3 text-sm leading-7 text-[var(--studio-ink-soft)]">
              {proposal.comparisonNotes.map((note) => (
                <div key={note}>• {note}</div>
              ))}
            </div>
          </div>
        </article>
      </section>
    </main>
  );
}
