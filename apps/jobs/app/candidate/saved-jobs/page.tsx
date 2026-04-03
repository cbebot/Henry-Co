import Link from "next/link";
import { requireJobsUser } from "@/lib/auth";
import { getCandidateDashboardData } from "@/lib/jobs/data";
import { candidateNav } from "@/lib/jobs/navigation";
import { SectionCard, WorkspaceShell } from "@/components/workspace-shell";

export const dynamic = "force-dynamic";

export default async function CandidateSavedJobsPage() {
  const viewer = await requireJobsUser("/candidate/saved-jobs");
  const data = await getCandidateDashboardData(viewer.user!.id);

  return (
    <WorkspaceShell
      area="candidate"
      title="Saved Jobs"
      subtitle="Keep a calm shortlist of roles worth revisiting."
      nav={candidateNav}
      activeHref="/candidate/saved-jobs"
      accent="linear-gradient(135deg,#0d5e66 0%,#0e7c86 55%,#7fd0d4 100%)"
    >
      <SectionCard title="Saved roles" body="Saved jobs stay attached to your future HenryCo account graph.">
        <div className="space-y-3">
          {data.savedJobs.map((saved) => (
            <Link key={saved.id} href={`/jobs/${saved.job.slug}`} className="block rounded-2xl bg-[var(--jobs-paper-soft)] p-4 hover:bg-[var(--jobs-accent-soft)]">
              <div className="font-semibold">{saved.job.title}</div>
              <div className="mt-1 text-sm text-[var(--jobs-muted)]">{saved.job.employerName} · {saved.job.location}</div>
            </Link>
          ))}
        </div>
      </SectionCard>
    </WorkspaceShell>
  );
}
