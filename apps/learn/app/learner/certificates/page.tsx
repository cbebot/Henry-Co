import Link from "next/link";
import { requireLearnUser } from "@/lib/learn/auth";
import { getLearnerWorkspace } from "@/lib/learn/data";
import { learnerNav } from "@/lib/learn/navigation";
import { syncViewerIdentity } from "@/lib/learn/workflows";
import { LearnEmptyState, LearnPanel, LearnWorkspaceShell } from "@/components/learn/ui";

export default async function LearnerCertificatesPage() {
  const viewer = await requireLearnUser("/learner/certificates");
  await syncViewerIdentity(viewer);
  const workspace = await getLearnerWorkspace(viewer);

  return (
    <LearnWorkspaceShell
      kicker="Certificates"
      title="Every verified HenryCo Learn credential, in one place."
      description="Certificates are linked to course completion and public verification so the record stays useful outside the academy UI."
      nav={learnerNav("/learner/certificates")}
    >
      {workspace.certificates.length === 0 ? (
        <LearnEmptyState title="No certificates yet" body="Complete certification-ready programs to issue verifiable HenryCo Learn certificates." />
      ) : (
        <div className="grid gap-5 lg:grid-cols-2">
          {workspace.certificates.map((certificate) => {
            const course = workspace.snapshot.courses.find((item) => item.id === certificate.courseId);
            return (
              <LearnPanel key={certificate.id} className="rounded-[2rem]">
                <h3 className="text-2xl font-semibold tracking-[-0.04em] text-[var(--learn-ink)]">{course?.title}</h3>
                <p className="mt-3 text-sm leading-7 text-[var(--learn-ink-soft)]">Certificate no: {certificate.certificateNo}</p>
                <p className="mt-1 text-sm leading-7 text-[var(--learn-ink-soft)]">Verification code: {certificate.verificationCode}</p>
                <Link href={`/certifications/verify/${certificate.verificationCode}`} className="mt-5 inline-flex text-sm font-semibold text-[var(--learn-mint-soft)]">
                  Open verification page
                </Link>
              </LearnPanel>
            );
          })}
        </div>
      )}
    </LearnWorkspaceShell>
  );
}
