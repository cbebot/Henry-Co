import Link from "next/link";
import { Bell, Sparkles } from "lucide-react";
import { EmptyState, InlineNotice } from "@/components/feedback";
import { requireJobsUser } from "@/lib/auth";
import { getCandidateDashboardData } from "@/lib/jobs/data";
import { candidateNav } from "@/lib/jobs/navigation";
import { SectionCard, StatTile, StatusPill, WorkspaceShell } from "@/components/workspace-shell";

export const dynamic = "force-dynamic";

function toneForStage(stage: string) {
  if (stage === "hired" || stage === "offer") return "good" as const;
  if (stage === "shortlisted" || stage === "interview") return "warn" as const;
  if (stage === "rejected") return "danger" as const;
  return "neutral" as const;
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

export default async function CandidateApplicationsPage({
  searchParams,
}: {
  searchParams?: Promise<Record<string, string | string[] | undefined>>;
}) {
  const viewer = await requireJobsUser("/candidate/applications");
  const [data, params] = await Promise.all([
    getCandidateDashboardData(viewer.user!.id),
    searchParams ?? Promise.resolve({} as Record<string, string | string[] | undefined>),
  ]);
  const submittedId = typeof params.submitted === "string" ? params.submitted : null;
  const interviewCount = data.applicationJourneys.filter((journey) => journey.application.stage === "interview").length;
  const offerCount = data.applicationJourneys.filter((journey) => journey.application.stage === "offer").length;

  return (
    <WorkspaceShell
      area="candidate"
      title="Applications"
      subtitle="Follow every role you've applied to, with clear stages and updates from hiring teams."
      nav={candidateNav}
      activeHref="/candidate/applications"
      accent="linear-gradient(135deg,#0d5e66 0%,#0e7c86 55%,#7fd0d4 100%)"
    >
      <div className="space-y-4">
        {submittedId ? (
          <InlineNotice
            tone="success"
            title="Application submitted"
            body="Your application has been submitted. You can track its progress below."
          />
        ) : null}

        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          <StatTile label="Total applications" value={data.applicationJourneys.length} detail="All roles you've applied to." />
          <StatTile label="Interviewing" value={interviewCount} detail="Applications in active interview stages." />
          <StatTile label="Offers" value={offerCount} detail="Applications approaching a decision." />
          <StatTile label="Updates" value={data.recruiterFeed.length} detail="Recent messages and stage changes from hiring teams." />
        </div>

        <SectionCard title="All applications" body="Your complete application history with progress, stages, and recruiter updates.">
          {data.applicationJourneys.length === 0 ? (
            <EmptyState
              kicker="Start your search"
              title="You have not applied to any roles yet."
              body="Browse open roles and apply to the ones that interest you. Your applications will appear here with stage updates."
              action={
                <Link href="/jobs" className="jobs-button-primary rounded-full px-5 py-3 text-sm font-semibold">
                  Browse jobs
                </Link>
              }
            />
          ) : (
            <div className="space-y-4">
              {data.applicationJourneys.map((journey) => {
                const isFresh = submittedId === journey.application.applicationId;
                return (
                  <article
                    key={journey.application.applicationId}
                    className={`rounded-[1.9rem] p-5 ${
                      isFresh
                        ? "border border-[var(--jobs-success)] bg-[var(--jobs-success-soft)]"
                        : "jobs-panel"
                    }`}
                  >
                    <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                      <div>
                        <div className="flex flex-wrap items-center gap-2">
                          <StatusPill label={journey.stageLabel} tone={toneForStage(journey.application.stage)} />
                          <span className="jobs-chip">{journey.progressPercent}% complete</span>
                        </div>
                        <h3 className="mt-3 text-xl font-semibold tracking-[-0.03em]">{journey.application.jobTitle}</h3>
                        <p className="mt-1 text-sm text-[var(--jobs-muted)]">
                          {journey.application.employerName} · Applied {formatDate(journey.application.createdAt)}
                        </p>
                      </div>

                      <div className="grid gap-3 sm:grid-cols-2">
                        <div className="rounded-[1.4rem] bg-[var(--jobs-paper-soft)] px-4 py-3">
                          <div className="jobs-kicker">Candidate readiness</div>
                          <div className="mt-2 text-2xl font-semibold">{journey.application.candidateReadiness}%</div>
                        </div>
                        <div className="rounded-[1.4rem] bg-[var(--jobs-paper-soft)] px-4 py-3">
                          <div className="jobs-kicker">Recruiter confidence</div>
                          <div className="mt-2 text-2xl font-semibold">{journey.application.recruiterConfidence}%</div>
                        </div>
                      </div>
                    </div>

                    <div className="mt-4 h-2 overflow-hidden rounded-full bg-[var(--jobs-line)]">
                      <div
                        className={`h-full rounded-full ${
                          journey.stageTone === "good"
                            ? "bg-[var(--jobs-success)]"
                            : journey.stageTone === "warn"
                              ? "bg-[var(--jobs-warning)]"
                              : journey.stageTone === "danger"
                                ? "bg-[var(--jobs-danger)]"
                                : "bg-[var(--jobs-accent)]"
                        }`}
                        style={{ width: `${journey.progressPercent}%` }}
                      />
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
                                : "bg-[var(--jobs-paper-soft)] text-[var(--jobs-muted)]"
                          }`}
                        >
                          {step.label}
                        </span>
                      ))}
                    </div>

                    <div className="mt-5 grid gap-3 lg:grid-cols-2">
                      <div className="rounded-[1.5rem] bg-[var(--jobs-paper-soft)] p-4">
                        <div className="flex items-center gap-2 text-sm font-semibold">
                          <Bell className="h-4 w-4 text-[var(--jobs-accent)]" />
                          Latest recruiter action
                        </div>
                        <p className="mt-2 text-sm leading-7 text-[var(--jobs-muted)]">{journey.recruiterActionBody}</p>
                        <p className="mt-2 text-xs text-[var(--jobs-muted)]">
                          {formatDateTime(journey.recruiterActionAt || journey.application.createdAt)}
                        </p>
                      </div>
                      <div className="rounded-[1.5rem] bg-[var(--jobs-paper-soft)] p-4">
                        <div className="flex items-center gap-2 text-sm font-semibold">
                          <Sparkles className="h-4 w-4 text-[var(--jobs-warning)]" />
                          Best next move
                        </div>
                        <p className="mt-2 text-sm font-semibold">{journey.nextStepLabel}</p>
                        <p className="mt-1 text-sm leading-7 text-[var(--jobs-muted)]">{journey.nextStepBody}</p>
                      </div>
                    </div>

                    {(journey.sharedMessages.length > 0 || journey.timeline.length > 0) ? (
                      <div className="mt-5 grid gap-3 lg:grid-cols-2">
                        <div className="rounded-[1.5rem] bg-[var(--jobs-paper-soft)] p-4">
                          <div className="text-sm font-semibold">Messages from the hiring team</div>
                          <div className="mt-3 space-y-3">
                            {journey.sharedMessages.slice(0, 2).map((message) => (
                              <div key={message.id} className="rounded-[1.2rem] bg-white/80 p-3">
                                <div className="text-xs text-[var(--jobs-muted)]">{formatDateTime(message.createdAt)}</div>
                                <div className="mt-2 text-sm leading-7 text-[var(--jobs-muted)]">{message.body}</div>
                              </div>
                            ))}
                            {journey.sharedMessages.length === 0 ? (
                              <div className="text-sm text-[var(--jobs-muted)]">No messages from the hiring team yet.</div>
                            ) : null}
                          </div>
                        </div>
                        <div className="rounded-[1.5rem] bg-[var(--jobs-paper-soft)] p-4">
                          <div className="text-sm font-semibold">Activity log</div>
                          <div className="mt-3 space-y-3">
                            {journey.timeline.slice(0, 3).map((event) => (
                              <div key={event.id} className="rounded-[1.2rem] bg-white/80 p-3">
                                <div className="text-xs text-[var(--jobs-muted)]">{formatDateTime(event.createdAt)}</div>
                                <div className="mt-2 text-sm font-semibold capitalize">{event.action.replace(/^jobs_/, "").replace(/[_-]+/g, " ")}</div>
                                <div className="mt-1 text-sm leading-7 text-[var(--jobs-muted)]">
                                  {event.reason || "Your application status was updated."}
                                </div>
                              </div>
                            ))}
                            {journey.timeline.length === 0 ? (
                              <div className="text-sm text-[var(--jobs-muted)]">No activity recorded yet.</div>
                            ) : null}
                          </div>
                        </div>
                      </div>
                    ) : null}
                  </article>
                );
              })}
            </div>
          )}
        </SectionCard>
      </div>
    </WorkspaceShell>
  );
}
