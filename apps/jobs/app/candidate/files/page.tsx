import { uploadCandidateDocumentAction } from "@/app/actions";
import { requireJobsUser } from "@/lib/auth";
import { getCandidateDashboardData } from "@/lib/jobs/data";
import { candidateNav } from "@/lib/jobs/navigation";
import { SectionCard, WorkspaceShell } from "@/components/workspace-shell";

export const dynamic = "force-dynamic";

export default async function CandidateFilesPage() {
  const viewer = await requireJobsUser("/candidate/files");
  const data = await getCandidateDashboardData(viewer.user!.id);

  return (
    <WorkspaceShell
      area="candidate"
      title="Files"
      subtitle="Resume, portfolio proof, and certifications live in the jobs document vault."
      nav={candidateNav}
      activeHref="/candidate/files"
      accent="linear-gradient(135deg,#0d5e66 0%,#0e7c86 55%,#7fd0d4 100%)"
    >
      <SectionCard title="Upload document" body="Documents are stored in the private HenryCo jobs document vault and linked into the shared customer document layer.">
        <form action={uploadCandidateDocumentAction} className="grid gap-4 md:grid-cols-[180px_1fr_auto]">
          <select name="kind" className="jobs-select">
            <option value="resume">Resume</option>
            <option value="portfolio">Portfolio</option>
            <option value="certification">Certification</option>
          </select>
          <input type="file" name="file" className="jobs-input" />
          <button className="jobs-button-primary rounded-full px-5 py-3 text-sm font-semibold">Upload</button>
        </form>
      </SectionCard>

      <SectionCard title="Document vault">
        <div className="space-y-3">
          {data.documents.map((document) => (
            <a key={document.id} href={document.fileUrl} target="_blank" rel="noreferrer" className="flex items-center justify-between rounded-2xl bg-[var(--jobs-paper-soft)] p-4">
              <div>
                <div className="font-semibold">{document.name}</div>
                <div className="mt-1 text-sm text-[var(--jobs-muted)]">{document.kind}</div>
              </div>
              <span className="text-sm font-semibold text-[var(--jobs-accent)]">Open</span>
            </a>
          ))}
        </div>
      </SectionCard>
    </WorkspaceShell>
  );
}
