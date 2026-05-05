import Link from "next/link";
import Image from "next/image";
import { notFound } from "next/navigation";
import { requireJobsRoles } from "@/lib/auth";
import {
  getApplicationById,
  getConversation,
  getMessages,
  getInterviews,
  getPipelineById,
  markMessagesRead,
} from "@/lib/jobs/hiring";
import { employerNav } from "@/lib/jobs/navigation";
import { SectionCard, StatusPill, WorkspaceShell } from "@/components/workspace-shell";
import { MessageComposer } from "@/components/hiring/MessageComposer";
import { InterviewScheduler } from "@/components/hiring/InterviewScheduler";

export const dynamic = "force-dynamic";

export default async function ApplicationDetailPage({
  params,
}: {
  params: Promise<{ pipelineId: string; applicationId: string }>;
}) {
  const { pipelineId, applicationId } = await params;
  const viewer = await requireJobsRoles(
    ["employer", "admin", "owner"],
    `/employer/hiring/${pipelineId}/${applicationId}`
  );

  const [pipeline, application] = await Promise.all([
    getPipelineById(pipelineId),
    getApplicationById(applicationId),
  ]);

  if (!pipeline || !application) return notFound();

  const [conversation, interviews] = await Promise.all([
    getConversation(applicationId),
    getInterviews(applicationId),
  ]);

  let messages: Awaited<ReturnType<typeof getMessages>> = [];
  if (conversation) {
    messages = await getMessages(conversation.id);
    // Mark messages as read for this employer user
    await markMessagesRead(conversation.id, viewer.user!.id);
  }

  const stageTone = (current: string, target: string) => {
    const stages = pipeline.stages;
    const currentIndex = stages.indexOf(current);
    const targetIndex = stages.indexOf(target);
    if (targetIndex < currentIndex) return "good" as const;
    if (targetIndex === currentIndex) return "warn" as const;
    return "neutral" as const;
  };

  const interviewStatusTone = (status: string) => {
    if (status === "completed") return "good" as const;
    if (status === "cancelled") return "danger" as const;
    if (status === "rescheduled") return "warn" as const;
    return "neutral" as const;
  };

  return (
    <WorkspaceShell
      area="employer"
      title="Application Detail"
      subtitle={`${application.candidateName} for ${application.jobTitle}`}
      nav={employerNav}
      activeHref="/employer/hiring"
      accent="linear-gradient(135deg,#7c5a28 0%,#b88a47 55%,#f1c88c 100%)"
    >
      <div className="space-y-4">
        {/* Candidate info card */}
        <SectionCard
          title="Candidate"
          actions={
            <Link
              href={`/employer/hiring/${pipelineId}`}
              className="text-sm font-semibold text-[var(--jobs-accent)]"
            >
              Back to pipeline
            </Link>
          }
        >
          <div className="flex items-start gap-4">
            {application.candidateAvatarUrl ? (
              <Image
                src={application.candidateAvatarUrl}
                alt=""
                width={56}
                height={56}
                unoptimized
                className="h-14 w-14 rounded-full object-cover"
              />
            ) : (
              <div className="flex h-14 w-14 items-center justify-center rounded-full bg-[var(--jobs-accent-soft)] text-lg font-semibold">
                {application.candidateName.charAt(0).toUpperCase()}
              </div>
            )}
            <div className="min-w-0 flex-1">
              <div className="text-lg font-semibold">{application.candidateName}</div>
              {application.candidateEmail && (
                <div className="mt-0.5 text-sm text-[var(--jobs-muted)]">{application.candidateEmail}</div>
              )}
              <div className="mt-2 flex flex-wrap gap-2">
                <StatusPill label={application.status} tone={application.status === "active" ? "good" : "neutral"} />
                <span className="rounded-full bg-[var(--jobs-accent-soft)] px-3 py-1 text-xs font-semibold">
                  {application.stage}
                </span>
              </div>
              {application.coverNote && (
                <p className="mt-3 text-sm leading-6 text-[var(--jobs-muted)]">{application.coverNote}</p>
              )}
            </div>
          </div>
        </SectionCard>

        {/* Stage progression */}
        <SectionCard title="Stage progression" body="Track where this candidate is in the hiring pipeline.">
          <div className="flex flex-wrap items-center gap-2">
            {pipeline.stages.map((stage, index) => (
              <div key={stage} className="flex items-center gap-2">
                <span
                  className={`rounded-full px-3 py-1.5 text-xs font-semibold ${
                    stage === application.stage
                      ? "bg-[var(--jobs-accent)] text-white"
                      : stageTone(application.stage, stage) === "good"
                        ? "bg-[var(--jobs-success-soft)] text-[var(--jobs-success)]"
                        : "bg-[var(--jobs-paper-soft)] text-[var(--jobs-muted)]"
                  }`}
                >
                  {stage}
                </span>
                {index < pipeline.stages.length - 1 && (
                  <span className="text-[var(--jobs-muted)]">&rarr;</span>
                )}
              </div>
            ))}
          </div>
        </SectionCard>

        {/* Conversation thread */}
        <SectionCard
          title="Conversation"
          body={conversation ? `${messages.length} message${messages.length !== 1 ? "s" : ""} in this thread.` : "No conversation started yet."}
        >
          {messages.length > 0 ? (
            <div className="space-y-3">
              {messages.map((msg) => (
                <div
                  key={msg.id}
                  className={`rounded-2xl p-4 ${
                    msg.senderType === "employer"
                      ? "ml-8 bg-[var(--jobs-accent-soft)]"
                      : msg.senderType === "system"
                        ? "mx-4 bg-[var(--jobs-paper-soft)] text-center text-sm italic"
                        : "mr-8 bg-[var(--jobs-paper-soft)]"
                  }`}
                >
                  <div className="flex items-start justify-between gap-2">
                    <span className="text-xs font-semibold text-[var(--jobs-muted)]">
                      {msg.senderName || msg.senderType}
                    </span>
                    <span className="text-xs text-[var(--jobs-muted)]">
                      {new Date(msg.createdAt).toLocaleString()}
                    </span>
                  </div>
                  <p className="mt-1.5 text-sm leading-6">{msg.body}</p>
                  {msg.isFlagged && (
                    <div className="mt-2 rounded-lg bg-[var(--jobs-warning-soft)] px-3 py-1.5 text-xs text-[var(--jobs-warning)]">
                      Flagged: {msg.flagReason}
                    </div>
                  )}
                </div>
              ))}
            </div>
          ) : (
            <div className="rounded-2xl bg-[var(--jobs-paper-soft)] p-6 text-center">
              <p className="text-sm text-[var(--jobs-muted)]">
                Send the first message to start a conversation with this candidate.
              </p>
            </div>
          )}

          {conversation && (
            <div className="mt-4">
              <MessageComposer
                conversationId={conversation.id}
                senderId={viewer.user!.id}
                senderType="employer"
              />
            </div>
          )}
        </SectionCard>

        {/* Interview scheduling */}
        <SectionCard
          title="Interviews"
          body={interviews.length > 0 ? `${interviews.length} interview${interviews.length !== 1 ? "s" : ""} scheduled or completed.` : "Schedule an interview with this candidate."}
        >
          {interviews.length > 0 && (
            <div className="mb-4 space-y-3">
              {interviews.map((interview) => (
                <div key={interview.id} className="rounded-2xl bg-[var(--jobs-paper-soft)] p-4">
                  <div className="flex items-start justify-between gap-4">
                    <div>
                      <div className="font-semibold">{interview.title}</div>
                      <div className="mt-1 text-sm text-[var(--jobs-muted)]">
                        {new Date(interview.scheduledAt).toLocaleString("en-NG", {
                          timeZone: interview.timezone,
                          dateStyle: "medium",
                          timeStyle: "short",
                        })}
                        {" "}({interview.durationMinutes} min)
                      </div>
                      <div className="mt-1 text-sm text-[var(--jobs-muted)]">
                        {interview.interviewType === "video" && interview.meetingUrl
                          ? `Video: ${interview.meetingUrl}`
                          : interview.interviewType === "in-person" && interview.location
                            ? `Location: ${interview.location}`
                            : interview.interviewType}
                      </div>
                      {interview.notes && (
                        <p className="mt-2 text-sm italic text-[var(--jobs-muted)]">{interview.notes}</p>
                      )}
                    </div>
                    <StatusPill label={interview.status} tone={interviewStatusTone(interview.status)} />
                  </div>
                </div>
              ))}
            </div>
          )}

          <InterviewScheduler applicationId={applicationId} />
        </SectionCard>
      </div>
    </WorkspaceShell>
  );
}
