import Link from "next/link";
import { notFound } from "next/navigation";
import { requireJobsUser } from "@/lib/auth";
import { getConversationById, getMessages, markMessagesRead } from "@/lib/jobs/hiring";
import { candidateNav } from "@/lib/jobs/navigation";
import { SectionCard, WorkspaceShell } from "@/components/workspace-shell";
import { MessageComposer } from "@/components/hiring/MessageComposer";

export const dynamic = "force-dynamic";

export default async function CandidateConversationDetailPage({
  params,
}: {
  params: Promise<{ conversationId: string }>;
}) {
  const { conversationId } = await params;
  const viewer = await requireJobsUser(`/candidate/conversations/${conversationId}`);

  const conversation = await getConversationById(conversationId);
  if (!conversation) return notFound();

  const messages = await getMessages(conversationId);

  // Auto-mark messages as read for this candidate
  await markMessagesRead(conversationId, viewer.user!.id);

  return (
    <WorkspaceShell
      area="candidate"
      title="Conversation"
      subtitle={conversation.subject || "Hiring conversation thread"}
      nav={candidateNav}
      activeHref="/candidate/conversations"
      accent="linear-gradient(135deg,#0d5e66 0%,#0e7c86 55%,#7fd0d4 100%)"
    >
      <SectionCard
        title={conversation.subject || "Messages"}
        body={`${messages.length} message${messages.length !== 1 ? "s" : ""} in this thread.`}
        actions={
          <Link
            href="/candidate/conversations"
            className="text-sm font-semibold text-[var(--jobs-accent)]"
          >
            All conversations
          </Link>
        }
      >
        {messages.length > 0 ? (
          <div className="space-y-3">
            {messages.map((msg) => (
              <div
                key={msg.id}
                className={`rounded-2xl p-4 ${
                  msg.senderType === "candidate"
                    ? "ml-8 bg-[var(--jobs-accent-soft)]"
                    : msg.senderType === "system"
                      ? "mx-4 bg-[var(--jobs-paper-soft)] text-center text-sm italic"
                      : "mr-8 bg-[var(--jobs-paper-soft)]"
                }`}
              >
                <div className="flex items-start justify-between gap-2">
                  <span className="text-xs font-semibold text-[var(--jobs-muted)]">
                    {msg.senderType === "candidate"
                      ? "You"
                      : msg.senderName || "Employer"}
                  </span>
                  <span className="text-xs text-[var(--jobs-muted)]">
                    {new Date(msg.createdAt).toLocaleString()}
                  </span>
                </div>
                <p className="mt-1.5 text-sm leading-6">{msg.body}</p>
                {msg.isFlagged && (
                  <div className="mt-2 rounded-lg bg-[var(--jobs-warning-soft)] px-3 py-1.5 text-xs text-[var(--jobs-warning)]">
                    This message was flagged for review.
                  </div>
                )}
              </div>
            ))}
          </div>
        ) : (
          <div className="rounded-2xl bg-[var(--jobs-paper-soft)] p-6 text-center">
            <p className="text-sm text-[var(--jobs-muted)]">
              No messages yet. Send the first message below.
            </p>
          </div>
        )}

        <div className="mt-4">
          <MessageComposer
            conversationId={conversationId}
            senderId={viewer.user!.id}
            senderType="candidate"
          />
        </div>
      </SectionCard>
    </WorkspaceShell>
  );
}
