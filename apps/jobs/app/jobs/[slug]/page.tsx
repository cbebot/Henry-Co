import Link from "next/link";
import { notFound } from "next/navigation";
import { JobCard } from "@/components/job-card";
import { PublicShell } from "@/components/public-shell";
import { getSharedAccountLoginUrl } from "@/lib/account";
import { getJobsViewer } from "@/lib/auth";
import { getJobPostBySlug, getJobPosts } from "@/lib/jobs/data";
import { submitApplicationAction, toggleSavedJobAction } from "@/app/actions";

export const dynamic = "force-dynamic";

export default async function JobDetailPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const [job, jobs, viewer] = await Promise.all([
    getJobPostBySlug(slug),
    getJobPosts(),
    getJobsViewer(),
  ]);

  if (!job) {
    notFound();
  }

  const related = jobs.filter((item) => item.categorySlug === job.categorySlug && item.slug !== job.slug).slice(0, 3);
  const loginUrl = getSharedAccountLoginUrl(`/jobs/${job.slug}`);

  return (
    <PublicShell primaryCta={{ label: "Open Candidate Module", href: "/candidate" }}>
      <div className="mx-auto max-w-7xl space-y-8 px-4 py-10 sm:px-6 lg:px-8">
        <div className="jobs-panel rounded-[2.4rem] p-7 sm:p-9">
          <div className="flex flex-wrap gap-2">
            <span className="jobs-chip">{job.employerName}</span>
            <span className="jobs-chip">{job.workMode}</span>
            <span className="jobs-chip">{job.employmentType}</span>
            {job.internal ? <span className="jobs-chip">Internal Hiring</span> : null}
          </div>
          <h1 className="mt-5 jobs-heading">{job.title}</h1>
          <p className="mt-4 max-w-3xl text-sm leading-7 text-[var(--jobs-muted)]">{job.summary}</p>
          <div className="mt-6 flex flex-wrap gap-3 text-sm text-[var(--jobs-muted)]">
            <span>{job.location}</span>
            <span>{job.team}</span>
            <span>{job.seniority}</span>
            <span>{job.salaryLabel || "Compensation discussed in process"}</span>
          </div>
        </div>

        <div className="grid gap-6 lg:grid-cols-[1fr_360px]">
          <div className="space-y-6">
            <section className="jobs-panel rounded-[2rem] p-6">
              <h2 className="jobs-section-title">Role Overview</h2>
              <p className="mt-3 whitespace-pre-wrap text-sm leading-8 text-[var(--jobs-muted)]">{job.description}</p>
            </section>
            <section className="jobs-panel rounded-[2rem] p-6">
              <h2 className="jobs-section-title">Responsibilities</h2>
              <ul className="mt-4 space-y-3 text-sm leading-7 text-[var(--jobs-muted)]">
                {job.responsibilities.map((item) => (
                  <li key={item}>• {item}</li>
                ))}
              </ul>
            </section>
            <section className="jobs-panel rounded-[2rem] p-6">
              <h2 className="jobs-section-title">Requirements</h2>
              <ul className="mt-4 space-y-3 text-sm leading-7 text-[var(--jobs-muted)]">
                {job.requirements.map((item) => (
                  <li key={item}>• {item}</li>
                ))}
              </ul>
            </section>
            <section className="jobs-panel rounded-[2rem] p-6">
              <h2 className="jobs-section-title">Benefits and trust signals</h2>
              <ul className="mt-4 space-y-3 text-sm leading-7 text-[var(--jobs-muted)]">
                {[...job.benefits, ...job.trustHighlights].map((item) => (
                  <li key={item}>• {item}</li>
                ))}
              </ul>
            </section>
          </div>

          <aside className="space-y-4">
            <div className="jobs-panel rounded-[2rem] p-6">
              <h2 className="jobs-section-title">Apply</h2>
              <p className="mt-2 text-sm leading-7 text-[var(--jobs-muted)]">
                The apply flow writes directly to the live HenryCo jobs data spine, including your activity history, notifications, and recruiter-facing pipeline record.
              </p>

              <form action={toggleSavedJobAction} className="mt-5">
                <input type="hidden" name="jobSlug" value={job.slug} />
                <button className="jobs-button-secondary w-full rounded-full px-5 py-3 text-sm font-semibold">
                  Save role
                </button>
              </form>

              {viewer.user ? (
                <form action={submitApplicationAction} className="mt-4 space-y-3">
                  <input type="hidden" name="jobSlug" value={job.slug} />
                  <textarea name="coverNote" className="jobs-textarea min-h-32" placeholder="Why are you a strong fit for this role?" />
                  <input name="availability" className="jobs-input" placeholder="Availability, notice period, start date" />
                  <input name="salaryExpectation" className="jobs-input" placeholder="Compensation expectation" />
                  <button className="jobs-button-primary w-full rounded-full px-5 py-3 text-sm font-semibold">
                    Submit application
                  </button>
                </form>
              ) : (
                <div className="mt-4 rounded-2xl bg-[var(--jobs-accent-soft)] p-4 text-sm text-[var(--jobs-ink)]">
                  <a href={loginUrl} className="font-semibold underline">
                    Sign in with your HenryCo account
                  </a>{" "}
                  to save or apply.
                </div>
              )}
            </div>

            <div className="jobs-panel rounded-[2rem] p-6">
              <h2 className="jobs-section-title">Employer</h2>
              <p className="mt-2 text-sm font-semibold">{job.employerName}</p>
              <p className="mt-2 text-sm leading-7 text-[var(--jobs-muted)]">
                Verification status: {job.employerVerification}. Application volume: {job.applicationCount}.
              </p>
              <Link href={`/employers/${job.employerSlug}`} className="mt-4 inline-flex text-sm font-semibold text-[var(--jobs-accent)]">
                View employer page
              </Link>
            </div>
          </aside>
        </div>

        {related.length > 0 ? (
          <section>
            <div className="mb-5 flex items-end justify-between gap-4">
              <div>
                <p className="jobs-kicker">Related Roles</p>
                <h2 className="mt-3 jobs-heading">More roles in this lane.</h2>
              </div>
            </div>
            <div className="grid gap-5 lg:grid-cols-3">
              {related.map((relatedJob) => (
                <JobCard key={relatedJob.slug} job={relatedJob} />
              ))}
            </div>
          </section>
        ) : null}
      </div>
    </PublicShell>
  );
}
