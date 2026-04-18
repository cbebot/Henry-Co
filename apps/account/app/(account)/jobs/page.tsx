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
import { formatSurfaceTemplate, translateSurfaceLabel } from "@henryco/i18n/server";
import { requireAccountUser } from "@/lib/auth";
import { getJobsModuleData } from "@/lib/jobs-module";
import { getAccountAppLocale } from "@/lib/locale-server";
import PageHeader from "@/components/layout/PageHeader";
import EmptyState from "@/components/layout/EmptyState";

export const dynamic = "force-dynamic";

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

export default async function JobsPage() {
  const locale = await getAccountAppLocale();
  const t = (text: string) => translateSurfaceLabel(locale, text);
  const tf = (template: string, values: Record<string, string | number>) =>
    formatSurfaceTemplate(template, values);
  const user = await requireAccountUser();
  const data = await getJobsModuleData(user.id);

  return (
    <div className="space-y-6 acct-fade-in">
      <PageHeader
        title={t("Jobs")}
        description={t("Your applications, saved roles, recruiter updates, and profile strength — all in one place.")}
        icon={BriefcaseBusiness}
        actions={
          <>
            <a href={data.candidateUrl} className="acct-button-secondary rounded-xl">
              {t("Candidate module")} <ArrowUpRight size={14} />
            </a>
            <Link href="/jobs/interviews" className="acct-button-secondary rounded-xl">
              {t("Interview rooms")} <ArrowUpRight size={14} />
            </Link>
            <a href={data.browseJobsUrl} className="acct-button-primary rounded-xl">
              {t("Browse live roles")} <ArrowUpRight size={14} />
            </a>
          </>
        }
      />

      <section className="acct-card overflow-hidden">
        <div className="bg-[linear-gradient(135deg,#0F172A_0%,#0E7490_54%,#D4AF37_100%)] px-6 py-7 text-white sm:px-8">
          <div className="flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
            <div className="max-w-3xl">
              <p className="text-[0.7rem] font-bold uppercase tracking-[0.2em] text-white/70">{t("Your account")}</p>
              <h2 className="mt-3 acct-display text-3xl leading-tight sm:text-4xl">
                {t("Your jobs activity, all in one place.")}
              </h2>
              <p className="mt-3 max-w-2xl text-sm leading-7 text-white/78">
                {t("Applications, saved roles, recruiter updates, and profile readiness are linked to your HenryCo account.")}
              </p>
            </div>
            <div className="grid gap-3 sm:grid-cols-2">
              {data.stats.map((stat) => (
                <div key={stat.id} className="rounded-2xl border border-white/15 bg-white/10 p-4 backdrop-blur-sm">
                  <div className="text-[0.7rem] font-semibold uppercase tracking-[0.16em] text-white/70">{t(stat.label)}</div>
                  <div className="mt-3 text-3xl font-semibold">{stat.value}</div>
                  <p className="mt-2 text-sm leading-6 text-white/72">{t(stat.detail)}</p>
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
                <p className="acct-kicker">{t("Next Actions")}</p>
                <h3 className="mt-2 text-lg font-semibold text-[var(--acct-ink)]">{t("What deserves your attention now")}</h3>
              </div>
              <a href={data.applicationsUrl} className="acct-button-ghost">
                {t("Open timeline")} <ChevronRight size={14} />
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
                          <p className="text-sm font-semibold text-[var(--acct-ink)]">{t(action.label)}</p>
                          <p className="mt-2 text-sm leading-6 text-[var(--acct-muted)]">{t(action.detail)}</p>
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
                <p className="acct-kicker">{t("Applications")}</p>
                <h3 className="mt-2 text-lg font-semibold text-[var(--acct-ink)]">{t("Live hiring movement")}</h3>
              </div>
              {data.stageSummary.length > 0 ? (
                <div className="flex flex-wrap gap-2">
                  {data.stageSummary.map((item) => (
                    <span key={item.key} className={toneChip(item.tone)}>
                      {item.label}: {item.count}
                    </span>
                  ))}
                </div>
              ) : null}
            </div>

            {data.applications.length === 0 ? (
                <EmptyState
                  icon={Rocket}
                  title={t("No applications are live yet")}
                  description={t("Saved roles, recruiter updates, and timelines will appear here as soon as you move from browsing into a live application.")}
                  action={
                    <a href={data.browseJobsUrl} className="acct-button-primary rounded-xl">
                      {t("Explore jobs")}
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
                          <span className={toneChip(application.tone)}>{t(application.stageLabel)}</span>
                          <span className="acct-chip acct-chip-gold">{tf("{percent}% complete", { percent: application.progressPercent })}</span>
                        </div>
                        <h4 className="mt-3 text-lg font-semibold text-[var(--acct-ink)]">{application.jobTitle}</h4>
                        <p className="mt-1 text-sm text-[var(--acct-muted)]">
                          {application.employerName} · {tf("Applied {date}", { date: formatDate(application.appliedAt) })}
                        </p>
                      </div>
                      <div className="grid gap-2 sm:grid-cols-2 lg:min-w-[240px]">
                        <div className="rounded-2xl bg-[var(--acct-surface)] p-3">
                          <div className="text-[0.65rem] font-semibold uppercase tracking-[0.14em] text-[var(--acct-muted)]">
                            {t("Candidate readiness")}
                          </div>
                          <div className="mt-2 text-2xl font-semibold text-[var(--acct-ink)]">{application.candidateReadiness}%</div>
                        </div>
                        <div className="rounded-2xl bg-[var(--acct-surface)] p-3">
                          <div className="text-[0.65rem] font-semibold uppercase tracking-[0.14em] text-[var(--acct-muted)]">
                            {t("Recruiter confidence")}
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
                          {t(step.label)}
                        </span>
                      ))}
                    </div>

                    <div className="mt-5 grid gap-3 lg:grid-cols-2">
                      <div className="rounded-2xl bg-[var(--acct-surface)] p-4">
                        <div className="flex items-center gap-2 text-sm font-semibold text-[var(--acct-ink)]">
                          <Bell size={15} className="text-[var(--acct-gold)]" />
                          {t("Latest recruiter movement")}
                        </div>
                        <p className="mt-2 text-sm leading-6 text-[var(--acct-muted)]">{t(application.latestUpdateBody)}</p>
                        <p className="mt-2 text-xs text-[var(--acct-muted)]">{formatDateTime(application.latestUpdateAt)}</p>
                      </div>
                      <div className="rounded-2xl bg-[var(--acct-surface)] p-4">
                        <div className="flex items-center gap-2 text-sm font-semibold text-[var(--acct-ink)]">
                          <ListChecks size={15} className="text-[var(--acct-blue)]" />
                          {t("Next best move")}
                        </div>
                        <p className="mt-2 text-sm font-semibold text-[var(--acct-ink)]">{t(application.nextStepLabel)}</p>
                        <p className="mt-2 text-sm leading-6 text-[var(--acct-muted)]">{t(application.nextStepBody)}</p>
                      </div>
                    </div>

                    <div className="mt-4 flex flex-wrap gap-3">
                      <a href={application.timelineHref} className="acct-button-primary rounded-xl">
                        {t("Open timeline")} <ArrowUpRight size={14} />
                      </a>
                      {["shortlisted", "interview", "offer", "hired"].includes(application.stage) ? (
                        <Link href={application.interviewHref} className="acct-button-secondary rounded-xl">
                          {t("Interview room")} <ArrowUpRight size={14} />
                        </Link>
                      ) : null}
                      <a href={application.jobHref} className="acct-button-secondary rounded-xl">
                        {t("View role")} <ArrowUpRight size={14} />
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
                  <p className="acct-kicker">{t("Saved Jobs")}</p>
                  <h3 className="mt-2 text-lg font-semibold text-[var(--acct-ink)]">{t("Shortlist with better context")}</h3>
                </div>
                <a href={data.savedJobsUrl} className="acct-button-ghost">
                  {t("Open saved roles")} <ChevronRight size={14} />
                </a>
              </div>
              {data.savedJobs.length === 0 ? (
                <EmptyState
                  icon={Bookmark}
                  title={t("No saved roles yet")}
                  description={t("Save promising roles to keep them on your shortlist across Jobs and your account.")}
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
                          {tf("Trust {score}", { score: savedJob.role.employerTrustScore })}
                        </span>
                      </div>
                      <p className="mt-3 text-sm leading-6 text-[var(--acct-muted)]">
                        {tf("Saved {date}", { date: formatDate(savedJob.savedAt) })} · {t(savedJob.role.workMode)} · {t(savedJob.role.employmentType)}
                      </p>
                    </a>
                  ))}
                </div>
              )}
            </section>

            <section className="acct-card p-5 sm:p-6">
              <div className="mb-4 flex items-center justify-between gap-4">
                <div>
                  <p className="acct-kicker">{t("Recommended Roles")}</p>
                  <h3 className="mt-2 text-lg font-semibold text-[var(--acct-ink)]">{t("What fits your current signal")}</h3>
                </div>
                <a href={data.browseJobsUrl} className="acct-button-ghost">
                  {t("Browse catalog")} <ChevronRight size={14} />
                </a>
              </div>
              {data.recommendedRoles.length === 0 ? (
                <EmptyState
                  icon={Sparkles}
                  title={t("Recommendations will sharpen as you use Jobs")}
                  description={t("Once your profile, shortlist, and applications deepen, the role suggestions here will get more targeted.")}
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
                        <span>{t(role.workMode)}</span>
                        <span>{t(role.employmentType)}</span>
                        <span>{role.salaryLabel ? t(role.salaryLabel) : t("Comp discussed in process")}</span>
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
                <p className="acct-kicker">{t("Recruiter Feed")}</p>
                <h3 className="mt-2 text-lg font-semibold text-[var(--acct-ink)]">{t("Messages, stage moves, and alerts")}</h3>
              </div>
              <a href={data.applicationsUrl} className="acct-button-ghost">
                {t("Candidate inbox")} <ChevronRight size={14} />
              </a>
            </div>

            {data.recruiterFeed.length === 0 ? (
                <EmptyState
                  icon={Bell}
                  title={t("No recruiter movement yet")}
                  description={t("Application stage changes, shared recruiter notes, and in-app jobs notifications will collect here.")}
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
                        <p className="mt-2 text-sm font-semibold text-[var(--acct-ink)]">{item.title}</p>
                        <p className="mt-2 text-sm leading-6 text-[var(--acct-muted)]">{item.body}</p>
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
                <p className="acct-kicker">{t("Profile Strength")}</p>
                <h3 className="mt-2 text-lg font-semibold text-[var(--acct-ink)]">{t("Candidate readiness and CV quality")}</h3>
              </div>
              <span className={toneChip(data.profile.trustScore >= 70 ? "green" : "orange")}>
                {data.profile.trustScore}%
              </span>
            </div>

            <div className="mt-4 rounded-2xl bg-[var(--acct-surface)] p-4">
              <div className="flex items-center justify-between gap-3">
                <div>
                  <p className="text-sm font-semibold text-[var(--acct-ink)]">{t(data.profile.readinessLabel)}</p>
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
                  <div className="text-[0.65rem] font-semibold uppercase tracking-[0.14em] text-[var(--acct-muted)]">{t("Readiness")}</div>
                  <div className="mt-2 text-xl font-semibold text-[var(--acct-ink)]">{data.profile.readinessScore}%</div>
                </div>
                <div className="rounded-2xl bg-[var(--acct-bg-elevated)] p-3">
                  <div className="text-[0.65rem] font-semibold uppercase tracking-[0.14em] text-[var(--acct-muted)]">{t("Skills mapped")}</div>
                  <div className="mt-2 text-xl font-semibold text-[var(--acct-ink)]">{data.profile.skillsCount}</div>
                </div>
                <div className="rounded-2xl bg-[var(--acct-bg-elevated)] p-3">
                  <div className="text-[0.65rem] font-semibold uppercase tracking-[0.14em] text-[var(--acct-muted)]">{t("Files")}</div>
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
                    <p className="text-sm font-semibold text-[var(--acct-ink)]">{t(item.label)}</p>
                    <p className="mt-1 text-sm leading-6 text-[var(--acct-muted)]">{t(item.detail)}</p>
                  </div>
                </a>
              ))}
            </div>

            <div className="mt-4 flex flex-wrap gap-3">
              <a href={data.profileUrl} className="acct-button-primary rounded-xl">
                {t("Improve profile")} <ArrowUpRight size={14} />
              </a>
              <a href={data.candidateUrl} className="acct-button-secondary rounded-xl">
                {t("Open candidate module")} <ArrowUpRight size={14} />
              </a>
            </div>
          </section>

          <section className="acct-card p-5 sm:p-6">
            <div className="mb-4 flex items-center justify-between gap-4">
              <div>
                <p className="acct-kicker">{t("Shared Inbox")}</p>
                <h3 className="mt-2 text-lg font-semibold text-[var(--acct-ink)]">{t("Jobs notifications linked to your account")}</h3>
              </div>
              <ShieldCheck className="h-5 w-5 text-[var(--acct-gold)]" />
            </div>
            {data.notifications.length === 0 ? (
                <EmptyState
                  icon={Bell}
                  title={t("No jobs notifications yet")}
                  description={t("Future shortlist moves, employer updates, and application changes will land here and inside the Jobs module.")}
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
                    <p className="text-sm font-semibold text-[var(--acct-ink)]">{notification.title}</p>
                    <p className="mt-2 text-sm leading-6 text-[var(--acct-muted)]">{notification.body}</p>
                    <p className="mt-2 text-xs text-[var(--acct-muted)]">{formatDateTime(notification.createdAt)}</p>
                  </a>
                ))}
              </div>
            )}
          </section>

          <section className="acct-card p-5 sm:p-6">
            <div className="mb-4 flex items-center justify-between gap-4">
              <div>
                <p className="acct-kicker">{t("Alerts")}</p>
                <h3 className="mt-2 text-lg font-semibold text-[var(--acct-ink)]">{t("Saved search intent")}</h3>
              </div>
              <Clock3 className="h-5 w-5 text-[var(--acct-blue)]" />
            </div>
            {data.alerts.length === 0 ? (
                <EmptyState
                  icon={Clock3}
                  title={t("No jobs alerts are active")}
                  description={t("Create an alert so new roles matching your criteria appear in your Jobs feed.")}
                  action={
                    <a href={data.browseJobsUrl} className="acct-button-primary rounded-xl">
                      {t("Browse roles")}
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
                        <p className="text-sm font-semibold text-[var(--acct-ink)]">{alert.label}</p>
                        <p className="mt-2 text-sm leading-6 text-[var(--acct-muted)]">{alert.detail}</p>
                      </div>
                      <span className={toneChip(alert.status === "active" ? "green" : "blue")}>{t(alert.status)}</span>
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
