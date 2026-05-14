import { getDivisionUrl } from "@henryco/config";

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
  learnStats,
  toLearnActivityRows,
  type AssignmentRow,
  type CertificateRow,
  type CourseRow,
  type LearnLocale,
  type SavedCourseRow,
  type TeacherApplication,
} from "@/components/learn/helpers";

export const dynamic = "force-dynamic";

const COPY_EN = {
  eyebrow: "Learn · live",
  sideKicker: "How this room works",
  sideTitle: "Catalog on Learn, progress here.",
  sideBody: "Every lesson, quiz, and certificate from HenryCo Learn syncs into this room — pick up where you left off, see your progress at a glance, and keep credentials in one place.",
  breakdownLabel: "By state",
  tileLabels: { active: "Active", completed: "Completed", certificates: "Certificates", assignments: "Assigned" },
  tileFoot: {
    activeEmpty: "Enroll to start a course",
    activeWith: "Lesson + quiz progress mirrors here",
    completedEmpty: "Programs you finish appear here",
    completedWith: "Handy for CVs and reporting",
    certificatesEmpty: "Earn one by completing a course",
    certificatesWith: "Verifiable links to each credential",
    assignmentsEmpty: "Nothing assigned right now",
    assignmentsWith: "From your manager or team",
  },
  breakdownNames: { active: "Active", assigned: "Assigned", certificates: "Certificates", saved: "Saved" },
  sectionCourses: "Continue learning",
  sectionCoursesMeta: (active: number, completed: number) =>
    `${active} active · ${completed} completed`,
  sectionCoursesEmpty: "Browse the HenryCo Learn catalog to enroll in your first course.",
  sectionExtras: "Credentials, assignments, and teaching",
  sectionExtrasMeta: "Certificates, assigned training, saved courses, and instructor application live here.",
  sectionActivity: "Recent activity",
  sectionActivityMeta: (n: number) => `${n} update${n === 1 ? "" : "s"} · most recent first`,
  sectionActivityEmpty: "Lessons, quizzes, certificates, and payments mirror here as they happen.",
  emptyTitle: "No courses linked yet",
  emptyBody: "Browse the catalog on HenryCo Learn and enroll. Your place will appear here automatically.",
  emptyActivityTitle: "No Learn activity yet",
  emptyActivityBody: "Course progress, quiz results, certificate issuance, and payment receipts surface here as they happen.",
  certificatesTitle: "Certificates",
  assignmentsTitle: "Assigned learning",
  savedTitle: "Saved courses",
  teachingTitle: "Teach with HenryCo",
  statusLabel: "Status",
  expertiseLabel: "Expertise",
  topicsLabel: "Topics",
  openApplication: "Open application",
  applyToTeach: "Apply to teach",
  teachingEmpty: "We review teaching applications manually. Apply on HenryCo Learn and status will sync back here.",
  activityAriaLabel: "Learn activity",
};

const COPY_FR: typeof COPY_EN = {
  eyebrow: "Learn · en direct",
  sideKicker: "Comment cette pièce fonctionne",
  sideTitle: "Catalogue sur Learn, progression ici.",
  sideBody: "Chaque leçon, quiz et certificat de HenryCo Learn est synchronisé ici — reprenez là où vous vous êtes arrêté, visualisez votre progression en un coup d’œil, et gardez vos certifications au même endroit.",
  breakdownLabel: "Par état",
  tileLabels: { active: "Actifs", completed: "Terminés", certificates: "Certificats", assignments: "Assignés" },
  tileFoot: {
    activeEmpty: "Inscrivez-vous pour commencer",
    activeWith: "Leçons + quiz reflétés ici",
    completedEmpty: "Les programmes terminés apparaîtront ici",
    completedWith: "Pratique pour CV et rapports",
    certificatesEmpty: "Obtenez-en un en terminant un cours",
    certificatesWith: "Liens vérifiables vers chaque certificat",
    assignmentsEmpty: "Rien d’assigné pour le moment",
    assignmentsWith: "De votre manager ou équipe",
  },
  breakdownNames: { active: "Actifs", assigned: "Assignés", certificates: "Certificats", saved: "Enregistrés" },
  sectionCourses: "Continuer l’apprentissage",
  sectionCoursesMeta: (active: number, completed: number) =>
    `${active} actif${active === 1 ? "" : "s"} · ${completed} terminé${completed === 1 ? "" : "s"}`,
  sectionCoursesEmpty: "Parcourez le catalogue HenryCo Learn pour vous inscrire à votre premier cours.",
  sectionExtras: "Certificats, assignations et enseignement",
  sectionExtrasMeta: "Certificats, formations assignées, cours enregistrés et candidature enseignant.",
  sectionActivity: "Activité récente",
  sectionActivityMeta: (n: number) => `${n} mise${n === 1 ? "" : "s"} à jour · plus récentes en premier`,
  sectionActivityEmpty: "Leçons, quiz, certificats et paiements reflétés ici en temps réel.",
  emptyTitle: "Aucun cours lié pour le moment",
  emptyBody: "Parcourez le catalogue sur HenryCo Learn et inscrivez-vous. Votre place apparaîtra ici automatiquement.",
  emptyActivityTitle: "Aucune activité Learn pour le moment",
  emptyActivityBody: "Progression des cours, résultats de quiz, émission de certificats et reçus de paiement apparaissent ici en temps réel.",
  certificatesTitle: "Certificats",
  assignmentsTitle: "Formations assignées",
  savedTitle: "Cours enregistrés",
  teachingTitle: "Enseigner avec HenryCo",
  statusLabel: "Statut",
  expertiseLabel: "Expertise",
  topicsLabel: "Sujets",
  openApplication: "Ouvrir la candidature",
  applyToTeach: "Postuler pour enseigner",
  teachingEmpty: "Nous examinons manuellement les candidatures d’enseignants. Postulez sur HenryCo Learn : le statut se synchronisera ici.",
  activityAriaLabel: "Activité Learn",
};

export default async function LearnPage() {
  const [localeRaw, user] = await Promise.all([getAccountAppLocale(), requireAccountUser()]);
  const locale: LearnLocale = localeRaw === "fr" ? "fr" : "en";
  const copy = locale === "fr" ? COPY_FR : COPY_EN;

  const [summary, activityRaw] = await Promise.all([
    getLearnAccountSummary(user.id, user.email),
    getDivisionActivity(user.id, "learn"),
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

  const activityRows = toLearnActivityRows(activityRaw);

  return (
    <div className="acct-lrn acct-fade-in">
      <LearnHero
        stats={stats}
        learnOrigin={learnOrigin}
        locale={locale}
        labels={{
          eyebrow: copy.eyebrow,
          sideKicker: copy.sideKicker,
          sideTitle: copy.sideTitle,
          sideBody: copy.sideBody,
          breakdownLabel: copy.breakdownLabel,
          tileLabels: copy.tileLabels,
          tileFoot: copy.tileFoot,
          breakdownNames: copy.breakdownNames,
        }}
      />

      <section aria-labelledby="acct-lrn-courses">
        <div className="acct-lrn__section-head">
          <h2 id="acct-lrn-courses" className="acct-lrn__section-title">
            {copy.sectionCourses}
          </h2>
          <span className="acct-lrn__section-meta">
            {combinedCourses.length === 0
              ? copy.sectionCoursesEmpty
              : copy.sectionCoursesMeta(stats.metrics.activeCourses, stats.metrics.completedCourses)}
          </span>
        </div>
        {combinedCourses.length === 0 ? (
          <div className="acct-lrn__empty">
            <strong>{copy.emptyTitle}</strong>
            {copy.emptyBody}
          </div>
        ) : (
          <LearnCourses courses={combinedCourses} locale={locale} />
        )}
      </section>

      <section aria-labelledby="acct-lrn-extras">
        <div className="acct-lrn__section-head">
          <h2 id="acct-lrn-extras" className="acct-lrn__section-title">
            {copy.sectionExtras}
          </h2>
          <span className="acct-lrn__section-meta">{copy.sectionExtrasMeta}</span>
        </div>
        <LearnExtras
          certificates={certificates}
          assignments={assignments}
          savedCourses={savedCourses}
          teacherApplication={teacherApplication}
          locale={locale}
          learnOrigin={learnOrigin}
          labels={{
            certificatesTitle: copy.certificatesTitle,
            assignmentsTitle: copy.assignmentsTitle,
            savedTitle: copy.savedTitle,
            teachingTitle: copy.teachingTitle,
            statusLabel: copy.statusLabel,
            expertiseLabel: copy.expertiseLabel,
            topicsLabel: copy.topicsLabel,
            openApplication: copy.openApplication,
            applyToTeach: copy.applyToTeach,
            teachingEmpty: copy.teachingEmpty,
          }}
        />
      </section>

      <section aria-labelledby="acct-lrn-activity">
        <div className="acct-lrn__section-head">
          <h2 id="acct-lrn-activity" className="acct-lrn__section-title">
            {copy.sectionActivity}
          </h2>
          <span className="acct-lrn__section-meta">
            {activityRows.length === 0
              ? copy.sectionActivityEmpty
              : copy.sectionActivityMeta(activityRows.length)}
          </span>
        </div>
        {activityRows.length === 0 ? (
          <div className="acct-lrn__empty">
            <strong>{copy.emptyActivityTitle}</strong>
            {copy.emptyActivityBody}
          </div>
        ) : (
          <LearnActivity activity={activityRows} locale={locale} ariaLabel={copy.activityAriaLabel} />
        )}
      </section>
    </div>
  );
}
