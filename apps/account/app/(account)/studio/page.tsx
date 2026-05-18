import type { Metadata } from "next";

import { requireAccountUser } from "@/lib/auth";
import { getStudioDashboardData } from "@/lib/studio-module";
import { getDivisionActivity } from "@/lib/division-data";
import { getAccountAppLocale } from "@/lib/locale-server";
import { formatAccountTemplate, getAccountCopy } from "@henryco/i18n";

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

export async function generateMetadata(): Promise<Metadata> {
  const locale = await getAccountAppLocale();
  const copy = getAccountCopy(locale);
  return {
    title: copy.divisionStudio.metadata.title,
    description: copy.divisionStudio.metadata.description,
  };
}

export default async function StudioPage() {
  const user = await requireAccountUser();
  const locale = await getAccountAppLocale();
  const copy = getAccountCopy(locale);
  const studioCopy = copy.divisionStudio;

  const [data, activityRaw] = await Promise.all([
    getStudioDashboardData(user.id, user.email),
    getDivisionActivity(user.id, "studio", 20, locale),
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

  const projectsMeta = projects.length === 0
    ? studioCopy.sections.projectsMetaEmpty
    : formatAccountTemplate(
        projects.length === 1
          ? studioCopy.sections.projectsMetaTemplateSingular
          : studioCopy.sections.projectsMetaTemplatePlural,
        { count: projects.length },
      );

  const paymentsMeta = payments.length === 0
    ? studioCopy.sections.paymentsMetaEmpty
    : formatAccountTemplate(
        payments.length === 1
          ? studioCopy.sections.paymentsMetaTemplateSingular
          : studioCopy.sections.paymentsMetaTemplatePlural,
        { count: payments.length },
      );

  const activityMeta = activityRows.length === 0
    ? studioCopy.sections.activityMetaEmpty
    : formatAccountTemplate(
        activityRows.length === 1
          ? studioCopy.sections.activityMetaTemplateSingular
          : studioCopy.sections.activityMetaTemplatePlural,
        { count: activityRows.length },
      );

  return (
    <div className="acct-stu acct-fade-in">
      <StudioHero stats={stats} locale={locale} copy={studioCopy} />

      <section id="studio-projects" aria-labelledby="acct-stu-projects">
        <div className="acct-stu__section-head">
          <h2 id="acct-stu-projects" className="acct-stu__section-title">
            {studioCopy.sections.projectsTitle}
          </h2>
          <span className="acct-stu__section-meta">{projectsMeta}</span>
        </div>
        {projects.length === 0 ? (
          <div className="acct-stu__empty">
            <strong>{studioCopy.empty.projectsTitle}</strong>
            {studioCopy.empty.projectsBody}
          </div>
        ) : (
          <StudioProjects projects={projects} copy={studioCopy} />
        )}
      </section>

      <section id="studio-payments" aria-labelledby="acct-stu-payments">
        <div className="acct-stu__section-head">
          <h2 id="acct-stu-payments" className="acct-stu__section-title">
            {studioCopy.sections.paymentsTitle}
          </h2>
          <span className="acct-stu__section-meta">{paymentsMeta}</span>
        </div>
        {payments.length === 0 ? (
          <div className="acct-stu__empty">
            <strong>{studioCopy.empty.paymentsTitle}</strong>
            {studioCopy.empty.paymentsBody}
          </div>
        ) : (
          <StudioPayments payments={payments} copy={studioCopy} locale={locale} />
        )}
      </section>

      <section aria-labelledby="acct-stu-activity">
        <div className="acct-stu__section-head">
          <h2 id="acct-stu-activity" className="acct-stu__section-title">
            {studioCopy.sections.activityTitle}
          </h2>
          <span className="acct-stu__section-meta">{activityMeta}</span>
        </div>
        {activityRows.length === 0 ? (
          <div className="acct-stu__empty">
            <strong>{studioCopy.empty.activityTitle}</strong>
            {studioCopy.empty.activityBody}
          </div>
        ) : (
          <StudioActivity
            activity={activityRows}
            ariaLabel={studioCopy.sections.activityAriaLabel}
            copy={studioCopy}
            locale={locale}
          />
        )}
      </section>
    </div>
  );
}
