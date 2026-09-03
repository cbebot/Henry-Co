import Link from "next/link";
import { translateSurfaceLabel } from "@henryco/i18n";
import { getLearnToEarnCopy } from "@henryco/i18n/server";
import { requireJobsRoles } from "@/lib/auth";
import { getRecruiterOverviewData } from "@/lib/jobs/data";
import { getVerifiedLearnCourseIds } from "@/lib/jobs/learn-to-earn-data";
import { createAdminSupabase } from "@/lib/supabase";
import { recruiterNav } from "@/lib/jobs/navigation";
import { getJobsPublicLocale } from "@/lib/locale-server";
import { LearnVerifiedBadge } from "@/components/hiring/LearnVerifiedBadge";
import { SectionCard, WorkspaceShell } from "@/components/workspace-shell";

export const dynamic = "force-dynamic";

export default async function RecruiterCandidatesPage({
  searchParams,
}: {
  searchParams?: Promise<Record<string, string | string[] | undefined>>;
}) {
  await requireJobsRoles(["recruiter", "admin", "owner", "moderator"], "/recruiter/candidates");
  const locale = await getJobsPublicLocale();
  const t = (text: string) => translateSurfaceLabel(locale, text);
  const learnCopy = getLearnToEarnCopy(locale);
  const [data, params] = await Promise.all([
    getRecruiterOverviewData(locale),
    searchParams ?? Promise.resolve({} as Record<string, string | string[] | undefined>),
  ]);
  const learnVerifiedOnly = params.learnVerified === "1";

  const profiles = data.candidateProfiles.filter(
    (candidate): candidate is NonNullable<typeof candidate> => Boolean(candidate),
  );

  // V3-56 S2b — learn-verified lookup. Resolve once per candidate, in parallel,
  // so the toggle below can both filter and badge without an N+1 in the render.
  const verifiedEntries = await Promise.all(
    profiles.map(async (candidate) => {
      const ids = await getVerifiedLearnCourseIds(createAdminSupabase(), candidate.userId);
      return [candidate.userId, ids.size > 0] as const;
    }),
  );
  const learnVerifiedByUser = new Map(verifiedEntries);

  const visible = learnVerifiedOnly
    ? profiles.filter((candidate) => learnVerifiedByUser.get(candidate.userId))
    : profiles;

  return (
    <WorkspaceShell area="recruiter" title={t("Candidates")} subtitle={t("Profile quality and readiness across the candidate pool.")} nav={recruiterNav} activeHref="/recruiter" accent="linear-gradient(135deg,#1d3f6f 0%,#3266b4 55%,#6db7ff 100%)">
      <SectionCard title={t("Candidate profiles")}>
        <div className="mb-4 flex flex-wrap gap-2">
          <Link
            href="/recruiter/candidates"
            aria-pressed={!learnVerifiedOnly}
            className={`rounded-full px-3.5 py-1.5 text-xs font-semibold ring-1 ring-inset transition-colors ${
              !learnVerifiedOnly
                ? "bg-[var(--jobs-accent-soft)] text-[var(--jobs-ink)] ring-[var(--jobs-accent)]/30"
                : "bg-transparent text-[var(--jobs-muted)] ring-[var(--jobs-line)]"
            }`}
          >
            {t("All candidates")}
          </Link>
          <Link
            href="/recruiter/candidates?learnVerified=1"
            aria-pressed={learnVerifiedOnly}
            className={`rounded-full px-3.5 py-1.5 text-xs font-semibold ring-1 ring-inset transition-colors ${
              learnVerifiedOnly
                ? "bg-teal-600/12 text-teal-800 ring-teal-600/25 dark:text-teal-200 dark:ring-teal-400/30"
                : "bg-transparent text-[var(--jobs-muted)] ring-[var(--jobs-line)]"
            }`}
          >
            {learnCopy.badge.label}
          </Link>
        </div>
        <div className="space-y-3">
          {visible.map((candidate) => (
            <Link key={candidate.userId} href={`/recruiter/candidates/${candidate.userId}`} className="block rounded-2xl bg-[var(--jobs-paper-soft)] p-4">
              <div className="flex items-center justify-between gap-4">
                <div className="min-w-0">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="font-semibold">{candidate.fullName || t("Candidate")}</span>
                    {learnVerifiedByUser.get(candidate.userId) ? (
                      <LearnVerifiedBadge
                        size="sm"
                        label={learnCopy.badge.label}
                        ariaLabel={learnCopy.badge.aria}
                      />
                    ) : null}
                  </div>
                  <div className="mt-1 text-sm text-[var(--jobs-muted)]">{candidate.headline || candidate.summary || t("Profile in progress")}</div>
                </div>
                <span className="rounded-full bg-[var(--jobs-accent-soft)] px-3 py-1 text-xs font-semibold">{candidate.trustScore}</span>
              </div>
            </Link>
          ))}
        </div>
      </SectionCard>
    </WorkspaceShell>
  );
}
