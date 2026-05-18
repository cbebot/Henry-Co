import type { Metadata } from "next";
import Link from "next/link";
import { getAccountUrl } from "@henryco/config";
import { getJobsCopy } from "@henryco/i18n";
import { saveCandidateProfileAction } from "@/app/actions";
import { requireJobsUser } from "@/lib/auth";
import { getCandidateDashboardData } from "@/lib/jobs/data";
import { getJobsPublicLocale } from "@/lib/locale-server";
import { candidateNav } from "@/lib/jobs/navigation";
import { InlineNotice } from "@/components/feedback";
import { PendingSubmitButton } from "@/components/pending-submit-button";
import { SectionCard, StatusPill, WorkspaceShell } from "@/components/workspace-shell";
import { ProfileBuilder } from "@/components/candidate/ProfileBuilder";

export const dynamic = "force-dynamic";

export async function generateMetadata(): Promise<Metadata> {
  const locale = await getJobsPublicLocale();
  const copy = getJobsCopy(locale).candidateProfile;
  return {
    title: copy.pageTitle,
    description: copy.pageSubtitle,
  };
}

function toneForVerification(status: string) {
  if (status === "verified") return "good" as const;
  if (status === "pending") return "warn" as const;
  if (status === "rejected") return "danger" as const;
  return "neutral" as const;
}

function labelForVerification(
  status: string,
  copy: ReturnType<typeof getJobsCopy>["candidateProfile"],
) {
  if (status === "verified") return copy.statusVerified;
  if (status === "pending") return copy.statusPending;
  if (status === "rejected") return copy.statusRejected;
  return copy.statusUnverified;
}

export default async function CandidateProfilePage({
  searchParams,
}: {
  searchParams?: Promise<Record<string, string | string[] | undefined>>;
}) {
  const viewer = await requireJobsUser("/candidate/profile");
  const locale = await getJobsPublicLocale();
  const [data, params] = await Promise.all([
    getCandidateDashboardData(viewer.user!.id, locale),
    searchParams ?? Promise.resolve({} as Record<string, string | string[] | undefined>),
  ]);
  const profile = data.profile;
  const saved = params.saved === "1";
  const jobsCopy = getJobsCopy(locale);
  const copy = jobsCopy.candidateProfile;
  const profileBuilderLabels = jobsCopy.profileBuilder;
  const verificationStatus = profile?.verificationStatus ?? "unverified";
  const documentTemplate =
    data.documents.length === 1
      ? copy.rightRailDocumentsCountSingular
      : copy.rightRailDocumentsCountPlural;
  const documentsLine = documentTemplate.replace(
    "{count}",
    String(data.documents.length),
  );

  return (
    <WorkspaceShell
      area="candidate"
      title={copy.pageTitle}
      subtitle={copy.pageSubtitle}
      nav={candidateNav}
      activeHref="/candidate/profile"
      accent="linear-gradient(135deg,#0d5e66 0%,#0e7c86 55%,#7fd0d4 100%)"
      rightRail={
        <>
          <SectionCard title={copy.rightRailTrustTitle}>
            <div className="space-y-4">
              <div className="flex items-center justify-between gap-4">
                <div>
                  <div className="jobs-kicker">{copy.rightRailVerificationKicker}</div>
                  <div className="mt-2 text-3xl font-semibold">{profile?.trustScore ?? 0}</div>
                </div>
                <StatusPill
                  label={labelForVerification(verificationStatus, copy)}
                  tone={toneForVerification(verificationStatus)}
                />
              </div>
              <p className="text-sm leading-7 text-[var(--jobs-muted)]">
                {profile?.readinessLabel || copy.rightRailDefaultReadiness}
              </p>
              {verificationStatus !== "verified" ? (
                <Link
                  href={getAccountUrl("/verification")}
                  className="inline-flex rounded-full bg-[var(--jobs-accent-soft)] px-4 py-2 text-xs font-semibold text-[var(--jobs-accent)]"
                >
                  {copy.rightRailOpenVerification}
                </Link>
              ) : null}
            </div>
          </SectionCard>
          <SectionCard title={copy.rightRailDocumentsTitle}>
            <div className="space-y-3 text-sm text-[var(--jobs-muted)]">
              <div className="rounded-2xl bg-[var(--jobs-paper-soft)] p-4">{documentsLine}</div>
              <div className="rounded-2xl bg-[var(--jobs-paper-soft)] p-4">
                {copy.rightRailDocumentsHint}
              </div>
            </div>
          </SectionCard>
        </>
      }
    >
      <div className="space-y-4">
        {saved ? (
          <InlineNotice
            tone="success"
            title={copy.savedNoticeTitle}
            body={copy.savedNoticeBody}
          />
        ) : null}

        {/* J3 — auto-save profile draft. Persists every 30s + on blur. */}
        <SectionCard
          title={copy.draftSectionTitle}
          body={copy.draftSectionBody}
        >
          <ProfileBuilder
            initialDraft={{
              basics: {
                fullName: profile?.fullName || viewer.user!.fullName || undefined,
                headline: profile?.headline || undefined,
                summary: profile?.summary || undefined,
                location: profile?.location || undefined,
                phone: viewer.user!.phone || undefined,
                email: viewer.user!.email || undefined,
              },
              skills: profile?.skills ?? [],
            }}
            labels={profileBuilderLabels}
          />
        </SectionCard>

        <SectionCard
          title={copy.editSectionTitle}
          body={copy.editSectionBody}
        >
          <form action={saveCandidateProfileAction} className="grid gap-4">
            <div className="grid gap-4 md:grid-cols-2">
              <input
                name="fullName"
                autoComplete="name"
                className="jobs-input"
                defaultValue={profile?.fullName || viewer.user!.fullName || ""}
                placeholder={copy.fieldFullNamePlaceholder}
              />
            </div>
            <input
              name="headline"
              className="jobs-input"
              defaultValue={profile?.headline || ""}
              placeholder={copy.fieldHeadlinePlaceholder}
            />
            <textarea
              name="summary"
              className="jobs-textarea min-h-36"
              defaultValue={profile?.summary || ""}
              placeholder={copy.fieldSummaryPlaceholder}
            />
            <div className="grid gap-4 md:grid-cols-2">
              <input
                name="location"
                className="jobs-input"
                defaultValue={profile?.location || ""}
                placeholder={copy.fieldLocationPlaceholder}
              />
              <input
                name="timezone"
                className="jobs-input"
                defaultValue={profile?.timezone || ""}
                placeholder={copy.fieldTimezonePlaceholder}
              />
            </div>
            <div className="grid gap-4 md:grid-cols-2">
              <input
                name="workModes"
                className="jobs-input"
                defaultValue={profile?.workModes.join(", ") || ""}
                placeholder={copy.fieldWorkModesPlaceholder}
              />
              <input
                name="roleTypes"
                className="jobs-input"
                defaultValue={profile?.roleTypes.join(", ") || ""}
                placeholder={copy.fieldRoleTypesPlaceholder}
              />
            </div>
            <input
              name="preferredFunctions"
              className="jobs-input"
              defaultValue={profile?.preferredFunctions.join(", ") || ""}
              placeholder={copy.fieldPreferredFunctionsPlaceholder}
            />
            <input
              name="skills"
              className="jobs-input"
              defaultValue={profile?.skills.join(", ") || ""}
              placeholder={copy.fieldSkillsPlaceholder}
            />
            <input
              name="portfolioLinks"
              className="jobs-input"
              defaultValue={profile?.portfolioLinks.join(", ") || ""}
              placeholder={copy.fieldPortfolioLinksPlaceholder}
            />
            <div className="grid gap-4 md:grid-cols-2">
              <input
                name="salaryExpectation"
                className="jobs-input"
                defaultValue={profile?.salaryExpectation || ""}
                placeholder={copy.fieldSalaryExpectationPlaceholder}
              />
              <input
                name="availability"
                className="jobs-input"
                defaultValue={profile?.availability || ""}
                placeholder={copy.fieldAvailabilityPlaceholder}
              />
            </div>
            <textarea
              name="workHistory"
              className="jobs-textarea min-h-28"
              defaultValue={JSON.stringify(profile?.workHistory || [], null, 2)}
              placeholder={copy.fieldWorkHistoryPlaceholder}
            />
            <textarea
              name="education"
              className="jobs-textarea min-h-24"
              defaultValue={JSON.stringify(profile?.education || [], null, 2)}
              placeholder={copy.fieldEducationPlaceholder}
            />
            <textarea
              name="certifications"
              className="jobs-textarea min-h-24"
              defaultValue={JSON.stringify(profile?.certifications || [], null, 2)}
              placeholder={copy.fieldCertificationsPlaceholder}
            />
            <PendingSubmitButton pendingLabel={copy.submitSaving} className="w-full sm:w-auto">
              {copy.submitLabel}
            </PendingSubmitButton>
          </form>
        </SectionCard>
      </div>
    </WorkspaceShell>
  );
}
