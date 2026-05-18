import type { Metadata } from "next";
import Link from "next/link";
import { Bell, Bookmark, CheckCircle2, CircleAlert, FileCheck2, Sparkles } from "lucide-react";
import { getJobsCopy } from "@henryco/i18n";
import { EmptyState } from "@/components/feedback";
import { requireJobsUser } from "@/lib/auth";
import { getCandidateDashboardData } from "@/lib/jobs/data";
import { candidateNav } from "@/lib/jobs/navigation";
import { getJobsPublicLocale } from "@/lib/locale-server";
import { SectionCard, StatTile, StatusPill, WorkspaceShell } from "@/components/workspace-shell";

export const dynamic = "force-dynamic";

export async function generateMetadata(): Promise<Metadata> {
  const locale = await getJobsPublicLocale();
  const copy = getJobsCopy(locale).candidateHome;
  return {
    title: copy.metaTitle,
    description: copy.metaDescription,
  };
}

function toneForPriority(tone: string) {
  if (tone === "good") return "good" as const;
  if (tone === "warn") return "warn" as const;
  if (tone === "danger") return "danger" as const;
  return "neutral" as const;
}

function formatDateTime(value: string) {
  return new Intl.DateTimeFormat("en-NG", {
    day: "numeric",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(value));
}

export default async function CandidateOverviewPage() {
  const [viewer, locale] = await Promise.all([
    requireJobsUser("/candidate"),
    getJobsPublicLocale(),
  ]);
  const copy = getJobsCopy(locale).candidateHome;
  const data = await getCandidateDashboardData(viewer.user!.id, locale);
  const activeApplications = data.applicationJourneys.filter(
    (journey) => journey.application.stage !== "rejected" && journey.application.stage !== "hired"
  );
  const interviewLaneCount = data.applicationJourneys.filter((journey) =>
    ["shortlisted", "interview", "offer"].includes(journey.application.stage)
  ).length;

  return (
    <WorkspaceShell
      area="candidate"
      title={copy.pageTitle}
      subtitle={copy.pageSubtitle}
      nav={candidateNav}
      activeHref="/candidate"
      accent="linear-gradient(135deg,#0d5e66 0%,#0e7c86 55%,#7fd0d4 100%)"
      rightRail={
        <>
          <SectionCard title={copy.rightRailRecruiterTitle} body={copy.rightRailRecruiterBody}>
            {data.recruiterFeed.length === 0 ? (
              <EmptyState
                kicker={copy.rightRailRecruiterEmpty}
                title={copy.rightRailRecruiterEmptyTitle}
                body={copy.rightRailRecruiterEmptyBody}
              />
            ) : (
              <div className="space-y-3">
                {data.recruiterFeed.slice(0, 5).map((item) => (
                  <a key={item.id} href={item.href || "/candidate/applications"} className="block rounded-2xl bg-[var(--jobs-paper-soft)] p-4 transition hover:bg-[var(--jobs-accent-soft)]">
                    <div className="flex items-center justify-between gap-3">
                      <StatusPill label={item.source} tone={toneForPriority(item.tone)} />
                      <span className="text-xs text-[var(--jobs-muted)]">{formatDateTime(item.createdAt)}</span>
                    </div>
                    <div className="mt-3 font-semibold">{item.title}</div>
                    <div className="mt-1 text-sm leading-7 text-[var(--jobs-muted)]">{item.body}</div>
                  </a>
                ))}
              </div>
            )}
          </SectionCard>

          <SectionCard title={copy.rightRailNextActionsTitle} body={copy.rightRailNextActionsBody}>
            <div className="space-y-3">
              {data.nextActions.map((action) => (
                <a key={action.id} href={action.href} className="block rounded-2xl bg-[var(--jobs-paper-soft)] p-4 transition hover:bg-[var(--jobs-accent-soft)]">
                  <div className="flex items-center justify-between gap-3">
                    <div className="font-semibold">{action.label}</div>
                    <StatusPill label={action.tone} tone={toneForPriority(action.tone)} />
                  </div>
                  <div className="mt-2 text-sm leading-7 text-[var(--jobs-muted)]">{action.body}</div>
                </a>
              ))}
            </div>
          </SectionCard>
        </>
      }
    >
      <div className="space-y-4">
        <SectionCard
          title={copy.overviewTitle}
          body={copy.overviewBody}
          actions={
            <Link href="/candidate/profile" className="text-sm font-semibold text-[var(--jobs-accent)]">
              {copy.overviewImproveProfile}
            </Link>
          }
        >
          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
            <StatTile
              label={copy.tileProfileReadinessLabel}
              value={`${data.profile?.trustScore ?? 0}%`}
              detail={data.profile?.readinessLabel || copy.tileProfileReadinessFallback}
            />
            <StatTile
              label={copy.tileActiveAppsLabel}
              value={activeApplications.length}
              detail={activeApplications.length > 0 ? copy.tileActiveAppsDetailActive : copy.tileActiveAppsDetailEmpty}
            />
            <StatTile
              label={copy.tileInProgressLabel}
              value={interviewLaneCount}
              detail={interviewLaneCount > 0 ? copy.tileInProgressDetailActive : copy.tileInProgressDetailEmpty}
            />
            <StatTile
              label={copy.tileSavedRolesLabel}
              value={data.savedJobs.length}
              detail={data.savedJobs.length > 0 ? copy.tileSavedRolesDetailActive : copy.tileSavedRolesDetailEmpty}
            />
          </div>
        </SectionCard>

        <SectionCard
          title={copy.profileStrengthTitle}
          body={copy.profileStrengthBody}
        >
          <div className="grid gap-4 lg:grid-cols-[1.1fr_0.9fr]">
            <div className="rounded-[1.7rem] bg-[var(--jobs-paper-soft)] p-5">
              <div className="flex items-center justify-between gap-4">
                <div>
                  <div className="jobs-kicker">{copy.readinessScoreKicker}</div>
                  <div className="mt-3 text-4xl font-semibold tracking-tight">{data.profile?.trustScore ?? 0}%</div>
                  <p className="mt-2 text-sm leading-7 text-[var(--jobs-muted)]">
                    {data.profile?.readinessLabel || copy.readinessFallback}
                  </p>
                </div>
                <div className="rounded-[1.5rem] bg-white/80 p-4 text-[var(--jobs-accent)]">
                  <FileCheck2 className="h-6 w-6" />
                </div>
              </div>
              <div className="mt-5 h-2 overflow-hidden rounded-full bg-[var(--jobs-line)]">
                <div className="h-full rounded-full bg-[var(--jobs-accent)]" style={{ width: `${data.profile?.trustScore ?? 0}%` }} />
              </div>
            </div>

            <div className="space-y-3">
              {data.profileChecklist.map((item) => (
                <a key={item.id} href={item.href} className="flex items-start gap-3 rounded-[1.5rem] bg-[var(--jobs-paper-soft)] p-4 transition hover:bg-[var(--jobs-accent-soft)]">
                  <div className="mt-0.5">
                    {item.complete ? (
                      <CheckCircle2 className="h-5 w-5 text-[var(--jobs-success)]" />
                    ) : (
                      <CircleAlert className="h-5 w-5 text-[var(--jobs-warning)]" />
                    )}
                  </div>
                  <div>
                    <div className="font-semibold">{item.label}</div>
                    <div className="mt-1 text-sm leading-7 text-[var(--jobs-muted)]">{item.detail}</div>
                  </div>
                </a>
              ))}
            </div>
          </div>
        </SectionCard>

        <SectionCard
          title={copy.applicationsTitle}
          body={copy.applicationsBody}
          actions={
            <Link href="/candidate/applications" className="text-sm font-semibold text-[var(--jobs-accent)]">
              {copy.applicationsViewAll}
            </Link>
          }
        >
          {data.applicationJourneys.length === 0 ? (
            <EmptyState
              kicker={copy.applicationsEmptyKicker}
              title={copy.applicationsEmptyTitle}
              body={copy.applicationsEmptyBody}
              action={
                <Link href="/jobs" className="jobs-button-primary rounded-full px-5 py-3 text-sm font-semibold">
                  {copy.applicationsBrowseCta}
                </Link>
              }
            />
          ) : (
            <div className="space-y-4">
              {data.applicationJourneys.slice(0, 3).map((journey) => (
                <div key={journey.application.applicationId} className="rounded-[1.7rem] bg-[var(--jobs-paper-soft)] p-5">
                  <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                    <div>
                      <div className="flex flex-wrap items-center gap-2">
                        <StatusPill label={journey.stageLabel} tone={toneForPriority(journey.stageTone)} />
                        <span className="jobs-chip">{journey.progressPercent}% complete</span>
                      </div>
                      <h3 className="mt-3 text-xl font-semibold tracking-[-0.03em]">{journey.application.jobTitle}</h3>
                      <p className="mt-1 text-sm text-[var(--jobs-muted)]">{journey.application.employerName}</p>
                    </div>
                    <div className="rounded-[1.4rem] bg-white/80 px-4 py-3 text-sm text-[var(--jobs-muted)]">
                      {copy.applicationUpdatedPrefix} {formatDateTime(journey.recruiterActionAt || journey.application.createdAt)}
                    </div>
                  </div>

                  <div className="mt-4 h-2 overflow-hidden rounded-full bg-[var(--jobs-line)]">
                    <div className={`h-full rounded-full ${journey.stageTone === "good" ? "bg-[var(--jobs-success)]" : journey.stageTone === "warn" ? "bg-[var(--jobs-warning)]" : journey.stageTone === "danger" ? "bg-[var(--jobs-danger)]" : "bg-[var(--jobs-accent)]"}`} style={{ width: `${journey.progressPercent}%` }} />
                  </div>

                  <div className="mt-4 flex flex-wrap gap-2">
                    {journey.pipeline.map((step) => (
                      <span
                        key={`${journey.application.applicationId}-${step.key}`}
                        className={`rounded-full px-3 py-1 text-xs font-semibold ${
                          step.status === "done"
                            ? "bg-[var(--jobs-success-soft)] text-[var(--jobs-success)]"
                            : step.status === "current"
                              ? "bg-[var(--jobs-accent-soft)] text-[var(--jobs-ink)]"
                              : "bg-white/80 text-[var(--jobs-muted)]"
                        }`}
                      >
                        {step.label}
                      </span>
                    ))}
                  </div>

                  <div className="mt-5 grid gap-3 lg:grid-cols-2">
                    <div className="rounded-[1.4rem] bg-white/80 p-4">
                      <div className="flex items-center gap-2 text-sm font-semibold">
                        <Bell className="h-4 w-4 text-[var(--jobs-accent)]" />
                        {copy.applicationLatestRecruiterLabel}
                      </div>
                      <p className="mt-2 text-sm leading-7 text-[var(--jobs-muted)]">{journey.recruiterActionBody}</p>
                    </div>
                    <div className="rounded-[1.4rem] bg-white/80 p-4">
                      <div className="flex items-center gap-2 text-sm font-semibold">
                        <Sparkles className="h-4 w-4 text-[var(--jobs-warning)]" />
                        {copy.applicationBestNextMoveLabel}
                      </div>
                      <p className="mt-2 text-sm font-semibold">{journey.nextStepLabel}</p>
                      <p className="mt-1 text-sm leading-7 text-[var(--jobs-muted)]">{journey.nextStepBody}</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </SectionCard>

        <div className="grid gap-4 xl:grid-cols-2">
          <SectionCard
            title={copy.savedRolesTitle}
            body={copy.savedRolesBody}
            actions={
              <Link href="/candidate/saved-jobs" className="text-sm font-semibold text-[var(--jobs-accent)]">
                {copy.savedRolesOpenLink}
              </Link>
            }
          >
            {data.savedJobs.length === 0 ? (
              <EmptyState
                kicker={copy.savedRolesEmptyKicker}
                title={copy.savedRolesEmptyTitle}
                body={copy.savedRolesEmptyBody}
              />
            ) : (
              <div className="space-y-3">
                {data.savedJobs.slice(0, 3).map((saved) => (
                  <a key={saved.id} href={`/jobs/${saved.job.slug}`} className="flex items-start gap-3 rounded-[1.5rem] bg-[var(--jobs-paper-soft)] p-4 transition hover:bg-[var(--jobs-accent-soft)]">
                    <div className="rounded-2xl bg-white/80 p-3 text-[var(--jobs-accent)]">
                      <Bookmark className="h-4 w-4" />
                    </div>
                    <div>
                      <div className="font-semibold">{saved.job.title}</div>
                      <div className="mt-1 text-sm text-[var(--jobs-muted)]">
                        {saved.job.employerName} · {saved.job.location}
                      </div>
                      {saved.job.employerTrustScore >= 70 ? (
                        <div className="mt-2 text-xs font-medium text-[var(--jobs-success)]">{copy.savedRolesHighTrustLabel}</div>
                      ) : null}
                    </div>
                  </a>
                ))}
              </div>
            )}
          </SectionCard>

          <SectionCard title={copy.recommendedTitle} body={copy.recommendedBody}>
            {data.recommendedJobs.length === 0 ? (
              <EmptyState
                kicker={copy.recommendedEmptyKicker}
                title={copy.recommendedEmptyTitle}
                body={copy.recommendedEmptyBody}
              />
            ) : (
              <div className="space-y-3">
                {data.recommendedJobs.map((recommendation) => (
                  <a
                    key={recommendation.job.slug}
                    href={`/jobs/${recommendation.job.slug}`}
                    className="block rounded-[1.5rem] bg-[var(--jobs-paper-soft)] p-4 transition hover:bg-[var(--jobs-accent-soft)]"
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <div className="font-semibold">{recommendation.job.title}</div>
                        <div className="mt-1 text-sm text-[var(--jobs-muted)]">
                          {recommendation.job.employerName} · {recommendation.job.location}
                        </div>
                      </div>
                      <span className="jobs-chip">{recommendation.score}{copy.recommendedMatchSuffix}</span>
                    </div>
                    <div className="mt-3 text-sm leading-7 text-[var(--jobs-muted)]">{recommendation.reason}</div>
                  </a>
                ))}
              </div>
            )}
          </SectionCard>
        </div>
      </div>
    </WorkspaceShell>
  );
}
