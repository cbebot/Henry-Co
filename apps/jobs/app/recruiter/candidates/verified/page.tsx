import Link from "next/link";
import { translateSurfaceLabel } from "@henryco/i18n";
import { getLearnToEarnCopy } from "@henryco/i18n/server";
import { requireJobsRoles, viewerHasRole } from "@/lib/auth";
import { getJobPosts } from "@/lib/jobs/data";
import {
  getEmployerVerifiedCandidatePool,
  type CourseGateRow,
} from "@/lib/jobs/learn-to-earn-data";
import { createAdminSupabase } from "@/lib/supabase";
import { recruiterNav } from "@/lib/jobs/navigation";
import { getJobsPublicLocale } from "@/lib/locale-server";
import { BulkInviteClient } from "@/components/hiring/BulkInviteClient";
import { SectionCard, WorkspaceShell } from "@/components/workspace-shell";

export const dynamic = "force-dynamic";

function firstParam(value: string | string[] | undefined): string | null {
  if (Array.isArray(value)) return value[0] ?? null;
  return value ?? null;
}

export default async function VerifiedCandidatePoolPage({
  searchParams,
}: {
  searchParams?: Promise<Record<string, string | string[] | undefined>>;
}) {
  const viewer = await requireJobsRoles(
    ["employer", "recruiter", "admin", "owner", "moderator"],
    "/recruiter/candidates/verified",
  );
  const locale = await getJobsPublicLocale();
  const t = (text: string) => translateSurfaceLabel(locale, text);
  const learnCopy = getLearnToEarnCopy(locale);
  const params = (await (searchParams ?? Promise.resolve({}))) as Record<
    string,
    string | string[] | undefined
  >;

  // Resolve the employer: an explicit ?employer= the viewer belongs to (or any,
  // for staff), else the viewer's first employer membership.
  const requestedEmployer = firstParam(params.employer);
  const membershipSlugs = viewer.employerMemberships.map((m) => m.employerSlug);
  const isStaff = viewerHasRole(viewer, ["recruiter", "admin", "owner", "moderator"]);
  const employerSlug =
    requestedEmployer && (isStaff || membershipSlugs.includes(requestedEmployer))
      ? requestedEmployer
      : membershipSlugs[0] ?? "";

  const courseId = firstParam(params.course);

  if (!employerSlug) {
    return (
      <WorkspaceShell
        area="recruiter"
        title={learnCopy.pool.title}
        subtitle={learnCopy.pool.body}
        nav={recruiterNav}
        activeHref="/recruiter"
        accent="linear-gradient(135deg,#1d3f6f 0%,#3266b4 55%,#6db7ff 100%)"
      >
        <SectionCard title={learnCopy.pool.emptyTitle} body={learnCopy.pool.emptyBody}>
          <p className="rounded-2xl bg-[var(--jobs-paper-soft)] p-4 text-sm text-[var(--jobs-muted)]">
            {learnCopy.pool.body}
          </p>
        </SectionCard>
      </WorkspaceShell>
    );
  }

  const [{ candidates, courses }, postings] = await Promise.all([
    getEmployerVerifiedCandidatePool(createAdminSupabase(), {
      employerSlug,
      courseId: courseId ?? undefined,
    }),
    getJobPosts({ includeUnpublished: true, employerSlug, locale }),
  ]);

  // Dedupe the employer's gated courses for the filter dropdown.
  const filterCourses = new Map<string, CourseGateRow>();
  for (const course of courses) {
    if (!filterCourses.has(course.course_id)) filterCourses.set(course.course_id, course);
  }

  const count = candidates.length;
  const countLabel =
    count === 1
      ? learnCopy.pool.candidateCountOne
      : learnCopy.pool.candidateCountOther.replace("{count}", String(count));

  const baseHref = (nextCourse: string | null) => {
    const search = new URLSearchParams();
    if (requestedEmployer) search.set("employer", requestedEmployer);
    if (nextCourse) search.set("course", nextCourse);
    const qs = search.toString();
    return qs ? `/recruiter/candidates/verified?${qs}` : "/recruiter/candidates/verified";
  };

  return (
    <WorkspaceShell
      area="recruiter"
      title={learnCopy.pool.title}
      subtitle={learnCopy.pool.body}
      nav={recruiterNav}
      activeHref="/recruiter"
      accent="linear-gradient(135deg,#1d3f6f 0%,#3266b4 55%,#6db7ff 100%)"
    >
      <SectionCard
        title={learnCopy.pool.eyebrow}
        body={countLabel}
        actions={
          <span className="rounded-full bg-[var(--jobs-accent-soft)] px-3 py-1 text-xs font-semibold">
            {countLabel}
          </span>
        }
      >
        {filterCourses.size > 0 ? (
          <div className="mb-4">
            <p className="text-[10.5px] font-semibold uppercase tracking-[0.22em] text-[var(--jobs-muted)]">
              {learnCopy.pool.courseFilterLabel}
            </p>
            <div className="mt-2 flex flex-wrap gap-2">
              <Link
                href={baseHref(null)}
                aria-pressed={!courseId}
                className={`rounded-full px-3.5 py-1.5 text-xs font-semibold ring-1 ring-inset transition-colors ${
                  !courseId
                    ? "bg-[var(--jobs-accent-soft)] text-[var(--jobs-ink)] ring-[var(--jobs-accent)]/30"
                    : "bg-transparent text-[var(--jobs-muted)] ring-[var(--jobs-line)]"
                }`}
              >
                {learnCopy.pool.allCoursesOption}
              </Link>
              {[...filterCourses.values()].map((course) => {
                const active = courseId === course.course_id;
                return (
                  <Link
                    key={course.course_id}
                    href={baseHref(course.course_id)}
                    aria-pressed={active}
                    className={`rounded-full px-3.5 py-1.5 text-xs font-semibold ring-1 ring-inset transition-colors ${
                      active
                        ? "bg-teal-600/12 text-teal-800 ring-teal-600/25 dark:text-teal-200 dark:ring-teal-400/30"
                        : "bg-transparent text-[var(--jobs-muted)] ring-[var(--jobs-line)]"
                    }`}
                  >
                    {course.course_label || course.course_slug || course.course_id}
                  </Link>
                );
              })}
            </div>
          </div>
        ) : null}

        {count === 0 ? (
          <div className="rounded-2xl bg-[var(--jobs-paper-soft)] p-6 text-center">
            <p className="text-sm font-semibold text-[var(--jobs-ink)]">{learnCopy.pool.emptyTitle}</p>
            <p className="mt-2 text-sm text-[var(--jobs-muted)]">{learnCopy.pool.emptyBody}</p>
          </div>
        ) : (
          <BulkInviteClient
            employerSlug={employerSlug}
            defaultJobSlug={firstParam(params.job) ?? ""}
            candidates={candidates.map((candidate) => ({
              userId: candidate.userId,
              courseLabels: candidate.courseLabels,
            }))}
            jobs={postings.map((job) => ({ slug: job.slug, title: job.title }))}
            copy={{
              badgeLabel: learnCopy.badge.label,
              badgeAria: learnCopy.badge.aria,
              bulkCta: learnCopy.invite.bulkCta,
              sentNotice: learnCopy.invite.sentNotice,
              none: learnCopy.invite.none,
              messageLabel: learnCopy.invite.messageLabel,
              messagePlaceholder: learnCopy.invite.messagePlaceholder,
              candidateLabel: t("Candidate"),
              selectJobLabel: t("Invite to role"),
            }}
          />
        )}
      </SectionCard>
    </WorkspaceShell>
  );
}
