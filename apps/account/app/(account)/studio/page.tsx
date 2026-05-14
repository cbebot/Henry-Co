import { requireAccountUser } from "@/lib/auth";
import { getStudioDashboardData } from "@/lib/studio-module";
import { getDivisionActivity } from "@/lib/division-data";

import "@/components/studio/styles.css";
import { StudioHero } from "@/components/studio/StudioHero";
import { StudioProjects } from "@/components/studio/StudioProjects";
import { StudioPayments } from "@/components/studio/StudioPayments";
import { StudioActivity } from "@/components/studio/StudioActivity";
import {
  studioStats,
  toStudioActivityRows,
  type PaymentRow,
  type ProjectRow,
  type ProposalRow,
} from "@/components/studio/helpers";

export const dynamic = "force-dynamic";

export default async function StudioPage() {
  const user = await requireAccountUser();
  const [data, activityRaw] = await Promise.all([
    getStudioDashboardData(user.id, user.email),
    getDivisionActivity(user.id, "studio"),
  ]);

  const projects: ProjectRow[] = data.projects.map((p) => ({
    id: p.id,
    title: p.title,
    status: p.status,
    nextAction: p.nextAction,
    milestoneProgress: p.milestoneProgress,
    approvedMilestones: p.approvedMilestones,
    totalMilestones: p.totalMilestones,
    openPayments: p.openPayments,
    deliverables: p.deliverables,
    latestPaymentStatus: p.latestPaymentStatus,
    latestUpdate: p.latestUpdate
      ? { summary: p.latestUpdate.summary, createdAt: p.latestUpdate.createdAt }
      : null,
    updatedAt: p.updatedAt,
  }));

  const payments: PaymentRow[] = data.payments.map((p) => ({
    id: p.id,
    label: p.label,
    amount: p.amount,
    currency: p.currency,
    status: p.status,
    method: p.method,
    dueDate: p.dueDate,
    proofUrl: p.proofUrl,
    updatedAt: p.updatedAt,
  }));

  const proposals: ProposalRow[] = data.proposals.map((p) => ({
    id: p.id,
    title: p.title,
    status: p.status,
    investment: p.investment,
    depositAmount: p.depositAmount,
    currency: p.currency,
    validUntil: p.validUntil,
    projectId: p.projectId,
  }));

  const stats = studioStats({ projects, payments, proposals, metrics: data.metrics });
  const activityRows = toStudioActivityRows(activityRaw);

  return (
    <div className="acct-stu acct-fade-in">
      <StudioHero stats={stats} />

      <section id="studio-projects" aria-labelledby="acct-stu-projects">
        <div className="acct-stu__section-head">
          <h2 id="acct-stu-projects" className="acct-stu__section-title">
            Project rooms
          </h2>
          <span className="acct-stu__section-meta">
            {projects.length === 0
              ? "Workspaces appear here when a Studio engagement goes live."
              : `${projects.length} project${projects.length === 1 ? "" : "s"} · sorted by latest movement`}
          </span>
        </div>
        {projects.length === 0 ? (
          <div className="acct-stu__empty">
            <strong>No Studio workspaces linked yet</strong>
            As soon as a proposal or project is created with your HenryCo identity, the synced Studio room will appear here — milestones, payments, deliverables, and the next move.
          </div>
        ) : (
          <StudioProjects projects={projects} />
        )}
      </section>

      <section id="studio-payments" aria-labelledby="acct-stu-payments">
        <div className="acct-stu__section-head">
          <h2 id="acct-stu-payments" className="acct-stu__section-title">
            Payment checkpoints
          </h2>
          <span className="acct-stu__section-meta">
            {payments.length === 0
              ? "Studio payment requests appear here when a proposal or project is live."
              : `${payments.length} checkpoint${payments.length === 1 ? "" : "s"} · proof upload + approval status`}
          </span>
        </div>
        {payments.length === 0 ? (
          <div className="acct-stu__empty">
            <strong>No payment checkpoints yet</strong>
            Commercial milestones — deposit, mid-project, and delivery — surface here once a proposal goes live with you.
          </div>
        ) : (
          <StudioPayments payments={payments} />
        )}
      </section>

      <section aria-labelledby="acct-stu-activity">
        <div className="acct-stu__section-head">
          <h2 id="acct-stu-activity" className="acct-stu__section-title">
            Recent activity
          </h2>
          <span className="acct-stu__section-meta">
            {activityRows.length === 0
              ? "Project updates, payment proofs, and milestone approvals mirror here."
              : `${activityRows.length} update${activityRows.length === 1 ? "" : "s"} · most recent first`}
          </span>
        </div>
        {activityRows.length === 0 ? (
          <div className="acct-stu__empty">
            <strong>No Studio activity yet</strong>
            Project updates, payment proofs, deliverable releases, and milestone approvals will appear here as they happen.
          </div>
        ) : (
          <StudioActivity activity={activityRows} ariaLabel="Studio activity" />
        )}
      </section>
    </div>
  );
}
