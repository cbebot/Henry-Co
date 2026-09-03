import Link from "next/link";
import "@henryco/dashboard-shell/surfaces.css";
import { HeroCard, type HeroCardBreakdownRow, type HeroCardTile } from "@henryco/dashboard-shell";
import { translateSurfaceLabel } from "@henryco/i18n";
import { requireJobsRoles } from "@/lib/auth";
import { getEmployerDashboardData } from "@/lib/jobs/data";
import { employerNav } from "@/lib/jobs/navigation";
import { getJobsPublicLocale } from "@/lib/locale-server";
import { EmptyState } from "@/components/feedback";
import { SectionCard, WorkspaceShell } from "@/components/workspace-shell";

export const dynamic = "force-dynamic";

/** Ordered metadata for the hiring-pipeline breakdown: which stage sorts where
 *  and which token-driven dot color it carries (early=blue → mid=teal →
 *  offer/hired=green → closed=red). Unknown stages fall through to muted. */
const STAGE_META: Record<string, { order: number; color: string }> = {
  new: { order: 0, color: "var(--acct-blue)" },
  applied: { order: 0, color: "var(--acct-blue)" },
  screening: { order: 1, color: "var(--acct-gold)" },
  in_review: { order: 1, color: "var(--acct-gold)" },
  shortlisted: { order: 2, color: "var(--acct-gold-strong)" },
  interview: { order: 3, color: "var(--acct-gold-strong)" },
  offer: { order: 4, color: "var(--acct-green)" },
  hired: { order: 5, color: "var(--acct-green)" },
  rejected: { order: 6, color: "var(--acct-red)" },
  declined: { order: 6, color: "var(--acct-red)" },
};

function titleCaseStage(stage: string): string {
  return stage
    .replace(/[_-]+/g, " ")
    .replace(/\b\w/g, (c) => c.toUpperCase())
    .trim();
}

export default async function EmployerOverviewPage() {
  const viewer = await requireJobsRoles(["employer", "admin", "owner"], "/employer");
  const locale = await getJobsPublicLocale();
  const t = (text: string) => translateSurfaceLabel(locale, text);
  const data = await getEmployerDashboardData(viewer.user!.id, viewer.user!.email, locale);

  const liveJobs = data.jobs.length;
  const applicants = data.applications.length;
  const shortlisted = data.stageSummary.shortlisted ?? 0;
  const hasActivity = applicants > 0;

  const tiles: ReadonlyArray<HeroCardTile> = [
    { label: t("Companies"), value: data.memberships.length, foot: t("Employer profiles linked") },
    { label: t("Live jobs"), value: liveJobs, foot: t("Published or under review") },
    { label: t("Applicants"), value: applicants, foot: t("Across your roles"), tone: hasActivity ? "active" : "default" },
    { label: t("Shortlisted"), value: shortlisted, foot: t("Past early review"), tone: shortlisted > 0 ? "accent" : "default" },
  ];

  // Q2 — "what next": where candidates currently stand, by pipeline stage.
  // Sort by the canonical stage order (early → offer → closed), then project
  // to the primitive's row shape so no throwaway ordering field leaks out.
  const breakdownRows: HeroCardBreakdownRow[] = Object.entries(data.stageSummary)
    .filter(([, count]) => Number(count) > 0)
    .sort(([a], [b]) => (STAGE_META[a]?.order ?? 99) - (STAGE_META[b]?.order ?? 99))
    .map(([stage, count]) => ({
      label: titleCaseStage(stage),
      count: Number(count),
      color: STAGE_META[stage]?.color ?? "var(--acct-muted)",
    }));

  return (
    <WorkspaceShell
      area="employer"
      title={t("Employer workspace")}
      subtitle={t("Manage your company profile, job postings, and applicants in one place.")}
      nav={employerNav}
      activeHref="/employer"
      accent="linear-gradient(135deg, var(--jobs-forest) 0%, var(--jobs-accent) 55%, var(--jobs-accent-soft) 100%)"
    >
      <div className="space-y-4">
        <HeroCard
          variant={breakdownRows.length > 0 ? "paired" : "solo"}
          tone={hasActivity ? "active" : "empty"}
          eyebrow={t("Employer · live")}
          headline={
            hasActivity
              ? t("Candidates are moving through your roles.")
              : t("Your roles are live — your first candidates will land here.")
          }
          blurb={t("Review new applicants, advance your pipeline, and keep every role moving — all from one place.")}
          ariaLabel={t("Employer overview")}
          ctaPrimary={{ label: t("Review applicants"), href: "/employer/applicants" }}
          ctaSecondary={{ label: t("Post a job"), href: "/employer/jobs/new" }}
          tiles={tiles}
          side={
            breakdownRows.length > 0
              ? {
                  kicker: t("Hiring pipeline"),
                  title: t("Where candidates stand"),
                  body: t("Live counts across every open role, by stage."),
                  breakdown: {
                    label: t("By stage"),
                    rows: breakdownRows,
                    ariaLabel: t("Hiring pipeline by stage"),
                  },
                }
              : undefined
          }
        />

        <SectionCard title={t("Recent applicants")} body={t("The latest candidates across your open roles.")} actions={<Link href="/employer/applicants" className="text-sm font-semibold text-[var(--jobs-accent)]">{t("View all")}</Link>}>
          {data.applications.length === 0 ? (
            <EmptyState
              kicker={t("No applicants yet")}
              title={t("Candidate movement will appear here.")}
              body={t("As soon as roles start receiving applications, this feed will show the newest candidates entering your hiring pipeline.")}
            />
          ) : (
            <div className="space-y-3">
              {data.applications.slice(0, 6).map((application) => (
                <Link key={application.applicationId} href={`/employer/applicants/${application.applicationId}`} className="block rounded-2xl bg-[var(--jobs-paper-soft)] p-4 hover:bg-[var(--jobs-accent-soft)]">
                  <div className="flex items-center justify-between gap-4">
                    <div>
                      <div className="font-semibold">{application.candidateName}</div>
                      <div className="mt-1 text-sm text-[var(--jobs-muted)]">{application.jobTitle}</div>
                    </div>
                    <span className="rounded-full bg-[var(--jobs-accent-soft)] px-3 py-1 text-xs font-semibold capitalize">{application.stage.replace(/[_-]+/g, " ")}</span>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </SectionCard>
      </div>
    </WorkspaceShell>
  );
}
