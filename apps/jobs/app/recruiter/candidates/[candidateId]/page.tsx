import { notFound } from "next/navigation";
import { translateSurfaceLabel } from "@henryco/i18n";
import { getLearnToEarnCopy } from "@henryco/i18n/server";
import { requireJobsRoles } from "@/lib/auth";
import { getCandidateProfileByUserId } from "@/lib/jobs/data";
import { getLearnVerifiedSkills } from "@/lib/jobs/learn-to-earn-data";
import { createAdminSupabase } from "@/lib/supabase";
import { recruiterNav } from "@/lib/jobs/navigation";
import { getJobsPublicLocale } from "@/lib/locale-server";
import { LearnVerifiedBadge } from "@/components/hiring/LearnVerifiedBadge";
import { SectionCard, WorkspaceShell } from "@/components/workspace-shell";

export const dynamic = "force-dynamic";

export default async function RecruiterCandidateDetailPage({
  params,
}: {
  params: Promise<{ candidateId: string }>;
}) {
  const { candidateId } = await params;
  await requireJobsRoles(["recruiter", "admin", "owner", "moderator"], `/recruiter/candidates/${candidateId}`);
  const locale = await getJobsPublicLocale();
  const t = (text: string) => translateSurfaceLabel(locale, text);
  const [profile, learnSkills] = await Promise.all([
    getCandidateProfileByUserId(candidateId, locale),
    getLearnVerifiedSkills(createAdminSupabase(), candidateId),
  ]);
  if (!profile) notFound();
  const learnCopy = getLearnToEarnCopy(locale);

  return (
    <WorkspaceShell area="recruiter" title={t("Candidate Detail")} subtitle={t("Readiness, skills, and profile depth for a single candidate.")} nav={recruiterNav} activeHref="/recruiter" accent="linear-gradient(135deg,#1d3f6f 0%,#3266b4 55%,#6db7ff 100%)">
      <SectionCard title={profile.fullName || t("Candidate")} body={profile.summary}>
        <div className="grid gap-4 md:grid-cols-2">
          <div className="rounded-2xl bg-[var(--jobs-paper-soft)] p-4 text-sm text-[var(--jobs-muted)]">
            {profile.readinessLabel} · {t("Profile strength")} {profile.trustScore}%
          </div>
          <div className="rounded-2xl bg-[var(--jobs-paper-soft)] p-4 text-sm text-[var(--jobs-muted)]">
            {t("Skills")}: {profile.skills.join(", ")}
          </div>
        </div>
        {/* V3-56 S2a — Learn-verified skills cluster (hidden when none). */}
        {learnSkills.length > 0 ? (
          <div className="mt-4 flex flex-wrap gap-2">
            {learnSkills.map((skill) => (
              <LearnVerifiedBadge
                key={skill.id}
                label={skill.label ? `${learnCopy.badge.label} · ${skill.label}` : learnCopy.badge.label}
                ariaLabel={skill.label ? `${learnCopy.badge.aria}: ${skill.label}` : learnCopy.badge.aria}
                verifyUrl={skill.verifyUrl}
                verifyLabel={learnCopy.badge.verifyCta}
              />
            ))}
          </div>
        ) : null}
      </SectionCard>
    </WorkspaceShell>
  );
}
