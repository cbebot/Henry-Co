import { getDivisionUrl } from "@henryco/config";
import {
  formatAccountTemplate,
  getAccountCopy,
} from "@henryco/i18n/server";
import type { AccountCopy } from "@henryco/i18n/server";
import {
  HeroCard,
  EmptyStateCard,
  NextStepRow,
  DivisionLanding,
  type HeroCardTile,
  type HeroCardBreakdownRow,
} from "@henryco/dashboard-shell/surfaces";

import { requireAccountUser } from "@/lib/auth";
import { DivisionResumeChip } from "@/components/recovery/DivisionResumeChip";
import { getDivisionActivity } from "@/lib/division-data";
import { getLearnAccountSummary } from "@/lib/learn-module";
import { getAccountAppLocale } from "@/lib/locale-server";

import "@/components/learn/styles.css";
import { LearnCourses } from "@/components/learn/LearnCourses";
import { LearnExtras } from "@/components/learn/LearnExtras";
import { LearnActivity } from "@/components/learn/LearnActivity";
import {
  heroState,
  learnStats,
  toLearnActivityRows,
  type AssignmentRow,
  type CertificateRow,
  type CourseRow,
  type LearnLocale,
  type LearnStats,
  type SavedCourseRow,
  type TeacherApplication,
} from "@/components/learn/helpers";

export const dynamic = "force-dynamic";

type DivisionLearnCopy = AccountCopy["divisionLearn"];

export async function generateMetadata() {
  const locale = await getAccountAppLocale();
  const copy = getAccountCopy(locale);
  return {
    title: copy.divisionLearn.metadata.title,
    description: copy.divisionLearn.metadata.description,
  };
}

function buildHeroHeadline(
  state: "empty" | "calm" | "active",
  stats: LearnStats,
  copy: DivisionLearnCopy,
) {
  if (state === "empty") {
    return {
      headline: copy.hero.state.empty.headline,
      blurb: copy.hero.state.empty.blurb,
    };
  }
  if (state === "active") {
    const count = stats.metrics.activeCourses;
    const template =
      count === 1
        ? copy.hero.state.active.headlineTemplateSingular
        : copy.hero.state.active.headlineTemplatePlural;
    return {
      headline: formatAccountTemplate(template, { count }),
      blurb: copy.hero.state.active.blurb,
    };
  }
  const count = stats.metrics.completedCourses;
  const template =
    count === 1
      ? copy.hero.state.calm.headlineTemplateSingular
      : copy.hero.state.calm.headlineTemplatePlural;
  return {
    headline: formatAccountTemplate(template, { count }),
    blurb: copy.hero.state.calm.blurb,
  };
}

/**
 * Learn landing.
 *
 * ACCOUNT-PREMIUM-01 (session 2, Phase 2B). Lifts LearnHero into HeroCard
 * with the `progress` slot driving overall completion. Adds NextStepRow for
 * the highest-friction action (due quiz → assigned → resume saved).
 */
export default async function LearnPage() {
  const [locale, user] = await Promise.all([
    getAccountAppLocale(),
    requireAccountUser(),
  ]);
  const copy = getAccountCopy(locale);
  const learnCopy = copy.divisionLearn;
  const helperLocale: LearnLocale = locale === "fr" ? "fr" : "en";

  const [summary, activityRaw] = await Promise.all([
    getLearnAccountSummary(user.id, user.email),
    getDivisionActivity(user.id, "learn", 20, locale),
  ]);

  const learnOrigin = getDivisionUrl("learn");
  const teachHref = `${learnOrigin}/teach`;

  const activeCourses: CourseRow[] = summary.activeCourses.map((c, idx) => ({
    id: String(c.id ?? `active-${idx}`),
    title: String(c.title ?? ""),
    subtitle: String(c.subtitle ?? ""),
    href: c.href,
    percentComplete: c.percentComplete,
    status: c.status ?? "active",
    paymentStatus: c.paymentStatus ?? "—",
    quizState: c.quizState ?? "",
    certificateState: c.certificateState ?? "",
    completedAt: null,
    kind: "active" as const,
  }));

  const completedCourses: CourseRow[] = summary.completedCourses.map((c, idx) => ({
    id: String(c.id ?? `completed-${idx}`),
    title: String(c.title ?? ""),
    subtitle: String(c.subtitle ?? ""),
    href: c.href,
    percentComplete: c.percentComplete,
    status: "completed",
    paymentStatus: "—",
    quizState: "",
    certificateState: "",
    completedAt: c.completedAt ?? null,
    kind: "completed" as const,
  }));

  const combinedCourses = [...activeCourses, ...completedCourses];

  const certificates: CertificateRow[] = summary.certificates.map((c) => ({
    id: c.id,
    courseTitle: c.courseTitle,
    certificateNo: c.certificateNo,
    href: c.href,
  }));

  const assignments: AssignmentRow[] = summary.assignedLearning.map((a) => ({
    id: a.id,
    courseTitle: a.courseTitle,
    note: a.note,
    href: a.href,
  }));

  const savedCourses: SavedCourseRow[] = summary.savedCourses
    .filter((c): c is NonNullable<typeof c> => Boolean(c))
    .map((c) => ({
      id: c.id,
      title: c.title,
      subtitle: c.subtitle,
      slug: c.slug,
    }));

  const teacherApplication: TeacherApplication = summary.teacherApplication
    ? {
        status: summary.teacherApplication.status,
        expertiseArea: summary.teacherApplication.expertiseArea,
        teachingTopics: summary.teacherApplication.teachingTopics,
        reviewNotes: summary.teacherApplication.reviewNotes ?? null,
      }
    : null;

  const stats = learnStats({
    metrics: summary.metrics,
    active: activeCourses,
    assignments,
    teacherApplication,
  });

  const state = heroState(stats);
  const heroHeadline = buildHeroHeadline(state, stats, learnCopy);
  const activityRows = toLearnActivityRows(activityRaw);

  // ── Overall progress % ───────────────────────────────────────────
  const overallPercent = (() => {
    const denom = stats.metrics.activeCourses + stats.metrics.completedCourses;
    if (denom === 0) return 0;
    const sum =
      activeCourses.reduce((acc, c) => acc + (c.percentComplete || 0), 0) +
      stats.metrics.completedCourses * 100;
    return Math.max(0, Math.min(100, Math.round(sum / denom)));
  })();

  // ── HeroCard tiles ───────────────────────────────────────────────
  const tiles: ReadonlyArray<HeroCardTile> = [
    {
      label: learnCopy.hero.tileLabels.active,
      value: stats.metrics.activeCourses,
      foot:
        stats.metrics.activeCourses === 0
          ? learnCopy.hero.tileFoot.activeEmpty
          : learnCopy.hero.tileFoot.activeWith,
      tone: stats.metrics.activeCourses > 0 ? "active" : "default",
    },
    {
      label: learnCopy.hero.tileLabels.completed,
      value: stats.metrics.completedCourses,
      foot:
        stats.metrics.completedCourses === 0
          ? learnCopy.hero.tileFoot.completedEmpty
          : learnCopy.hero.tileFoot.completedWith,
    },
    {
      label: learnCopy.hero.tileLabels.certificates,
      value: stats.metrics.certificates,
      foot:
        stats.metrics.certificates === 0
          ? learnCopy.hero.tileFoot.certificatesEmpty
          : learnCopy.hero.tileFoot.certificatesWith,
      tone: stats.metrics.certificates > 0 ? "accent" : "default",
    },
    {
      label: learnCopy.hero.tileLabels.assignments,
      value: stats.metrics.assignedLearning,
      foot:
        stats.metrics.assignedLearning === 0
          ? learnCopy.hero.tileFoot.assignmentsEmpty
          : learnCopy.hero.tileFoot.assignmentsWith,
      tone: stats.metrics.assignedLearning > 0 ? "warning" : "default",
    },
  ];

  const breakdownAll: ReadonlyArray<HeroCardBreakdownRow> = [
    {
      label: learnCopy.hero.breakdownNames.active,
      count: stats.metrics.activeCourses,
      color: "var(--acct-gold)",
    },
    {
      label: learnCopy.hero.breakdownNames.assigned,
      count: stats.metrics.assignedLearning,
      color: "var(--acct-blue)",
    },
    {
      label: learnCopy.hero.breakdownNames.certificates,
      count: stats.metrics.certificates,
      color: "var(--acct-green)",
    },
    {
      label: learnCopy.hero.breakdownNames.saved,
      count: stats.metrics.savedCourses,
      color: "var(--acct-purple)",
    },
  ];
  const breakdown = breakdownAll.filter((row) => row.count > 0);

  // ── NextStepRow ─────────────────────────────────────────────────
  // Highest-priority: quiz due → assigned → saved (when no active).
  let nextStep: React.ReactNode = null;
  const quizDueCourse = activeCourses.find(
    (c) => String(c.quizState || "").toLowerCase() === "due",
  );
  if (quizDueCourse) {
    nextStep = (
      <NextStepRow
        tone="attention"
        kicker={learnCopy.hero.tileLabels.active}
        title={quizDueCourse.title}
        detail={quizDueCourse.subtitle}
        cta={{ label: learnCopy.hero.openLearnCta, href: quizDueCourse.href, newTab: true }}
      />
    );
  } else if (assignments.length > 0) {
    const a = assignments[0];
    nextStep = (
      <NextStepRow
        tone="neutral"
        kicker={learnCopy.hero.tileLabels.assignments}
        title={a.courseTitle}
        detail={a.note ?? undefined}
        cta={{ label: learnCopy.hero.openLearnCta, href: a.href, newTab: true }}
      />
    );
  } else if (savedCourses.length > 0 && activeCourses.length === 0) {
    const c = savedCourses[0];
    nextStep = (
      <NextStepRow
        tone="neutral"
        kicker={learnCopy.hero.breakdownNames.saved}
        title={c.title}
        detail={c.subtitle}
        cta={{
          label: learnCopy.hero.openLearnCta,
          href: `${learnOrigin}/courses/${c.slug}`,
          newTab: true,
        }}
      />
    );
  }

  const coursesMeta =
    combinedCourses.length === 0
      ? learnCopy.sections.coursesMetaEmpty
      : formatAccountTemplate(learnCopy.sections.coursesMetaTemplate, {
          active: stats.metrics.activeCourses,
          completed: stats.metrics.completedCourses,
        });

  const activityMeta =
    activityRows.length === 0
      ? learnCopy.sections.activityMetaEmpty
      : formatAccountTemplate(
          activityRows.length === 1
            ? learnCopy.sections.activityMetaTemplateSingular
            : learnCopy.sections.activityMetaTemplatePlural,
          { count: activityRows.length },
        );

  const heroTone: "calm" | "active" | "attention" | "empty" =
    state === "empty"
      ? "empty"
      : state === "active"
        ? quizDueCourse
          ? "attention"
          : "active"
        : "calm";

  return (
    <DivisionLanding
      className="acct-lrn acct-fade-in"
      hero={
        <HeroCard
          variant="paired"
          tone={heroTone}
          eyebrow={learnCopy.hero.eyebrow}
          headline={heroHeadline.headline}
          blurb={heroHeadline.blurb}
          ariaLabel={learnCopy.hero.ariaLabel}
          ariaTilesLabel={learnCopy.hero.tilesAriaLabel}
          ctaPrimary={{ label: learnCopy.hero.openLearnCta, href: learnOrigin, newTab: true }}
          ctaSecondary={{
            label: learnCopy.hero.applyToTeachCta,
            href: teachHref,
            newTab: true,
          }}
          tiles={tiles}
          side={{
            kicker: learnCopy.hero.sideKicker,
            title: learnCopy.hero.sideTitle,
            body: learnCopy.hero.sideBody,
            breakdown:
              breakdown.length > 0
                ? {
                    label: learnCopy.hero.breakdownLabel,
                    rows: breakdown,
                    ariaLabel: learnCopy.hero.breakdownAriaLabel,
                  }
                : undefined,
          }}
          progress={
            overallPercent > 0
              ? {
                  percent: overallPercent,
                  label: `${learnCopy.hero.tileLabels.completed} · ${overallPercent}%`,
                }
              : undefined
          }
        />
      }
      nextStep={
        <>
          {/* SP6: division-scoped resume chip — renders only when a REAL pending journey exists here. */}
          <DivisionResumeChip division="learn" userId={user.id} />
          {nextStep}
        </>
      }
      sections={[
        {
          id: "acct-lrn-courses",
          title: learnCopy.sections.coursesTitle,
          meta: coursesMeta,
          content:
            combinedCourses.length === 0 ? (
              <EmptyStateCard
                kicker={learnCopy.hero.eyebrow}
                title={learnCopy.empty.coursesTitle}
                body={learnCopy.empty.coursesBody}
                cta={{
                  label: learnCopy.hero.openLearnCta,
                  href: learnOrigin,
                  newTab: true,
                }}
              />
            ) : (
              <LearnCourses
                courses={combinedCourses}
                locale={helperLocale}
                labels={{
                  ariaLabel: learnCopy.courses.ariaLabel,
                  completedAtTemplate: learnCopy.courses.completedAtTemplate,
                  progressPercentTemplate: learnCopy.courses.progressPercentTemplate,
                  statusDelimiter: learnCopy.courses.statusDelimiter,
                }}
              />
            ),
        },
        {
          id: "acct-lrn-extras",
          title: learnCopy.sections.extrasTitle,
          meta: learnCopy.sections.extrasMeta,
          content: (
            <LearnExtras
              certificates={certificates}
              assignments={assignments}
              savedCourses={savedCourses}
              teacherApplication={teacherApplication}
              locale={helperLocale}
              learnOrigin={learnOrigin}
              labels={{
                ariaLabel: learnCopy.extras.ariaLabel,
                certificatesTitle: learnCopy.extras.certificatesTitle,
                assignmentsTitle: learnCopy.extras.assignmentsTitle,
                savedTitle: learnCopy.extras.savedTitle,
                teachingTitle: learnCopy.extras.teachingTitle,
                statusLabel: learnCopy.extras.statusLabel,
                expertiseLabel: learnCopy.extras.expertiseLabel,
                topicsLabel: learnCopy.extras.topicsLabel,
                openApplicationCta: learnCopy.extras.openApplicationCta,
                applyToTeachCta: learnCopy.extras.applyToTeachCta,
                teachingEmpty: learnCopy.extras.teachingEmpty,
              }}
            />
          ),
        },
        {
          id: "acct-lrn-activity",
          title: learnCopy.sections.activityTitle,
          meta: activityMeta,
          content:
            activityRows.length === 0 ? (
              <EmptyStateCard
                kicker={learnCopy.sections.activityTitle}
                title={learnCopy.empty.activityTitle}
                body={learnCopy.empty.activityBody}
              />
            ) : (
              <LearnActivity
                activity={activityRows}
                locale={helperLocale}
                labels={{
                  ariaLabel: learnCopy.activity.ariaLabel,
                  fallbackTitle: learnCopy.activity.fallbackTitle,
                }}
              />
            ),
        },
      ]}
    />
  );
}
