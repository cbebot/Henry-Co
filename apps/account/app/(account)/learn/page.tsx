import Link from "next/link";
import {
  GraduationCap,
  ArrowUpRight,
  Award,
  BookOpen,
  Sparkles,
  UsersRound,
} from "lucide-react";
import { getDivisionUrl } from "@henryco/config";
import { requireAccountUser } from "@/lib/auth";
import { activityMessageHref, notificationMessageHref } from "@/lib/notification-center";
import {
  getDivisionActivity,
  getDivisionInvoices,
  getDivisionNotifications,
  getDivisionSupportThreads,
} from "@/lib/division-data";
import { getLearnAccountSummary } from "@/lib/learn-module";
import { formatNaira, timeAgoLocalized } from "@/lib/format";
import { getAccountAppLocale } from "@/lib/locale-server";
import PageHeader from "@/components/layout/PageHeader";

export const dynamic = "force-dynamic";

type LearnPanelKey =
  | "overview"
  | "active"
  | "progress"
  | "completed"
  | "assignments"
  | "certificates"
  | "saved"
  | "notifications"
  | "payments"
  | "teaching";

const LEARN_PANELS = [
  "overview",
  "active",
  "progress",
  "completed",
  "assignments",
  "certificates",
  "saved",
  "notifications",
  "payments",
  "teaching",
] as const satisfies readonly LearnPanelKey[];

function isLearnPanel(value: string | undefined): value is LearnPanelKey {
  return Boolean(value && LEARN_PANELS.includes(value as LearnPanelKey));
}

function sectionCard(active: boolean) {
  return active ? "acct-card p-5 ring-1 ring-[var(--acct-gold)]/35" : "acct-card p-5";
}

function translateLearnToken(locale: string, value: string) {
  const normalized = String(value || "").trim().toLowerCase();
  if (!normalized) return "";

  const english: Record<string, string> = {
    active: "Active",
    assigned: "Assigned",
    completed: "Completed",
    enrolled: "Enrolled",
    pending: "Pending",
    paid: "Paid",
    unpaid: "Unpaid",
    passed: "Passed",
    failed: "Failed",
    issued: "Issued",
    available: "Available",
    submitted: "Submitted",
    under_review: "Under review",
    approved: "Approved",
    rejected: "Rejected",
    updated: "updated",
    in_progress: "In progress",
    not_started: "Not started",
  };

  const french: Record<string, string> = {
    active: "Actif",
    assigned: "Assigné",
    completed: "Terminé",
    enrolled: "Inscrit",
    pending: "En attente",
    paid: "Payé",
    unpaid: "Impayé",
    passed: "Réussi",
    failed: "Échoué",
    issued: "Émis",
    available: "Disponible",
    submitted: "Soumis",
    under_review: "En revue",
    approved: "Approuvé",
    rejected: "Rejeté",
    updated: "mis à jour",
    in_progress: "En cours",
    not_started: "Pas commencé",
  };

  const label = (locale === "fr" ? french : english)[normalized];
  if (label) return label;

  return normalized
    .replace(/[_-]+/g, " ")
    .replace(/\b\w/g, (letter) => letter.toUpperCase());
}

function getLearnCopy(locale: string) {
  if (locale === "fr") {
    return {
      panelLabels: {
        overview: "HenryCo Learn",
        active: "Apprentissage actif",
        progress: "Votre progression",
        completed: "Apprentissage terminé",
        assignments: "Apprentissage assigné",
        certificates: "Certificats",
        saved: "Cours enregistrés",
        notifications: "Notifications Learn",
        payments: "Facturation Learn",
        teaching: "Enseigner avec HenryCo",
      } satisfies Record<LearnPanelKey, string>,
      panelDescriptions: {
        overview:
          "Vue d’ensemble des cours, certifications et statut d’enseignement. Ouvrez HenryCo Learn à tout moment pour les leçons, quiz et téléchargements.",
        active:
          "Reprenez les programmes déjà commencés. Chaque lien ouvre votre salle d’apprentissage HenryCo Learn.",
        progress:
          "Voyez votre avancée : cours actifs, état des évaluations et certificats en un coup d’œil.",
        completed:
          "Programmes terminés et dates utiles pour le CV, les rapports internes ou vos propres archives.",
        assignments:
          "Formations assignées par votre manager ou votre équipe. Terminez-les dans la même salle d’apprentissage que les cours en libre-service.",
        certificates:
          "Certifications obtenues, avec liens de vérification ou téléchargement depuis HenryCo Learn.",
        saved:
          "Cours enregistrés depuis le catalogue public. Ouvrez-en un quand vous êtes prêt à vous inscrire.",
        notifications:
          "Rappels et mises à jour de l’académie (échéances, nouveaux modules, etc.).",
        payments:
          "Reçus et état de paiement des programmes payants. L’accès reste débloqué dans la salle d’apprentissage.",
        teaching:
          "Statut de candidature enseignant et notes. La candidature complète vit sur HenryCo Learn.",
      } satisfies Record<LearnPanelKey, string>,
      openLearn: "Ouvrir HenryCo Learn",
      tabs: {
        overview: "Vue d’ensemble",
        active: "Actif",
        progress: "Progrès",
        assignments: "Assignations",
        certificates: "Certificats",
        saved: "Enregistrés",
        payments: "Facturation",
        notifications: "Notifications",
        teaching: "Enseigner",
      },
      metrics: {
        activeCourses: "Cours actifs",
        completed: "Terminés",
        certificates: "Certificats",
        assignedLearning: "Apprentissage assigné",
        savedCourses: "Cours enregistrés",
      },
      completedLearning: "Apprentissage terminé",
      continueLearning: "Continuer l’apprentissage",
      completedEmpty:
        "Quand vous terminez un programme, il apparaîtra ici avec la date d’achèvement.",
      activeEmpty:
        "Aucun cours actif pour le moment. Parcourez le catalogue HenryCo Learn et inscrivez-vous : votre place apparaîtra ici automatiquement.",
      completedPrefix: "Terminé",
      teachWithHenryCo: "Enseigner avec HenryCo",
      status: "Statut",
      expertise: "Expertise",
      topics: "Sujets",
      openApplication: "Ouvrir la candidature",
      teachingEmpty:
        "Nous examinons manuellement les candidatures d’enseignants. Postulez sur HenryCo Learn : le statut et les notes se synchroniseront ici.",
      applyToTeach: "Postuler pour enseigner",
      certificatesTitle: "Certificats",
      certificatesEmpty:
        "Terminez un cours éligible à un certificat sur HenryCo Learn (leçons + quiz requis) et il apparaîtra ici avec un lien de vérification.",
      assignedLearningTitle: "Apprentissage assigné",
      assignedLearningEmpty: "Tout est à jour : aucune formation assignée pour le moment.",
      savedCoursesTitle: "Cours enregistrés",
      savedCoursesEmpty:
        "Enregistrez des cours depuis le catalogue HenryCo Learn : ils resteront ici jusqu’à inscription ou suppression.",
      recentActivityTitle: "Activité Learn récente",
      viewAll: "Voir tout",
      activityFallback: "Activité HenryCo Learn",
      notificationsBillingTitle: "Notifications et facturation",
      openNotifications: "Ouvrir les notifications",
      notificationFallback: "Notification HenryCo Learn",
      invoiceFallback: "Facture de l’académie",
      supportStatus: "Statut support",
    };
  }

  return {
    panelLabels: {
      overview: "HenryCo Learn",
      active: "Active learning",
      progress: "Your progress",
      completed: "Completed learning",
      assignments: "Assigned learning",
      certificates: "Certificates",
      saved: "Saved courses",
      notifications: "Learn notifications",
      payments: "Learn billing",
      teaching: "Teach with HenryCo",
    } satisfies Record<LearnPanelKey, string>,
    panelDescriptions: {
      overview:
        "Snapshot of courses, credentials, and teaching status. Open HenryCo Learn anytime for lessons, quizzes, and downloads.",
      active:
        "Jump back into programs you’ve started. Each link opens your learning room on HenryCo Learn.",
      progress:
        "See how far you’ve come: active courses, assessment status, and certificates in one glance.",
      completed:
        "Finished programs and dates, handy for CVs, internal reporting, or your own records.",
      assignments:
        "Training your manager or team assigned. Complete it in the same learning room as self-serve courses.",
      certificates:
        "Credentials you’ve earned, with links to verify or download from HenryCo Learn.",
      saved:
        "Courses you bookmarked on the public catalog. Open one when you’re ready to enroll.",
      notifications:
        "Reminders and updates from the academy (assignments due, new modules, and similar).",
      payments:
        "Receipts and payment state for paid programs. Access still unlocks in the learning room.",
      teaching:
        "Instructor application status and notes. Full application lives on HenryCo Learn.",
    } satisfies Record<LearnPanelKey, string>,
    openLearn: "Open HenryCo Learn",
    tabs: {
      overview: "Overview",
      active: "Active",
      progress: "Progress",
      assignments: "Assignments",
      certificates: "Certificates",
      saved: "Saved",
      payments: "Billing",
      notifications: "Notifications",
      teaching: "Teaching",
    },
    metrics: {
      activeCourses: "Active courses",
      completed: "Completed",
      certificates: "Certificates",
      assignedLearning: "Assigned learning",
      savedCourses: "Saved courses",
    },
    completedLearning: "Completed Learning",
    continueLearning: "Continue Learning",
    completedEmpty:
      "When you finish a program, it will show here with the completion date.",
    activeEmpty:
      "No active courses yet. Browse the catalog on HenryCo Learn and enroll. Your place will appear here automatically.",
    completedPrefix: "Completed",
    teachWithHenryCo: "Teach With HenryCo",
    status: "Status",
    expertise: "Expertise",
    topics: "Topics",
    openApplication: "Open application",
    teachingEmpty:
      "We review teaching applications manually. Apply on HenryCo Learn and status and notes will sync back here.",
    applyToTeach: "Apply to teach",
    certificatesTitle: "Certificates",
    certificatesEmpty:
      "Complete a certificate-eligible course on HenryCo Learn (lessons plus any required quiz) and it will list here with a verify link.",
    assignedLearningTitle: "Assigned Learning",
    assignedLearningEmpty: "You’re all caught up. No assigned training at the moment.",
    savedCoursesTitle: "Saved Courses",
    savedCoursesEmpty:
      "Save courses from the catalog on HenryCo Learn. They’ll show up here until you enroll or remove them.",
    recentActivityTitle: "Recent Learn Activity",
    viewAll: "View all",
    activityFallback: "HenryCo Learn activity",
    notificationsBillingTitle: "Notifications & Billing",
    openNotifications: "Open notifications",
    notificationFallback: "HenryCo Learn notification",
    invoiceFallback: "Academy invoice",
    supportStatus: "Support status",
  };
}

export default async function LearnPage({
  searchParams,
}: {
  searchParams: Promise<{ panel?: string }>;
}) {
  const [locale, user] = await Promise.all([getAccountAppLocale(), requireAccountUser()]);
  const params = await searchParams;
  const activePanel = isLearnPanel(params.panel) ? params.panel : "overview";
  const [summary, activity, notifications, supportThreads, invoices] = await Promise.all([
    getLearnAccountSummary(user.id, user.email),
    getDivisionActivity(user.id, "learn"),
    getDivisionNotifications(user.id, "learn"),
    getDivisionSupportThreads(user.id, "learn"),
    getDivisionInvoices(user.id, "learn"),
  ]);
  const copy = getLearnCopy(locale);
  const showingCompleted = activePanel === "completed";
  const learnOrigin = getDivisionUrl("learn");
  const dateLocale = locale === "fr" ? "fr-FR" : "en-NG";

  return (
    <div className="space-y-6 acct-fade-in">
      <PageHeader
        title={copy.panelLabels[activePanel]}
        description={copy.panelDescriptions[activePanel]}
        icon={GraduationCap}
        actions={
          <a
            href={learnOrigin}
            target="_blank"
            rel="noopener noreferrer"
            className="acct-button-primary rounded-xl"
          >
            {copy.openLearn} <ArrowUpRight size={14} />
          </a>
        }
      />

      <div className="flex flex-wrap gap-2">
        {(
          [
            ["overview", copy.tabs.overview],
            ["active", copy.tabs.active],
            ["progress", copy.tabs.progress],
            ["assignments", copy.tabs.assignments],
            ["certificates", copy.tabs.certificates],
            ["saved", copy.tabs.saved],
            ["payments", copy.tabs.payments],
            ["notifications", copy.tabs.notifications],
            ["teaching", copy.tabs.teaching],
          ] as const
        ).map(([panel, label]) => (
          <Link
            key={panel}
            href={panel === "overview" ? "/learn" : `/learn?panel=${panel}`}
            className={
              activePanel === panel
                ? "rounded-full border border-[var(--acct-gold)]/35 bg-[var(--acct-gold)]/12 px-4 py-2 text-xs font-semibold uppercase tracking-[0.18em] text-[var(--acct-gold)]"
                : "rounded-full border border-[var(--acct-line)] bg-[var(--acct-surface)] px-4 py-2 text-xs font-semibold uppercase tracking-[0.18em] text-[var(--acct-muted)] transition hover:border-[var(--acct-gold)]/20 hover:text-[var(--acct-ink)]"
            }
          >
            {label}
          </Link>
        ))}
      </div>

      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-5">
        <div className="acct-card p-4">
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[var(--acct-muted)]">{copy.metrics.activeCourses}</p>
          <p className="mt-3 text-3xl font-semibold text-[var(--acct-ink)]">{summary.metrics.activeCourses}</p>
        </div>
        <div className="acct-card p-4">
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[var(--acct-muted)]">{copy.metrics.completed}</p>
          <p className="mt-3 text-3xl font-semibold text-[var(--acct-ink)]">{summary.metrics.completedCourses}</p>
        </div>
        <div className="acct-card p-4">
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[var(--acct-muted)]">{copy.metrics.certificates}</p>
          <p className="mt-3 text-3xl font-semibold text-[var(--acct-ink)]">{summary.metrics.certificates}</p>
        </div>
        <div className="acct-card p-4">
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[var(--acct-muted)]">{copy.metrics.assignedLearning}</p>
          <p className="mt-3 text-3xl font-semibold text-[var(--acct-ink)]">{summary.metrics.assignedLearning}</p>
        </div>
        <div className="acct-card p-4">
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[var(--acct-muted)]">{copy.metrics.savedCourses}</p>
          <p className="mt-3 text-3xl font-semibold text-[var(--acct-ink)]">{summary.metrics.savedCourses}</p>
        </div>
      </div>

      <div className="grid gap-6 xl:grid-cols-[1.05fr,0.95fr]">
        <section className={sectionCard(activePanel === "active" || activePanel === "completed" || activePanel === "progress")}>
          <div className="mb-4 flex items-center gap-2">
            <BookOpen size={14} className="text-[var(--acct-muted)]" />
            <p className="acct-kicker">{showingCompleted ? copy.completedLearning : copy.continueLearning}</p>
          </div>
          {(showingCompleted ? summary.completedCourses.length === 0 : summary.activeCourses.length === 0) ? (
            <p className="py-6 text-sm text-[var(--acct-muted)]">
              {showingCompleted ? copy.completedEmpty : copy.activeEmpty}
            </p>
          ) : (
            <div className="space-y-3">
              {(showingCompleted ? summary.completedCourses : summary.activeCourses).map((course) => (
                <a
                  key={course.id}
                  href={course.href}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="block rounded-xl bg-[var(--acct-surface)] px-4 py-3 transition-colors hover:bg-[var(--acct-line)]"
                >
                  <div className="flex items-start justify-between gap-4">
                    <div>
                      <p className="text-sm font-semibold text-[var(--acct-ink)]">{course.title}</p>
                      <p className="mt-1 text-xs text-[var(--acct-muted)]">{course.subtitle}</p>
                    </div>
                    <span className="text-xs font-semibold text-[var(--acct-gold)]">
                      {course.percentComplete}%
                    </span>
                  </div>
                  {"status" in course ? (
                    <p className="mt-2 text-xs text-[var(--acct-muted)]">
                      {translateLearnToken(locale, course.status)} • {translateLearnToken(locale, course.paymentStatus)}
                    </p>
                  ) : null}
                  {"quizState" in course ? (
                    <p className="mt-1 text-xs text-[var(--acct-muted)]">
                      {translateLearnToken(locale, course.quizState)} • {translateLearnToken(locale, course.certificateState)}
                    </p>
                  ) : null}
                  {"completedAt" in course && course.completedAt ? (
                    <p className="mt-2 text-xs text-[var(--acct-muted)]">
                      {copy.completedPrefix}{" "}
                      {new Date(course.completedAt).toLocaleDateString(dateLocale, {
                        day: "numeric",
                        month: "short",
                        year: "numeric",
                      })}
                    </p>
                  ) : null}
                </a>
              ))}
            </div>
          )}
        </section>

        <section className={sectionCard(activePanel === "teaching")}>
          <div className="mb-4 flex items-center gap-2">
            <Sparkles size={14} className="text-[var(--acct-muted)]" />
            <p className="acct-kicker">{copy.teachWithHenryCo}</p>
          </div>
          {summary.teacherApplication ? (
            <div className="space-y-3">
              <div className="rounded-xl bg-[var(--acct-surface)] px-4 py-3">
                <p className="text-sm font-semibold text-[var(--acct-ink)]">
                  {copy.status}: {translateLearnToken(locale, summary.teacherApplication.status)}
                </p>
                <p className="mt-1 text-xs text-[var(--acct-muted)]">
                  {copy.expertise}: {summary.teacherApplication.expertiseArea}
                </p>
                {summary.teacherApplication.teachingTopics.length > 0 ? (
                  <p className="mt-1 text-xs text-[var(--acct-muted)]">
                    {copy.topics}: {summary.teacherApplication.teachingTopics.join(", ")}
                  </p>
                ) : null}
                {summary.teacherApplication.reviewNotes ? (
                  <p className="mt-3 text-sm text-[var(--acct-muted)]">
                    {summary.teacherApplication.reviewNotes}
                  </p>
                ) : null}
              </div>
              <a
                href={`${learnOrigin}/teach`}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 text-sm font-semibold text-[var(--acct-gold)] hover:underline"
              >
                {copy.openApplication} <ArrowUpRight size={14} />
              </a>
            </div>
          ) : (
            <div className="rounded-xl bg-[var(--acct-surface)] px-4 py-4">
              <p className="text-sm text-[var(--acct-muted)]">{copy.teachingEmpty}</p>
              <a
                href={`${learnOrigin}/teach`}
                target="_blank"
                rel="noopener noreferrer"
                className="mt-4 inline-flex items-center gap-2 text-sm font-semibold text-[var(--acct-gold)] hover:underline"
              >
                {copy.applyToTeach} <ArrowUpRight size={14} />
              </a>
            </div>
          )}
        </section>
      </div>

      <div className="grid gap-6 xl:grid-cols-3">
        <section className={sectionCard(activePanel === "certificates" || activePanel === "progress")}>
          <div className="mb-4 flex items-center gap-2">
            <Award size={14} className="text-[var(--acct-muted)]" />
            <p className="acct-kicker">{copy.certificatesTitle}</p>
          </div>
          {summary.certificates.length === 0 ? (
            <p className="py-4 text-sm text-[var(--acct-muted)]">{copy.certificatesEmpty}</p>
          ) : (
            <div className="space-y-3">
              {summary.certificates.map((certificate) => (
                <a
                  key={certificate.id}
                  href={certificate.href}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="block rounded-xl bg-[var(--acct-surface)] px-4 py-3 transition-colors hover:bg-[var(--acct-line)]"
                >
                  <p className="text-sm font-semibold text-[var(--acct-ink)]">{certificate.courseTitle}</p>
                  <p className="mt-1 text-xs text-[var(--acct-muted)]">{certificate.certificateNo}</p>
                </a>
              ))}
            </div>
          )}
        </section>

        <section className={sectionCard(activePanel === "assignments")}>
          <div className="mb-4 flex items-center gap-2">
            <UsersRound size={14} className="text-[var(--acct-muted)]" />
            <p className="acct-kicker">{copy.assignedLearningTitle}</p>
          </div>
          {summary.assignedLearning.length === 0 ? (
            <p className="py-4 text-sm text-[var(--acct-muted)]">{copy.assignedLearningEmpty}</p>
          ) : (
            <div className="space-y-3">
              {summary.assignedLearning.map((assignment) => (
                <a
                  key={assignment.id}
                  href={assignment.href}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="block rounded-xl bg-[var(--acct-surface)] px-4 py-3 transition-colors hover:bg-[var(--acct-line)]"
                >
                  <p className="text-sm font-semibold text-[var(--acct-ink)]">{assignment.courseTitle}</p>
                  <p className="mt-1 text-xs text-[var(--acct-muted)]">{assignment.note}</p>
                </a>
              ))}
            </div>
          )}
        </section>

        <section className={sectionCard(activePanel === "saved")}>
          <div className="mb-4 flex items-center gap-2">
            <BookOpen size={14} className="text-[var(--acct-muted)]" />
            <p className="acct-kicker">{copy.savedCoursesTitle}</p>
          </div>
          {summary.savedCourses.length === 0 ? (
            <p className="py-4 text-sm text-[var(--acct-muted)]">{copy.savedCoursesEmpty}</p>
          ) : (
            <div className="space-y-3">
              {summary.savedCourses
                .filter(
                  (
                    course
                  ): course is NonNullable<(typeof summary.savedCourses)[number]> => Boolean(course)
                )
                .map((course) => (
                  <a
                    key={course.id}
                    href={`${learnOrigin}/courses/${course.slug}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="block rounded-xl bg-[var(--acct-surface)] px-4 py-3 transition-colors hover:bg-[var(--acct-line)]"
                  >
                    <p className="text-sm font-semibold text-[var(--acct-ink)]">{course.title}</p>
                    <p className="mt-1 text-xs text-[var(--acct-muted)]">{course.subtitle}</p>
                  </a>
                ))}
            </div>
          )}
        </section>
      </div>

      <div className="grid gap-6 xl:grid-cols-[1fr,1fr]">
        <section className={sectionCard(activePanel === "overview")}>
          <div className="mb-4 flex items-center justify-between">
            <p className="acct-kicker">{copy.recentActivityTitle}</p>
            <Link href="/activity" className="text-xs font-medium text-[var(--acct-gold)] hover:underline">
              {copy.viewAll}
            </Link>
          </div>
          <div className="space-y-2">
            {activity.slice(0, 5).map((item) => (
              <Link
                key={String(item.id)}
                href={activityMessageHref(String(item.id || ""))}
                className="block rounded-xl bg-[var(--acct-surface)] px-4 py-3 transition-colors hover:bg-[var(--acct-line)]"
              >
                <p className="text-sm font-semibold text-[var(--acct-ink)]">
                  {String(item.title || copy.activityFallback)}
                </p>
                <p className="mt-1 text-xs text-[var(--acct-muted)]">
                  {translateLearnToken(locale, String(item.status || "updated"))} • {timeAgoLocalized(String(item.created_at || ""), locale)}
                  {item.amount_kobo ? ` • ${formatNaira(Number(item.amount_kobo), { locale: dateLocale })}` : ""}
                </p>
              </Link>
            ))}
          </div>
        </section>

        <section className={sectionCard(activePanel === "notifications" || activePanel === "payments")}>
          <div className="mb-4 flex items-center justify-between">
            <p className="acct-kicker">{copy.notificationsBillingTitle}</p>
            <Link href="/notifications" className="text-xs font-medium text-[var(--acct-gold)] hover:underline">
              {copy.openNotifications}
            </Link>
          </div>
          <div className="space-y-2">
            {notifications.slice(0, 3).map((item) => (
              <Link
                key={String(item.id)}
                href={notificationMessageHref(String(item.id || ""))}
                className="block rounded-xl bg-[var(--acct-surface)] px-4 py-3 transition-colors hover:bg-[var(--acct-line)]"
              >
                <p className="text-sm font-semibold text-[var(--acct-ink)]">
                  {String(item.title || copy.notificationFallback)}
                </p>
                <p className="mt-1 text-xs text-[var(--acct-muted)] line-clamp-2">{String(item.body || "")}</p>
              </Link>
            ))}
            {invoices.slice(0, 2).map((invoice) => (
              <div key={String(invoice.id)} className="rounded-xl bg-[var(--acct-surface)] px-4 py-3">
                <p className="text-sm font-semibold text-[var(--acct-ink)]">
                  {String(invoice.description || invoice.invoice_no || copy.invoiceFallback)}
                </p>
                <p className="mt-1 text-xs text-[var(--acct-muted)]">
                  {String(invoice.invoice_no || "")} • {formatNaira(Number(invoice.total_kobo || 0), { locale: dateLocale })}
                </p>
              </div>
            ))}
            {supportThreads.slice(0, 1).map((thread) => (
              <div key={thread.id} className="rounded-xl bg-[var(--acct-surface)] px-4 py-3">
                <p className="text-sm font-semibold text-[var(--acct-ink)]">{thread.subject}</p>
                <p className="mt-1 text-xs text-[var(--acct-muted)]">
                  {copy.supportStatus}: {translateLearnToken(locale, thread.status)}
                </p>
              </div>
            ))}
          </div>
        </section>
      </div>
    </div>
  );
}
