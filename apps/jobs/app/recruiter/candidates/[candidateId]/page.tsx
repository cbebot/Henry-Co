import { notFound } from "next/navigation";
import { requireJobsRoles } from "@/lib/auth";
import { getCandidateProfileByUserId } from "@/lib/jobs/data";
import { recruiterNav } from "@/lib/jobs/navigation";
import { SectionCard, WorkspaceShell } from "@/components/workspace-shell";

export const dynamic = "force-dynamic";

export default async function RecruiterCandidateDetailPage({
  params,
}: {
  params: Promise<{ candidateId: string }>;
}) {
  const { candidateId } = await params;
  await requireJobsRoles(["recruiter", "admin", "owner", "moderator"], `/recruiter/candidates/${candidateId}`);
  const profile = await getCandidateProfileByUserId(candidateId);
  if (!profile) notFound();

  return (
    <WorkspaceShell area="recruiter" title="Candidate Detail" subtitle="Readiness, skills, and profile depth for a single candidate." nav={recruiterNav} activeHref="/recruiter" accent="linear-gradient(135deg,#1d3f6f 0%,#3266b4 55%,#6db7ff 100%)">
      <SectionCard title={profile.fullName || "Candidate"} body={profile.summary}>
        <div className="grid gap-4 md:grid-cols-2">
          <div className="rounded-2xl bg-[var(--jobs-paper-soft)] p-4 text-sm text-[var(--jobs-muted)]">
            Readiness {profile.readinessLabel} · Trust {profile.trustScore}
          </div>
          <div className="rounded-2xl bg-[var(--jobs-paper-soft)] p-4 text-sm text-[var(--jobs-muted)]">
            Skills: {profile.skills.join(", ")}
          </div>
        </div>
      </SectionCard>
    </WorkspaceShell>
  );
}
