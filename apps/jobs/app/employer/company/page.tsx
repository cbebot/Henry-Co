import { createEmployerProfileAction } from "@/app/actions";
import { requireJobsRoles } from "@/lib/auth";
import { getEmployerDashboardData, getEmployerProfileBySlug } from "@/lib/jobs/data";
import { employerNav } from "@/lib/jobs/navigation";
import { InlineNotice } from "@/components/feedback";
import { PendingSubmitButton } from "@/components/pending-submit-button";
import { SectionCard, StatusPill, WorkspaceShell } from "@/components/workspace-shell";

export const dynamic = "force-dynamic";

function toneForVerification(status: string) {
  if (status === "verified") return "good" as const;
  if (status === "watch" || status === "rejected") return "danger" as const;
  return "warn" as const;
}

export default async function EmployerCompanyPage({
  searchParams,
}: {
  searchParams?: Promise<Record<string, string | string[] | undefined>>;
}) {
  const viewer = await requireJobsRoles(["employer", "admin", "owner"], "/employer/company");
  const [data, params] = await Promise.all([
    getEmployerDashboardData(viewer.user!.id, viewer.user!.email),
    searchParams ?? Promise.resolve({} as Record<string, string | string[] | undefined>),
  ]);
  const membership = data.memberships[0];
  const companyRecord = membership ? await getEmployerProfileBySlug(membership.employerSlug, { includeUnpublished: true }) : null;
  const employer = companyRecord?.employer ?? null;
  const created = typeof params.created === "string" ? params.created : null;

  return (
    <WorkspaceShell
      area="employer"
      title="Company Profile"
      subtitle="Set up your company profile so candidates can learn about your team."
      nav={employerNav}
      activeHref="/employer/company"
      accent="linear-gradient(135deg,#7c5a28 0%,#b88a47 55%,#f1c88c 100%)"
      rightRail={
        <>
          <SectionCard title="Verification status">
            <div className="space-y-4">
              <div className="flex items-center justify-between gap-4">
                <div>
                  <div className="jobs-kicker">Status</div>
                  <div className="mt-2 text-lg font-semibold capitalize">{employer?.verificationStatus ?? "Pending"}</div>
                </div>
                <StatusPill label={employer?.verificationStatus ?? "pending"} tone={toneForVerification(employer?.verificationStatus ?? "pending")} />
              </div>
              <p className="text-sm leading-7 text-[var(--jobs-muted)]">
                {employer
                  ? `${employer.openRoleCount} open role${employer.openRoleCount === 1 ? "" : "s"}. You aim to respond to candidates within ${employer.responseSlaHours} hours.`
                  : "Create your company profile to begin the verification process and set up your public employer page."}
              </p>
            </div>
          </SectionCard>
          <SectionCard title="Tips for a strong profile">
            <div className="space-y-3 text-sm text-[var(--jobs-muted)]">
              <div className="rounded-2xl bg-[var(--jobs-paper-soft)] p-4">A clear public description of the team and hiring intent.</div>
              <div className="rounded-2xl bg-[var(--jobs-paper-soft)] p-4">Working policies, locations, and culture points that remove ambiguity.</div>
              <div className="rounded-2xl bg-[var(--jobs-paper-soft)] p-4">A verified surface that recruiters and candidates can trust.</div>
            </div>
          </SectionCard>
        </>
      }
    >
      <div className="space-y-4">
        {created ? (
          <InlineNotice
            tone="success"
            title="Employer profile saved"
            body={`${created} has been saved. Your company profile is now in the verification queue.`}
          />
        ) : null}

        <SectionCard title="Company details" body="This information appears on your public employer page and helps candidates evaluate your company.">
          <form action={createEmployerProfileAction} className="grid gap-4">
            <div className="grid gap-4 md:grid-cols-2">
              <input name="name" className="jobs-input" defaultValue={employer?.name || membership?.employerName || ""} placeholder="Company name" />
              <input name="slug" className="jobs-input" defaultValue={employer?.slug || membership?.employerSlug || ""} placeholder="company-slug" />
            </div>
            <input name="tagline" className="jobs-input" defaultValue={employer?.tagline || ""} placeholder="Tagline" />
            <textarea name="description" className="jobs-textarea min-h-32" defaultValue={employer?.description || ""} placeholder="Employer description" />
            <div className="grid gap-4 md:grid-cols-2">
              <input name="website" className="jobs-input" defaultValue={employer?.website || ""} placeholder="Website" />
              <input name="industry" className="jobs-input" defaultValue={employer?.industry || ""} placeholder="Industry" />
            </div>
            <div className="grid gap-4 md:grid-cols-2">
              <input name="locations" className="jobs-input" defaultValue={employer?.locations.join(", ") || ""} placeholder="Lagos, Abuja, Remote" />
              <input name="headcount" className="jobs-input" defaultValue={employer?.headcount || ""} placeholder="Headcount" />
            </div>
            <div className="grid gap-4 md:grid-cols-2">
              <input name="remotePolicy" className="jobs-input" defaultValue={employer?.remotePolicy || ""} placeholder="Remote policy" />
              <input name="benefitsHeadline" className="jobs-input" defaultValue={employer?.benefitsHeadline || ""} placeholder="Benefits headline" />
            </div>
            <input name="culturePoints" className="jobs-input" defaultValue={employer?.culturePoints.join(", ") || ""} placeholder="Culture points" />
            <select name="employerType" className="jobs-select" defaultValue={employer?.employerType || "external"}>
              <option value="external">External employer</option>
              <option value="internal">Internal HenryCo hiring</option>
            </select>
            <PendingSubmitButton pendingLabel="Saving company..." className="w-full sm:w-auto">
              Save employer profile
            </PendingSubmitButton>
          </form>
        </SectionCard>
      </div>
    </WorkspaceShell>
  );
}
