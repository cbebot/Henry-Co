import Link from "next/link";
import { getJobsCopy, translateSurfaceLabel } from "@henryco/i18n";
import { createJobPostAction } from "@/app/actions";
import { isAiSurfaceEnabled } from "@henryco/ai-gateway";
import { DraftPostingPanel } from "@/components/ai/DraftPostingPanel";
import { requireJobsRoles } from "@/lib/auth";
import { getEmployerDashboardData, getEmployerProfileBySlug } from "@/lib/jobs/data";
import { employerNav } from "@/lib/jobs/navigation";
import { getEmployerPostingEligibility } from "@/lib/jobs/posting-eligibility";
import { isEmployerSubscribed } from "@/lib/jobs/employer-subscription";
import { getJobsPublicLocale } from "@/lib/locale-server";
import { EmptyState, InlineNotice } from "@/components/feedback";
import { PendingSubmitButton } from "@/components/pending-submit-button";
import { SectionCard, StatusPill, WorkspaceShell } from "@/components/workspace-shell";

export const dynamic = "force-dynamic";

// Flag-dark: the metered "Draft with Henry Onyx Intelligence" assist renders only when the
// company turns it on (and the global AI kill switch is enabled — the gateway enforces that).
const JOBS_AI_POSTING_ASSIST = isAiSurfaceEnabled(process.env.JOBS_AI_POSTING_ASSIST, process.env);

export async function generateMetadata() {
  const locale = await getJobsPublicLocale();
  const copy = getJobsCopy(locale).employerJobNew;
  return {
    title: copy.pageTitle,
    description: copy.pageSubtitle,
  };
}

export default async function EmployerNewJobPage() {
  const viewer = await requireJobsRoles(["employer", "admin", "owner"], "/employer/jobs/new");
  const locale = await getJobsPublicLocale();
  const data = await getEmployerDashboardData(viewer.user!.id, viewer.user!.email, locale);
  const copy = getJobsCopy(locale).employerJobNew;
  const membership = data.memberships[0];
  const companyRecord = membership ? await getEmployerProfileBySlug(membership.employerSlug, { includeUnpublished: true, locale }) : null;
  const employer = companyRecord?.employer ?? null;
  const [eligibility, subscription] = membership
    ? await Promise.all([
        getEmployerPostingEligibility({
          userId: viewer.user!.id,
          email: viewer.user!.email,
          employerSlug: membership.employerSlug,
          actorRole: viewer.internalRole || (viewer.roles.includes("employer") ? "employer" : null),
        }),
        isEmployerSubscribed(membership.employerSlug),
      ])
    : [null, null];

  const roleCount = data.jobs.length;
  const roleCountTemplate = roleCount === 1 ? copy.rightRailRoleCountSingular : copy.rightRailRoleCountPlural;
  const roleCountText = roleCountTemplate.replace("{count}", String(roleCount));

  return (
    <WorkspaceShell
      area="employer"
      title={copy.pageTitle}
      subtitle={copy.pageSubtitle}
      nav={employerNav}
      activeHref="/employer/jobs/new"
      accent="linear-gradient(135deg,#7c5a28 0%,#b88a47 55%,#f1c88c 100%)"
      rightRail={
        membership ? (
          <>
            <SectionCard title={copy.rightRailCompanyTitle}>
              <div className="space-y-4">
                <div className="flex items-center justify-between gap-4">
                  <div>
                    <div className="jobs-kicker">{copy.rightRailEmployerKicker}</div>
                    <div className="mt-2 text-lg font-semibold">{membership.employerName}</div>
                  </div>
                  <StatusPill label={employer?.verificationStatus ?? copy.rightRailVerificationFallback} tone={employer?.verificationStatus === "verified" ? "good" : "warn"} />
                </div>
                <p className="text-sm leading-7 text-[var(--jobs-muted)]">
                  {roleCountText}
                </p>
              </div>
            </SectionCard>
            <SectionCard title={copy.rightRailTipsTitle}>
              <div className="space-y-3 text-sm text-[var(--jobs-muted)]">
                <div className="rounded-2xl bg-[var(--jobs-paper-soft)] p-4">{copy.rightRailTipSummaries}</div>
                <div className="rounded-2xl bg-[var(--jobs-paper-soft)] p-4">{copy.rightRailTipSalaryBenefits}</div>
              </div>
            </SectionCard>
            {eligibility ? (
              <SectionCard title={copy.rightRailReadinessTitle}>
                <div className="space-y-3">
                  <div className="rounded-2xl bg-[var(--jobs-paper-soft)] p-4">
                    <div className="jobs-kicker">{copy.rightRailAccountTierKicker}</div>
                    <div className="mt-2 text-lg font-semibold capitalize">
                      {eligibility.trustTier.replace(/_/g, " ")}
                    </div>
                    <p className="mt-2 text-sm leading-7 text-[var(--jobs-muted)]">
                      {copy.rightRailAccountTierBody}
                    </p>
                  </div>
                  <div className="space-y-2">
                    {eligibility.checklist.map((item) => (
                      <div key={item.id} className="rounded-2xl bg-[var(--jobs-paper-soft)] p-4">
                        <div className="flex items-center justify-between gap-3">
                          <div className="text-sm font-semibold">{item.label}</div>
                          <StatusPill label={item.complete ? copy.rightRailChecklistReady : copy.rightRailChecklistOpen} tone={item.complete ? "good" : "warn"} />
                        </div>
                        <p className="mt-2 text-sm leading-7 text-[var(--jobs-muted)]">{item.detail}</p>
                      </div>
                    ))}
                  </div>
                </div>
              </SectionCard>
            ) : null}
          </>
        ) : null
      }
    >
      {!membership ? (
        <SectionCard title={copy.noMembershipSectionTitle} body={copy.noMembershipSectionBody}>
          <EmptyState
            kicker={copy.noMembershipEmptyKicker}
            title={copy.noMembershipEmptyTitle}
            body={copy.noMembershipEmptyBody}
            action={
              <Link href="/employer/company" className="jobs-button-primary rounded-full px-5 py-3 text-sm font-semibold">
                {copy.noMembershipEmptyCta}
              </Link>
            }
          />
        </SectionCard>
      ) : (
        <SectionCard title={copy.formSectionTitle} body={copy.formSectionBody}>
          {subscription && !subscription.allowed ? (
            <div className="mb-5">
              <InlineNotice
                tone="warn"
                title={copy.subscriptionRequiredTitle}
                body={copy.subscriptionRequiredBodyTemplate.replace("{status}", subscription.status)}
              />
            </div>
          ) : null}
          {subscription && subscription.allowed && subscription.status === "soft-fail" ? (
            <div className="mb-5">
              <InlineNotice
                title={copy.subscriptionPendingTitle}
                body={copy.subscriptionPendingBody}
              />
            </div>
          ) : null}
          {eligibility ? (
            <div className="mb-5 space-y-3">
              {eligibility.verificationStatus !== "verified" ? (
                <div className="space-y-3">
                  <InlineNotice
                    tone="warn"
                    title={eligibility.verificationGate.headline}
                    body={`${eligibility.verificationGate.detail} ${copy.verificationGateBodySuffix}`}
                  />
                  <Link href={eligibility.verificationGate.href} className="jobs-button-secondary inline-flex rounded-full px-4 py-2 text-sm font-semibold">
                    {eligibility.verificationGate.actionLabel}
                  </Link>
                </div>
              ) : eligibility.autoApprovalAllowed ? (
                <InlineNotice
                  tone="success"
                  title={copy.directPublishingTitle}
                  body={copy.directPublishingBody}
                />
              ) : eligibility.canSubmitForReview ? (
                <InlineNotice
                  title={copy.reviewRequiredTitle}
                  body={copy.reviewRequiredBody}
                />
              ) : (
                <InlineNotice
                  tone="warn"
                  title={copy.draftOnlyTitle}
                  body={copy.draftOnlyBody}
                />
              )}
            </div>
          ) : null}
          {JOBS_AI_POSTING_ASSIST ? (
            <DraftPostingPanel
              copy={{
                heading: translateSurfaceLabel(locale, "Draft with Henry Onyx Intelligence"),
                intro: translateSurfaceLabel(locale, "Henry Onyx Intelligence drafts a starting point from your idea — review and edit every field before you publish."),
                draftButton: translateSurfaceLabel(locale, "Draft with Henry Onyx Intelligence"),
                drafting: translateSurfaceLabel(locale, "Drafting…"),
                needTitle: translateSurfaceLabel(locale, "Add a title first, then let Henry Onyx Intelligence draft the rest."),
                errorFallback: translateSurfaceLabel(locale, "Henry Onyx Intelligence is unavailable right now."),
                priceTemplate: translateSurfaceLabel(locale, "Henry Onyx Intelligence · {price} (incl. {vat} VAT) · {tier}"),
              }}
            />
          ) : null}
          <form action={createJobPostAction} className="grid gap-4">
            <input type="hidden" name="employerSlug" value={membership.employerSlug} />
            <div className="grid gap-4 md:grid-cols-2">
              <input name="title" className="jobs-input" placeholder={copy.fieldTitlePlaceholder} />
              <input name="slug" className="jobs-input" placeholder={copy.fieldSlugPlaceholder} />
            </div>
            <input name="subtitle" className="jobs-input" placeholder={copy.fieldSubtitlePlaceholder} />
            <textarea name="summary" className="jobs-textarea min-h-24" placeholder={copy.fieldSummaryPlaceholder} />
            <textarea name="description" className="jobs-textarea min-h-40" placeholder={copy.fieldDescriptionPlaceholder} />
            <div className="grid gap-4 md:grid-cols-2">
              <input name="location" className="jobs-input" placeholder={copy.fieldLocationPlaceholder} />
              <input name="category" className="jobs-input" placeholder={copy.fieldCategoryPlaceholder} />
            </div>
            <div className="grid gap-4 md:grid-cols-3">
              <input name="workMode" className="jobs-input" placeholder={copy.fieldWorkModePlaceholder} />
              <input name="employmentType" className="jobs-input" placeholder={copy.fieldEmploymentTypePlaceholder} />
              <input name="seniority" className="jobs-input" placeholder={copy.fieldSeniorityPlaceholder} />
            </div>
            <input name="team" className="jobs-input" placeholder={copy.fieldTeamPlaceholder} />
            <input name="skills" className="jobs-input" placeholder={copy.fieldSkillsPlaceholder} />
            <textarea name="responsibilities" className="jobs-textarea min-h-24" placeholder={copy.fieldResponsibilitiesPlaceholder} />
            <textarea name="requirements" className="jobs-textarea min-h-24" placeholder={copy.fieldRequirementsPlaceholder} />
            <textarea name="benefits" className="jobs-textarea min-h-24" placeholder={copy.fieldBenefitsPlaceholder} />
            <div className="grid gap-4 md:grid-cols-2">
              <input name="salaryMin" className="jobs-input" placeholder={copy.fieldSalaryMinPlaceholder} />
              <input name="salaryMax" className="jobs-input" placeholder={copy.fieldSalaryMaxPlaceholder} />
            </div>
            <PendingSubmitButton pendingLabel={copy.submitPending} className="w-full sm:w-auto">
              {copy.submitLabel}
            </PendingSubmitButton>
          </form>
        </SectionCard>
      )}
    </WorkspaceShell>
  );
}
