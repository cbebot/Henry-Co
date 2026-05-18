import { translateSurfaceLabel } from "@henryco/i18n";
import { requireJobsUser } from "@/lib/auth";
import { getCandidateDashboardData } from "@/lib/jobs/data";
import { candidateNav } from "@/lib/jobs/navigation";
import { getJobsPublicLocale } from "@/lib/locale-server";
import CandidateFilesClient from "@/components/candidate/CandidateFilesClient";
import { WorkspaceShell } from "@/components/workspace-shell";

export const dynamic = "force-dynamic";

export default async function CandidateFilesPage({
  searchParams,
}: {
  searchParams?: Promise<Record<string, string | string[] | undefined>>;
}) {
  const viewer = await requireJobsUser("/candidate/files");
  const locale = await getJobsPublicLocale();
  const t = (text: string) => translateSurfaceLabel(locale, text);
  const [data, params] = await Promise.all([
    getCandidateDashboardData(viewer.user!.id, locale),
    searchParams ?? Promise.resolve({} as Record<string, string | string[] | undefined>),
  ]);
  const uploaded = params.uploaded === "1";

  return (
    <WorkspaceShell
      area="candidate"
      title={t("Files")}
      subtitle={t("Upload your resume, certifications, and portfolio to strengthen your applications.")}
      nav={candidateNav}
      activeHref="/candidate/files"
      accent="linear-gradient(135deg,#0d5e66 0%,#0e7c86 55%,#7fd0d4 100%)"
    >
      <CandidateFilesClient initialDocuments={data.documents} uploadedFromRedirect={uploaded} />
    </WorkspaceShell>
  );
}
