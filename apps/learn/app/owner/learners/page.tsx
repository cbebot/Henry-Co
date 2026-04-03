import { confirmEnrollmentPaymentAction } from "@/lib/learn/actions";
import { requireLearnRoles } from "@/lib/learn/auth";
import { getLearnSnapshot } from "@/lib/learn/data";
import { ownerNav } from "@/lib/learn/navigation";
import { LearnPanel, LearnWorkspaceShell } from "@/components/learn/ui";

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
                  <p className="mt-2 text-sm text-[var(--learn-ink-soft)]">{enrollment.normalizedEmail || enrollment.userId} • {enrollment.status} • {enrollment.percentComplete}%</p>
                </div>
                {payment && payment.status === "pending" ? (
                  <form action={confirmEnrollmentPaymentAction} className="flex gap-3">
                    <input type="hidden" name="paymentId" value={payment.id} />
                    <button type="submit" className="learn-button-primary rounded-full px-4 py-2 text-sm font-semibold">Confirm payment</button>
                    <button type="submit" name="sponsor" value="true" className="learn-button-secondary rounded-full px-4 py-2 text-sm font-semibold">Mark sponsored</button>
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
