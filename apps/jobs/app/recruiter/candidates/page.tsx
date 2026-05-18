import Link from "next/link";
import { translateSurfaceLabel } from "@henryco/i18n";
import { requireJobsRoles } from "@/lib/auth";
import { getRecruiterOverviewData } from "@/lib/jobs/data";
import { recruiterNav } from "@/lib/jobs/navigation";
import { getJobsPublicLocale } from "@/lib/locale-server";
import { SectionCard, WorkspaceShell } from "@/components/workspace-shell";

export const dynamic = "force-dynamic";

export default async function RecruiterCandidatesPage() {
  await requireJobsRoles(["recruiter", "admin", "owner", "moderator"], "/recruiter/candidates");
  const locale = await getJobsPublicLocale();
  const t = (text: string) => translateSurfaceLabel(locale, text);
  const data = await getRecruiterOverviewData(locale);

  return (
    <WorkspaceShell area="recruiter" title={t("Candidates")} subtitle={t("Profile quality and readiness across the candidate pool.")} nav={recruiterNav} activeHref="/recruiter" accent="linear-gradient(135deg,#1d3f6f 0%,#3266b4 55%,#6db7ff 100%)">
      <SectionCard title={t("Candidate profiles")}>
        <div className="space-y-3">
          {data.candidateProfiles.map((candidate) => (
            <Link key={candidate!.userId} href={`/recruiter/candidates/${candidate!.userId}`} className="block rounded-2xl bg-[var(--jobs-paper-soft)] p-4">
              <div className="flex items-center justify-between gap-4">
                <div>
                  <div className="font-semibold">{candidate!.fullName || t("Candidate")}</div>
                  <div className="mt-1 text-sm text-[var(--jobs-muted)]">{candidate!.headline || candidate!.summary || t("Profile in progress")}</div>
                </div>
                <span className="rounded-full bg-[var(--jobs-accent-soft)] px-3 py-1 text-xs font-semibold">{candidate!.trustScore}</span>
              </div>
            </Link>
          ))}
        </div>
      </SectionCard>
    </WorkspaceShell>
  );
}
