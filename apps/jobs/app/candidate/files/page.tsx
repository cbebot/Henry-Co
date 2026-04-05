import Link from "next/link";
import { uploadCandidateDocumentAction } from "@/app/actions";
import { requireJobsUser } from "@/lib/auth";
import { getCandidateDashboardData } from "@/lib/jobs/data";
import { candidateNav } from "@/lib/jobs/navigation";
import { EmptyState, InlineNotice } from "@/components/feedback";
import { PendingSubmitButton } from "@/components/pending-submit-button";
import { SectionCard, WorkspaceShell } from "@/components/workspace-shell";

export const dynamic = "force-dynamic";

function formatFileSize(value: number | null) {
  if (!value) return "Unknown size";
  if (value < 1024 * 1024) return `${Math.max(value / 1024, 1).toFixed(0)} KB`;
  return `${(value / (1024 * 1024)).toFixed(1)} MB`;
}

export default async function CandidateFilesPage({
  searchParams,
}: {
  searchParams?: Promise<Record<string, string | string[] | undefined>>;
}) {
  const viewer = await requireJobsUser("/candidate/files");
  const [data, params] = await Promise.all([
    getCandidateDashboardData(viewer.user!.id),
    searchParams ?? Promise.resolve({} as Record<string, string | string[] | undefined>),
  ]);
  const uploaded = params.uploaded === "1";

  return (
    <WorkspaceShell
      area="candidate"
      title="Files"
      subtitle="Upload your resume, certifications, and portfolio to strengthen your applications."
      nav={candidateNav}
      activeHref="/candidate/files"
      accent="linear-gradient(135deg,#0d5e66 0%,#0e7c86 55%,#7fd0d4 100%)"
    >
      <div className="space-y-4">
        {uploaded ? (
          <InlineNotice
            tone="success"
            title="Document uploaded"
            body="Your file has been uploaded and is now part of your candidate profile."
          />
        ) : null}

        <SectionCard title="Upload a document" body="Accepted formats include PDF, Word, and image files.">
          <form action={uploadCandidateDocumentAction} className="grid gap-4 md:grid-cols-[180px_1fr_auto]">
            <select name="kind" className="jobs-select">
              <option value="resume">Resume</option>
              <option value="portfolio">Portfolio</option>
              <option value="certification">Certification</option>
            </select>
            <input type="file" name="file" className="jobs-input" />
            <PendingSubmitButton pendingLabel="Uploading..." className="w-full md:w-auto">
              Upload
            </PendingSubmitButton>
          </form>
        </SectionCard>

        <SectionCard title="Your documents" body="Files you've uploaded to support your applications.">
          {data.documents.length === 0 ? (
            <EmptyState
              kicker="Vault is empty"
              title="Add your resume or supporting proof."
              body="A resume is the fastest way to strengthen your profile and give employers useful context."
              action={
                <Link href="/candidate/profile" className="jobs-button-secondary rounded-full px-5 py-3 text-sm font-semibold">
                  Review profile
                </Link>
              }
            />
          ) : (
            <div className="space-y-3">
              {data.documents.map((document) => (
                <a
                  key={document.id}
                  href={document.fileUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="flex flex-wrap items-center justify-between gap-4 rounded-2xl bg-[var(--jobs-paper-soft)] p-4 hover:bg-[var(--jobs-accent-soft)]"
                >
                  <div>
                    <div className="font-semibold">{document.name}</div>
                    <div className="mt-1 text-sm text-[var(--jobs-muted)]">
                      {document.kind} | {formatFileSize(document.fileSize)} | Added{" "}
                      {new Intl.DateTimeFormat("en-US", { dateStyle: "medium" }).format(new Date(document.createdAt))}
                    </div>
                  </div>
                  <span className="text-sm font-semibold text-[var(--jobs-accent)]">Open</span>
                </a>
              ))}
            </div>
          )}
        </SectionCard>
      </div>
    </WorkspaceShell>
  );
}
