import Link from "next/link";
import { requireJobsUser } from "@/lib/auth";
import { getCandidateConversations } from "@/lib/jobs/hiring";
import { candidateNav } from "@/lib/jobs/navigation";
import { SectionCard, WorkspaceShell } from "@/components/workspace-shell";

export const dynamic = "force-dynamic";

export default async function CandidateConversationsPage() {
  const viewer = await requireJobsUser("/candidate/conversations");
  const conversations = await getCandidateConversations(viewer.user!.id);

  return (
    <WorkspaceShell
      area="candidate"
      title="Messages"
      subtitle="Your hiring conversations with employers. All messages are kept on-platform for security and auditability."
      nav={candidateNav}
      activeHref="/candidate/conversations"
      accent="linear-gradient(135deg,#0d5e66 0%,#0e7c86 55%,#7fd0d4 100%)"
    >
      <SectionCard
        title="Conversations"
        body="Messages from employers about your applications."
      >
        {conversations.length === 0 ? (
          <div className="rounded-2xl bg-[var(--jobs-paper-soft)] p-6 text-center">
            <p className="text-sm text-[var(--jobs-muted)]">
              No conversations yet. When an employer messages you about an application, it will appear here.
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {conversations.map((conv) => (
              <Link
                key={conv.id}
                href={`/candidate/conversations/${conv.id}`}
                className="block rounded-2xl bg-[var(--jobs-paper-soft)] p-4 transition-colors hover:bg-[var(--jobs-accent-soft)]"
              >
                <div className="flex items-center justify-between gap-4">
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <span className="font-semibold">{conv.subject || "Hiring conversation"}</span>
                      {conv.unreadCount > 0 && (
                        <span className="flex h-5 min-w-[1.25rem] items-center justify-center rounded-full bg-[var(--jobs-accent)] px-1.5 text-xs font-bold text-white">
                          {conv.unreadCount}
                        </span>
                      )}
                    </div>
                    <div className="mt-1 text-sm text-[var(--jobs-muted)]">
                      {conv.lastMessageAt
                        ? `Last message: ${new Date(conv.lastMessageAt).toLocaleDateString()}`
                        : "No messages yet"}
                    </div>
                  </div>
                  <span className="rounded-full bg-[var(--jobs-accent-soft)] px-3 py-1 text-xs font-semibold">
                    {conv.status}
                  </span>
                </div>
              </Link>
            ))}
          </div>
        )}
      </SectionCard>
    </WorkspaceShell>
  );
}
