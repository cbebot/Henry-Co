import Link from "next/link";
import { getAccountUrl } from "@henryco/config";
import { saveCandidateProfileAction } from "@/app/actions";
import { requireJobsUser } from "@/lib/auth";
import { getCandidateDashboardData } from "@/lib/jobs/data";
import { candidateNav } from "@/lib/jobs/navigation";
import { InlineNotice } from "@/components/feedback";
import { PendingSubmitButton } from "@/components/pending-submit-button";
import { SectionCard, StatusPill, WorkspaceShell } from "@/components/workspace-shell";

export const dynamic = "force-dynamic";

function toneForVerification(status: string) {
  if (status === "verified") return "good" as const;
  if (status === "pending") return "warn" as const;
  if (status === "rejected") return "danger" as const;
  return "neutral" as const;
}

export default async function CandidateProfilePage({
  searchParams,
}: {
  searchParams?: Promise<Record<string, string | string[] | undefined>>;
}) {
  const viewer = await requireJobsUser("/candidate/profile");
  const [data, params] = await Promise.all([
    getCandidateDashboardData(viewer.user!.id),
    searchParams ?? Promise.resolve({} as Record<string, string | string[] | undefined>),
  ]);
  const profile = data.profile;
  const saved = params.saved === "1";

  return (
    <WorkspaceShell
      area="candidate"
      title="Candidate Profile"
      subtitle="Keep your profile complete so employers can see the best version of you."
      nav={candidateNav}
      activeHref="/candidate/profile"
      accent="linear-gradient(135deg,#0d5e66 0%,#0e7c86 55%,#7fd0d4 100%)"
      rightRail={
        <>
          <SectionCard title="Profile trust">
            <div className="space-y-4">
              <div className="flex items-center justify-between gap-4">
                <div>
                  <div className="jobs-kicker">Verification</div>
                  <div className="mt-2 text-3xl font-semibold">{profile?.trustScore ?? 0}</div>
                </div>
                <StatusPill label={profile?.verificationStatus ?? "unverified"} tone={toneForVerification(profile?.verificationStatus ?? "unverified")} />
              </div>
              <p className="text-sm leading-7 text-[var(--jobs-muted)]">
                {profile?.readinessLabel || "Complete your profile to improve how employers see your applications."}
              </p>
              {profile?.verificationStatus !== "verified" ? (
                <Link
                  href={getAccountUrl("/verification")}
                  className="inline-flex rounded-full bg-[var(--jobs-accent-soft)] px-4 py-2 text-xs font-semibold text-[var(--jobs-accent)]"
                >
                  Open account verification
                </Link>
              ) : null}
            </div>
          </SectionCard>
          <SectionCard title="Documents">
            <div className="space-y-3 text-sm text-[var(--jobs-muted)]">
              <div className="rounded-2xl bg-[var(--jobs-paper-soft)] p-4">
                {data.documents.length} file{data.documents.length === 1 ? "" : "s"} uploaded to your profile.
              </div>
              <div className="rounded-2xl bg-[var(--jobs-paper-soft)] p-4">
                Skills, work history, and portfolio links help employers evaluate your applications.
              </div>
            </div>
          </SectionCard>
        </>
      }
    >
      <div className="space-y-4">
        {saved ? (
          <InlineNotice
            tone="success"
            title="Profile saved"
            body="Your profile has been updated. Changes are visible to employers when you apply."
          />
        ) : null}

        <SectionCard title="Edit your profile" body="This information is shared with employers when you apply to roles.">
          <form action={saveCandidateProfileAction} className="grid gap-4">
            <div className="grid gap-4 md:grid-cols-2">
              <input
                name="fullName"
                autoComplete="name"
                className="jobs-input"
                defaultValue={profile?.fullName || viewer.user!.fullName || ""}
                placeholder="Full name"
              />
              <input
                name="phone"
                autoComplete="tel"
                className="jobs-input"
                defaultValue={profile?.phone || viewer.user!.phone || ""}
                placeholder="Phone number"
              />
            </div>
            <input name="headline" className="jobs-input" defaultValue={profile?.headline || ""} placeholder="Headline" />
            <textarea name="summary" className="jobs-textarea min-h-36" defaultValue={profile?.summary || ""} placeholder="Professional summary" />
            <div className="grid gap-4 md:grid-cols-2">
              <input name="location" className="jobs-input" defaultValue={profile?.location || ""} placeholder="Location" />
              <input name="timezone" className="jobs-input" defaultValue={profile?.timezone || ""} placeholder="Timezone" />
            </div>
            <div className="grid gap-4 md:grid-cols-2">
              <input name="workModes" className="jobs-input" defaultValue={profile?.workModes.join(", ") || ""} placeholder="remote, hybrid, onsite" />
              <input name="roleTypes" className="jobs-input" defaultValue={profile?.roleTypes.join(", ") || ""} placeholder="full-time, contract" />
            </div>
            <input
              name="preferredFunctions"
              className="jobs-input"
              defaultValue={profile?.preferredFunctions.join(", ") || ""}
              placeholder="Product, Operations, Marketing"
            />
            <input name="skills" className="jobs-input" defaultValue={profile?.skills.join(", ") || ""} placeholder="Skills" />
            <input
              name="portfolioLinks"
              className="jobs-input"
              defaultValue={profile?.portfolioLinks.join(", ") || ""}
              placeholder="Portfolio links"
            />
            <div className="grid gap-4 md:grid-cols-2">
              <input name="salaryExpectation" className="jobs-input" defaultValue={profile?.salaryExpectation || ""} placeholder="Salary expectation" />
              <input name="availability" className="jobs-input" defaultValue={profile?.availability || ""} placeholder="Availability" />
            </div>
            <textarea
              name="workHistory"
              className="jobs-textarea min-h-28"
              defaultValue={JSON.stringify(profile?.workHistory || [], null, 2)}
              placeholder='[{"company":"HenryCo","title":"Operations Lead"}]'
            />
            <textarea
              name="education"
              className="jobs-textarea min-h-24"
              defaultValue={JSON.stringify(profile?.education || [], null, 2)}
              placeholder='[{"school":"University","degree":"BSc"}]'
            />
            <textarea
              name="certifications"
              className="jobs-textarea min-h-24"
              defaultValue={JSON.stringify(profile?.certifications || [], null, 2)}
              placeholder='[{"name":"Project Management"}]'
            />
            <PendingSubmitButton pendingLabel="Saving profile..." className="w-full sm:w-auto">
              Save candidate profile
            </PendingSubmitButton>
          </form>
        </SectionCard>
      </div>
    </WorkspaceShell>
  );
}
