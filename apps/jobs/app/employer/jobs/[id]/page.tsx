import { notFound } from "next/navigation";
import { translateSurfaceLabel } from "@henryco/i18n";
import { getLearnToEarnCopy } from "@henryco/i18n/server";
import { requireJobsRoles, viewerHasRole } from "@/lib/auth";
import { getEmployerDashboardData, getJobPostBySlug } from "@/lib/jobs/data";
import { getCourseGatesForJob, listGatableLearnCourses } from "@/lib/jobs/learn-to-earn-data";
import { createAdminSupabase } from "@/lib/supabase";
import { employerNav } from "@/lib/jobs/navigation";
import { getJobsPublicLocale } from "@/lib/locale-server";
import { EmptyState, InlineNotice } from "@/components/feedback";
import { CourseGateManager } from "@/components/hiring/CourseGateManager";
import { SectionCard, StatusPill, WorkspaceShell } from "@/components/workspace-shell";

export const dynamic = "force-dynamic";

export default async function EmployerJobDetailPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams?: Promise<Record<string, string | string[] | undefined>>;
}) {
  const { id } = await params;
  const viewer = await requireJobsRoles(["employer", "admin", "owner"], `/employer/jobs/${id}`);
  const locale = await getJobsPublicLocale();
  const t = (text: string) => translateSurfaceLabel(locale, text);
  const [data, job, query] = await Promise.all([
    getEmployerDashboardData(viewer.user!.id, viewer.user!.email, locale),
    getJobPostBySlug(id, { includeUnpublished: true, locale }),
    searchParams ?? Promise.resolve({} as Record<string, string | string[] | undefined>),
  ]);

  if (!job) {
    notFound();
  }

  const applicants = data.applications.filter((application) => application.jobSlug === job.slug);
  const created = query.created === "1";

  // V3-56 S3a — only render the gate manager to someone who can manage this job:
  // an employer member of the posting's employer, or jobs staff.
  const canManageGates =
    viewerHasRole(viewer, ["recruiter", "admin", "owner", "moderator"]) ||
    viewer.employerMemberships.some((membership) => membership.employerSlug === job.employerSlug);
  const learnCopy = getLearnToEarnCopy(locale);
  const [gateRows, gatableCourses] = canManageGates
    ? await Promise.all([
        getCourseGatesForJob(createAdminSupabase(), job.slug),
        listGatableLearnCourses(createAdminSupabase()),
      ])
    : [[], []];

  return (
    <WorkspaceShell
      area="employer"
      title={t("Role Detail")}
      subtitle={t("Role settings, moderation status, and applicants in one place.")}
      nav={employerNav}
      activeHref="/employer/jobs"
      accent="linear-gradient(135deg,#7c5a28 0%,#b88a47 55%,#f1c88c 100%)"
    >
      <div className="space-y-4">
        {created ? (
          <InlineNotice
            tone="success"
            title={t("Role created")}
            body={t("Your role has been created. It will appear on the public board once review is complete.")}
          />
        ) : null}

        <SectionCard title={job.title} body={job.summary}>
          <div className="flex flex-wrap items-center gap-3">
            <StatusPill label={job.moderationStatus.replace(/[_-]+/g, " ")} tone={job.moderationStatus === "approved" ? "good" : "warn"} />
            <span className="rounded-full bg-[var(--jobs-paper-soft)] px-3 py-1 text-xs font-semibold">
              {job.applicationCount} {t(job.applicationCount === 1 ? "applicant" : "applicants")}
            </span>
            <span className="rounded-full bg-[var(--jobs-paper-soft)] px-3 py-1 text-xs font-semibold">
              {job.workMode}
            </span>
          </div>
          <div className="mt-4 grid gap-4 md:grid-cols-2">
            <div className="rounded-2xl bg-[var(--jobs-paper-soft)] p-4 text-sm text-[var(--jobs-muted)]">
              {t("Status")}: <strong className="capitalize">{job.moderationStatus.replace(/[_-]+/g, " ")}</strong><br />
              {t("Visibility")}: <strong>{job.isPublished ? t("Live on board") : t("Not yet published")}</strong><br />
              {t("Compensation")}: <strong>{job.salaryLabel || t("Discussed in process")}</strong>
            </div>
            <div className="rounded-2xl bg-[var(--jobs-paper-soft)] p-4 text-sm text-[var(--jobs-muted)]">
              {job.location} · {job.workMode} · {job.employmentType} · {job.seniority}
            </div>
          </div>
        </SectionCard>

        <SectionCard title={t("Hiring process")} body={t("The stages and highlights attached to this role.")}>
          <div className="grid gap-4 lg:grid-cols-2">
            <div className="rounded-2xl bg-[var(--jobs-paper-soft)] p-4">
              <div className="jobs-kicker">{t("Pipeline stages")}</div>
              <div className="mt-3 flex flex-wrap gap-2">
                {job.pipelineStages.map((stage) => (
                  <span key={stage} className="rounded-full bg-[var(--jobs-accent-soft)] px-3 py-1 text-xs font-semibold">
                    {stage}
                  </span>
                ))}
              </div>
            </div>
            <div className="rounded-2xl bg-[var(--jobs-paper-soft)] p-4">
              <div className="jobs-kicker">{t("Trust highlights")}</div>
              <div className="mt-3 flex flex-wrap gap-2">
                {job.trustHighlights.map((item) => (
                  <span key={item} className="rounded-full bg-[var(--jobs-brass-soft)] px-3 py-1 text-xs font-semibold">
                    {item}
                  </span>
                ))}
              </div>
            </div>
          </div>
        </SectionCard>

        {canManageGates ? (
          <SectionCard title={learnCopy.gate.manageTitle} body={learnCopy.gate.manageBody}>
            <CourseGateManager
              jobSlug={job.slug}
              employerSlug={job.employerSlug}
              initialGates={gateRows.map((gate) => ({
                id: gate.id,
                courseId: gate.course_id,
                courseSlug: gate.course_slug ?? null,
                courseLabel: gate.course_label ?? null,
                required: gate.required,
              }))}
              courses={gatableCourses.map((course) => ({
                id: course.id,
                slug: course.slug,
                title: course.title,
              }))}
              copy={{
                addCta: learnCopy.gate.addCta,
                removeCta: learnCopy.gate.removeCta,
                empty: learnCopy.gate.empty,
                requiredOption: learnCopy.gate.requiredOption,
                preferredOption: learnCopy.gate.preferredOption,
              }}
            />
          </SectionCard>
        ) : null}

        <SectionCard title={t("Applicants on this role")}>
          {applicants.length === 0 ? (
            <EmptyState
              kicker={t("Awaiting candidates")}
              title={t("No applicants are attached to this role yet.")}
              body={t("As soon as candidates apply, they will appear here and in the employer applicant queue.")}
            />
          ) : (
            <div className="space-y-3">
              {applicants.slice(0, 5).map((application) => (
                <div key={application.applicationId} className="rounded-2xl bg-[var(--jobs-paper-soft)] p-4">
                  <div className="flex items-start justify-between gap-4">
                    <div>
                      <div className="font-semibold">{application.candidateName}</div>
                      <div className="mt-1 text-sm text-[var(--jobs-muted)]">{application.candidateEmail || t("Email not supplied")}</div>
                    </div>
                    <StatusPill label={application.stage.replace(/[_-]+/g, " ")} tone={application.stage === "rejected" ? "danger" : application.stage === "shortlisted" || application.stage === "interview" ? "warn" : "neutral"} />
                  </div>
                </div>
              ))}
            </div>
          )}
        </SectionCard>
      </div>
    </WorkspaceShell>
  );
}
