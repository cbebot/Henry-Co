import { confirmEnrollmentPaymentAction } from "@/lib/learn/actions";
import { requireLearnRoles } from "@/lib/learn/auth";
import { getLearnSnapshot } from "@/lib/learn/data";
import { ownerNav } from "@/lib/learn/navigation";
import { PendingSubmitButton } from "@/components/learn/pending-submit-button";
import { humanizeLabel, LearnPanel, LearnWorkspaceShell } from "@/components/learn/ui";

export default async function OwnerLearnersPage() {
  await requireLearnRoles(["academy_owner", "academy_admin", "finance", "support"], "/owner/learners");
  const snapshot = await getLearnSnapshot();

  return (
    <LearnWorkspaceShell
      kicker="Learners"
      title="Monitor enrollments, payment state, and assignment pressure."
      description="Learner operations stay tied to live academy records so course status, assignments, and certificate eligibility stay consistent."
      nav={ownerNav("/owner/learners")}
    >
      <div className="space-y-5">
        {snapshot.enrollments.map((enrollment) => {
          const course = snapshot.courses.find((item) => item.id === enrollment.courseId);
          const payment = snapshot.payments.find((item) => item.enrollmentId === enrollment.id);
          return (
            <LearnPanel key={enrollment.id} className="rounded-[2rem]">
              <div className="flex flex-wrap items-center justify-between gap-4">
                <div>
                  <div className="font-semibold text-[var(--learn-ink)]">{course?.title}</div>
                  <p className="mt-2 text-sm text-[var(--learn-ink-soft)]">{enrollment.normalizedEmail || enrollment.userId} • {humanizeLabel(enrollment.status)} • {enrollment.percentComplete}%</p>
                </div>
                {payment && payment.status === "pending" ? (
                  <form action={confirmEnrollmentPaymentAction} className="flex gap-3">
                    <input type="hidden" name="paymentId" value={payment.id} />
                    <PendingSubmitButton className="px-4 py-2" pendingLabel="Confirming payment...">Confirm payment</PendingSubmitButton>
                    <PendingSubmitButton variant="secondary" name="sponsor" value="true" className="px-4 py-2" pendingLabel="Marking as sponsored...">Mark sponsored</PendingSubmitButton>
                  </form>
                ) : null}
              </div>
            </LearnPanel>
          );
        })}
      </div>
    </LearnWorkspaceShell>
  );
}
