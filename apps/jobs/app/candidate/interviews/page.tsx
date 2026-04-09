import { requireJobsUser } from "@/lib/auth";
import { getCandidateInterviews } from "@/lib/jobs/hiring";
import { candidateNav } from "@/lib/jobs/navigation";
import { SectionCard, StatusPill, WorkspaceShell } from "@/components/workspace-shell";

export const dynamic = "force-dynamic";

export default async function CandidateInterviewsPage() {
  const viewer = await requireJobsUser("/candidate/interviews");
  const interviews = await getCandidateInterviews(viewer.user!.id);

  const now = new Date();
  const upcoming = interviews.filter(
    (i) => new Date(i.scheduledAt) >= now && i.status === "scheduled"
  );
  const past = interviews.filter(
    (i) => new Date(i.scheduledAt) < now || i.status !== "scheduled"
  );

  const statusTone = (status: string) => {
    if (status === "completed") return "good" as const;
    if (status === "cancelled") return "danger" as const;
    if (status === "rescheduled") return "warn" as const;
    return "neutral" as const;
  };

  const candidateTimezone =
    viewer.candidateProfile?.timezone || "Africa/Lagos";

  return (
    <WorkspaceShell
      area="candidate"
      title="Interviews"
      subtitle="Your scheduled and completed interviews. Times are shown in your timezone."
      nav={candidateNav}
      activeHref="/candidate/interviews"
      accent="linear-gradient(135deg,#0d5e66 0%,#0e7c86 55%,#7fd0d4 100%)"
    >
      <div className="space-y-4">
        {/* Upcoming interviews */}
        <SectionCard
          title="Upcoming"
          body={`${upcoming.length} interview${upcoming.length !== 1 ? "s" : ""} scheduled.`}
        >
          {upcoming.length === 0 ? (
            <div className="rounded-2xl bg-[var(--jobs-paper-soft)] p-6 text-center">
              <p className="text-sm text-[var(--jobs-muted)]">
                No upcoming interviews. When an employer schedules one, it will appear here.
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {upcoming.map((interview) => (
                <div
                  key={interview.id}
                  className="rounded-2xl bg-[var(--jobs-paper-soft)] p-5"
                >
                  <div className="flex items-start justify-between gap-4">
                    <div>
                      <div className="font-semibold">{interview.title}</div>
                      <div className="mt-1.5 text-sm text-[var(--jobs-muted)]">
                        {new Date(interview.scheduledAt).toLocaleString("en-NG", {
                          timeZone: candidateTimezone,
                          weekday: "long",
                          year: "numeric",
                          month: "long",
                          day: "numeric",
                          hour: "2-digit",
                          minute: "2-digit",
                        })}
                      </div>
                      <div className="mt-1 flex flex-wrap gap-2 text-sm text-[var(--jobs-muted)]">
                        <span>{interview.durationMinutes} minutes</span>
                        <span>&middot;</span>
                        <span className="capitalize">{interview.interviewType}</span>
                        <span>&middot;</span>
                        <span>{candidateTimezone}</span>
                      </div>
                      {interview.interviewType === "video" && interview.meetingUrl && (
                        <div className="mt-2">
                          <a
                            href={interview.meetingUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-sm font-semibold text-[var(--jobs-accent)] hover:underline"
                          >
                            Join meeting
                          </a>
                        </div>
                      )}
                      {interview.interviewType === "in-person" && interview.location && (
                        <div className="mt-2 text-sm text-[var(--jobs-muted)]">
                          Location: {interview.location}
                        </div>
                      )}
                      {interview.notes && (
                        <p className="mt-2 text-sm italic text-[var(--jobs-muted)]">{interview.notes}</p>
                      )}
                    </div>
                    <StatusPill label="Scheduled" tone="good" />
                  </div>
                </div>
              ))}
            </div>
          )}
        </SectionCard>

        {/* Past interviews */}
        <SectionCard
          title="Past"
          body={`${past.length} previous interview${past.length !== 1 ? "s" : ""}.`}
        >
          {past.length === 0 ? (
            <div className="rounded-2xl bg-[var(--jobs-paper-soft)] p-6 text-center">
              <p className="text-sm text-[var(--jobs-muted)]">
                No past interviews.
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {past.map((interview) => (
                <div
                  key={interview.id}
                  className="rounded-2xl bg-[var(--jobs-paper-soft)] p-4"
                >
                  <div className="flex items-start justify-between gap-4">
                    <div>
                      <div className="font-semibold">{interview.title}</div>
                      <div className="mt-1 text-sm text-[var(--jobs-muted)]">
                        {new Date(interview.scheduledAt).toLocaleString("en-NG", {
                          timeZone: candidateTimezone,
                          dateStyle: "medium",
                          timeStyle: "short",
                        })}
                        {" "}({interview.durationMinutes} min, {interview.interviewType})
                      </div>
                    </div>
                    <StatusPill label={interview.status} tone={statusTone(interview.status)} />
                  </div>
                </div>
              ))}
            </div>
          )}
        </SectionCard>
      </div>
    </WorkspaceShell>
  );
}
