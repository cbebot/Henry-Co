import { getDivisionUrl } from "@henryco/config";
import {
  formatAccountTemplate,
  getAccountCopy,
} from "@henryco/i18n/server";
import type { AccountCopy } from "@henryco/i18n/server";

import { requireAccountUser } from "@/lib/auth";
import { getDivisionActivity } from "@/lib/division-data";
import { getLearnAccountSummary } from "@/lib/learn-module";
import { getAccountAppLocale } from "@/lib/locale-server";

import "@/components/learn/styles.css";
import { LearnHero } from "@/components/learn/LearnHero";
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

  return (
    <div className="acct-lrn acct-fade-in">
      <LearnHero
        stats={stats}
        learnOrigin={learnOrigin}
        labels={{
          ariaLabel: learnCopy.hero.ariaLabel,
          eyebrow: learnCopy.hero.eyebrow,
          sideKicker: learnCopy.hero.sideKicker,
          sideTitle: learnCopy.hero.sideTitle,
          sideBody: learnCopy.hero.sideBody,
          breakdownLabel: learnCopy.hero.breakdownLabel,
          breakdownAriaLabel: learnCopy.hero.breakdownAriaLabel,
          tilesAriaLabel: learnCopy.hero.tilesAriaLabel,
          tileLabels: learnCopy.hero.tileLabels,
          tileFoot: learnCopy.hero.tileFoot,
          breakdownNames: learnCopy.hero.breakdownNames,
          openLearnCta: learnCopy.hero.openLearnCta,
          applyToTeachCta: learnCopy.hero.applyToTeachCta,
          headline: heroHeadline.headline,
          blurb: heroHeadline.blurb,
        }}
        state={state}
      />

      <section aria-labelledby="acct-lrn-courses">
        <div className="acct-lrn__section-head">
          <h2 id="acct-lrn-courses" className="acct-lrn__section-title">
            {learnCopy.sections.coursesTitle}
          </h2>
          <span className="acct-lrn__section-meta">{coursesMeta}</span>
        </div>
        {combinedCourses.length === 0 ? (
          <div className="acct-lrn__empty">
            <strong>{learnCopy.empty.coursesTitle}</strong>
            {learnCopy.empty.coursesBody}
          </div>
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
        )}
      </section>

      <section aria-labelledby="acct-lrn-extras">
        <div className="acct-lrn__section-head">
          <h2 id="acct-lrn-extras" className="acct-lrn__section-title">
            {learnCopy.sections.extrasTitle}
          </h2>
          <span className="acct-lrn__section-meta">{learnCopy.sections.extrasMeta}</span>
        </div>
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
      </section>

      <section aria-labelledby="acct-lrn-activity">
        <div className="acct-lrn__section-head">
          <h2 id="acct-lrn-activity" className="acct-lrn__section-title">
            {learnCopy.sections.activityTitle}
          </h2>
          <span className="acct-lrn__section-meta">{activityMeta}</span>
        </div>
        {activityRows.length === 0 ? (
          <div className="acct-lrn__empty">
            <strong>{learnCopy.empty.activityTitle}</strong>
            {learnCopy.empty.activityBody}
          </div>
        ) : (
          <LearnActivity
            activity={activityRows}
            locale={helperLocale}
            labels={{
              ariaLabel: learnCopy.activity.ariaLabel,
              fallbackTitle: learnCopy.activity.fallbackTitle,
            }}
          />
        )}
      </section>
    </div>
  );
}
