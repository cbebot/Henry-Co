import Link from "next/link";
import { notFound } from "next/navigation";
import {
  ArrowLeft,
  ArrowUpRight,
  CalendarRange,
  Headphones,
  MessageSquare,
  ShieldCheck,
  Video,
} from "lucide-react";
import { requireAccountUser } from "@/lib/auth";
import { getJobsModuleData } from "@/lib/jobs-module";
import { formatDateTime, timeAgo } from "@/lib/format";
import PageHeader from "@/components/layout/PageHeader";

export const dynamic = "force-dynamic";

function statusChip(status: string) {
  if (["post_interview"].includes(status)) return "acct-chip acct-chip-green";
  if (["scheduled"].includes(status)) return "acct-chip acct-chip-blue";
  if (["awaiting_schedule", "preparation"].includes(status)) return "acct-chip acct-chip-orange";
  return "acct-chip acct-chip-gold";
}

export default async function JobsInterviewDetailPage({
  params,
}: {
  params: Promise<{ sessionId: string }>;
}) {
  const user = await requireAccountUser();
  const { sessionId } = await params;
  const data = await getJobsModuleData(user.id);
  const session = data.interviewSessions.find((item) => item.id === sessionId) ?? null;

  if (!session) {
    notFound();
  }

  return (
    <div className="space-y-6 acct-fade-in">
      <PageHeader
        title={session.jobTitle}
        description="A candidate-safe interview room with timing, recruiter notes, provider readiness, and follow-up history."
        icon={Video}
        actions={
          <div className="flex flex-wrap gap-3">
            <Link href="/jobs/interviews" className="acct-button-secondary rounded-xl">
              <ArrowLeft size={14} /> All interview rooms
            </Link>
            <a href={session.jobHref} className="acct-button-secondary rounded-xl">
              View role <ArrowUpRight size={14} />
            </a>
            <a href={session.supportHref} className="acct-button-primary rounded-xl">
              Open recruiter thread <ArrowUpRight size={14} />
            </a>
          </div>
        }
      />

      <section className="acct-card overflow-hidden">
        <div className="bg-[linear-gradient(135deg,#0F172A_0%,#0E7490_48%,#C9A227_100%)] px-6 py-7 text-white sm:px-8">
          <div className="flex flex-col gap-6 xl:flex-row xl:items-end xl:justify-between">
            <div className="max-w-3xl">
              <div className="flex flex-wrap gap-2">
                <span className="rounded-full bg-white/12 px-3 py-1 text-[0.7rem] font-semibold uppercase tracking-[0.18em] text-white/84">
                  {session.applicationStage.replaceAll("_", " ")}
                </span>
                <span className={statusChip(session.status).replace("acct-chip", "rounded-full px-3 py-1 text-[0.7rem] font-semibold uppercase tracking-[0.18em]")}>
                  {session.status.replaceAll("_", " ")}
                </span>
                <span className="rounded-full bg-white/12 px-3 py-1 text-[0.7rem] font-semibold uppercase tracking-[0.18em] text-white/84">
                  {session.provider.replaceAll("_", " ")}
                </span>
              </div>
              <h2 className="mt-4 acct-display text-3xl leading-tight sm:text-4xl">
                {session.nextStepLabel}
              </h2>
              <p className="mt-3 text-sm leading-7 text-white/78">{session.confirmationNote}</p>
            </div>
            <div className="grid gap-3 sm:grid-cols-3">
              {[
                {
                  label: "Timing",
                  value: session.scheduledAt ? formatDateTime(session.scheduledAt) : "Pending",
                  detail: "The recruiter can still refine timing and room details.",
                },
                {
                  label: "Interviewer",
                  value: session.interviewerName,
                  detail: session.interviewerTitle,
                },
                {
                  label: "Join readiness",
                  value: session.isJoinReady ? "Ready" : "Pending",
                  detail: session.locationLabel,
                },
              ].map((item) => (
                <div key={item.label} className="rounded-2xl border border-white/15 bg-white/10 p-4 backdrop-blur-sm">
                  <div className="text-[0.7rem] font-semibold uppercase tracking-[0.16em] text-white/70">{item.label}</div>
                  <div className="mt-3 text-lg font-semibold">{item.value}</div>
                  <p className="mt-2 text-sm leading-6 text-white/72">{item.detail}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      <div className="grid gap-6 xl:grid-cols-[0.95fr_1.05fr]">
        <section className="space-y-6">
          <div className="acct-card p-5 sm:p-6">
            <div className="mb-5 flex items-center gap-2">
              <CalendarRange size={15} className="text-[var(--acct-gold)]" />
              <div>
                <p className="acct-kicker">Interview state</p>
                <h3 className="mt-2 text-lg font-semibold text-[var(--acct-ink)]">What is already known</h3>
              </div>
            </div>
            <div className="grid gap-3 sm:grid-cols-2">
              <div className="rounded-[1.35rem] border border-[var(--acct-line)] bg-[var(--acct-surface)] p-4">
                <div className="text-[0.65rem] font-semibold uppercase tracking-[0.14em] text-[var(--acct-muted)]">Interviewer</div>
                <div className="mt-2 text-sm font-semibold text-[var(--acct-ink)]">{session.interviewerName}</div>
                <p className="mt-1 text-xs text-[var(--acct-muted)]">{session.interviewerTitle}</p>
              </div>
              <div className="rounded-[1.35rem] border border-[var(--acct-line)] bg-[var(--acct-surface)] p-4">
                <div className="text-[0.65rem] font-semibold uppercase tracking-[0.14em] text-[var(--acct-muted)]">Provider</div>
                <div className="mt-2 text-sm font-semibold text-[var(--acct-ink)]">{session.provider.replaceAll("_", " ")}</div>
                <p className="mt-1 text-xs text-[var(--acct-muted)]">{session.locationLabel}</p>
              </div>
              <div className="rounded-[1.35rem] border border-[var(--acct-line)] bg-[var(--acct-surface)] p-4">
                <div className="text-[0.65rem] font-semibold uppercase tracking-[0.14em] text-[var(--acct-muted)]">Scheduled at</div>
                <div className="mt-2 text-sm font-semibold text-[var(--acct-ink)]">
                  {session.scheduledAt ? formatDateTime(session.scheduledAt) : "Awaiting recruiter timing"}
                </div>
              </div>
              <div className="rounded-[1.35rem] border border-[var(--acct-line)] bg-[var(--acct-surface)] p-4">
                <div className="text-[0.65rem] font-semibold uppercase tracking-[0.14em] text-[var(--acct-muted)]">Status</div>
                <div className="mt-2">
                  <span className={statusChip(session.status)}>{session.status.replaceAll("_", " ")}</span>
                </div>
              </div>
            </div>
          </div>

          <div className="acct-card p-5 sm:p-6">
            <div className="mb-5 flex items-center gap-2">
              <ShieldCheck size={15} className="text-[var(--acct-blue)]" />
              <div>
                <p className="acct-kicker">Preparation notes</p>
                <h3 className="mt-2 text-lg font-semibold text-[var(--acct-ink)]">How to walk into this stage stronger</h3>
              </div>
            </div>
            <div className="rounded-[1.35rem] border border-[var(--acct-line)] bg-[var(--acct-surface)] p-4">
              <p className="text-sm font-semibold text-[var(--acct-ink)]">{session.nextStepLabel}</p>
              <p className="mt-3 text-sm leading-7 text-[var(--acct-muted)]">{session.preparationNotes}</p>
              <p className="mt-3 text-sm leading-7 text-[var(--acct-muted)]">{session.nextStepBody}</p>
            </div>
          </div>
        </section>

        <section className="space-y-6">
          <div className="acct-card p-5 sm:p-6">
            <div className="mb-5 flex items-center gap-2">
              <Headphones size={15} className="text-[var(--acct-gold)]" />
              <div>
                <p className="acct-kicker">Remote session lane</p>
                <h3 className="mt-2 text-lg font-semibold text-[var(--acct-ink)]">Provider-ready join flow</h3>
              </div>
            </div>
            <div className="rounded-[1.35rem] border border-[var(--acct-line)] bg-[var(--acct-surface)] p-4">
              {session.isJoinReady && session.joinUrl ? (
                <>
                  <p className="text-sm font-semibold text-[var(--acct-ink)]">The room is ready to join.</p>
                  <p className="mt-2 text-sm leading-7 text-[var(--acct-muted)]">
                    Use the live session link when the scheduled window opens.
                  </p>
                  <a href={session.joinUrl} className="acct-button-primary mt-4 rounded-xl">
                    Join remote interview
                  </a>
                </>
              ) : (
                <>
                  <p className="text-sm font-semibold text-[var(--acct-ink)]">The live provider is not attached yet.</p>
                  <p className="mt-2 text-sm leading-7 text-[var(--acct-muted)]">
                    HenryCo Jobs now preserves the interview-room architecture, but this session is still waiting for final timing or a video room provider attachment.
                  </p>
                  <a href={session.supportHref} className="acct-button-secondary mt-4 rounded-xl">
                    Request timing or reschedule
                  </a>
                </>
              )}
            </div>
          </div>

          <div className="acct-card p-5 sm:p-6">
            <div className="mb-5 flex items-center gap-2">
              <MessageSquare size={15} className="text-[var(--acct-blue)]" />
              <div>
                <p className="acct-kicker">History</p>
                <h3 className="mt-2 text-lg font-semibold text-[var(--acct-ink)]">Recruiter and stage movement</h3>
              </div>
            </div>
            <div className="space-y-3">
              {session.history.map((item) => (
                <div key={item.id} className="rounded-[1.35rem] border border-[var(--acct-line)] bg-[var(--acct-surface)] px-4 py-4">
                  <div className="flex items-center justify-between gap-4">
                    <p className="text-sm font-semibold text-[var(--acct-ink)]">{item.title}</p>
                    <span className="text-xs text-[var(--acct-muted)]">{timeAgo(item.createdAt)}</span>
                  </div>
                  <p className="mt-2 text-sm leading-6 text-[var(--acct-muted)]">{item.body}</p>
                </div>
              ))}
            </div>
          </div>
        </section>
      </div>
    </div>
  );
}
