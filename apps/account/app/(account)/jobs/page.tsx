import Link from "next/link";
import {
  ArrowUpRight,
  Bell,
  Bookmark,
  BriefcaseBusiness,
  CheckCircle2,
  ChevronRight,
  CircleAlert,
  Clock3,
  FileCheck2,
  ListChecks,
  Rocket,
  ShieldCheck,
  Sparkles,
} from "lucide-react";
import { translateSurfaceLabel } from "@henryco/i18n/server";
import { formatAccountTemplate, getAccountCopy } from "@henryco/i18n/server";
import type { AccountCopy } from "@henryco/i18n/server";
import { requireAccountUser } from "@/lib/auth";
import { getJobsModuleData } from "@/lib/jobs-module";
import { getAccountAppLocale } from "@/lib/locale-server";
import PageHeader from "@/components/layout/PageHeader";
import EmptyState from "@/components/layout/EmptyState";

export const dynamic = "force-dynamic";

type DivisionJobsCopy = AccountCopy["divisionJobs"];

function toneChip(tone: string) {
  if (tone === "green") return "acct-chip acct-chip-green";
  if (tone === "orange") return "acct-chip acct-chip-orange";
  if (tone === "red") return "acct-chip acct-chip-red";
  if (tone === "gold") return "acct-chip acct-chip-gold";
  return "acct-chip acct-chip-blue";
}

function toneProgress(tone: string) {
  if (tone === "green") return "bg-[var(--acct-green)]";
  if (tone === "orange") return "bg-[var(--acct-orange)]";
  if (tone === "red") return "bg-[var(--acct-red)]";
  if (tone === "gold") return "bg-[var(--acct-gold)]";
  return "bg-[var(--acct-blue)]";
}

function stageStepClass(status: string) {
  if (status === "done") return "border-transparent bg-[var(--acct-green-soft)] text-[var(--acct-green)]";
  if (status === "current") return "border-transparent bg-[var(--acct-gold-soft)] text-[var(--acct-gold)]";
  return "border-[var(--acct-line)] bg-[var(--acct-bg)] text-[var(--acct-muted)]";
}

function formatDate(value: string) {
  return new Intl.DateTimeFormat("en-NG", {
    day: "numeric",
    month: "short",
    year: "numeric",
  }).format(new Date(value));
}

function formatDateTime(value: string) {
  return new Intl.DateTimeFormat("en-NG", {
    day: "numeric",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(value));
}

function resolveStageLabel(copy: DivisionJobsCopy, stage: string, fallback: string) {
  const labels = copy.stageLabels as Record<string, string>;
  return labels[stage] ?? fallback;
}

function resolveReadinessLabel(copy: DivisionJobsCopy, raw: string) {
  if (raw === "Interview-ready") return copy.readinessLabels.interviewReady;
  if (raw === "Strong profile") return copy.readinessLabels.strongProfile;
  if (raw === "Needs proof") return copy.readinessLabels.needsProof;
  if (raw === "Needs structure") return copy.readinessLabels.needsStructure;
  return raw;
}

function resolveWorkMode(copy: DivisionJobsCopy, raw: string) {
  const labels = copy.workModeLabels as Record<string, string>;
  return labels[raw] ?? raw;
}

function resolveEmploymentType(copy: DivisionJobsCopy, raw: string) {
  if (raw === "Full-time") return copy.employmentTypeLabels.fullTime;
  if (raw === "Part-time") return copy.employmentTypeLabels.partTime;
  if (raw === "Contract") return copy.employmentTypeLabels.contract;
  if (raw === "Internship") return copy.employmentTypeLabels.internship;
  if (raw === "Temporary") return copy.employmentTypeLabels.temporary;
  return raw;
}

function resolveNextStepLabel(copy: DivisionJobsCopy, stage: string, fallback: string) {
  if (stage === "interview") return copy.nextStep.labels.interview;
  if (stage === "offer") return copy.nextStep.labels.offer;
  if (stage === "shortlisted") return copy.nextStep.labels.shortlisted;
  if (stage === "rejected") return copy.nextStep.labels.rejected;
  if (stage === "applied" || stage === "reviewing") return copy.nextStep.labels.applied;
  return fallback;
}

function resolveNextStepBody(copy: DivisionJobsCopy, stage: string, fallback: string) {
  if (stage === "interview") return copy.nextStep.bodies.interview;
  if (stage === "offer") return copy.nextStep.bodies.offer;
  if (stage === "shortlisted") return copy.nextStep.bodies.shortlisted;
  if (stage === "rejected") return copy.nextStep.bodies.rejected;
  if (stage === "applied" || stage === "reviewing") return copy.nextStep.bodies.applied;
  return fallback;
}

function resolveStatLabel(copy: DivisionJobsCopy, statId: string, fallback: string) {
  if (statId === "applications") return copy.hero.statLabels.applications;
  if (statId === "saved") return copy.hero.statLabels.saved;
  if (statId === "readiness") return copy.hero.statLabels.readiness;
  if (statId === "updates") return copy.hero.statLabels.updates;
  return fallback;
}

function resolveStatDetail(
  copy: DivisionJobsCopy,
  stat: { id: string; detail: string },
  context: {
    leadingStageLabel: string | null;
    latestRelative: string | null;
  },
) {
  if (stat.id === "applications") {
    return context.leadingStageLabel
      ? formatAccountTemplate(copy.hero.statDetails.applicationsLeadingTemplate, {
          stage: context.leadingStageLabel,
        })
      : copy.hero.statDetails.applicationsEmpty;
  }
  if (stat.id === "saved") {
    return stat.detail.includes("shortlist")
      ? copy.hero.statDetails.savedSome
      : copy.hero.statDetails.savedEmpty;
  }
  if (stat.id === "readiness") {
    return resolveReadinessLabel(copy, stat.detail);
  }
  if (stat.id === "updates") {
    return context.latestRelative
      ? formatAccountTemplate(copy.hero.statDetails.updatesLatestTemplate, {
          relative: context.latestRelative,
        })
      : copy.hero.statDetails.updatesEmpty;
  }
  return stat.detail;
}

function resolveChecklistLabel(copy: DivisionJobsCopy, id: string, fallback: string) {
  if (id === "identity") return copy.profile.checklist.identityLabel;
  if (id === "story") return copy.profile.checklist.storyLabel;
  if (id === "verification") return copy.profile.checklist.verificationLabel;
  if (id === "proof") return copy.profile.checklist.proofLabel;
  if (id === "skills") return copy.profile.checklist.skillsLabel;
  return fallback;
}

function resolveChecklistDetail(copy: DivisionJobsCopy, id: string, fallback: string) {
  if (id === "identity") return copy.profile.checklist.identityDetail;
  if (id === "story") return copy.profile.checklist.storyDetail;
  if (id === "verification") return copy.profile.checklist.verificationDetail;
  if (id === "proof") return copy.profile.checklist.proofDetail;
  if (id === "skills") return copy.profile.checklist.skillsDetail;
  return fallback;
}

function resolveNextActionLabel(
  copy: DivisionJobsCopy,
  action: { id: string; label: string },
  checklistLabels: Map<string, string>,
) {
  // Profile-gap action: id matches a checklist key, label looks like "Close the X gap"
  const checklistLabel = checklistLabels.get(action.id);
  if (checklistLabel) {
    return formatAccountTemplate(copy.nextActions.gapTemplate, {
      label: checklistLabel.toLowerCase(),
    });
  }
  if (action.id.startsWith("application-")) {
    return action.label.startsWith("Respond")
      ? copy.nextActions.offerLabel
      : copy.nextActions.interviewLabel;
  }
  if (action.id === "saved-role") return copy.nextActions.convertSavedLabel;
  if (action.id === "start-search") return copy.nextActions.restartLabel;
  return action.label;
}

function resolveNextActionDetail(
  copy: DivisionJobsCopy,
  action: { id: string; detail: string },
  applicationLookup: Map<string, { jobTitle: string; employerName: string }>,
  savedLookup: { title: string } | null,
) {
  if (action.id.startsWith("application-")) {
    const applicationId = action.id.replace(/^application-/, "");
    const application = applicationLookup.get(applicationId);
    if (application) {
      return formatAccountTemplate(copy.nextActions.attentionTemplate, {
        title: application.jobTitle,
        employer: application.employerName,
      });
    }
  }
  if (action.id === "saved-role" && savedLookup) {
    return formatAccountTemplate(copy.nextActions.convertSavedTemplate, {
      title: savedLookup.title,
    });
  }
  if (action.id === "start-search") return copy.nextActions.restartDetail;
  return action.detail;
}

function resolveAlertStatus(copy: DivisionJobsCopy, status: string) {
  if (status === "active") return copy.alertStatus.active;
  return copy.alertStatus.paused;
}

function localeShortRelative(value: string) {
  // Keep relative time formatting locale-agnostic; data layer returns
  // English ("Just now", "5m ago"). Surface the raw string — pretty
  // localization of relative-time is deferred to a later pass.
  const diff = Date.now() - new Date(value).getTime();
  const minutes = Math.floor(diff / 60000);
  if (minutes < 1) return "Just now";
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  if (days < 7) return `${days}d ago`;
  return new Intl.DateTimeFormat("en-NG", { day: "numeric", month: "short" }).format(new Date(value));
}

export async function generateMetadata() {
  const locale = await getAccountAppLocale();
  const copy = getAccountCopy(locale).divisionJobs;
  return {
    title: copy.metadata.title,
    description: copy.metadata.description,
  };
}

export default async function JobsPage() {
  const locale = await getAccountAppLocale();
  const copy = getAccountCopy(locale).divisionJobs;
  const t = (text: string) => translateSurfaceLabel(locale, text);
  const user = await requireAccountUser();
  const data = await getJobsModuleData(user.id);

  const leadingStageLabel =
    data.applications[0]
      ? resolveStageLabel(copy, data.applications[0].stage, data.applications[0].stageLabel)
      : null;
  const latestRelative = data.recruiterFeed[0] ? localeShortRelative(data.recruiterFeed[0].createdAt) : null;

  const checklistLabels = new Map(
    data.profile.checklist.map((item) => [item.id, resolveChecklistLabel(copy, item.id, item.label)] as const),
  );
  const applicationLookup = new Map(
    data.applications.map((application) => [
      application.id,
      { jobTitle: application.jobTitle, employerName: application.employerName },
    ] as const),
  );
  const savedLookup = data.savedJobs[0] ? { title: data.savedJobs[0].role.title } : null;

  return (
    <div className="space-y-6 acct-fade-in">
      <PageHeader
        title={copy.header.title}
        description={copy.header.description}
        icon={BriefcaseBusiness}
        actions={
          <>
            <a href={data.candidateUrl} className="acct-button-secondary rounded-xl">
              {copy.header.candidateModuleCta} <ArrowUpRight size={14} />
            </a>
            <Link href="/jobs/interviews" className="acct-button-secondary rounded-xl">
              {copy.header.interviewRoomsCta} <ArrowUpRight size={14} />
            </Link>
            <a href={data.browseJobsUrl} className="acct-button-primary rounded-xl">
              {copy.header.browseLiveRolesCta} <ArrowUpRight size={14} />
            </a>
          </>
        }
      />

      <section className="acct-card overflow-hidden">
        <div className="bg-[linear-gradient(135deg,#0F172A_0%,#0E7490_54%,#D4AF37_100%)] px-6 py-7 text-white sm:px-8">
          <div className="flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
            <div className="max-w-3xl">
              <p className="hc-label uppercase tracking-[0.2em] text-white/75">{copy.hero.eyebrow}</p>
              <h2 className="hc-h1 acct-display mt-3 text-white">{copy.hero.headline}</h2>
              <p className="hc-body-lg mt-3 max-w-2xl text-white/80">{copy.hero.body}</p>
            </div>
            <div className="grid gap-3 sm:grid-cols-2" aria-label={copy.hero.statsAriaLabel}>
              {data.stats.map((stat) => (
                <div key={stat.id} className="rounded-2xl border border-white/15 bg-white/10 p-4 backdrop-blur-sm">
                  <div className="hc-label uppercase tracking-[0.16em] text-white/75">
                    {resolveStatLabel(copy, stat.id, stat.label)}
                  </div>
                  <div className="hc-h1 hc-mono mt-3 text-white">{stat.value}</div>
                  <p className="hc-body-sm mt-2 text-white/75">
                    {resolveStatDetail(copy, stat, { leadingStageLabel, latestRelative })}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      <div className="grid gap-6 xl:grid-cols-[minmax(0,1.35fr)_360px]">
        <div className="space-y-6">
          <section className="acct-card p-5 sm:p-6">
            <div className="mb-4 flex items-center justify-between gap-4">
              <div>
                <p className="acct-kicker">{copy.sections.nextActionsKicker}</p>
                <h3 className="hc-h3 mt-2 text-[var(--acct-ink)]">{copy.sections.nextActionsTitle}</h3>
              </div>
              <a href={data.applicationsUrl} className="acct-button-ghost">
                {copy.sections.openTimelineCta} <ChevronRight size={14} />
              </a>
            </div>
            <div className="grid gap-3 md:grid-cols-2">
              {data.nextActions.map((action) => (
                <a
                  key={action.id}
                  href={action.href}
                  className="rounded-2xl border border-[var(--acct-line)] bg-[var(--acct-surface)] p-4 transition hover:border-[var(--acct-gold)]/30 hover:shadow-md"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <p className="text-sm font-semibold text-[var(--acct-ink)]">
                        {resolveNextActionLabel(copy, action, checklistLabels)}
                      </p>
                      <p className="mt-2 text-sm leading-6 text-[var(--acct-muted)]">
                        {resolveNextActionDetail(copy, action, applicationLookup, savedLookup)}
                      </p>
                    </div>
                    <span className={toneChip(action.tone)}>{t(action.tone)}</span>
                  </div>
                </a>
              ))}
            </div>
          </section>

          <section className="acct-card p-5 sm:p-6">
            <div className="mb-5 flex items-center justify-between gap-4">
              <div>
                <p className="acct-kicker">{copy.sections.applicationsKicker}</p>
                <h3 className="hc-h3 mt-2 text-[var(--acct-ink)]">{copy.sections.applicationsTitle}</h3>
              </div>
              {data.stageSummary.length > 0 ? (
                <div className="flex flex-wrap gap-2">
                  {data.stageSummary.map((item) => (
                    <span key={item.key} className={toneChip(item.tone)}>
                      {resolveStageLabel(copy, item.key, item.label)}: {item.count}
                    </span>
                  ))}
                </div>
              ) : null}
            </div>

            {data.applications.length === 0 ? (
              <EmptyState
                icon={Rocket}
                title={copy.empty.applicationsTitle}
                description={copy.empty.applicationsBody}
                action={
                  <a href={data.browseJobsUrl} className="acct-button-primary rounded-xl">
                    {copy.empty.exploreJobsCta}
                  </a>
                }
              />
            ) : (
              <div className="space-y-4">
                {data.applications.map((application) => (
                  <article key={application.id} className="rounded-[1.5rem] border border-[var(--acct-line)] bg-[var(--acct-bg-elevated)] p-5">
                    <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                      <div className="min-w-0">
                        <div className="flex flex-wrap items-center gap-2">
                          <span className={toneChip(application.tone)}>
                            {resolveStageLabel(copy, application.stage, application.stageLabel)}
                          </span>
                          <span className="acct-chip acct-chip-gold">
                            {formatAccountTemplate(copy.application.progressPercentTemplate, {
                              percent: application.progressPercent,
                            })}
                          </span>
                        </div>
                        <h4 className="mt-3 text-lg font-semibold text-[var(--acct-ink)]">{application.jobTitle}</h4>
                        <p className="mt-1 text-sm text-[var(--acct-muted)]">
                          {application.employerName} ·{" "}
                          {formatAccountTemplate(copy.application.appliedAtTemplate, {
                            date: formatDate(application.appliedAt),
                          })}
                        </p>
                      </div>
                      <div className="grid gap-2 sm:grid-cols-2 lg:min-w-[240px]">
                        <div className="rounded-2xl bg-[var(--acct-surface)] p-3">
                          <div className="text-[0.65rem] font-semibold uppercase tracking-[0.14em] text-[var(--acct-muted)]">
                            {copy.application.candidateReadiness}
                          </div>
                          <div className="mt-2 text-2xl font-semibold text-[var(--acct-ink)]">{application.candidateReadiness}%</div>
                        </div>
                        <div className="rounded-2xl bg-[var(--acct-surface)] p-3">
                          <div className="text-[0.65rem] font-semibold uppercase tracking-[0.14em] text-[var(--acct-muted)]">
                            {copy.application.recruiterConfidence}
                          </div>
                          <div className="mt-2 text-2xl font-semibold text-[var(--acct-ink)]">{application.recruiterConfidence}%</div>
                        </div>
                      </div>
                    </div>

                    <div className="mt-4 h-2 overflow-hidden rounded-full bg-[var(--acct-line)]">
                      <div
                        className={`h-full rounded-full ${toneProgress(application.tone)}`}
                        style={{ width: `${application.progressPercent}%` }}
                      />
                    </div>

                    <div className="mt-4 flex flex-wrap gap-2">
                      {application.pipeline.map((step) => (
                        <span
                          key={`${application.id}-${step.key}`}
                          className={`rounded-full border px-3 py-1 text-xs font-semibold ${stageStepClass(step.status)}`}
                        >
                          {resolveStageLabel(copy, step.key, step.label)}
                        </span>
                      ))}
                    </div>

                    <div className="mt-5 grid gap-3 lg:grid-cols-2">
                      <div className="rounded-2xl bg-[var(--acct-surface)] p-4">
                        <div className="flex items-center gap-2 text-sm font-semibold text-[var(--acct-ink)]">
                          <Bell size={15} className="text-[var(--acct-gold)]" />
                          {copy.application.latestMovement}
                        </div>
                        <p className="mt-2 text-sm leading-6 text-[var(--acct-muted)]">{t(application.latestUpdateBody)}</p>
                        <p className="mt-2 text-xs text-[var(--acct-muted)]">{formatDateTime(application.latestUpdateAt)}</p>
                      </div>
                      <div className="rounded-2xl bg-[var(--acct-surface)] p-4">
                        <div className="flex items-center gap-2 text-sm font-semibold text-[var(--acct-ink)]">
                          <ListChecks size={15} className="text-[var(--acct-blue)]" />
                          {copy.application.nextBestMove}
                        </div>
                        <p className="mt-2 text-sm font-semibold text-[var(--acct-ink)]">
                          {resolveNextStepLabel(copy, application.stage, application.nextStepLabel)}
                        </p>
                        <p className="mt-2 text-sm leading-6 text-[var(--acct-muted)]">
                          {resolveNextStepBody(copy, application.stage, application.nextStepBody)}
                        </p>
                      </div>
                    </div>

                    <div className="mt-4 flex flex-wrap gap-3">
                      <a href={application.timelineHref} className="acct-button-primary rounded-xl">
                        {copy.application.openTimelineCta} <ArrowUpRight size={14} />
                      </a>
                      {["shortlisted", "interview", "offer", "hired"].includes(application.stage) ? (
                        <Link href={application.interviewHref} className="acct-button-secondary rounded-xl">
                          {copy.application.interviewRoomCta} <ArrowUpRight size={14} />
                        </Link>
                      ) : null}
                      <a href={application.jobHref} className="acct-button-secondary rounded-xl">
                        {copy.application.viewRoleCta} <ArrowUpRight size={14} />
                      </a>
                    </div>
                  </article>
                ))}
              </div>
            )}
          </section>

          <div className="grid gap-6 lg:grid-cols-2">
            <section className="acct-card p-5 sm:p-6">
              <div className="mb-4 flex items-center justify-between gap-4">
                <div>
                  <p className="acct-kicker">{copy.sections.savedKicker}</p>
                  <h3 className="hc-h3 mt-2 text-[var(--acct-ink)]">{copy.sections.savedTitle}</h3>
                </div>
                <a href={data.savedJobsUrl} className="acct-button-ghost">
                  {copy.sections.openSavedRolesCta} <ChevronRight size={14} />
                </a>
              </div>
              {data.savedJobs.length === 0 ? (
                <EmptyState
                  icon={Bookmark}
                  title={copy.empty.savedJobsTitle}
                  description={copy.empty.savedJobsBody}
                />
              ) : (
                <div className="space-y-3">
                  {data.savedJobs.map((savedJob) => (
                    <a
                      key={savedJob.id}
                      href={savedJob.role.href}
                      className="block rounded-2xl border border-[var(--acct-line)] bg-[var(--acct-surface)] p-4 transition hover:border-[var(--acct-gold)]/30 hover:shadow-md"
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div>
                          <p className="text-sm font-semibold text-[var(--acct-ink)]">{savedJob.role.title}</p>
                          <p className="mt-1 text-sm text-[var(--acct-muted)]">
                            {savedJob.role.employerName} · {savedJob.role.location}
                          </p>
                        </div>
                        <span className={toneChip(savedJob.role.employerVerification === "verified" ? "green" : "blue")}>
                          {formatAccountTemplate(copy.savedJob.trustTemplate, {
                            score: savedJob.role.employerTrustScore,
                          })}
                        </span>
                      </div>
                      <p className="mt-3 text-sm leading-6 text-[var(--acct-muted)]">
                        {formatAccountTemplate(copy.savedJob.savedAtTemplate, {
                          date: formatDate(savedJob.savedAt),
                        })}{" "}
                        · {resolveWorkMode(copy, savedJob.role.workMode)} ·{" "}
                        {resolveEmploymentType(copy, savedJob.role.employmentType)}
                      </p>
                    </a>
                  ))}
                </div>
              )}
            </section>

            <section className="acct-card p-5 sm:p-6">
              <div className="mb-4 flex items-center justify-between gap-4">
                <div>
                  <p className="acct-kicker">{copy.sections.recommendedKicker}</p>
                  <h3 className="hc-h3 mt-2 text-[var(--acct-ink)]">{copy.sections.recommendedTitle}</h3>
                </div>
                <a href={data.browseJobsUrl} className="acct-button-ghost">
                  {copy.sections.browseCatalogCta} <ChevronRight size={14} />
                </a>
              </div>
              {data.recommendedRoles.length === 0 ? (
                <EmptyState
                  icon={Sparkles}
                  title={copy.empty.recommendedTitle}
                  description={copy.empty.recommendedBody}
                />
              ) : (
                <div className="space-y-3">
                  {data.recommendedRoles.map((role) => (
                    <a
                      key={role.slug}
                      href={role.href}
                      className="block rounded-2xl border border-[var(--acct-line)] bg-[var(--acct-surface)] p-4 transition hover:border-[var(--acct-gold)]/30 hover:shadow-md"
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div>
                          <p className="text-sm font-semibold text-[var(--acct-ink)]">{role.title}</p>
                          <p className="mt-1 text-sm text-[var(--acct-muted)]">
                            {role.employerName} · {role.location}
                          </p>
                        </div>
                        <span className={toneChip(role.employerVerification === "verified" ? "green" : "blue")}>
                          {role.score}
                        </span>
                      </div>
                      <p className="mt-3 text-sm leading-6 text-[var(--acct-muted)]">{role.reason}</p>
                      <div className="mt-3 flex flex-wrap gap-2 text-xs text-[var(--acct-muted)]">
                        <span>{resolveWorkMode(copy, role.workMode)}</span>
                        <span>{resolveEmploymentType(copy, role.employmentType)}</span>
                        <span>{role.salaryLabel ? t(role.salaryLabel) : copy.recommended.compFallback}</span>
                      </div>
                    </a>
                  ))}
                </div>
              )}
            </section>
          </div>

          <section className="acct-card p-5 sm:p-6">
            <div className="mb-4 flex items-center justify-between gap-4">
              <div>
                <p className="acct-kicker">{copy.sections.recruiterFeedKicker}</p>
                <h3 className="hc-h3 mt-2 text-[var(--acct-ink)]">{copy.sections.recruiterFeedTitle}</h3>
              </div>
              <a href={data.applicationsUrl} className="acct-button-ghost">
                {copy.sections.candidateInboxCta} <ChevronRight size={14} />
              </a>
            </div>

            {data.recruiterFeed.length === 0 ? (
              <EmptyState
                icon={Bell}
                title={copy.empty.recruiterFeedTitle}
                description={copy.empty.recruiterFeedBody}
              />
            ) : (
              <div className="space-y-3">
                {data.recruiterFeed.map((item) => (
                  <a
                    key={item.id}
                    href={item.href}
                    className="block rounded-2xl border border-[var(--acct-line)] bg-[var(--acct-surface)] p-4 transition hover:border-[var(--acct-gold)]/30 hover:shadow-md"
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <div className="flex flex-wrap items-center gap-2">
                          <span className={toneChip(item.tone)}>{item.source}</span>
                          <span className="text-xs text-[var(--acct-muted)]">{formatDateTime(item.createdAt)}</span>
                        </div>
                        <p className="mt-2 text-sm font-semibold text-[var(--acct-ink)]">{t(item.title)}</p>
                        <p className="mt-2 text-sm leading-6 text-[var(--acct-muted)]">{t(item.body)}</p>
                      </div>
                      <ArrowUpRight size={16} className="mt-1 shrink-0 text-[var(--acct-muted)]" />
                    </div>
                  </a>
                ))}
              </div>
            )}
          </section>
        </div>

        <div className="space-y-6">
          <section className="acct-card p-5 sm:p-6">
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="acct-kicker">{copy.sections.profileKicker}</p>
                <h3 className="hc-h3 mt-2 text-[var(--acct-ink)]">{copy.sections.profileTitle}</h3>
              </div>
              <span className={toneChip(data.profile.trustScore >= 70 ? "green" : "orange")}>
                {data.profile.trustScore}%
              </span>
            </div>

            <div className="mt-4 rounded-2xl bg-[var(--acct-surface)] p-4">
              <div className="flex items-center justify-between gap-3">
                <div>
                  <p className="text-sm font-semibold text-[var(--acct-ink)]">
                    {resolveReadinessLabel(copy, data.profile.readinessLabel)}
                  </p>
                  <p className="mt-1 text-sm text-[var(--acct-muted)]">{t(data.profile.resumeQualityLabel)}</p>
                </div>
                <FileCheck2 className="h-5 w-5 text-[var(--acct-gold)]" />
              </div>
              <div className="mt-4 h-2 overflow-hidden rounded-full bg-[var(--acct-line)]">
                <div
                  className={`h-full rounded-full ${toneProgress(data.profile.trustScore >= 70 ? "green" : "orange")}`}
                  style={{ width: `${data.profile.trustScore}%` }}
                />
              </div>
              <div className="mt-4 grid gap-3 sm:grid-cols-3">
                <div className="rounded-2xl bg-[var(--acct-bg-elevated)] p-3">
                  <div className="text-[0.65rem] font-semibold uppercase tracking-[0.14em] text-[var(--acct-muted)]">
                    {copy.profile.readinessLabel}
                  </div>
                  <div className="mt-2 text-xl font-semibold text-[var(--acct-ink)]">{data.profile.readinessScore}%</div>
                </div>
                <div className="rounded-2xl bg-[var(--acct-bg-elevated)] p-3">
                  <div className="text-[0.65rem] font-semibold uppercase tracking-[0.14em] text-[var(--acct-muted)]">
                    {copy.profile.skillsMappedLabel}
                  </div>
                  <div className="mt-2 text-xl font-semibold text-[var(--acct-ink)]">{data.profile.skillsCount}</div>
                </div>
                <div className="rounded-2xl bg-[var(--acct-bg-elevated)] p-3">
                  <div className="text-[0.65rem] font-semibold uppercase tracking-[0.14em] text-[var(--acct-muted)]">
                    {copy.profile.filesLabel}
                  </div>
                  <div className="mt-2 text-xl font-semibold text-[var(--acct-ink)]">{data.profile.documentsCount}</div>
                </div>
              </div>
            </div>

            <div className="mt-4 space-y-3">
              {data.profile.checklist.map((item) => (
                <a
                  key={item.id}
                  href={item.href}
                  className="flex items-start gap-3 rounded-2xl border border-[var(--acct-line)] bg-[var(--acct-bg)] p-4 transition hover:border-[var(--acct-gold)]/30"
                >
                  <div className="mt-0.5">
                    {item.complete ? (
                      <CheckCircle2 className="h-5 w-5 text-[var(--acct-green)]" />
                    ) : (
                      <CircleAlert className="h-5 w-5 text-[var(--acct-orange)]" />
                    )}
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-[var(--acct-ink)]">
                      {resolveChecklistLabel(copy, item.id, item.label)}
                    </p>
                    <p className="mt-1 text-sm leading-6 text-[var(--acct-muted)]">
                      {resolveChecklistDetail(copy, item.id, item.detail)}
                    </p>
                  </div>
                </a>
              ))}
            </div>

            <div className="mt-4 flex flex-wrap gap-3">
              <a href={data.profileUrl} className="acct-button-primary rounded-xl">
                {copy.profile.improveProfileCta} <ArrowUpRight size={14} />
              </a>
              <a href={data.candidateUrl} className="acct-button-secondary rounded-xl">
                {copy.profile.openCandidateModuleCta} <ArrowUpRight size={14} />
              </a>
            </div>
          </section>

          <section className="acct-card p-5 sm:p-6">
            <div className="mb-4 flex items-center justify-between gap-4">
              <div>
                <p className="acct-kicker">{copy.sections.sharedInboxKicker}</p>
                <h3 className="hc-h3 mt-2 text-[var(--acct-ink)]">{copy.sections.sharedInboxTitle}</h3>
              </div>
              <ShieldCheck className="h-5 w-5 text-[var(--acct-gold)]" />
            </div>
            {data.notifications.length === 0 ? (
              <EmptyState
                icon={Bell}
                title={copy.empty.notificationsTitle}
                description={copy.empty.notificationsBody}
              />
            ) : (
              <div className="space-y-3">
                {data.notifications.map((notification) => (
                  <a
                    key={notification.id}
                    href={notification.href}
                    className={`block rounded-2xl border p-4 transition hover:border-[var(--acct-gold)]/30 ${
                      notification.isRead
                        ? "border-[var(--acct-line)] bg-[var(--acct-surface)]"
                        : "border-[var(--acct-gold)]/20 bg-[var(--acct-gold-soft)]"
                    }`}
                  >
                    <p className="text-sm font-semibold text-[var(--acct-ink)]">{t(notification.title)}</p>
                    <p className="mt-2 text-sm leading-6 text-[var(--acct-muted)]">{t(notification.body)}</p>
                    <p className="mt-2 text-xs text-[var(--acct-muted)]">{formatDateTime(notification.createdAt)}</p>
                  </a>
                ))}
              </div>
            )}
          </section>

          <section className="acct-card p-5 sm:p-6">
            <div className="mb-4 flex items-center justify-between gap-4">
              <div>
                <p className="acct-kicker">{copy.sections.alertsKicker}</p>
                <h3 className="hc-h3 mt-2 text-[var(--acct-ink)]">{copy.sections.alertsTitle}</h3>
              </div>
              <Clock3 className="h-5 w-5 text-[var(--acct-blue)]" />
            </div>
            {data.alerts.length === 0 ? (
              <EmptyState
                icon={Clock3}
                title={copy.empty.alertsTitle}
                description={copy.empty.alertsBody}
                action={
                  <a href={data.browseJobsUrl} className="acct-button-primary rounded-xl">
                    {copy.empty.browseRolesCta}
                  </a>
                }
              />
            ) : (
              <div className="space-y-3">
                {data.alerts.map((alert) => (
                  <a
                    key={alert.id}
                    href={alert.href}
                    className="block rounded-2xl border border-[var(--acct-line)] bg-[var(--acct-surface)] p-4 transition hover:border-[var(--acct-gold)]/30 hover:shadow-md"
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <p className="text-sm font-semibold text-[var(--acct-ink)]">{t(alert.label)}</p>
                        <p className="mt-2 text-sm leading-6 text-[var(--acct-muted)]">{t(alert.detail)}</p>
                      </div>
                      <span className={toneChip(alert.status === "active" ? "green" : "blue")}>
                        {resolveAlertStatus(copy, alert.status)}
                      </span>
                    </div>
                  </a>
                ))}
              </div>
            )}
          </section>
        </div>
      </div>
    </div>
  );
}
