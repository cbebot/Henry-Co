import Link from "next/link";
import { ArrowLeft, ArrowUpRight, CalendarRange, CircleAlert, Video } from "lucide-react";
import { requireAccountUser } from "@/lib/auth";
import { getJobsModuleData } from "@/lib/jobs-module";
import { formatDateTime } from "@/lib/format";
import PageHeader from "@/components/layout/PageHeader";
import EmptyState from "@/components/layout/EmptyState";

export const dynamic = "force-dynamic";

function statusChip(status: string) {
  if (["post_interview"].includes(status)) return "acct-chip acct-chip-green";
  if (["scheduled"].includes(status)) return "acct-chip acct-chip-blue";
  if (["awaiting_schedule", "preparation"].includes(status)) return "acct-chip acct-chip-orange";
  return "acct-chip acct-chip-gold";
}

export default async function JobsInterviewsPage() {
  const user = await requireAccountUser();
  const data = await getJobsModuleData(user.id);

  return (
    <div className="space-y-6 acct-fade-in">
      <PageHeader
        title="Interview Rooms"
        description="Provider-ready candidate interview lanes with timing, instructions, recruiter notes, and follow-up history."
        icon={Video}
        actions={
          <div className="flex flex-wrap gap-3">
            <Link href="/jobs" className="acct-button-secondary rounded-xl">
              <ArrowLeft size={14} /> Back to Jobs
            </Link>
            <a href={data.applicationsUrl} className="acct-button-primary rounded-xl">
              Candidate timeline <ArrowUpRight size={14} />
            </a>
          </div>
        }
      />

      {data.interviewSessions.length === 0 ? (
        <section className="acct-card p-6">
          <EmptyState
            icon={CalendarRange}
            title="No interview lanes are active yet"
            description="Once a recruiter moves an application into shortlist or interview movement, the interview room will appear here with timing, preparation notes, and join readiness."
            action={
              <Link href="/jobs" className="acct-button-primary rounded-xl">
                Return to Jobs
              </Link>
            }
          />
        </section>
      ) : (
        <section className="acct-card p-5 sm:p-6">
          <div className="grid gap-4 xl:grid-cols-2">
            {data.interviewSessions.map((session) => (
              <Link
                key={session.id}
                href={session.interviewHref}
                className="rounded-[1.6rem] border border-[var(--acct-line)] bg-[var(--acct-bg-elevated)] p-5 transition hover:border-[var(--acct-gold)]/30 hover:shadow-md"
              >
                <div className="flex flex-wrap items-center gap-2">
                  <span className={statusChip(session.status)}>{session.status.replaceAll("_", " ")}</span>
                  <span className="acct-chip acct-chip-blue">{session.provider.replaceAll("_", " ")}</span>
                  <span className="acct-chip acct-chip-gold">{session.applicationStage.replaceAll("_", " ")}</span>
                </div>
                <h3 className="mt-4 text-lg font-semibold text-[var(--acct-ink)]">{session.jobTitle}</h3>
                <p className="mt-1 text-sm text-[var(--acct-muted)]">{session.employerName}</p>

                <div className="mt-4 grid gap-3 sm:grid-cols-2">
                  <div className="rounded-2xl bg-[var(--acct-surface)] p-4">
                    <div className="text-[0.65rem] font-semibold uppercase tracking-[0.14em] text-[var(--acct-muted)]">Timing</div>
                    <div className="mt-2 text-sm font-semibold text-[var(--acct-ink)]">
                      {session.scheduledAt ? formatDateTime(session.scheduledAt) : "Pending recruiter scheduling"}
                    </div>
                  </div>
                  <div className="rounded-2xl bg-[var(--acct-surface)] p-4">
                    <div className="text-[0.65rem] font-semibold uppercase tracking-[0.14em] text-[var(--acct-muted)]">Interviewer</div>
                    <div className="mt-2 text-sm font-semibold text-[var(--acct-ink)]">{session.interviewerName}</div>
                  </div>
                </div>

                <div className="mt-4 rounded-2xl bg-[var(--acct-surface)] p-4">
                  <div className="flex items-center gap-2 text-sm font-semibold text-[var(--acct-ink)]">
                    <CircleAlert size={15} className="text-[var(--acct-gold)]" />
                    Next step
                  </div>
                  <p className="mt-2 text-sm font-semibold text-[var(--acct-ink)]">{session.nextStepLabel}</p>
                  <p className="mt-2 text-sm leading-6 text-[var(--acct-muted)]">{session.preparationNotes}</p>
                </div>
              </Link>
            ))}
          </div>
        </section>
      )}
    </div>
  );
}
