import { translateSurfaceLabel } from "@henryco/i18n/server";
import { reviewTeacherApplicationAction } from "@/lib/learn/actions";
import { requireLearnRoles } from "@/lib/learn/auth";
import { getLearnSnapshot } from "@/lib/learn/data";
import { signLearnMediaUrl } from "@/lib/learn/media";
import { ownerNav } from "@/lib/learn/navigation";
import { getLearnPublicLocale } from "@/lib/locale-server";
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
  const locale = await getLearnPublicLocale();
  const t = (text: string) => translateSurfaceLabel(locale, text);
  const applications = [...snapshot.teacherApplications].sort((left, right) =>
    right.updatedAt.localeCompare(left.updatedAt)
  );
  const activeApplications = applications.filter((item) =>
    ["submitted", "under_review", "changes_requested"].includes(item.status)
  );
  // Supporting files are sensitive private media refs; resolve each to a
  // short-lived signed URL server-side (keyed by the per-file unique id) before
  // the staff review surface renders them. Legacy absolute URLs pass through.
  const supportingFileUrls = new Map<string, string>(
    await Promise.all(
      applications
        .flatMap((application) => application.supportingFiles)
        .map(
          async (file) =>
            [file.publicId, await signLearnMediaUrl(file.url)] as const,
        ),
    ),
  );

  return (
    <LearnWorkspaceShell
      kicker={t("Instructor Ops")}
      title={t("Review applications, approve instructors, and keep onboarding structured.")}
      description={t("Teaching opportunities, approval notes, and instructor access should be managed with the same operational discipline as courses and certificates.")}
      nav={ownerNav("/owner/instructors", t)}
    >
      {params.updated ? (
        <LearnPanel className="rounded-[2rem]">
          <p className="text-sm font-semibold text-[var(--learn-mint-soft)]">
            {t("Instructor application updated")}: {params.updated.replace(/_/g, " ")}.
          </p>
        </LearnPanel>
      ) : null}

      <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-4">
        <LearnMetricCard label={t("Applications")} value={String(applications.length)} hint={t("All instructor applications currently stored in Henry Onyx Learn.")} />
        <LearnMetricCard label={t("Open review")} value={String(activeApplications.length)} hint={t("Applications still moving through review or changes.")} />
        <LearnMetricCard label={t("Approved")} value={String(applications.filter((item) => item.status === "approved").length)} hint={t("Approved instructors ready for onboarding or content work.")} />
        <LearnMetricCard label={t("Public profiles")} value={String(snapshot.instructors.length)} hint={t("Published instructor spotlights already visible in the academy.")} />
      </div>

      {applications.length === 0 ? (
        <LearnEmptyState
          title={t("No instructor applications yet")}
          body={t("Public teaching applications will appear here once candidates apply through Teach with HenryCo.")}
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
                    {application.normalizedEmail || t("No email")} • {application.phone || t("No phone")} •{" "}
                    {application.country || t("Country not supplied")}
                  </p>
                  <p className="mt-2 text-sm leading-7 text-[var(--learn-ink-soft)]">
                    <span className="font-semibold text-[var(--learn-ink)]">{t("Expertise")}:</span>{" "}
                    {application.expertiseArea}
                  </p>
                </div>
                <div className="rounded-[1.4rem] border border-[var(--learn-line)] bg-white/5 px-4 py-3 text-sm text-[var(--learn-ink-soft)]">
                  {t("Updated")}{" "}
                  {new Date(application.updatedAt).toLocaleDateString(locale, {
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
                      {t("Teaching topics")}
                    </p>
                    <p className="mt-2 text-sm leading-7 text-[var(--learn-ink)]">
                      {application.teachingTopics.join(", ")}
                    </p>
                  </div>
                  <div className="rounded-[1.4rem] border border-[var(--learn-line)] bg-white/5 p-4">
                    <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[var(--learn-ink-soft)]">
                      {t("Credentials")}
                    </p>
                    <p className="mt-2 text-sm leading-7 text-[var(--learn-ink)]">
                      {application.credentials}
                    </p>
                  </div>
                  <div className="rounded-[1.4rem] border border-[var(--learn-line)] bg-white/5 p-4">
                    <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[var(--learn-ink-soft)]">
                      {t("Course proposal")}
                    </p>
                    <p className="mt-2 text-sm leading-7 text-[var(--learn-ink)]">
                      {application.courseProposal}
                    </p>
                  </div>
                  {application.portfolioLinks.length > 0 ? (
                    <div className="rounded-[1.4rem] border border-[var(--learn-line)] bg-white/5 p-4">
                      <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[var(--learn-ink-soft)]">
                        {t("Portfolio links")}
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
                        {t("Supporting files")}
                      </p>
                      <div className="mt-3 space-y-2">
                        {application.supportingFiles.map((file) => {
                          const signedUrl = supportingFileUrls.get(file.publicId) || "";
                          if (!signedUrl) return null;
                          return (
                            <a
                              key={file.publicId}
                              href={signedUrl}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="flex items-center justify-between rounded-[1.2rem] border border-[var(--learn-line)] px-4 py-3 text-sm text-[var(--learn-ink)]"
                            >
                              <span>{file.name}</span>
                              <span className="text-[var(--learn-ink-soft)]">{t("Open")}</span>
                            </a>
                          );
                        })}
                      </div>
                    </div>
                  ) : null}
                </div>

                <form action={reviewTeacherApplicationAction} className="space-y-4 rounded-[1.6rem] border border-[var(--learn-line)] bg-black/10 p-4">
                  <input type="hidden" name="applicationId" value={application.id} />
                  <div>
                    <label className="block text-sm font-medium text-[var(--learn-ink)]">{t("Review note for applicant")}</label>
                    <textarea
                      name="reviewNotes"
                      defaultValue={application.reviewNotes || ""}
                      rows={5}
                      className="learn-textarea mt-2 rounded-2xl px-4 py-3"
                      placeholder={t("Explain what was approved, what needs to change, or why the team passed.")}
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-[var(--learn-ink)]">{t("Internal note")}</label>
                    <textarea
                      name="adminNotes"
                      defaultValue={application.adminNotes || ""}
                      rows={4}
                      className="learn-textarea mt-2 rounded-2xl px-4 py-3"
                      placeholder={t("Internal onboarding, payout, or staffing notes.")}
                    />
                  </div>
                  <div className="grid gap-4 sm:grid-cols-2">
                    <div>
                      <label className="block text-sm font-medium text-[var(--learn-ink)]">{t("Payout model")}</label>
                      <select
                        name="payoutModel"
                        defaultValue={application.payoutModel || "pending"}
                        className="learn-select mt-2 rounded-2xl px-4 py-3"
                      >
                        <option value="pending">{t("Pending")}</option>
                        <option value="revenue_share">{t("Revenue share")}</option>
                        <option value="fixed_fee">{t("Fixed fee")}</option>
                        <option value="stipend">{t("Stipend")}</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-[var(--learn-ink)]">{t("Revenue share %")}</label>
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
                      pendingLabel={t("Updating review state...")}
                    >
                      {t("Mark under review")}
                    </PendingSubmitButton>
                    <PendingSubmitButton
                      name="decision"
                      value="changes_requested"
                      variant="secondary"
                      pendingLabel={t("Requesting changes...")}
                    >
                      {t("Request changes")}
                    </PendingSubmitButton>
                    <PendingSubmitButton
                      name="decision"
                      value="approved"
                      pendingLabel={t("Approving instructor...")}
                    >
                      {t("Approve instructor")}
                    </PendingSubmitButton>
                    <PendingSubmitButton
                      name="decision"
                      value="rejected"
                      variant="secondary"
                      pendingLabel={t("Updating application...")}
                    >
                      {t("Decline application")}
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
