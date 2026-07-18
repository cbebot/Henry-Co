import Link from "next/link";
import { translateSurfaceLabel } from "@henryco/i18n";
import { requireJobsUser } from "@/lib/auth";
import { getCandidateConversations } from "@/lib/jobs/hiring";
import { candidateNav } from "@/lib/jobs/navigation";
import { getJobsPublicLocale } from "@/lib/locale-server";
import { SectionCard, WorkspaceShell } from "@/components/workspace-shell";
import { EmptyState } from "@/components/feedback";

export const dynamic = "force-dynamic";

export default async function CandidateConversationsPage() {
  const [viewer, locale] = await Promise.all([
    requireJobsUser("/candidate/conversations"),
    getJobsPublicLocale(),
  ]);
  const conversations = await getCandidateConversations(viewer.user!.id);
  const t = (text: string) => translateSurfaceLabel(locale, text);

  return (
    <WorkspaceShell
      area="candidate"
      title={t("Messages")}
      subtitle={t("Your hiring conversations with employers. All messages stay on Henry Onyx to keep you protected.")}
      nav={candidateNav}
      activeHref="/candidate/conversations"
      accent="linear-gradient(135deg,#0d5e66 0%,#0e7c86 55%,#7fd0d4 100%)"
    >
      <SectionCard
        title={t("Conversations")}
        body={t("Messages from employers about your applications.")}
      >
        {conversations.length === 0 ? (
          <EmptyState
            kicker={t("No conversations yet")}
            title={t("Hiring conversations will appear here.")}
            body={t("When an employer responds to one of your applications, the thread opens here. All messages stay on Henry Onyx so everyone stays protected.")}
            action={
              <Link
                href="/candidate/applications"
                className="jobs-button-secondary rounded-full px-5 py-3 text-sm font-semibold"
              >
                {t("View applications")}
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
                      <span className="font-semibold">{conv.subject || t("Hiring conversation")}</span>
                      {conv.unreadCount > 0 && (
                        <span className="flex h-5 min-w-[1.25rem] items-center justify-center rounded-full bg-[var(--jobs-accent)] px-1.5 text-xs font-semibold tabular-nums text-white">
                          {conv.unreadCount}
                        </span>
                      )}
                    </div>
                    <div className="mt-1 text-sm text-[var(--jobs-muted)]">
                      {conv.lastMessageAt
                        ? `${t("Last message")}: ${new Date(conv.lastMessageAt).toLocaleDateString()}`
                        : t("No messages yet")}
                    </div>
                  </div>
                  {conv.status === "open" || conv.status === "closed" ? (
                    <span className="rounded-full bg-[var(--jobs-accent-soft)] px-3 py-1 text-xs font-semibold">
                      {conv.status === "open" ? t("Active") : t("Closed")}
                    </span>
                  ) : null}
                </div>
              </Link>
            ))}
          </div>
        )}
      </SectionCard>
    </WorkspaceShell>
  );
}
