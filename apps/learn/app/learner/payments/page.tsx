import { requireLearnUser } from "@/lib/learn/auth";
import { getLearnerWorkspace } from "@/lib/learn/data";
import { learnerNav } from "@/lib/learn/navigation";
import { syncViewerIdentity } from "@/lib/learn/workflows";
import { LearnEmptyState, LearnPanel, LearnWorkspaceShell } from "@/components/learn/ui";

export default async function LearnerPaymentsPage() {
  const viewer = await requireLearnUser("/learner/payments");
  await syncViewerIdentity(viewer);
  const workspace = await getLearnerWorkspace(viewer);

  return (
    <LearnWorkspaceShell
      kicker="Payments"
      title="Manual payment and sponsored training visibility without guesswork."
      description="HenryCo Learn records payment checkpoints, sponsorship, and invoice readiness even when a course is managed through manual confirmation."
      nav={learnerNav("/learner/payments")}
    >
      {workspace.payments.length === 0 ? (
        <LearnEmptyState title="No payment records yet" body="Free programs and sponsored internal training may never appear here. Paid seats and confirmations will show once created." />
      ) : (
        <div className="space-y-5">
          {workspace.payments.map((payment) => {
            const course = workspace.snapshot.courses.find((item) => item.id === payment.courseId);
            return (
              <LearnPanel key={payment.id} className="rounded-[2rem]">
                <h3 className="text-2xl font-semibold tracking-[-0.04em] text-[var(--learn-ink)]">{course?.title}</h3>
                <p className="mt-3 text-sm leading-7 text-[var(--learn-ink-soft)]">Reference: {payment.reference}</p>
                <p className="mt-1 text-sm leading-7 text-[var(--learn-ink-soft)]">Status: {payment.status}</p>
              </LearnPanel>
            );
          })}
        </div>
      )}
    </LearnWorkspaceShell>
  );
}
