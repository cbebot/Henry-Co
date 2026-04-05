import Link from "next/link";
import { GraduationCap, ArrowUpRight, Award, BookOpen, Sparkles, UsersRound } from "lucide-react";
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
import { formatNaira, timeAgo } from "@/lib/format";
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

const panelLabels: Record<LearnPanelKey, string> = {
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
};

const panelCopy: Record<LearnPanelKey, string> = {
  overview:
    "Snapshot of courses, credentials, and teaching status. Open HenryCo Learn anytime for lessons, quizzes, and downloads.",
  active:
    "Jump back into programs you’ve started. Each link opens your learning room on HenryCo Learn.",
  progress:
    "See how far you’ve come: active courses, assessment status, and certificates in one glance.",
  completed:
    "Finished programs and dates—handy for CVs, internal reporting, or your own records.",
  assignments:
    "Training your manager or team assigned. Complete it in the same learning room as self-serve courses.",
  certificates:
    "Credentials you’ve earned, with links to verify or download from HenryCo Learn.",
  saved:
    "Courses you bookmarked on the public catalog—open one when you’re ready to enroll.",
  notifications:
    "Reminders and updates from the academy (assignments due, new modules, and similar).",
  payments:
    "Receipts and payment state for paid programs. Access still unlocks in the learning room.",
  teaching:
    "Instructor application status and notes. Full application lives on HenryCo Learn.",
};

function isLearnPanel(value: string | undefined): value is LearnPanelKey {
  return Boolean(value && value in panelLabels);
}

function sectionCard(active: boolean) {
  return active ? "acct-card p-5 ring-1 ring-[var(--acct-gold)]/35" : "acct-card p-5";
}

export default async function LearnPage({
  searchParams,
}: {
  searchParams: Promise<{ panel?: string }>;
}) {
  const user = await requireAccountUser();
  const params = await searchParams;
  const activePanel = isLearnPanel(params.panel) ? params.panel : "overview";
  const [summary, activity, notifications, supportThreads, invoices] = await Promise.all([
    getLearnAccountSummary(user.id, user.email),
    getDivisionActivity(user.id, "learn"),
    getDivisionNotifications(user.id, "learn"),
    getDivisionSupportThreads(user.id, "learn"),
    getDivisionInvoices(user.id, "learn"),
  ]);
  const showingCompleted = activePanel === "completed";
  const learnOrigin = getDivisionUrl("learn");

  return (
    <div className="space-y-6 acct-fade-in">
      <PageHeader
        title={panelLabels[activePanel]}
        description={panelCopy[activePanel]}
        icon={GraduationCap}
        actions={
          <a
            href={learnOrigin}
            target="_blank"
            rel="noopener noreferrer"
            className="acct-button-primary rounded-xl"
          >
            Open HenryCo Learn <ArrowUpRight size={14} />
          </a>
        }
      />

      <div className="flex flex-wrap gap-2">
        {(
          [
            ["overview", "Overview"],
            ["active", "Active"],
            ["progress", "Progress"],
            ["assignments", "Assignments"],
            ["certificates", "Certificates"],
            ["saved", "Saved"],
            ["payments", "Billing"],
            ["notifications", "Notifications"],
            ["teaching", "Teaching"],
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
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[var(--acct-muted)]">Active courses</p>
          <p className="mt-3 text-3xl font-semibold text-[var(--acct-ink)]">{summary.metrics.activeCourses}</p>
        </div>
        <div className="acct-card p-4">
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[var(--acct-muted)]">Completed</p>
          <p className="mt-3 text-3xl font-semibold text-[var(--acct-ink)]">{summary.metrics.completedCourses}</p>
        </div>
        <div className="acct-card p-4">
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[var(--acct-muted)]">Certificates</p>
          <p className="mt-3 text-3xl font-semibold text-[var(--acct-ink)]">{summary.metrics.certificates}</p>
        </div>
        <div className="acct-card p-4">
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[var(--acct-muted)]">Assigned learning</p>
          <p className="mt-3 text-3xl font-semibold text-[var(--acct-ink)]">{summary.metrics.assignedLearning}</p>
        </div>
        <div className="acct-card p-4">
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[var(--acct-muted)]">Saved courses</p>
          <p className="mt-3 text-3xl font-semibold text-[var(--acct-ink)]">{summary.metrics.savedCourses}</p>
        </div>
      </div>

      <div className="grid gap-6 xl:grid-cols-[1.05fr,0.95fr]">
        <section className={sectionCard(activePanel === "active" || activePanel === "completed" || activePanel === "progress")}>
          <div className="mb-4 flex items-center gap-2">
            <BookOpen size={14} className="text-[var(--acct-muted)]" />
            <p className="acct-kicker">{showingCompleted ? "Completed Learning" : "Continue Learning"}</p>
          </div>
          {(showingCompleted ? summary.completedCourses.length === 0 : summary.activeCourses.length === 0) ? (
            <p className="py-6 text-sm text-[var(--acct-muted)]">
              {showingCompleted
                ? "When you finish a program, it will show here with the completion date."
                : "No active courses yet. Browse the catalog on HenryCo Learn and enroll—your place will appear here automatically."}
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
                      {course.status.replace(/_/g, " ")} • {course.paymentStatus.replace(/_/g, " ")}
                    </p>
                  ) : null}
                  {"quizState" in course ? (
                    <p className="mt-1 text-xs text-[var(--acct-muted)]">
                      {course.quizState} • {course.certificateState}
                    </p>
                  ) : null}
                  {"completedAt" in course && course.completedAt ? (
                    <p className="mt-2 text-xs text-[var(--acct-muted)]">
                      Completed{" "}
                      {new Date(course.completedAt).toLocaleDateString("en-NG", {
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
            <p className="acct-kicker">Teach With HenryCo</p>
          </div>
          {summary.teacherApplication ? (
            <div className="space-y-3">
              <div className="rounded-xl bg-[var(--acct-surface)] px-4 py-3">
                <p className="text-sm font-semibold text-[var(--acct-ink)]">
                  Status: {summary.teacherApplication.status.replace(/_/g, " ")}
                </p>
                <p className="mt-1 text-xs text-[var(--acct-muted)]">
                  Expertise: {summary.teacherApplication.expertiseArea}
                </p>
                {summary.teacherApplication.teachingTopics.length > 0 ? (
                  <p className="mt-1 text-xs text-[var(--acct-muted)]">
                    Topics: {summary.teacherApplication.teachingTopics.join(", ")}
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
                Open application <ArrowUpRight size={14} />
              </a>
            </div>
          ) : (
            <div className="rounded-xl bg-[var(--acct-surface)] px-4 py-4">
              <p className="text-sm text-[var(--acct-muted)]">
                We review teaching applications manually. Apply on HenryCo Learn—status and notes sync back here.
              </p>
              <a
                href={`${learnOrigin}/teach`}
                target="_blank"
                rel="noopener noreferrer"
                className="mt-4 inline-flex items-center gap-2 text-sm font-semibold text-[var(--acct-gold)] hover:underline"
              >
                Apply to teach <ArrowUpRight size={14} />
              </a>
            </div>
          )}
        </section>
      </div>

      <div className="grid gap-6 xl:grid-cols-3">
        <section className={sectionCard(activePanel === "certificates" || activePanel === "progress")}>
          <div className="mb-4 flex items-center gap-2">
            <Award size={14} className="text-[var(--acct-muted)]" />
            <p className="acct-kicker">Certificates</p>
          </div>
          {summary.certificates.length === 0 ? (
            <p className="py-4 text-sm text-[var(--acct-muted)]">
              Complete a certificate-eligible course on HenryCo Learn (lessons + any required quiz) and it will list here with a verify link.
            </p>
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
            <p className="acct-kicker">Assigned Learning</p>
          </div>
          {summary.assignedLearning.length === 0 ? (
            <p className="py-4 text-sm text-[var(--acct-muted)]">You’re all caught up—no assigned training at the moment.</p>
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
            <p className="acct-kicker">Saved Courses</p>
          </div>
          {summary.savedCourses.length === 0 ? (
            <p className="py-4 text-sm text-[var(--acct-muted)]">
              Save courses from the catalog on HenryCo Learn—they’ll show up here until you enroll or remove them.
            </p>
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
            <p className="acct-kicker">Recent Learn Activity</p>
            <Link href="/activity" className="text-xs font-medium text-[var(--acct-gold)] hover:underline">
              View all
            </Link>
          </div>
          <div className="space-y-2">
            {activity.slice(0, 5).map((item) => (
              <Link
                key={String(item.id)}
                href={activityMessageHref(String(item.id || ""))}
                className="block rounded-xl bg-[var(--acct-surface)] px-4 py-3 transition-colors hover:bg-[var(--acct-line)]"
              >
                <p className="text-sm font-semibold text-[var(--acct-ink)]">{String(item.title || "HenryCo Learn activity")}</p>
                <p className="mt-1 text-xs text-[var(--acct-muted)]">
                  {String(item.status || "updated")} • {timeAgo(String(item.created_at || ""))}
                  {item.amount_kobo ? ` • ${formatNaira(Number(item.amount_kobo))}` : ""}
                </p>
              </Link>
            ))}
          </div>
        </section>

        <section className={sectionCard(activePanel === "notifications" || activePanel === "payments")}>
          <div className="mb-4 flex items-center justify-between">
            <p className="acct-kicker">Notifications & Billing</p>
            <Link href="/notifications" className="text-xs font-medium text-[var(--acct-gold)] hover:underline">
              Open notifications
            </Link>
          </div>
          <div className="space-y-2">
            {notifications.slice(0, 3).map((item) => (
              <Link
                key={String(item.id)}
                href={notificationMessageHref(String(item.id || ""))}
                className="block rounded-xl bg-[var(--acct-surface)] px-4 py-3 transition-colors hover:bg-[var(--acct-line)]"
              >
                <p className="text-sm font-semibold text-[var(--acct-ink)]">{String(item.title || "HenryCo Learn notification")}</p>
                <p className="mt-1 text-xs text-[var(--acct-muted)] line-clamp-2">{String(item.body || "")}</p>
              </Link>
            ))}
            {invoices.slice(0, 2).map((invoice) => (
              <div key={String(invoice.id)} className="rounded-xl bg-[var(--acct-surface)] px-4 py-3">
                <p className="text-sm font-semibold text-[var(--acct-ink)]">
                  {String(invoice.description || invoice.invoice_no || "Academy invoice")}
                </p>
                <p className="mt-1 text-xs text-[var(--acct-muted)]">
                  {String(invoice.invoice_no || "")} • {formatNaira(Number(invoice.total_kobo || 0))}
                </p>
              </div>
            ))}
            {supportThreads.slice(0, 1).map((thread) => (
              <div key={thread.id} className="rounded-xl bg-[var(--acct-surface)] px-4 py-3">
                <p className="text-sm font-semibold text-[var(--acct-ink)]">{thread.subject}</p>
                <p className="mt-1 text-xs text-[var(--acct-muted)]">Support status: {thread.status}</p>
              </div>
            ))}
          </div>
        </section>
      </div>
    </div>
  );
}
