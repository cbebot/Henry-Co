import { updateEmployerVerificationAction } from "@/app/actions";
import { requireJobsRoles } from "@/lib/auth";
import { getRecruiterOverviewData } from "@/lib/jobs/data";
import { recruiterNav } from "@/lib/jobs/navigation";
import { EmptyState, InlineNotice } from "@/components/feedback";
import { PendingSubmitButton } from "@/components/pending-submit-button";
import { SectionCard, StatusPill, WorkspaceShell } from "@/components/workspace-shell";

export const dynamic = "force-dynamic";

function toneForVerification(status: string) {
  if (status === "verified") return "good" as const;
  if (status === "watch" || status === "rejected") return "danger" as const;
  return "warn" as const;
}

export default async function RecruiterEmployersPage({
  searchParams,
}: {
  searchParams?: Promise<Record<string, string | string[] | undefined>>;
}) {
  await requireJobsRoles(["recruiter", "admin", "owner", "moderator"], "/recruiter/employers");
  const [data, params] = await Promise.all([
    getRecruiterOverviewData(),
    searchParams ?? Promise.resolve({} as Record<string, string | string[] | undefined>),
  ]);
  const updated = typeof params.updated === "string" ? params.updated : null;

  return (
    <WorkspaceShell area="recruiter" title="Employers" subtitle="Review and manage employer verification status." nav={recruiterNav} activeHref="/recruiter/employers" accent="linear-gradient(135deg,#1d3f6f 0%,#3266b4 55%,#6db7ff 100%)">
      <div className="space-y-4">
        {updated ? (
          <InlineNotice
            tone="success"
            title="Verification updated"
            body={`${updated} has been updated in the live employer verification queue and audit history.`}
          />
        ) : null}

        <SectionCard title="Employer verification">
          {data.employers.length === 0 ? (
            <EmptyState
              kicker="Queue is clear"
              title="No employer profiles are waiting here right now."
              body="New employer profiles will appear here when companies register and need verification."
            />
          ) : (
            <div className="space-y-3">
              {data.employers.map((employer) => (
                <div key={employer.slug} className="rounded-2xl bg-[var(--jobs-paper-soft)] p-4">
                  <div className="flex flex-col gap-4 xl:flex-row xl:items-start xl:justify-between">
                    <div className="min-w-0">
                      <div className="flex flex-wrap items-center gap-3">
                        <div className="font-semibold">{employer.name}</div>
                        <StatusPill label={employer.verificationStatus} tone={toneForVerification(employer.verificationStatus)} />
                        <StatusPill label={employer.trustPassport.label} tone={toneForVerification(employer.trustPassport.riskBand === "low" ? "verified" : employer.verificationStatus)} />
                      </div>
                      <div className="mt-1 text-sm text-[var(--jobs-muted)]">{employer.industry} · Profile strength {employer.trustScore}%</div>
                      <div className="mt-2 text-xs leading-6 text-[var(--jobs-muted)]">{employer.trustPassport.summary}</div>
                    </div>
                    <form action={updateEmployerVerificationAction} className="grid gap-3 sm:grid-cols-[minmax(0,150px)_minmax(0,220px)_auto]">
                      <input type="hidden" name="employerSlug" value={employer.slug} />
                      <input type="hidden" name="returnTo" value="/recruiter/employers" />
                      <select name="status" defaultValue={employer.verificationStatus} className="jobs-select">
                        {["pending", "verified", "watch", "rejected"].map((status) => (
                          <option key={status} value={status}>{status}</option>
                        ))}
                      </select>
                      <input name="reason" className="jobs-input" placeholder="Reason or review note" />
                      <PendingSubmitButton tone="secondary" pendingLabel="Saving..." className="w-full sm:w-auto">
                        Save
                      </PendingSubmitButton>
                    </form>
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
