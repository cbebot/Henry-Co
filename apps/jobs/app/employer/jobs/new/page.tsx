import Link from "next/link";
import { createJobPostAction } from "@/app/actions";
import { getJobsActorRole, requireJobsRoles } from "@/lib/auth";
import { getEmployerDashboardData, getEmployerProfileBySlug } from "@/lib/jobs/data";
import { employerNav } from "@/lib/jobs/navigation";
import { getEmployerPostingEligibility } from "@/lib/jobs/posting-eligibility";
import { EmptyState, InlineNotice } from "@/components/feedback";
import { PendingSubmitButton } from "@/components/pending-submit-button";
import { SectionCard, StatusPill, WorkspaceShell } from "@/components/workspace-shell";

export const dynamic = "force-dynamic";

export default async function EmployerNewJobPage() {
  const viewer = await requireJobsRoles(["employer", "admin", "owner"], "/employer/jobs/new");
  const data = await getEmployerDashboardData(viewer.user!.id, viewer.user!.email);
  const membership = data.memberships[0];
  const companyRecord = membership ? await getEmployerProfileBySlug(membership.employerSlug, { includeUnpublished: true }) : null;
  const employer = companyRecord?.employer ?? null;
  const eligibility = membership
    ? await getEmployerPostingEligibility({
        userId: viewer.user!.id,
        email: viewer.user!.email,
        employerSlug: membership.employerSlug,
        actorRole: getJobsActorRole(viewer),
      })
    : null;

  return (
    <WorkspaceShell
      area="employer"
      title="Post a Role"
      subtitle="Create a new job posting for your company."
      nav={employerNav}
      activeHref="/employer/jobs/new"
      accent="linear-gradient(135deg,#7c5a28 0%,#b88a47 55%,#f1c88c 100%)"
      rightRail={
        membership ? (
          <>
            <SectionCard title="Your company">
              <div className="space-y-4">
                <div className="flex items-center justify-between gap-4">
                  <div>
                    <div className="jobs-kicker">Employer</div>
                    <div className="mt-2 text-lg font-semibold">{membership.employerName}</div>
                  </div>
                  <StatusPill label={employer?.verificationStatus ?? "pending"} tone={employer?.verificationStatus === "verified" ? "good" : "warn"} />
                </div>
                <p className="text-sm leading-7 text-[var(--jobs-muted)]">
                  {data.jobs.length} role{data.jobs.length === 1 ? "" : "s"} currently posted under this company.
                </p>
              </div>
            </SectionCard>
            <SectionCard title="Tips for better posts">
              <div className="space-y-3 text-sm text-[var(--jobs-muted)]">
                <div className="rounded-2xl bg-[var(--jobs-paper-soft)] p-4">Clear summaries and structured responsibilities attract stronger candidates.</div>
                <div className="rounded-2xl bg-[var(--jobs-paper-soft)] p-4">Sharing salary ranges and benefits increases application quality.</div>
              </div>
            </SectionCard>
            {eligibility ? (
              <SectionCard title="Posting readiness">
                <div className="space-y-3">
                  <div className="rounded-2xl bg-[var(--jobs-paper-soft)] p-4">
                    <div className="jobs-kicker">Account tier</div>
                    <div className="mt-2 text-lg font-semibold capitalize">
                      {eligibility.trustTier.replace(/_/g, " ")}
                    </div>
                    <p className="mt-2 text-sm leading-7 text-[var(--jobs-muted)]">
                      Your posting privileges are based on your company&apos;s verification status and account history.
                    </p>
                  </div>
                  <div className="space-y-2">
                    {eligibility.checklist.map((item) => (
                      <div key={item.id} className="rounded-2xl bg-[var(--jobs-paper-soft)] p-4">
                        <div className="flex items-center justify-between gap-3">
                          <div className="text-sm font-semibold">{item.label}</div>
                          <StatusPill label={item.complete ? "ready" : "open"} tone={item.complete ? "good" : "warn"} />
                        </div>
                        <p className="mt-2 text-sm leading-7 text-[var(--jobs-muted)]">{item.detail}</p>
                      </div>
                    ))}
                  </div>
                </div>
              </SectionCard>
            ) : null}
          </>
        ) : null
      }
    >
      {!membership ? (
        <SectionCard title="Company profile required" body="Set up your company profile before posting roles.">
          <EmptyState
            kicker="One more step"
            title="Create your company profile first."
            body="Your company profile is needed so candidates can learn about your team and your roles appear under the right employer."
            action={
              <Link href="/employer/company" className="jobs-button-primary rounded-full px-5 py-3 text-sm font-semibold">
                Open company setup
              </Link>
            }
          />
        </SectionCard>
      ) : (
        <SectionCard title="Create a new role" body="Fill in the details below. New posts may go through a brief review before going live.">
          {eligibility ? (
            <div className="mb-5 space-y-3">
              {eligibility.autoApprovalAllowed ? (
                <InlineNotice
                  tone="success"
                  title="Direct publishing available"
                  body="Your account can publish roles directly. They'll go live as soon as you submit."
                />
              ) : eligibility.canSubmitForReview ? (
                <InlineNotice
                  title="Review required"
                  body="New roles will be reviewed by our team before going live. This typically takes a few hours."
                />
              ) : (
                <InlineNotice
                  tone="warn"
                  title="Draft only"
                  body="You can prepare your job posting now, but it will be saved as a draft until your company profile meets our posting requirements."
                />
              )}
            </div>
          ) : null}
          <form action={createJobPostAction} className="grid gap-4">
            <input type="hidden" name="employerSlug" value={membership.employerSlug} />
            <div className="grid gap-4 md:grid-cols-2">
              <input name="title" className="jobs-input" placeholder="Role title" />
              <input name="slug" className="jobs-input" placeholder="Optional custom slug" />
            </div>
            <input name="subtitle" className="jobs-input" placeholder="Subtitle" />
            <textarea name="summary" className="jobs-textarea min-h-24" placeholder="Short role summary" />
            <textarea name="description" className="jobs-textarea min-h-40" placeholder="Full description" />
            <div className="grid gap-4 md:grid-cols-2">
              <input name="location" className="jobs-input" placeholder="Location" />
              <input name="category" className="jobs-input" placeholder="Category" />
            </div>
            <div className="grid gap-4 md:grid-cols-3">
              <input name="workMode" className="jobs-input" placeholder="remote / hybrid / onsite" />
              <input name="employmentType" className="jobs-input" placeholder="Full-time / Contract" />
              <input name="seniority" className="jobs-input" placeholder="Seniority" />
            </div>
            <input name="team" className="jobs-input" placeholder="Team" />
            <input name="skills" className="jobs-input" placeholder="Skills" />
            <textarea name="responsibilities" className="jobs-textarea min-h-24" placeholder="Responsibilities, one per line" />
            <textarea name="requirements" className="jobs-textarea min-h-24" placeholder="Requirements, one per line" />
            <textarea name="benefits" className="jobs-textarea min-h-24" placeholder="Benefits, one per line" />
            <div className="grid gap-4 md:grid-cols-2">
              <input name="salaryMin" className="jobs-input" placeholder="Salary min" />
              <input name="salaryMax" className="jobs-input" placeholder="Salary max" />
            </div>
            <PendingSubmitButton pendingLabel="Creating role..." className="w-full sm:w-auto">
              Create role
            </PendingSubmitButton>
          </form>
        </SectionCard>
      )}
    </WorkspaceShell>
  );
}
