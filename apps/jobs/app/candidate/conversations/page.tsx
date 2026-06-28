import Link from "next/link";
import { getJobsCandidateSurfaceCopy } from "@henryco/i18n";
import { requireJobsUser } from "@/lib/auth";
import { getCandidateConversations } from "@/lib/jobs/hiring";
import { candidateNav } from "@/lib/jobs/navigation";
import { getJobsPublicLocale } from "@/lib/locale-server";
import { SectionCard, WorkspaceShell } from "@/components/workspace-shell";
import { EmptyState } from "@/components/feedback";

export const dynamic = "force-dynamic";

export default async function CandidateConversationsPage() {
  const viewer = await requireJobsUser("/candidate/conversations");
  const locale = await getJobsPublicLocale();
  const copy = getJobsCandidateSurfaceCopy(locale).conversations;
  const conversations = await getCandidateConversations(viewer.user!.id);

  return (
    <WorkspaceShell
      area="candidate"
      title={copy.title}
      subtitle={copy.subtitle}
      nav={candidateNav}
      activeHref="/candidate/conversations"
      accent="linear-gradient(135deg,#0d5e66 0%,#0e7c86 55%,#7fd0d4 100%)"
    >
      <SectionCard
        title={copy.cardTitle}
        body={copy.cardBody}
      >
        {conversations.length === 0 ? (
          <EmptyState
            kicker={copy.emptyKicker}
            title={copy.emptyTitle}
            body={copy.emptyBody}
            action={
              <Link
                href="/candidate/applications"
                className="jobs-button-secondary rounded-full px-5 py-3 text-sm font-semibold"
              >
                {copy.viewApplications}
              </Link>
            }
          />
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
                      <span className="font-semibold">{conv.subject || copy.fallbackSubject}</span>
                      {conv.unreadCount > 0 && (
                        <span className="flex h-5 min-w-[1.25rem] items-center justify-center rounded-full bg-[var(--jobs-accent)] px-1.5 text-xs font-semibold tabular-nums text-white">
                          {conv.unreadCount}
                        </span>
                      )}
                    </div>
                    <div className="mt-1 text-sm text-[var(--jobs-muted)]">
                      {conv.lastMessageAt
                        ? `${copy.lastMessage}: ${new Date(conv.lastMessageAt).toLocaleDateString()}`
                        : copy.noMessages}
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
