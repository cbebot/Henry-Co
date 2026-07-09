import type { Metadata } from "next";

import { requireAccountUser } from "@/lib/auth";
import { DivisionResumeChip } from "@/components/recovery/DivisionResumeChip";
import { getStudioDashboardData } from "@/lib/studio-module";
import { getDivisionActivity } from "@/lib/division-data";
import { getAccountAppLocale } from "@/lib/locale-server";
import { formatAccountTemplate, getAccountCopy } from "@henryco/i18n";
import {
  HeroCard,
  EmptyStateCard,
  NextStepRow,
  DivisionLanding,
  type HeroCardTile,
  type HeroCardBreakdownRow,
} from "@henryco/dashboard-shell/surfaces";

import "@/components/studio/styles.css";
import { StudioProjects } from "@/components/studio/StudioProjects";
import { StudioPayments } from "@/components/studio/StudioPayments";
import { StudioActivity } from "@/components/studio/StudioActivity";
import {
  STUDIO_ORIGIN,
  heroState,
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

/**
 * Studio landing.
 *
 * ACCOUNT-PREMIUM-01 (session 2, Phase 2B). Lifts StudioHero into the shared
 * <HeroCard /> primitive. Surfaces top-project nextAction via NextStepRow.
 */
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
  const state = heroState(stats);

  // ── Resolve hero copy ────────────────────────────────────────────
  const sliceState = studioCopy.hero.state;
  let heroHeadline: string;
  let heroBlurb: string;
  let heroCtaPrimary: { label: string; href: string };
  let heroCtaSecondary: { label: string; href: string };
  if (state === "empty") {
    heroHeadline = sliceState.empty.headline;
    heroBlurb = sliceState.empty.blurb;
    heroCtaPrimary = { label: sliceState.empty.ctaPrimary, href: `${STUDIO_ORIGIN}/request` };
    heroCtaSecondary = { label: sliceState.empty.ctaSecondary, href: STUDIO_ORIGIN };
  } else if (state === "attention") {
    const count = stats.overduePayments;
    heroHeadline = formatAccountTemplate(
      count === 1
        ? sliceState.attention.headlineTemplateSingular
        : sliceState.attention.headlineTemplatePlural,
      { count },
    );
    heroBlurb = sliceState.attention.blurb;
    heroCtaPrimary = { label: sliceState.attention.ctaPrimary, href: "#studio-payments" };
    heroCtaSecondary = { label: sliceState.attention.ctaSecondary, href: STUDIO_ORIGIN };
  } else if (state === "active") {
    if (stats.readyReview > 0) {
      const count = stats.readyReview;
      heroHeadline = formatAccountTemplate(
        count === 1
          ? sliceState.activeReady.headlineTemplateSingular
          : sliceState.activeReady.headlineTemplatePlural,
        { count },
      );
      heroBlurb = sliceState.activeReady.blurb;
      heroCtaPrimary = { label: sliceState.activeReady.ctaPrimary, href: "#studio-projects" };
      heroCtaSecondary = { label: sliceState.activeReady.ctaSecondary, href: STUDIO_ORIGIN };
    } else {
      const count = stats.metrics.activeProjects;
      heroHeadline = formatAccountTemplate(
        count === 1
          ? sliceState.activeProjects.headlineTemplateSingular
          : sliceState.activeProjects.headlineTemplatePlural,
        { count },
      );
      heroBlurb = sliceState.activeProjects.blurb;
      heroCtaPrimary = { label: sliceState.activeProjects.ctaPrimary, href: STUDIO_ORIGIN };
      heroCtaSecondary = { label: sliceState.activeProjects.ctaSecondary, href: `${STUDIO_ORIGIN}/request` };
    }
  } else {
    const count = stats.totalProjects;
    heroHeadline = formatAccountTemplate(
      count === 1
        ? sliceState.calm.headlineTemplateSingular
        : sliceState.calm.headlineTemplatePlural,
      { count },
    );
    heroBlurb = sliceState.calm.blurb;
    heroCtaPrimary = { label: sliceState.calm.ctaPrimary, href: STUDIO_ORIGIN };
    heroCtaSecondary = { label: sliceState.calm.ctaSecondary, href: `${STUDIO_ORIGIN}/request` };
  }

  // ── HeroCard tiles ───────────────────────────────────────────────
  const tiles: ReadonlyArray<HeroCardTile> = [
    {
      label: studioCopy.hero.tiles.activeLabel,
      value: stats.metrics.activeProjects,
      foot:
        stats.metrics.activeProjects === 0
          ? studioCopy.hero.tiles.activeFootEmpty
          : studioCopy.hero.tiles.activeFootHasValue,
      tone: stats.metrics.activeProjects > 0 ? "active" : "default",
    },
    {
      label: studioCopy.hero.tiles.pendingLabel,
      value: stats.metrics.pendingPayments,
      foot:
        stats.metrics.pendingPayments === 0
          ? studioCopy.hero.tiles.pendingFootEmpty
          : studioCopy.hero.tiles.pendingFootHasValue,
      tone: stats.metrics.pendingPayments > 0 ? "warning" : "default",
    },
    {
      label: studioCopy.hero.tiles.proofLabel,
      value: stats.metrics.proofSubmitted,
      foot:
        stats.metrics.proofSubmitted === 0
          ? studioCopy.hero.tiles.proofFootEmpty
          : studioCopy.hero.tiles.proofFootHasValue,
    },
    {
      label: studioCopy.hero.tiles.deliverablesLabel,
      value: stats.metrics.deliverables,
      foot:
        stats.metrics.deliverables === 0
          ? studioCopy.hero.tiles.deliverablesFootEmpty
          : studioCopy.hero.tiles.deliverablesFootHasValue,
    },
  ];

  const breakdownAll: ReadonlyArray<HeroCardBreakdownRow> = [
    {
      label: studioCopy.hero.breakdown.active,
      count: stats.metrics.activeProjects,
      color: "var(--acct-gold)",
    },
    {
      label: studioCopy.hero.breakdown.readyReview,
      count: stats.readyReview,
      color: "var(--acct-blue)",
    },
    {
      label: studioCopy.hero.breakdown.pendingPayment,
      count: stats.metrics.pendingPayments,
      color: "var(--acct-purple)",
    },
    {
      label: studioCopy.hero.breakdown.proofSubmitted,
      count: stats.metrics.proofSubmitted,
      color: "var(--acct-green)",
    },
  ];
  const breakdown = breakdownAll.filter((row) => row.count > 0);

  // ── NextStepRow ──────────────────────────────────────────────────
  let nextStep: React.ReactNode = null;
  if (stats.topProject?.nextAction) {
    const tone: "attention" | "neutral" =
      stats.topProjectKind === "issue" || stats.topProjectKind === "ready_review"
        ? "attention"
        : "neutral";
    nextStep = (
      <NextStepRow
        tone={tone}
        kicker={studioCopy.sections.projectsTitle}
        title={stats.topProject.title}
        detail={stats.topProject.nextAction}
        cta={{
          label: studioCopy.hero.state.activeProjects.ctaPrimary,
          href: "#studio-projects",
        }}
      />
    );
  }

  const projectsMeta =
    projects.length === 0
      ? studioCopy.sections.projectsMetaEmpty
      : formatAccountTemplate(
          projects.length === 1
            ? studioCopy.sections.projectsMetaTemplateSingular
            : studioCopy.sections.projectsMetaTemplatePlural,
          { count: projects.length },
        );

  const paymentsMeta =
    payments.length === 0
      ? studioCopy.sections.paymentsMetaEmpty
      : formatAccountTemplate(
          payments.length === 1
            ? studioCopy.sections.paymentsMetaTemplateSingular
            : studioCopy.sections.paymentsMetaTemplatePlural,
          { count: payments.length },
        );

  const activityMeta =
    activityRows.length === 0
      ? studioCopy.sections.activityMetaEmpty
      : formatAccountTemplate(
          activityRows.length === 1
            ? studioCopy.sections.activityMetaTemplateSingular
            : studioCopy.sections.activityMetaTemplatePlural,
          { count: activityRows.length },
        );

  const heroTone: "calm" | "active" | "attention" | "empty" =
    state === "empty"
      ? "empty"
      : state === "attention"
        ? "attention"
        : state === "active"
          ? "active"
          : "calm";

  return (
    <DivisionLanding
      className="acct-stu acct-fade-in"
      hero={
        <HeroCard
          variant="paired"
          tone={heroTone}
          eyebrow={studioCopy.hero.eyebrowLive}
          headline={heroHeadline}
          blurb={heroBlurb}
          ariaLabel={studioCopy.hero.overviewAriaLabel}
          ariaTilesLabel={studioCopy.hero.activityAriaLabel}
          ctaPrimary={heroCtaPrimary}
          ctaSecondary={heroCtaSecondary}
          tiles={tiles}
          side={{
            kicker: studioCopy.hero.sideLabel,
            title: studioCopy.hero.sideTitle,
            body: studioCopy.hero.sideBody,
            breakdown:
              breakdown.length > 0
                ? {
                    label: studioCopy.hero.breakdownLabel,
                    rows: breakdown,
                    ariaLabel: studioCopy.hero.breakdownAriaLabel,
                  }
                : undefined,
          }}
        />
      }
      nextStep={
        <>
          {/* SP6: division-scoped resume chip — renders only when a REAL pending journey exists here. */}
          <DivisionResumeChip division="studio" userId={user.id} />
          {nextStep}
        </>
      }
      sections={[
        {
          id: "studio-projects",
          title: studioCopy.sections.projectsTitle,
          meta: projectsMeta,
          content:
            projects.length === 0 ? (
              <EmptyStateCard
                kicker={studioCopy.sections.projectsTitle}
                title={studioCopy.empty.projectsTitle}
                body={studioCopy.empty.projectsBody}
              />
            ) : (
              <StudioProjects projects={projects} copy={studioCopy} />
            ),
        },
        {
          id: "studio-payments",
          title: studioCopy.sections.paymentsTitle,
          meta: paymentsMeta,
          content:
            payments.length === 0 ? (
              <EmptyStateCard
                kicker={studioCopy.sections.paymentsTitle}
                title={studioCopy.empty.paymentsTitle}
                body={studioCopy.empty.paymentsBody}
              />
            ) : (
              <StudioPayments payments={payments} copy={studioCopy} locale={locale} />
            ),
        },
        {
          id: "studio-activity",
          title: studioCopy.sections.activityTitle,
          meta: activityMeta,
          content:
            activityRows.length === 0 ? (
              <EmptyStateCard
                kicker={studioCopy.sections.activityTitle}
                title={studioCopy.empty.activityTitle}
                body={studioCopy.empty.activityBody}
              />
            ) : (
              <StudioActivity
                activity={activityRows}
                ariaLabel={studioCopy.sections.activityAriaLabel}
                copy={studioCopy}
                locale={locale}
              />
            ),
        },
      ]}
    />
  );
}
