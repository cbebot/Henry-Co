import { reviewTeacherApplicationAction } from "@/lib/learn/actions";
import { requireLearnRoles } from "@/lib/learn/auth";
import { getLearnSnapshot } from "@/lib/learn/data";
import { ownerNav } from "@/lib/learn/navigation";
import { PendingSubmitButton } from "@/components/learn/pending-submit-button";
import { LearnEmptyState, LearnMetricCard, LearnPanel, LearnStatusBadge, LearnWorkspaceShell } from "@/components/learn/ui";

export default async function OwnerInstructorsPage({
  searchParams,
}: {
  searchParams: Promise<{ updated?: string }>;
}) {
  await requireLearnRoles(["academy_owner", "academy_admin"], "/owner/instructors");
  const params = await searchParams;
  const snapshot = await getLearnSnapshot();
  const applications = [...snapshot.teacherApplications].sort((left, right) =>
    right.updatedAt.localeCompare(left.updatedAt)
  );
  const activeApplications = applications.filter((item) =>
    ["submitted", "under_review", "changes_requested"].includes(item.status)
  );

  return (
    <LearnWorkspaceShell
      kicker="Instructor Ops"
      title="Review applications, approve instructors, and keep onboarding structured."
      description="Teaching opportunities, approval notes, and instructor access should be managed with the same operational discipline as courses and certificates."
      nav={ownerNav("/owner/instructors")}
    >
      {params.updated ? (
        <LearnPanel className="rounded-[2rem]">
          <p className="text-sm font-semibold text-[var(--learn-mint-soft)]">
            Instructor application updated: {params.updated.replace(/_/g, " ")}.
          </p>
        </LearnPanel>
      ) : null}

      <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-4">
        <LearnMetricCard label="Applications" value={String(applications.length)} hint="All instructor applications currently stored in HenryCo Learn." />
        <LearnMetricCard label="Open review" value={String(activeApplications.length)} hint="Applications still moving through review or changes." />
        <LearnMetricCard label="Approved" value={String(applications.filter((item) => item.status === "approved").length)} hint="Approved instructors ready for onboarding or content work." />
        <LearnMetricCard label="Public profiles" value={String(snapshot.instructors.length)} hint="Published instructor spotlights already visible in the academy." />
      </div>

      {applications.length === 0 ? (
        <LearnEmptyState
          title="No instructor applications yet"
          body="Public teaching applications will appear here once candidates apply through Teach with HenryCo."
        />
      ) : (
        <div className="space-y-5">
          {applications.map((application) => (
            <LearnPanel key={application.id} className="rounded-[2rem]">
              <div className="flex flex-wrap items-start justify-between gap-4">
                <div>
                  <div className="flex flex-wrap items-center gap-2">
                    <h2 className="text-2xl font-semibold tracking-[-0.04em] text-[var(--learn-ink)]">
                      {application.fullName}
                    </h2>
                    <LearnStatusBadge
                      label={application.status.replace(/_/g, " ")}
                      tone={
                        application.status === "approved"
                          ? "success"
                          : application.status === "changes_requested"
                            ? "warning"
                            : "signal"
                      }
                    />
                  </div>
                  <p className="mt-2 text-sm leading-7 text-[var(--learn-ink-soft)]">
                    {application.normalizedEmail || "No email"} • {application.phone || "No phone"} •{" "}
                    {application.country || "Country not supplied"}
                  </p>
                  <p className="mt-2 text-sm leading-7 text-[var(--learn-ink-soft)]">
                    <span className="font-semibold text-[var(--learn-ink)]">Expertise:</span>{" "}
                    {application.expertiseArea}
                  </p>
                </div>
                <div className="rounded-[1.4rem] border border-[var(--learn-line)] bg-white/5 px-4 py-3 text-sm text-[var(--learn-ink-soft)]">
                  Updated{" "}
                  {new Date(application.updatedAt).toLocaleDateString("en-NG", {
                    day: "numeric",
                    month: "short",
                    year: "numeric",
                  })}
                </div>
              </div>

              <div className="mt-5 grid gap-4 xl:grid-cols-[1fr,0.95fr]">
                <div className="space-y-4">
                  <div className="rounded-[1.4rem] border border-[var(--learn-line)] bg-white/5 p-4">
                    <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[var(--learn-ink-soft)]">
                      Teaching topics
                    </p>
                    <p className="mt-2 text-sm leading-7 text-[var(--learn-ink)]">
                      {application.teachingTopics.join(", ")}
                    </p>
                  </div>
                  <div className="rounded-[1.4rem] border border-[var(--learn-line)] bg-white/5 p-4">
                    <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[var(--learn-ink-soft)]">
                      Credentials
                    </p>
                    <p className="mt-2 text-sm leading-7 text-[var(--learn-ink)]">
                      {application.credentials}
                    </p>
                  </div>
                  <div className="rounded-[1.4rem] border border-[var(--learn-line)] bg-white/5 p-4">
                    <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[var(--learn-ink-soft)]">
                      Course proposal
                    </p>
                    <p className="mt-2 text-sm leading-7 text-[var(--learn-ink)]">
                      {application.courseProposal}
                    </p>
                  </div>
                  {application.portfolioLinks.length > 0 ? (
                    <div className="rounded-[1.4rem] border border-[var(--learn-line)] bg-white/5 p-4">
                      <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[var(--learn-ink-soft)]">
                        Portfolio links
                      </p>
                      <div className="mt-3 space-y-2">
                        {application.portfolioLinks.map((link) => (
                          <a
                            key={link}
                            href={link}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="block text-sm font-semibold text-[var(--learn-mint-soft)]"
                          >
                            {link}
                          </a>
                        ))}
                      </div>
                    </div>
                  ) : null}
                  {application.supportingFiles.length > 0 ? (
                    <div className="rounded-[1.4rem] border border-[var(--learn-line)] bg-white/5 p-4">
                      <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[var(--learn-ink-soft)]">
                        Supporting files
                      </p>
                      <div className="mt-3 space-y-2">
                        {application.supportingFiles.map((file) => (
                          <a
                            key={file.publicId}
                            href={file.url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="flex items-center justify-between rounded-[1.2rem] border border-[var(--learn-line)] px-4 py-3 text-sm text-[var(--learn-ink)]"
                          >
                            <span>{file.name}</span>
                            <span className="text-[var(--learn-ink-soft)]">Open</span>
                          </a>
                        ))}
                      </div>
                    </div>
                  ) : null}
                </div>

                <form action={reviewTeacherApplicationAction} className="space-y-4 rounded-[1.6rem] border border-[var(--learn-line)] bg-black/10 p-4">
                  <input type="hidden" name="applicationId" value={application.id} />
                  <div>
                    <label className="block text-sm font-medium text-[var(--learn-ink)]">Review note for applicant</label>
                    <textarea
                      name="reviewNotes"
                      defaultValue={application.reviewNotes || ""}
                      rows={5}
                      className="learn-textarea mt-2 rounded-2xl px-4 py-3"
                      placeholder="Explain what was approved, what needs to change, or why the team passed."
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-[var(--learn-ink)]">Internal note</label>
                    <textarea
                      name="adminNotes"
                      defaultValue={application.adminNotes || ""}
                      rows={4}
                      className="learn-textarea mt-2 rounded-2xl px-4 py-3"
                      placeholder="Internal onboarding, payout, or staffing notes."
                    />
                  </div>
                  <div className="grid gap-4 sm:grid-cols-2">
                    <div>
                      <label className="block text-sm font-medium text-[var(--learn-ink)]">Payout model</label>
                      <select
                        name="payoutModel"
                        defaultValue={application.payoutModel || "pending"}
                        className="learn-select mt-2 rounded-2xl px-4 py-3"
                      >
                        <option value="pending">Pending</option>
                        <option value="revenue_share">Revenue share</option>
                        <option value="fixed_fee">Fixed fee</option>
                        <option value="stipend">Stipend</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-[var(--learn-ink)]">Revenue share %</label>
                      <input
                        name="revenueSharePercent"
                        type="number"
                        min="0"
                        max="100"
                        step="1"
                        defaultValue={application.revenueSharePercent ?? ""}
                        className="learn-input mt-2 rounded-2xl px-4 py-3"
                        placeholder="25"
                      />
                    </div>
                  </div>
                  <div className="grid gap-3 sm:grid-cols-2">
                    <PendingSubmitButton
                      name="decision"
                      value="under_review"
                      variant="secondary"
                      pendingLabel="Updating review state..."
                    >
                      Mark under review
                    </PendingSubmitButton>
                    <PendingSubmitButton
                      name="decision"
                      value="changes_requested"
                      variant="secondary"
                      pendingLabel="Requesting changes..."
                    >
                      Request changes
                    </PendingSubmitButton>
                    <PendingSubmitButton
                      name="decision"
                      value="approved"
                      pendingLabel="Approving instructor..."
                    >
                      Approve instructor
                    </PendingSubmitButton>
                    <PendingSubmitButton
                      name="decision"
                      value="rejected"
                      variant="secondary"
                      pendingLabel="Updating application..."
                    >
                      Decline application
                    </PendingSubmitButton>
                  </div>
                </form>
              </div>
            </LearnPanel>
          ))}
        </div>
      )}
    </LearnWorkspaceShell>
  );
}
