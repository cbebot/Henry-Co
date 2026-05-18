import Link from "next/link";
import { getAccountUrl } from "@henryco/config";
import { getJobsCopy } from "@henryco/i18n";
import { createEmployerProfileAction } from "@/app/actions";
import { requireJobsRoles } from "@/lib/auth";
import { getEmployerDashboardData, getEmployerProfileBySlug } from "@/lib/jobs/data";
import { getJobsPublicLocale } from "@/lib/locale-server";
import { employerNav } from "@/lib/jobs/navigation";
import { getEmployerPostingEligibility } from "@/lib/jobs/posting-eligibility";
import { InlineNotice } from "@/components/feedback";
import { PendingSubmitButton } from "@/components/pending-submit-button";
import { SectionCard, StatusPill, WorkspaceShell } from "@/components/workspace-shell";

export const dynamic = "force-dynamic";

function toneForVerification(status: string) {
  if (status === "verified") return "good" as const;
  if (status === "watch" || status === "rejected") return "danger" as const;
  return "warn" as const;
}

export default async function EmployerCompanyPage({
  searchParams,
}: {
  searchParams?: Promise<Record<string, string | string[] | undefined>>;
}) {
  const viewer = await requireJobsRoles(["employer", "admin", "owner"], "/employer/company");
  const locale = await getJobsPublicLocale();
  const [data, params] = await Promise.all([
    getEmployerDashboardData(viewer.user!.id, viewer.user!.email, locale),
    searchParams ?? Promise.resolve({} as Record<string, string | string[] | undefined>),
  ]);
  const copy = getJobsCopy(locale).employerCompany;
  const membership = data.memberships[0];
  const companyRecord = membership ? await getEmployerProfileBySlug(membership.employerSlug, { includeUnpublished: true }) : null;
  const employer = companyRecord?.employer ?? null;
  const eligibility = membership
    ? await getEmployerPostingEligibility({
        userId: viewer.user!.id,
        email: viewer.user!.email,
        employerSlug: membership.employerSlug,
        actorRole: viewer.internalRole || (viewer.roles.includes("employer") ? "employer" : null),
      })
    : null;
  const created = typeof params.created === "string" ? params.created : null;

  const verificationStatusValue = employer?.verificationStatus ?? copy.rightRailStatusPending;
  const verificationStatusDisplay = employer?.verificationStatus
    ? employer.verificationStatus.charAt(0).toUpperCase() + employer.verificationStatus.slice(1)
    : copy.rightRailStatusPendingCapitalized;

  const responseSlaCopy = employer
    ? copy.rightRailResponseSlaTemplate
        .replace("{count}", String(employer.openRoleCount))
        .replace(
          "{roleLabel}",
          employer.openRoleCount === 1 ? copy.rightRailOpenRoleSingular : copy.rightRailOpenRolePlural,
        )
        .replace("{hours}", String(employer.responseSlaHours))
    : copy.rightRailEmptyProfileBody;

  return (
    <WorkspaceShell
      area="employer"
      title={copy.pageTitle}
      subtitle={copy.pageSubtitle}
      nav={employerNav}
      activeHref="/employer/company"
      accent="linear-gradient(135deg,#7c5a28 0%,#b88a47 55%,#f1c88c 100%)"
      rightRail={
        <>
          <SectionCard title={copy.rightRailVerificationTitle}>
            <div className="space-y-4">
              <div className="flex items-center justify-between gap-4">
                <div>
                  <div className="jobs-kicker">{copy.rightRailStatusLabel}</div>
                  <div className="mt-2 text-lg font-semibold capitalize">{verificationStatusDisplay}</div>
                </div>
                <StatusPill label={verificationStatusValue} tone={toneForVerification(employer?.verificationStatus ?? "pending")} />
              </div>
              <p className="text-sm leading-7 text-[var(--jobs-muted)]">{responseSlaCopy}</p>
              {eligibility && eligibility.verificationStatus !== "verified" ? (
                <div className="rounded-2xl bg-[var(--jobs-paper-soft)] p-4">
                  <div className="text-sm font-semibold">{eligibility.verificationGate.headline}</div>
                  <p className="mt-2 text-sm leading-7 text-[var(--jobs-muted)]">
                    {eligibility.verificationGate.detail}
                  </p>
                  <Link
                    href={eligibility.verificationGate.href}
                    className="mt-3 inline-flex rounded-full bg-[var(--jobs-accent)] px-4 py-2 text-xs font-semibold text-white"
                  >
                    {eligibility.verificationGate.actionLabel}
                  </Link>
                </div>
              ) : null}
            </div>
          </SectionCard>
          <SectionCard title={copy.rightRailTipsTitle}>
            <div className="space-y-3 text-sm text-[var(--jobs-muted)]">
              <div className="rounded-2xl bg-[var(--jobs-paper-soft)] p-4">{copy.rightRailTipDescription}</div>
              <div className="rounded-2xl bg-[var(--jobs-paper-soft)] p-4">{copy.rightRailTipPolicies}</div>
              <div className="rounded-2xl bg-[var(--jobs-paper-soft)] p-4">{copy.rightRailTipVerified}</div>
            </div>
          </SectionCard>
        </>
      }
    >
      <div className="space-y-4">
        {created ? (
          <InlineNotice
            tone="success"
            title={copy.profileSavedNoticeTitle}
            body={copy.profileSavedNoticeBodyTemplate.replace("{name}", created)}
          />
        ) : null}
        {eligibility && eligibility.verificationStatus !== "verified" ? (
          <div className="space-y-3">
            <InlineNotice
              tone="warn"
              title={eligibility.verificationGate.headline}
              body={`${eligibility.verificationGate.detail} ${copy.verificationCalloutBodySuffix}`}
            />
            <Link href={getAccountUrl("/verification")} className="jobs-button-secondary inline-flex rounded-full px-4 py-2 text-sm font-semibold">
              {copy.openAccountVerification}
            </Link>
          </div>
        ) : null}

        <SectionCard title={copy.sectionTitle} body={copy.sectionBody}>
          <form action={createEmployerProfileAction} className="grid gap-4">
            <div className="grid gap-4 md:grid-cols-2">
              <input name="name" className="jobs-input" defaultValue={employer?.name || membership?.employerName || ""} placeholder={copy.fieldNamePlaceholder} />
              <input name="slug" className="jobs-input" defaultValue={employer?.slug || membership?.employerSlug || ""} placeholder={copy.fieldSlugPlaceholder} />
            </div>
            <input name="tagline" className="jobs-input" defaultValue={employer?.tagline || ""} placeholder={copy.fieldTaglinePlaceholder} />
            <textarea name="description" className="jobs-textarea min-h-32" defaultValue={employer?.description || ""} placeholder={copy.fieldDescriptionPlaceholder} />
            <div className="grid gap-4 md:grid-cols-2">
              <input name="website" className="jobs-input" defaultValue={employer?.website || ""} placeholder={copy.fieldWebsitePlaceholder} />
              <input name="industry" className="jobs-input" defaultValue={employer?.industry || ""} placeholder={copy.fieldIndustryPlaceholder} />
            </div>
            <div className="grid gap-4 md:grid-cols-2">
              <input name="locations" className="jobs-input" defaultValue={employer?.locations.join(", ") || ""} placeholder={copy.fieldLocationsPlaceholder} />
              <input name="headcount" className="jobs-input" defaultValue={employer?.headcount || ""} placeholder={copy.fieldHeadcountPlaceholder} />
            </div>
            <div className="grid gap-4 md:grid-cols-2">
              <input name="remotePolicy" className="jobs-input" defaultValue={employer?.remotePolicy || ""} placeholder={copy.fieldRemotePolicyPlaceholder} />
              <input name="benefitsHeadline" className="jobs-input" defaultValue={employer?.benefitsHeadline || ""} placeholder={copy.fieldBenefitsHeadlinePlaceholder} />
            </div>
            <input name="culturePoints" className="jobs-input" defaultValue={employer?.culturePoints.join(", ") || ""} placeholder={copy.fieldCulturePointsPlaceholder} />
            <select name="employerType" className="jobs-select" defaultValue={employer?.employerType || "external"}>
              <option value="external">{copy.employerTypeExternal}</option>
              <option value="internal">{copy.employerTypeInternal}</option>
            </select>
            <PendingSubmitButton pendingLabel={copy.submitSaving} className="w-full sm:w-auto">
              {copy.submitLabel}
            </PendingSubmitButton>
          </form>
        </SectionCard>
      </div>
    </WorkspaceShell>
  );
}
